// backend/database/seeders/main_seeder.ts
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import Restaurant from '#models/restaurant'
import Category from '#models/category'
import MenuItem from '#models/menu_item'

/**
 * Seeder de démonstration — injecte des données réalistes pour un restaurant gastronomique fictif.
 * Lancer avec : node ace db:seed
 */
export default class MainSeeder extends BaseSeeder {
  async run() {
    // ── Utilisateur admin ──────────────────────────────────────────────────
    const [admin] = await User.updateOrCreateMany('email', [
      {
        email: 'admin@restaurant.fr',
        password: 'Admin1234!',
        fullName: 'Chef Admin',
        role: 'admin',
      },
    ])
    console.log(`✅ Admin créé : ${admin.email}`)

    // ── Informations restaurant ────────────────────────────────────────────
    const restaurant = await Restaurant.getOrCreate()
    await restaurant
      .merge({
        name: 'Le Comptoir des Saveurs',
        slogan: 'Une cuisine sincère, des produits d\'exception',
        brandColor: '#C0392B',
        address: '12 rue de la Gastronomie, 75001 Paris',
        phone: '+33 1 42 00 00 00',
        email: 'contact@lecomptoirdessaveurs.fr',
        openingHours: {
          monday: { open: '12:00', close: '14:30', closed: false },
          tuesday: { open: '12:00', close: '14:30', closed: false },
          wednesday: { open: '12:00', close: '14:30', closed: false },
          thursday: { open: '12:00', close: '14:30', closed: false },
          friday: { open: '12:00', close: '14:30', closed: false },
          saturday: { open: '12:00', close: '22:30', closed: false },
          sunday: { open: '12:00', close: '15:00', closed: false },
        },
      })
      .save()
    console.log(`✅ Restaurant configuré : ${restaurant.name}`)

    // ── Catégories ─────────────────────────────────────────────────────────
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
      const [cat] = await Category.updateOrCreateMany('name', [data])
      categories[data.name] = cat
    }
    console.log(`✅ ${Object.keys(categories).length} catégories créées`)

    // ── Plats ──────────────────────────────────────────────────────────────
    const menuItemsData = [
      // Entrées
      {
        categoryId: categories['Entrées'].id,
        name: 'Soupe de tomate confite',
        description: 'Tomates San Marzano rôties, huile d\'olive vierge, basilic frais et croûtons de pain de campagne',
        priceInCents: 1200,
        isAvailable: true,
        badge: 'popular' as const,
        sortOrder: 1,
      },
      {
        categoryId: categories['Entrées'].id,
        name: 'Tartare de thon rouge',
        description: 'Thon rouge de Méditerranée, avocat, mangue, vinaigrette yuzu-sésame',
        priceInCents: 1900,
        isAvailable: true,
        badge: 'new' as const,
        sortOrder: 2,
      },
      {
        categoryId: categories['Entrées'].id,
        name: 'Burrata crémeuse',
        description: 'Burrata des Pouilles, tomates cerises, pesto maison, fleur de sel de Guérande',
        priceInCents: 1600,
        isAvailable: true,
        badge: 'vegetarian' as const,
        sortOrder: 3,
      },
      {
        categoryId: categories['Entrées'].id,
        name: 'Velouté de butternut',
        description: 'Courge butternut rôtie, lait de coco, gingembre frais, noix de cajou torréfiées',
        priceInCents: 1100,
        isAvailable: true,
        badge: 'vegetarian' as const,
        sortOrder: 4,
      },
      // Poissons
      {
        categoryId: categories['Poissons'].id,
        name: 'Pavé de bar en croûte d\'herbes',
        description: 'Bar de ligne, persillade maison, beurre blanc à la ciboulette, légumes de saison',
        priceInCents: 3200,
        isAvailable: true,
        badge: 'popular' as const,
        sortOrder: 1,
      },
      {
        categoryId: categories['Poissons'].id,
        name: 'Filet de sole meunière',
        description: 'Sole de l\'Atlantique, beurre noisette, câpres, citron confit, purée de pommes de terre',
        priceInCents: 2900,
        isAvailable: true,
        badge: null,
        sortOrder: 2,
      },
      {
        categoryId: categories['Poissons'].id,
        name: 'Saint-Jacques poêlées',
        description: '5 noix de Saint-Jacques Label Rouge, velouté de chou-fleur, huile de truffe, cerfeuil',
        priceInCents: 3800,
        isAvailable: false,
        badge: 'new' as const,
        sortOrder: 3,
      },
      // Viandes
      {
        categoryId: categories['Viandes'].id,
        name: 'Entrecôte maturée 30 jours',
        description: 'Bœuf Angus, 350g, sauce béarnaise maison, frites fraîches, salade verte',
        priceInCents: 4500,
        isAvailable: true,
        badge: 'popular' as const,
        sortOrder: 1,
      },
      {
        categoryId: categories['Viandes'].id,
        name: 'Magret de canard aux cerises',
        description: 'Magret des Landes, réduction de cerises Amarena, gratin dauphinois, haricots verts',
        priceInCents: 3400,
        isAvailable: true,
        badge: null,
        sortOrder: 2,
      },
      {
        categoryId: categories['Viandes'].id,
        name: 'Poulet rôti façon grand-mère',
        description: 'Poulet fermier Label Rouge, jus corsé, pommes de terre grenaille rôties, lardons',
        priceInCents: 2600,
        isAvailable: true,
        badge: null,
        sortOrder: 3,
      },
      // Desserts
      {
        categoryId: categories['Desserts'].id,
        name: 'Moelleux au chocolat Valrhona',
        description: 'Cœur coulant au Guanaja 70%, glace vanille Bourbon, crumble caramel beurre salé',
        priceInCents: 1400,
        isAvailable: true,
        badge: 'popular' as const,
        sortOrder: 1,
      },
      {
        categoryId: categories['Desserts'].id,
        name: 'Tarte Tatin revisitée',
        description: 'Pommes Granny caramélisées, pâte feuilletée inversée, crème fraîche épaisse, calvados',
        priceInCents: 1200,
        isAvailable: true,
        badge: null,
        sortOrder: 2,
      },
      {
        categoryId: categories['Desserts'].id,
        name: 'Panna cotta au jasmin',
        description: 'Panna cotta infusée au jasmin, coulis de framboise fraîche, zestes de citron vert',
        priceInCents: 1100,
        isAvailable: true,
        badge: 'new' as const,
        sortOrder: 3,
      },
      // Boissons
      {
        categoryId: categories['Boissons'].id,
        name: 'Eau minérale (50cl)',
        description: 'Evian ou Perrier',
        priceInCents: 450,
        isAvailable: true,
        badge: null,
        sortOrder: 1,
      },
      {
        categoryId: categories['Boissons'].id,
        name: 'Verre de vin rouge — Côtes du Rhône',
        description: 'Sélection du sommelier, 15cl, notes épicées et fruits noirs',
        priceInCents: 850,
        isAvailable: true,
        badge: 'popular' as const,
        sortOrder: 2,
      },
    ]

    for (const item of menuItemsData) {
      await MenuItem.updateOrCreateMany(['categoryId', 'name'], [item])
    }
    console.log(`✅ ${menuItemsData.length} plats créés`)
    console.log('\n📋 Identifiants de connexion admin :')
    console.log('   Email    : admin@restaurant.fr')
    console.log('   Password : Admin1234!')
  }
}
