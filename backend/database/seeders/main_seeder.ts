import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Plan from '#models/plan'
import Restaurant from '#models/restaurant'
import User from '#models/user'
import Category from '#models/category'
import MenuItem from '#models/menu_item'

export default class MainSeeder extends BaseSeeder {
  async run() {
    // ── Plans ─────────────────────────────────────────────────────────────────
    const plansData = [
      {
        name: 'Gratuit',
        slug: 'free',
        description: 'Démarrez sans engagement',
        priceMonthlyCents: 0,
        priceYearlyCents: 0,
        maxCategories: 3,
        maxMenuItems: 15,
        maxUsers: 1,
        features: ['3 catégories', '15 plats', '1 utilisateur', 'Page menu publique'],
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
        features: ['20 catégories', '200 plats', '5 caissiers', 'Statistiques', 'Support prioritaire'],
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
        features: ['Illimité', 'API dédiée', 'Support 24/7', 'SLA garanti', 'Onboarding personnalisé'],
        isActive: true,
        isPublic: true,
        sortOrder: 2,
      },
    ]

    for (const data of plansData) {
      await Plan.updateOrCreate({ slug: data.slug }, data)
    }
    console.log('✅ Plans créés : Free, Pro, Enterprise')

    // ── Super admin ───────────────────────────────────────────────────────────
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

    // ── Sample restaurant ─────────────────────────────────────────────────────
    const freePlan = await Plan.findByOrFail('slug', 'free')
    const proPlan = await Plan.findByOrFail('slug', 'pro')

    const [restaurant] = await Restaurant.updateOrCreateMany('slug', [
      {
        slug: 'demo',
        name: 'Le Comptoir des Saveurs',
        slogan: 'Une cuisine sincère, des produits d\'exception',
        brandColor: '#C0392B',
        address: '12 rue de la Gastronomie, Abidjan',
        phone: '+225 07 00 00 00 00',
        email: 'contact@comptoir.ci',
        country: 'CI',
        currency: 'XOF',
        planId: proPlan.id,
        subscriptionStatus: 'trialing',
        trialEndsAt: DateTime.now().plus({ days: 14 }),
        isActive: true,
        openingHours: {
          monday: { open: '12:00', close: '22:30', closed: false },
          tuesday: { open: '12:00', close: '22:30', closed: false },
          wednesday: { open: '12:00', close: '22:30', closed: false },
          thursday: { open: '12:00', close: '22:30', closed: false },
          friday: { open: '12:00', close: '23:00', closed: false },
          saturday: { open: '11:00', close: '23:30', closed: false },
          sunday: { open: '11:00', close: '15:00', closed: false },
        },
      },
    ])
    console.log(`✅ Restaurant demo : ${restaurant.slug} (${restaurant.name})`)

    // ── Restaurant admin user ─────────────────────────────────────────────────
    const [adminUser] = await User.updateOrCreateMany('email', [
      {
        email: 'admin@demo.ci',
        password: 'Admin1234!',
        fullName: 'Kouamé Ange',
        role: 'admin',
        restaurantId: restaurant.id,
        isActive: true,
      },
    ])

    const [cashierUser] = await User.updateOrCreateMany('email', [
      {
        email: 'caissier@demo.ci',
        password: 'Caissier1234!',
        fullName: 'Fatou Diallo',
        role: 'cashier',
        restaurantId: restaurant.id,
        isActive: true,
      },
    ])
    console.log(`✅ Admin restaurant : ${adminUser.email} / Admin1234!`)
    console.log(`✅ Caissier : ${cashierUser.email} / Caissier1234!`)

    // ── Second demo restaurant (free plan) ────────────────────────────────────
    const [restaurant2] = await Restaurant.updateOrCreateMany('slug', [
      {
        slug: 'savana',
        name: 'Restaurant La Savana',
        slogan: 'Les saveurs de l\'Afrique',
        brandColor: '#27AE60',
        address: 'Plateau, Abidjan',
        phone: '+225 05 00 00 00 00',
        email: 'info@savana.ci',
        country: 'CI',
        currency: 'XOF',
        planId: freePlan.id,
        subscriptionStatus: 'trialing',
        trialEndsAt: DateTime.now().plus({ days: 7 }),
        isActive: true,
      },
    ])

    await User.updateOrCreateMany('email', [
      {
        email: 'admin@savana.ci',
        password: 'Admin1234!',
        fullName: 'Ibrahim Coulibaly',
        role: 'admin',
        restaurantId: restaurant2.id,
        isActive: true,
      },
    ])
    console.log(`✅ Restaurant demo 2 : ${restaurant2.slug} (${restaurant2.name})`)

    // ── Categories & menu items for demo restaurant ───────────────────────────
    const categoriesData = [
      { name: 'Entrées', description: 'Pour bien commencer', sortOrder: 1, isVisible: true },
      { name: 'Plats', description: 'Nos créations du chef', sortOrder: 2, isVisible: true },
      { name: 'Poissons', description: 'Arrivage quotidien', sortOrder: 3, isVisible: true },
      { name: 'Viandes', description: 'Sélection de bouchers partenaires', sortOrder: 4, isVisible: true },
      { name: 'Desserts', description: 'Douceurs maison', sortOrder: 5, isVisible: true },
      { name: 'Boissons', description: 'Carte des vins & softs', sortOrder: 6, isVisible: true },
    ]

    const categories: Record<string, Category> = {}
    for (const data of categoriesData) {
      const existing = await Category.query()
        .where('restaurant_id', restaurant.id)
        .where('name', data.name)
        .first()

      if (existing) {
        categories[data.name] = existing
      } else {
        categories[data.name] = await Category.create({ ...data, restaurantId: restaurant.id })
      }
    }
    console.log(`✅ ${Object.keys(categories).length} catégories créées pour "demo"`)

    // Menu items
    const menuItemsData = [
      { categoryId: categories['Entrées'].id, name: 'Soupe de tomate confite', description: 'Tomates rôties, huile d\'olive, basilic frais', priceInCents: 250000, isAvailable: true, badge: 'popular', sortOrder: 1 },
      { categoryId: categories['Entrées'].id, name: 'Tartare de thon', description: 'Thon frais, avocat, mangue, vinaigrette citron', priceInCents: 350000, isAvailable: true, badge: 'new', sortOrder: 2 },
      { categoryId: categories['Entrées'].id, name: 'Salade César', description: 'Laitue romaine, poulet grillé, parmesan, croûtons', priceInCents: 300000, isAvailable: true, badge: 'vegetarian', sortOrder: 3 },
      { categoryId: categories['Poissons'].id, name: 'Bar en croûte d\'herbes', description: 'Bar de ligne, beurre blanc, légumes de saison', priceInCents: 600000, isAvailable: true, badge: 'popular', sortOrder: 1 },
      { categoryId: categories['Poissons'].id, name: 'Crevettes sautées', description: 'Crevettes royales, ail, persil, riz basmati', priceInCents: 450000, isAvailable: true, badge: null, sortOrder: 2 },
      { categoryId: categories['Viandes'].id, name: 'Côte de bœuf (400g)', description: 'Bœuf local, sauce chimichurri, frites maison', priceInCents: 900000, isAvailable: true, badge: 'popular', sortOrder: 1 },
      { categoryId: categories['Viandes'].id, name: 'Poulet braisé', description: 'Poulet fermier, sauce arachide, attiéké', priceInCents: 350000, isAvailable: true, badge: null, sortOrder: 2 },
      { categoryId: categories['Viandes'].id, name: 'Agneau en tajine', description: 'Épaule d\'agneau, légumes confits, couscous', priceInCents: 700000, isAvailable: false, badge: 'new', sortOrder: 3 },
      { categoryId: categories['Desserts'].id, name: 'Fondant au chocolat', description: 'Cœur coulant, glace vanille, caramel beurre salé', priceInCents: 200000, isAvailable: true, badge: 'popular', sortOrder: 1 },
      { categoryId: categories['Desserts'].id, name: 'Tarte aux mangues', description: 'Mangues fraîches, crème pâtissière, pâte sablée', priceInCents: 180000, isAvailable: true, badge: null, sortOrder: 2 },
      { categoryId: categories['Boissons'].id, name: 'Eau minérale (50cl)', description: 'Évian ou Perrier', priceInCents: 75000, isAvailable: true, badge: null, sortOrder: 1 },
      { categoryId: categories['Boissons'].id, name: 'Jus de bissap', description: 'Hibiscus frais, gingembre, menthe', priceInCents: 120000, isAvailable: true, badge: 'popular', sortOrder: 2 },
      { categoryId: categories['Boissons'].id, name: 'Bière locale (33cl)', description: 'Flag ou Castel fraîche', priceInCents: 150000, isAvailable: true, badge: null, sortOrder: 3 },
    ]

    for (const item of menuItemsData) {
      const existing = await MenuItem.query()
        .where('restaurant_id', restaurant.id)
        .where('category_id', item.categoryId)
        .where('name', item.name)
        .first()

      if (!existing) {
        await MenuItem.create({ ...item, restaurantId: restaurant.id })
      }
    }
    console.log(`✅ ${menuItemsData.length} plats créés pour "demo"`)

    await db.from('restaurants').update({ plan_id: proPlan.id }).where('slug', 'demo')

    console.log('\n📋 Récapitulatif des accès :')
    console.log('  Super Admin  : superadmin@menuapp.com / SuperAdmin1234!')
    console.log('  Admin demo   : admin@demo.ci         / Admin1234!   (X-Tenant-Slug: demo)')
    console.log('  Caissier demo: caissier@demo.ci      / Caissier1234! (X-Tenant-Slug: demo)')
    console.log('  Admin savana : admin@savana.ci        / Admin1234!   (X-Tenant-Slug: savana)')
  }
}
