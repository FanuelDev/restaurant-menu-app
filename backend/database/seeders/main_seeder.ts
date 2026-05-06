import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Plan from '#models/plan'
import Restaurant from '#models/restaurant'
import User from '#models/user'
import Category from '#models/category'
import MenuItem from '#models/menu_item'
import Subscription from '#models/subscription'
import type { MenuItemBadge } from '#models/menu_item'

// ─── Helper : upsert category by name + restaurant ───────────────────────────
async function upsertCategory(restaurantId: number, data: {
  name: string; description: string; sortOrder: number; isVisible: boolean
}): Promise<Category> {
  const existing = await Category.query()
    .where('restaurant_id', restaurantId)
    .where('name', data.name)
    .first()
  if (existing) {
    Object.assign(existing, data)
    await existing.save()
    return existing
  }
  return Category.create({ ...data, restaurantId })
}

// ─── Helper : upsert menu item by name + category ────────────────────────────
async function upsertItem(restaurantId: number, data: {
  categoryId: number; name: string; description: string
  priceInCents: number; isAvailable: boolean; badge: MenuItemBadge; sortOrder: number
}): Promise<void> {
  const existing = await MenuItem.query()
    .where('restaurant_id', restaurantId)
    .where('category_id', data.categoryId)
    .where('name', data.name)
    .first()
  if (existing) {
    Object.assign(existing, data)
    await existing.save()
  } else {
    await MenuItem.create({ ...data, restaurantId })
  }
}

export default class MainSeeder extends BaseSeeder {
  async run() {

    // ══════════════════════════════════════════════════════════════════════════
    // 1. PLANS
    // ══════════════════════════════════════════════════════════════════════════
    const plansData = [
      {
        name: 'Gratuit',
        slug: 'free',
        description: 'Idéal pour démarrer sans engagement',
        priceMonthlyCents: 0,
        priceYearlyCents: 0,
        maxCategories: 3,
        maxMenuItems: 15,
        maxUsers: 1,
        features: {
          '3 catégories de menu': true,
          '15 plats maximum': true,
          '1 utilisateur': true,
          'Page menu QR publique': true,
          'Statistiques avancées': false,
          'Support prioritaire': false,
        } as Record<string, boolean>,
        isActive: true,
        isPublic: true,
        sortOrder: 0,
      },
      {
        name: 'Pro',
        slug: 'pro',
        description: 'Pour les restaurants en croissance',
        priceMonthlyCents: 1500000,
        priceYearlyCents: 15000000,
        maxCategories: 20,
        maxMenuItems: 200,
        maxUsers: 5,
        features: {
          '20 catégories de menu': true,
          '200 plats maximum': true,
          '5 caissiers': true,
          'Page menu QR publique': true,
          'Statistiques avancées': true,
          'Support prioritaire': true,
        } as Record<string, boolean>,
        isActive: true,
        isPublic: true,
        sortOrder: 1,
      },
      {
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'Puissance illimitée pour les grandes enseignes',
        priceMonthlyCents: 5000000,
        priceYearlyCents: 50000000,
        maxCategories: -1,
        maxMenuItems: -1,
        maxUsers: -1,
        features: {
          'Catégories & plats illimités': true,
          'Caissiers illimités': true,
          'Page menu QR publique': true,
          'Statistiques avancées': true,
          'API dédiée': true,
          'Support 24/7 & SLA garanti': true,
        } as Record<string, boolean>,
        isActive: true,
        isPublic: true,
        sortOrder: 2,
      },
    ]

    for (const data of plansData) {
      await Plan.updateOrCreate({ slug: data.slug }, data)
    }
    console.log('✅ Plans : Free, Pro, Enterprise')

    const freePlan = await Plan.findByOrFail('slug', 'free')
    const proPlan  = await Plan.findByOrFail('slug', 'pro')

    // ══════════════════════════════════════════════════════════════════════════
    // 2. SUPER ADMIN
    // ══════════════════════════════════════════════════════════════════════════
    const [superAdmin] = await User.updateOrCreateMany('email', [
      {
        email: 'superadmin@menuapp.com',
        password: 'SuperAdmin1234!',
        fullName: 'Super Administrateur',
        role: 'super_admin',
        restaurantId: null,
        isActive: true,
      },
    ])
    console.log(`✅ Super admin : ${superAdmin.email} / SuperAdmin1234!`)

    // ══════════════════════════════════════════════════════════════════════════
    // 3. RESTAURANT 1 — Le Comptoir des Saveurs (Pro, active)
    // ══════════════════════════════════════════════════════════════════════════
    const [r1] = await Restaurant.updateOrCreateMany('slug', [
      {
        slug: 'demo',
        name: 'Le Comptoir des Saveurs',
        slogan: "Une cuisine sincère, des produits d'exception",
        brandColor: '#C0392B',
        address: '12 avenue des Cocotiers, Cocody, Abidjan',
        phone: '+225 07 00 00 01 01',
        email: 'contact@comptoir.ci',
        website: 'https://comptoir.ci',
        country: 'CI',
        currency: 'XOF',
        planId: proPlan.id,
        subscriptionStatus: 'active',
        trialEndsAt: null,
        isActive: true,
        openingHours: {
          monday:    { open: '12:00', close: '22:30', closed: false },
          tuesday:   { open: '12:00', close: '22:30', closed: false },
          wednesday: { open: '12:00', close: '22:30', closed: false },
          thursday:  { open: '12:00', close: '22:30', closed: false },
          friday:    { open: '12:00', close: '23:00', closed: false },
          saturday:  { open: '11:00', close: '23:30', closed: false },
          sunday:    { open: '11:00', close: '15:00', closed: false },
        },
      },
    ])
    console.log(`✅ Restaurant 1 : ${r1.name} (slug: ${r1.slug})`)

    // Active subscription for r1
    const existingSub1 = await Subscription.query().where('restaurant_id', r1.id).where('status', 'active').first()
    if (!existingSub1) {
      await Subscription.create({
        restaurantId: r1.id,
        planId: proPlan.id,
        cinetpayTransactionId: `seed_sub_${r1.id}_pro`,
        cinetpayPaymentToken: null,
        billingCycle: 'yearly',
        status: 'active',
        amountCents: proPlan.priceYearlyCents,
        currency: 'XOF',
        currentPeriodStart: DateTime.now(),
        currentPeriodEnd: DateTime.now().plus({ years: 1 }),
        canceledAt: null,
        paymentMetadata: { source: 'seeder' },
      })
    }

    // Users for r1
    const [admin1] = await User.updateOrCreateMany('email', [
      {
        email: 'admin@demo.ci',
        password: 'Admin1234!',
        fullName: 'Kouamé Ange',
        role: 'admin',
        restaurantId: r1.id,
        isActive: true,
      },
    ])
    const [cashier1] = await User.updateOrCreateMany('email', [
      {
        email: 'caissier@demo.ci',
        password: 'Caissier1234!',
        fullName: 'Fatou Diallo',
        role: 'cashier',
        restaurantId: r1.id,
        isActive: true,
      },
    ])
    const [cashier1b] = await User.updateOrCreateMany('email', [
      {
        email: 'caissier2@demo.ci',
        password: 'Caissier1234!',
        fullName: 'Jean-Baptiste Konan',
        role: 'cashier',
        restaurantId: r1.id,
        isActive: true,
      },
    ])
    console.log(`   👤 ${admin1.email} / Admin1234! (admin)`)
    console.log(`   👤 ${cashier1.email} / Caissier1234! (caissier)`)
    console.log(`   👤 ${cashier1b.email} / Caissier1234! (caissier)`)

    // ── Categories & items for r1 ─────────────────────────────────────────────
    const r1Cats = {
      entrees:  await upsertCategory(r1.id, { name: 'Entrées', description: 'Pour bien commencer', sortOrder: 1, isVisible: true }),
      poissons: await upsertCategory(r1.id, { name: 'Poissons', description: 'Arrivage quotidien du port', sortOrder: 2, isVisible: true }),
      viandes:  await upsertCategory(r1.id, { name: 'Viandes', description: 'Sélection de bouchers partenaires', sortOrder: 3, isVisible: true }),
      pizzas:   await upsertCategory(r1.id, { name: 'Pizzas', description: 'Four à bois artisanal', sortOrder: 4, isVisible: true }),
      desserts: await upsertCategory(r1.id, { name: 'Desserts', description: 'Douceurs maison', sortOrder: 5, isVisible: true }),
      boissons: await upsertCategory(r1.id, { name: 'Boissons', description: 'Vins, softs & cocktails', sortOrder: 6, isVisible: true }),
    }

    const r1Items: Array<{ cat: keyof typeof r1Cats; name: string; description: string; price: number; available: boolean; badge: MenuItemBadge; order: number }> = [
      // Entrées
      { cat: 'entrees', name: 'Soupe de tomate confite', description: "Tomates rôties au four, huile d'olive extra-vierge, basilic frais", price: 250000, available: true, badge: 'popular', order: 1 },
      { cat: 'entrees', name: 'Tartare de thon mi-cuit', description: "Thon rouge frais, avocat crémeux, mangue en brunoise, vinaigrette citron-sésame", price: 380000, available: true, badge: 'new', order: 2 },
      { cat: 'entrees', name: 'Salade César revisitée', description: "Laitue romaine croquante, poulet grillé, parmesan 24 mois, croûtons au beurre, sauce César maison", price: 320000, available: true, badge: 'vegetarian', order: 3 },
      { cat: 'entrees', name: 'Velouté de patate douce', description: "Patate douce rôtie, lait de coco, gingembre frais, crème fleurette", price: 280000, available: true, badge: null, order: 4 },
      { cat: 'entrees', name: "Foie gras de canard mi-cuit", description: "Foie gras maison, chutney de mangue, brioche toastée, fleur de sel", price: 650000, available: true, badge: 'new', order: 5 },

      // Poissons
      { cat: 'poissons', name: "Bar en croûte d'herbes", description: "Bar de ligne entier, croûte persil-citron, beurre blanc aux câpres, légumes du marché", price: 620000, available: true, badge: 'popular', order: 1 },
      { cat: 'poissons', name: 'Crevettes royales flambées', description: "Crevettes géantes sautées au cognac, ail confit, persil plat, riz basmati au safran", price: 480000, available: true, badge: 'spicy', order: 2 },
      { cat: 'poissons', name: 'Tilapia grillé entier', description: "Tilapia frais du lac, marinade citron-piment, attiéké maison, sauce tomate relevée", price: 350000, available: true, badge: null, order: 3 },
      { cat: 'poissons', name: 'Langouste thermidor', description: "Langouste fraîche, sauce crème moutarde, parmesan gratiné, accompagnée de légumes vapeur", price: 1200000, available: false, badge: 'popular', order: 4 },

      // Viandes
      { cat: 'viandes', name: 'Côte de bœuf maturée (400g)', description: "Bœuf local maturé 28 jours, sauce chimichurri, frites maison, salade verte", price: 950000, available: true, badge: 'popular', order: 1 },
      { cat: 'viandes', name: 'Poulet braisé sauce arachide', description: "Poulet fermier rôti lentement, sauce arachide onctueuse, attiéké frais, banane plantain", price: 370000, available: true, badge: null, order: 2 },
      { cat: 'viandes', name: "Agneau en tajine d'abricots", description: "Épaule d'agneau fondante, abricots confits, amandes grillées, couscous aux herbes", price: 720000, available: true, badge: 'new', order: 3 },
      { cat: 'viandes', name: 'Magret de canard rôti', description: "Magret cuit rosé, réduction au miel-gingembre, purée de patate douce, haricots verts", price: 680000, available: false, badge: null, order: 4 },
      { cat: 'viandes', name: 'Côtelettes d\'agneau grillées', description: "Côtelettes marinées aux herbes de Provence, tapenade d'olives, pommes sarladaises", price: 850000, available: true, badge: 'spicy', order: 5 },

      // Pizzas
      { cat: 'pizzas', name: 'Margherita bufala', description: "Tomate San Marzano, mozzarella di bufala, basilic frais, huile d'olive sicilienne — 32 cm", price: 400000, available: true, badge: 'vegetarian', order: 1 },
      { cat: 'pizzas', name: 'Quattro stagioni', description: "Jambon cru, champignons, artichauts, olives noires, mozzarella, tomate fraîche — 32 cm", price: 480000, available: true, badge: 'popular', order: 2 },
      { cat: 'pizzas', name: 'Diavola épicée', description: "Salami piquant, piment calabrais, mozzarella fumée, tomate, origan — 32 cm", price: 460000, available: true, badge: 'spicy', order: 3 },
      { cat: 'pizzas', name: 'Pizza du Chef du moment', description: "Création hebdomadaire selon les arrivages — demandez au serveur pour les détails du jour", price: 550000, available: true, badge: 'new', order: 4 },

      // Desserts
      { cat: 'desserts', name: 'Fondant au chocolat Valrhona', description: "Cœur coulant 70%, glace vanille Bourbon, caramel beurre salé, tuile croustillante", price: 220000, available: true, badge: 'popular', order: 1 },
      { cat: 'desserts', name: 'Tarte tropézienne aux mangues', description: "Mangues Amélie fraîches, crème légère à la vanille, pâte sablée maison", price: 190000, available: true, badge: null, order: 2 },
      { cat: 'desserts', name: 'Crème brûlée à la citronnelle', description: "Crème onctueuse infusée à la citronnelle, caramel craquant, zestes de citron vert", price: 175000, available: true, badge: 'new', order: 3 },
      { cat: 'desserts', name: 'Tiramisu café-Baileys', description: "Mascarpone maison, café fort, Baileys, cacao de Madagascar", price: 200000, available: true, badge: 'popular', order: 4 },
      { cat: 'desserts', name: 'Plateau de fromages affinés', description: "Sélection de 4 fromages, confiture de figues, miel d'acacia, noix fraîches", price: 350000, available: false, badge: null, order: 5 },

      // Boissons
      { cat: 'boissons', name: 'Eau minérale (50cl)', description: "Évian plate ou Perrier pétillante", price: 75000, available: true, badge: null, order: 1 },
      { cat: 'boissons', name: 'Jus de bissap maison', description: "Hibiscus frais infusé, gingembre, menthe, sucre de canne — servi frais", price: 150000, available: true, badge: 'popular', order: 2 },
      { cat: 'boissons', name: 'Jus de fruits frais pressés', description: "Orange, ananas, mangue, ou maracuja — au choix, pressé à la commande", price: 200000, available: true, badge: null, order: 3 },
      { cat: 'boissons', name: 'Bière locale (33cl)', description: "Flag, Castel ou Bock fraîche — servie en bouteille ou pression", price: 150000, available: true, badge: null, order: 4 },
      { cat: 'boissons', name: 'Vin rouge (verre 15cl)', description: "Sélection du sommelier — Bordeaux AOC ou Côtes du Rhône selon arrivage", price: 350000, available: true, badge: null, order: 5 },
      { cat: 'boissons', name: 'Cocktail du bar', description: "Mojito, Daïquiri, Piña Colada ou Spritz — demandez la carte complète", price: 400000, available: true, badge: 'new', order: 6 },
    ]

    for (const item of r1Items) {
      await upsertItem(r1.id, {
        categoryId: r1Cats[item.cat].id,
        name: item.name,
        description: item.description,
        priceInCents: item.price,
        isAvailable: item.available,
        badge: item.badge,
        sortOrder: item.order,
      })
    }
    console.log(`✅ ${r1Items.length} plats créés pour "${r1.slug}"`)

    // ══════════════════════════════════════════════════════════════════════════
    // 4. RESTAURANT 2 — La Savana (Free plan, trialing)
    // ══════════════════════════════════════════════════════════════════════════
    const [r2] = await Restaurant.updateOrCreateMany('slug', [
      {
        slug: 'savana',
        name: 'Restaurant La Savana',
        slogan: "Les saveurs authentiques de l'Afrique",
        brandColor: '#27AE60',
        address: 'Boulevard Latrille, Cocody, Abidjan',
        phone: '+225 05 00 00 02 02',
        email: 'info@savana.ci',
        country: 'CI',
        currency: 'XOF',
        planId: freePlan.id,
        subscriptionStatus: 'trialing',
        trialEndsAt: DateTime.now().plus({ days: 11 }),
        isActive: true,
        openingHours: {
          monday:    { open: '11:00', close: '22:00', closed: false },
          tuesday:   { open: '11:00', close: '22:00', closed: false },
          wednesday: { open: '11:00', close: '22:00', closed: false },
          thursday:  { open: '11:00', close: '22:00', closed: false },
          friday:    { open: '11:00', close: '23:00', closed: false },
          saturday:  { open: '10:00', close: '23:00', closed: false },
          sunday:    { open: '12:00', close: '20:00', closed: false },
        },
      },
    ])
    console.log(`✅ Restaurant 2 : ${r2.name} (slug: ${r2.slug})`)

    // Users for r2
    const [admin2] = await User.updateOrCreateMany('email', [
      {
        email: 'admin@savana.ci',
        password: 'Admin1234!',
        fullName: 'Ibrahim Coulibaly',
        role: 'admin',
        restaurantId: r2.id,
        isActive: true,
      },
    ])
    const [cashier2] = await User.updateOrCreateMany('email', [
      {
        email: 'caissier@savana.ci',
        password: 'Caissier1234!',
        fullName: 'Mariam Traoré',
        role: 'cashier',
        restaurantId: r2.id,
        isActive: true,
      },
    ])
    console.log(`   👤 ${admin2.email} / Admin1234! (admin)`)
    console.log(`   👤 ${cashier2.email} / Caissier1234! (caissier)`)

    // ── Categories & items for r2 (free plan: max 3 cats, 15 items) ───────────
    const r2Cats = {
      entrees: await upsertCategory(r2.id, { name: 'Entrées', description: 'Mise en bouche africaine', sortOrder: 1, isVisible: true }),
      plats:   await upsertCategory(r2.id, { name: 'Plats africains', description: 'Recettes authentiques du continent', sortOrder: 2, isVisible: true }),
      boissons: await upsertCategory(r2.id, { name: 'Boissons', description: 'Jus naturels & softs', sortOrder: 3, isVisible: true }),
    }

    // Exactly 15 items to respect the free plan limit
    const r2Items: Array<{ cat: keyof typeof r2Cats; name: string; description: string; price: number; available: boolean; badge: MenuItemBadge; order: number }> = [
      // Entrées (4)
      { cat: 'entrees', name: 'Salade de papaye verte', description: "Papaye verte râpée, tomates cerises, arachides grillées, vinaigrette citronnée", price: 180000, available: true, badge: 'vegetarian', order: 1 },
      { cat: 'entrees', name: 'Accras de morue maison', description: "Beignets croustillants à la morue, sauce piquante maison, citron vert", price: 220000, available: true, badge: 'popular', order: 2 },
      { cat: 'entrees', name: 'Brochettes de bœuf yassa', description: "Bœuf mariné à l'oseille, oignons confits, moutarde douce — 4 pièces", price: 250000, available: true, badge: 'spicy', order: 3 },
      { cat: 'entrees', name: "Soupe légère de poisson", description: "Bouillon de poisson fumé, tomates, oignons, herbes fraîches, chili doux", price: 200000, available: true, badge: null, order: 4 },

      // Plats africains (8)
      { cat: 'plats', name: 'Poulet braisé DG', description: "Poulet fermier braisé, sauce tomate-banane, légumes sautés — la spécialité de la maison", price: 380000, available: true, badge: 'popular', order: 1 },
      { cat: 'plats', name: 'Kedjenou de poulet', description: "Poulet mijoté à l'étouffée, légumes du jardin, épices douces — servi avec du riz gluant", price: 350000, available: true, badge: 'popular', order: 2 },
      { cat: 'plats', name: 'Riz gras au mouton', description: "Riz parfumé cuit dans le bouillon de mouton, légumes, tomates, épices de Côte d'Ivoire", price: 320000, available: true, badge: null, order: 3 },
      { cat: 'plats', name: "Alloco poisson frit", description: "Banane plantain mûre frite, poisson tilapia entier, oignons caramélisés, piment vert", price: 280000, available: true, badge: 'spicy', order: 4 },
      { cat: 'plats', name: 'Foutou banane & sauce graine', description: "Foutou de banane pilé, sauce graine de palme au crabe, crevettes séchées", price: 300000, available: true, badge: 'vegetarian', order: 5 },
      { cat: 'plats', name: 'Thiéboudienne sénégalais', description: "Riz au poisson à la sénégalaise, légumes, sauce tomate, poisson entier grillé", price: 420000, available: true, badge: 'new', order: 6 },
      { cat: 'plats', name: 'Brochettes de poulet grillé', description: "Poulet mariné herbes et citron, grillé au charbon, servi avec attiéké et salade", price: 290000, available: false, badge: null, order: 7 },
      { cat: 'plats', name: "Mafé d'agneau", description: "Épaule d'agneau fondante, sauce cacahuète crémeuse, riz blanc, légumes sautés", price: 450000, available: true, badge: 'new', order: 8 },

      // Boissons (3)
      { cat: 'boissons', name: 'Jus de gingembre frais', description: "Gingembre pressé, citron, sucre de canne, glaçons — fortifiant et rafraîchissant", price: 120000, available: true, badge: 'popular', order: 1 },
      { cat: 'boissons', name: 'Bissap hibiscus', description: "Fleurs d'hibiscus séchées infusées, menthe fraîche, eau de fleur d'oranger", price: 100000, available: true, badge: null, order: 2 },
      { cat: 'boissons', name: 'Eau minérale (50cl)', description: "Eau plate ou gazeuse fraîche", price: 75000, available: true, badge: null, order: 3 },
    ]

    for (const item of r2Items) {
      await upsertItem(r2.id, {
        categoryId: r2Cats[item.cat].id,
        name: item.name,
        description: item.description,
        priceInCents: item.price,
        isAvailable: item.available,
        badge: item.badge,
        sortOrder: item.order,
      })
    }
    console.log(`✅ ${r2Items.length} plats créés pour "${r2.slug}"`)

    // ══════════════════════════════════════════════════════════════════════════
    // 5. PAGE VIEWS FICTIVES — Le Comptoir des Saveurs (60 derniers jours)
    // ══════════════════════════════════════════════════════════════════════════
    const existingViews = await db.from('page_views').where('restaurant_id', r1.id).count('* as total')
    if (Number((existingViews[0] as any).total) === 0) {
      const viewsInserts: { restaurant_id: number; resource_type: string; resource_id: null; created_at: string }[] = []
      const now = DateTime.now()

      // Spikes on specific days for realistic look (relative to today)
      const spikeDays = new Set([3, 10, 18, 25, 45])

      for (let i = 59; i >= 0; i--) {
        const date = now.minus({ days: i })
        const isWeekend = date.weekday >= 6
        const isSpike    = spikeDays.has(i)

        const base  = isWeekend ? 28 : 14
        const extra = isSpike   ? 20 : 0
        const jitter = Math.round((Math.random() - 0.5) * 12)
        const count = Math.max(2, base + extra + jitter)

        for (let v = 0; v < count; v++) {
          // Spread views between 11:00 and 22:00 (restaurant hours)
          const hour = 11 + Math.floor(Math.random() * 11)
          const minute = Math.floor(Math.random() * 60)
          const second = Math.floor(Math.random() * 60)
          viewsInserts.push({
            restaurant_id: r1.id,
            resource_type: 'menu',
            resource_id: null,
            created_at: date.set({ hour, minute, second }).toSQL()!,
          })
        }
      }

      // Batch insert (SQLite-safe chunks of 200)
      const chunkSize = 200
      for (let s = 0; s < viewsInserts.length; s += chunkSize) {
        await db.table('page_views').insert(viewsInserts.slice(s, s + chunkSize))
      }
      console.log(`✅ ${viewsInserts.length} page_views fictives insérées pour "${r1.slug}"`)
    } else {
      console.log(`⏭️  page_views déjà présentes pour "${r1.slug}", skip`)
    }

    // ══════════════════════════════════════════════════════════════════════════
    // 6. RECAP
    // ══════════════════════════════════════════════════════════════════════════
    await db.from('restaurants').update({ plan_id: proPlan.id, subscription_status: 'active' }).where('slug', 'demo')

    console.log('\n' + '═'.repeat(60))
    console.log('📋  ACCÈS DE DÉMONSTRATION')
    console.log('═'.repeat(60))
    console.log('  🔑 Super Admin')
    console.log(`     Email    : superadmin@menuapp.com`)
    console.log(`     Mot passe: SuperAdmin1234!\n`)
    console.log('  🍽️  Le Comptoir des Saveurs  (Plan Pro — Actif)')
    console.log(`     Admin    : admin@demo.ci        / Admin1234!`)
    console.log(`     Caissier : caissier@demo.ci     / Caissier1234!`)
    console.log(`     Caissier2: caissier2@demo.ci    / Caissier1234!`)
    console.log(`     Tenant   : X-Tenant-Slug: demo`)
    console.log(`     Menu URL : http://demo.localhost:4200/menu\n`)
    console.log('  🌿  Restaurant La Savana  (Plan Gratuit — Essai 11j)')
    console.log(`     Admin    : admin@savana.ci      / Admin1234!`)
    console.log(`     Caissier : caissier@savana.ci   / Caissier1234!`)
    console.log(`     Tenant   : X-Tenant-Slug: savana`)
    console.log(`     Menu URL : http://savana.localhost:4200/menu`)
    console.log('═'.repeat(60) + '\n')
  }
}
