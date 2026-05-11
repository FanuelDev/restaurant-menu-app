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
  nameTranslations?: Record<string, string>
  descriptionTranslations?: Record<string, string>
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
  price: number; isAvailable: boolean; badge: MenuItemBadge; sortOrder: number
  nameTranslations?: Record<string, string>
  descriptionTranslations?: Record<string, string>
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
        priceMonthlyCents: 10000,
        priceYearlyCents: 100000,
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
        priceMonthlyCents: 30000,
        priceYearlyCents: 300000,
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
        email: 'superadmin@saemenus.com',
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

    // Active subscription for r1 — upsert pour éviter les conflits sur cinetpayTransactionId
    await Subscription.updateOrCreate(
      { cinetpayTransactionId: `seed_sub_${r1.id}_pro` },
      {
        restaurantId: r1.id,
        planId: proPlan.id,
        cinetpayPaymentToken: null,
        billingCycle: 'yearly',
        status: 'active',
        amountCents: proPlan.priceYearlyCents,
        currency: 'EUR',
        currentPeriodStart: DateTime.now(),
        currentPeriodEnd: DateTime.now().plus({ years: 1 }),
        canceledAt: null,
        paymentMetadata: { source: 'seeder' },
      }
    )

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
      entrees: await upsertCategory(r1.id, {
        name: 'Entrées', description: 'Pour bien commencer', sortOrder: 1, isVisible: true,
        nameTranslations: { en: 'Starters', de: 'Vorspeisen', zh: '开胃菜' },
        descriptionTranslations: { en: 'To start off right', de: 'Zum guten Start', zh: '开启美食之旅' },
      }),
      poissons: await upsertCategory(r1.id, {
        name: 'Poissons', description: 'Arrivage quotidien du port', sortOrder: 2, isVisible: true,
        nameTranslations: { en: 'Fish', de: 'Fisch', zh: '海鲜' },
        descriptionTranslations: { en: 'Fresh daily catch from the port', de: 'Täglich frischer Hafen-Fang', zh: '每日新鲜港口到货' },
      }),
      viandes: await upsertCategory(r1.id, {
        name: 'Viandes', description: 'Sélection de bouchers partenaires', sortOrder: 3, isVisible: true,
        nameTranslations: { en: 'Meats', de: 'Fleisch', zh: '肉类' },
        descriptionTranslations: { en: 'Selection from partner butchers', de: 'Auswahl unserer Partnermetzger', zh: '精选合作屠夫的肉品' },
      }),
      pizzas: await upsertCategory(r1.id, {
        name: 'Pizzas', description: 'Four à bois artisanal', sortOrder: 4, isVisible: true,
        nameTranslations: { en: 'Pizzas', de: 'Pizzen', zh: '比萨' },
        descriptionTranslations: { en: 'Artisan wood-fired oven', de: 'Handgemacht aus dem Holzofen', zh: '手工柴火窑炉' },
      }),
      desserts: await upsertCategory(r1.id, {
        name: 'Desserts', description: 'Douceurs maison', sortOrder: 5, isVisible: true,
        nameTranslations: { en: 'Desserts', de: 'Desserts', zh: '甜点' },
        descriptionTranslations: { en: 'Homemade sweets', de: 'Hausgemachte Köstlichkeiten', zh: '自制甜品' },
      }),
      boissons: await upsertCategory(r1.id, {
        name: 'Boissons', description: 'Vins, softs & cocktails', sortOrder: 6, isVisible: true,
        nameTranslations: { en: 'Drinks', de: 'Getränke', zh: '饮品' },
        descriptionTranslations: { en: 'Wines, soft drinks & cocktails', de: 'Weine, Softdrinks & Cocktails', zh: '葡萄酒、软饮和鸡尾酒' },
      }),
    }

    type R1Item = {
      cat: keyof typeof r1Cats
      name: string; description: string
      nameTranslations: Record<string, string>
      descriptionTranslations: Record<string, string>
      price: number; available: boolean; badge: MenuItemBadge; order: number
    }

    const r1Items: R1Item[] = [
      // ── Entrées ────────────────────────────────────────────────────────────
      {
        cat: 'entrees', order: 1, price: 8.50, available: true, badge: 'popular',
        name: 'Soupe de tomate confite',
        description: "Tomates rôties au four, huile d'olive extra-vierge, basilic frais",
        nameTranslations: { en: 'Slow-roasted Tomato Soup', de: 'Ofentomatensuppe', zh: '慢烤番茄汤' },
        descriptionTranslations: { en: 'Oven-roasted tomatoes, extra-virgin olive oil, fresh basil', de: 'Im Ofen geröstete Tomaten, natives Olivenöl extra, frisches Basilikum', zh: '烤番茄、特级初榨橄榄油、新鲜罗勒' },
      },
      {
        cat: 'entrees', order: 2, price: 14.00, available: true, badge: 'new',
        name: 'Tartare de thon mi-cuit',
        description: "Thon rouge frais, avocat crémeux, mangue en brunoise, vinaigrette citron-sésame",
        nameTranslations: { en: 'Semi-seared Tuna Tartare', de: 'Halbgegarter Thunfischtatar', zh: '半熟金枪鱼他他' },
        descriptionTranslations: { en: 'Fresh bluefin tuna, creamy avocado, diced mango, lemon-sesame dressing', de: 'Frischer Blauflossenthun, cremige Avocado, Mangowürfel, Zitronen-Sesam-Vinaigrette', zh: '新鲜蓝鳍金枪鱼、奶油牛油果、芒果粒、柠檬芝麻汁' },
      },
      {
        cat: 'entrees', order: 3, price: 11.50, available: true, badge: 'vegetarian',
        name: 'Salade César revisitée',
        description: "Laitue romaine croquante, poulet grillé, parmesan 24 mois, croûtons au beurre, sauce César maison",
        nameTranslations: { en: 'Reinvented Caesar Salad', de: 'Neu interpretierter Caesar-Salat', zh: '创意凯撒沙拉' },
        descriptionTranslations: { en: 'Crispy romaine lettuce, grilled chicken, 24-month parmesan, butter croutons, house Caesar dressing', de: 'Knuspriger Romanasalat, gegrilltes Hähnchen, 24 Monate gereifter Parmesan, Buttercroutons, hausgemachte Caesar-Sauce', zh: '脆爽罗马生菜、烤鸡肉、24月陈帕玛森奶酪、黄油面包丁、自制凯撒酱' },
      },
      {
        cat: 'entrees', order: 4, price: 9.00, available: true, badge: null,
        name: 'Velouté de patate douce',
        description: "Patate douce rôtie, lait de coco, gingembre frais, crème fleurette",
        nameTranslations: { en: 'Sweet Potato Velouté', de: 'Süßkartoffelcremesuppe', zh: '红薯奶油汤' },
        descriptionTranslations: { en: 'Roasted sweet potato, coconut milk, fresh ginger, light cream', de: 'Geröstete Süßkartoffel, Kokosmilch, frischer Ingwer, Sahne', zh: '烤红薯、椰奶、鲜姜、淡奶油' },
      },
      {
        cat: 'entrees', order: 5, price: 22.00, available: true, badge: 'new',
        name: 'Foie gras de canard mi-cuit',
        description: "Foie gras maison, chutney de mangue, brioche toastée, fleur de sel",
        nameTranslations: { en: 'Semi-cooked Duck Foie Gras', de: 'Halbgegarte Entenstopfleber', zh: '半熟鸭肥肝' },
        descriptionTranslations: { en: 'House-made foie gras, mango chutney, toasted brioche, fleur de sel', de: 'Hausgemachte Foie Gras, Mango-Chutney, geröstete Brioche, Meersalzflocken', zh: '自制鹅肝、芒果酸辣酱、烤布里欧修、海盐花' },
      },

      // ── Poissons ───────────────────────────────────────────────────────────
      {
        cat: 'poissons', order: 1, price: 24.00, available: true, badge: 'popular',
        name: "Bar en croûte d'herbes",
        description: "Bar de ligne entier, croûte persil-citron, beurre blanc aux câpres, légumes du marché",
        nameTranslations: { en: 'Herb-crusted Sea Bass', de: 'Seebarsch in Kräuterkruste', zh: '香草酥皮鲈鱼' },
        descriptionTranslations: { en: 'Whole line-caught sea bass, parsley-lemon crust, caper beurre blanc, market vegetables', de: 'Ganzer Leinenfang-Seebarsch, Petersilien-Zitronen-Kruste, Kapern-Beurre-blanc, Marktgemüse', zh: '整条线钓鲈鱼、香芹柠檬酥皮、刺山柑白黄油酱、时蔬' },
      },
      {
        cat: 'poissons', order: 2, price: 19.50, available: true, badge: 'spicy',
        name: 'Crevettes royales flambées',
        description: "Crevettes géantes sautées au cognac, ail confit, persil plat, riz basmati au safran",
        nameTranslations: { en: 'Flambéed King Prawns', de: 'Flambierte Riesengarnelen', zh: '火焰大虾' },
        descriptionTranslations: { en: 'Giant prawns sautéed in cognac, confit garlic, flat-leaf parsley, saffron basmati rice', de: 'Riesengarnelen in Cognac gebraten, Knoblauchconfit, glatte Petersilie, Safran-Basmatireis', zh: '干邑炒大虾、蒜头油封、平叶香芹、藏红花香米' },
      },
      {
        cat: 'poissons', order: 3, price: 15.00, available: true, badge: null,
        name: 'Tilapia grillé entier',
        description: "Tilapia frais du lac, marinade citron-piment, attiéké maison, sauce tomate relevée",
        nameTranslations: { en: 'Whole Grilled Tilapia', de: 'Gegrillter ganzer Tilapia', zh: '整条烤罗非鱼' },
        descriptionTranslations: { en: 'Fresh lake tilapia, lemon-chili marinade, house-made attiéké, spicy tomato sauce', de: 'Frischer See-Tilapia, Zitronen-Chili-Marinade, hausgemachtes Attiéké, würzige Tomatensauce', zh: '鲜湖罗非鱼、柠檬辣椒腌料、自制木薯碎、香辣番茄酱' },
      },
      {
        cat: 'poissons', order: 4, price: 48.00, available: false, badge: 'popular',
        name: 'Langouste thermidor',
        description: "Langouste fraîche, sauce crème moutarde, parmesan gratiné, accompagnée de légumes vapeur",
        nameTranslations: { en: 'Thermidor Spiny Lobster', de: 'Thermidor-Langusten', zh: '龙虾热多' },
        descriptionTranslations: { en: 'Fresh spiny lobster, mustard cream sauce, gratinated parmesan, steamed vegetables', de: 'Frische Langusten, Senfrahmsauce, gratinierter Parmesan, gedünstetes Gemüse', zh: '鲜海螯虾、芥末奶油酱、帕玛森芝士焗烤、蒸蔬菜' },
      },

      // ── Viandes ────────────────────────────────────────────────────────────
      {
        cat: 'viandes', order: 1, price: 38.00, available: true, badge: 'popular',
        name: 'Côte de bœuf maturée (400g)',
        description: "Bœuf local maturé 28 jours, sauce chimichurri, frites maison, salade verte",
        nameTranslations: { en: '28-day Aged Rib of Beef (400g)', de: '28 Tage gereiftes Rinderkotelett (400g)', zh: '28天熟成肋眼牛排 (400g)' },
        descriptionTranslations: { en: 'Local beef aged 28 days, chimichurri sauce, homemade fries, green salad', de: 'Lokales Rindfleisch, 28 Tage gereift, Chimichurri-Sauce, hausgemachte Pommes, grüner Salat', zh: '本地28天熟成牛肉、阿根廷香草酱、自制薯条、绿色沙拉' },
      },
      {
        cat: 'viandes', order: 2, price: 16.00, available: true, badge: null,
        name: 'Poulet braisé sauce arachide',
        description: "Poulet fermier rôti lentement, sauce arachide onctueuse, attiéké frais, banane plantain",
        nameTranslations: { en: 'Braised Chicken in Peanut Sauce', de: 'Geschmortes Hähnchen in Erdnusssauce', zh: '花生酱焖鸡' },
        descriptionTranslations: { en: 'Slow-roasted free-range chicken, smooth peanut sauce, fresh attiéké, plantain', de: 'Langsam gebratenes Freilandhuhn, cremige Erdnusssauce, frisches Attiéké, Kochbanane', zh: '慢烤散养鸡、顺滑花生酱、新鲜木薯碎、香蕉' },
      },
      {
        cat: 'viandes', order: 3, price: 28.00, available: true, badge: 'new',
        name: "Agneau en tajine d'abricots",
        description: "Épaule d'agneau fondante, abricots confits, amandes grillées, couscous aux herbes",
        nameTranslations: { en: 'Lamb Apricot Tagine', de: 'Lamm-Aprikosen-Tajine', zh: '杏干羊肉塔吉锅' },
        descriptionTranslations: { en: 'Melt-in-the-mouth lamb shoulder, candied apricots, toasted almonds, herbed couscous', de: 'Zartes Lammschulter, kandierte Aprikosen, geröstete Mandeln, Kräutercouscous', zh: '入口即化羊肩肉、蜜饯杏干、烤杏仁、香草粗麦粉' },
      },
      {
        cat: 'viandes', order: 4, price: 26.00, available: false, badge: null,
        name: 'Magret de canard rôti',
        description: "Magret cuit rosé, réduction au miel-gingembre, purée de patate douce, haricots verts",
        nameTranslations: { en: 'Roasted Duck Breast', de: 'Gebratene Entenbrust', zh: '烤鸭胸' },
        descriptionTranslations: { en: 'Pink-cooked duck breast, honey-ginger reduction, sweet potato purée, green beans', de: 'Rosa gebratene Entenbrust, Honig-Ingwer-Reduktion, Süßkartoffelpüree, grüne Bohnen', zh: '粉嫩鸭胸、蜂蜜姜汁收汁、红薯泥、四季豆' },
      },
      {
        cat: 'viandes', order: 5, price: 32.00, available: true, badge: 'spicy',
        name: "Côtelettes d'agneau grillées",
        description: "Côtelettes marinées aux herbes de Provence, tapenade d'olives, pommes sarladaises",
        nameTranslations: { en: 'Grilled Lamb Chops', de: 'Gegrillte Lammkoteletts', zh: '烤羊排' },
        descriptionTranslations: { en: 'Chops marinated in Provence herbs, olive tapenade, Sarladaise potatoes', de: 'In Provenzalischen Kräutern marinierte Koteletts, Oliventapenade, Sarladaise-Kartoffeln', zh: '普罗旺斯香草腌羊排、橄榄酱、萨尔拉风味土豆' },
      },

      // ── Pizzas ─────────────────────────────────────────────────────────────
      {
        cat: 'pizzas', order: 1, price: 13.50, available: true, badge: 'vegetarian',
        name: 'Margherita bufala',
        description: "Tomate San Marzano, mozzarella di bufala, basilic frais, huile d'olive sicilienne — 32 cm",
        nameTranslations: { en: 'Buffalo Margherita', de: 'Büffel-Margherita', zh: '水牛奶酪玛格丽塔' },
        descriptionTranslations: { en: 'San Marzano tomato, buffalo mozzarella, fresh basil, Sicilian olive oil — 32 cm', de: 'San-Marzano-Tomate, Büffelmozzarella, frisches Basilikum, sizilianisches Olivenöl — 32 cm', zh: '圣马扎诺番茄、水牛芝士、新鲜罗勒、西西里橄榄油 — 32厘米' },
      },
      {
        cat: 'pizzas', order: 2, price: 15.50, available: true, badge: 'popular',
        name: 'Quattro stagioni',
        description: "Jambon cru, champignons, artichauts, olives noires, mozzarella, tomate fraîche — 32 cm",
        nameTranslations: { en: 'Four Seasons Pizza', de: 'Vier Jahreszeiten Pizza', zh: '四季披萨' },
        descriptionTranslations: { en: 'Cured ham, mushrooms, artichokes, black olives, mozzarella, fresh tomato — 32 cm', de: 'Rohschinken, Pilze, Artischocken, schwarze Oliven, Mozzarella, frische Tomate — 32 cm', zh: '生火腿、蘑菇、洋蓟、黑橄榄、马苏里拉、新鲜番茄 — 32厘米' },
      },
      {
        cat: 'pizzas', order: 3, price: 14.50, available: true, badge: 'spicy',
        name: 'Diavola épicée',
        description: "Salami piquant, piment calabrais, mozzarella fumée, tomate, origan — 32 cm",
        nameTranslations: { en: 'Spicy Diavola', de: 'Scharfe Diavola', zh: '魔鬼辣肠披萨' },
        descriptionTranslations: { en: 'Spicy salami, Calabrian chili, smoked mozzarella, tomato, oregano — 32 cm', de: 'Scharfe Salami, kalabrischer Chili, geräucherter Mozzarella, Tomate, Oregano — 32 cm', zh: '辣萨拉米、卡拉布里亚辣椒、烟熏马苏里拉、番茄、牛至 — 32厘米' },
      },
      {
        cat: 'pizzas', order: 4, price: 17.00, available: true, badge: 'new',
        name: 'Pizza du Chef du moment',
        description: "Création hebdomadaire selon les arrivages — demandez au serveur pour les détails du jour",
        nameTranslations: { en: "Chef's Special Pizza", de: "Pizza des Küchenchefs", zh: '每周主厨特色披萨' },
        descriptionTranslations: { en: 'Weekly creation based on fresh arrivals — ask your server for today\'s details', de: 'Wöchentliche Kreation je nach Angebot — fragen Sie Ihren Kellner nach den Tagesdetails', zh: '每周根据食材到货创作 — 请询问服务员今日详情' },
      },

      // ── Desserts ───────────────────────────────────────────────────────────
      {
        cat: 'desserts', order: 1, price: 9.00, available: true, badge: 'popular',
        name: 'Fondant au chocolat Valrhona',
        description: "Cœur coulant 70%, glace vanille Bourbon, caramel beurre salé, tuile croustillante",
        nameTranslations: { en: 'Valrhona Chocolate Lava Cake', de: 'Valrhona-Schokokuchen mit flüssigem Kern', zh: '法芙娜熔岩巧克力蛋糕' },
        descriptionTranslations: { en: '70% molten center, Bourbon vanilla ice cream, salted butter caramel, crispy tuile', de: '70%-Schokoladenkern, Bourbon-Vanilleeis, Salzkaramell, knusprige Tuile', zh: '70%流心、波旁香草冰淇淋、咸黄油焦糖、脆片' },
      },
      {
        cat: 'desserts', order: 2, price: 7.50, available: true, badge: null,
        name: 'Tarte tropézienne aux mangues',
        description: "Mangues Amélie fraîches, crème légère à la vanille, pâte sablée maison",
        nameTranslations: { en: 'Mango Tropézienne Tart', de: 'Mango-Tropézienne-Tarte', zh: '芒果法式奶油挞' },
        descriptionTranslations: { en: 'Fresh Amélie mangoes, light vanilla cream, homemade shortcrust pastry', de: 'Frische Amélie-Mangos, leichte Vanillecreme, hausgemachter Mürbeteig', zh: '新鲜阿梅利芒果、轻盈香草奶油、自制酥皮' },
      },
      {
        cat: 'desserts', order: 3, price: 7.00, available: true, badge: 'new',
        name: 'Crème brûlée à la citronnelle',
        description: "Crème onctueuse infusée à la citronnelle, caramel craquant, zestes de citron vert",
        nameTranslations: { en: 'Lemongrass Crème Brûlée', de: 'Zitronengras-Crème brûlée', zh: '香茅焦糖布丁' },
        descriptionTranslations: { en: 'Smooth lemongrass-infused cream, crackling caramel, lime zest', de: 'Geschmeidige Zitronengras-Creme, knuspriger Karamell, Limettenschale', zh: '香茅浸制丝滑奶油、脆糖、青柠皮' },
      },
      {
        cat: 'desserts', order: 4, price: 8.00, available: true, badge: 'popular',
        name: 'Tiramisu café-Baileys',
        description: "Mascarpone maison, café fort, Baileys, cacao de Madagascar",
        nameTranslations: { en: 'Coffee & Baileys Tiramisù', de: 'Kaffee-Baileys-Tiramisù', zh: '咖啡贝利斯提拉米苏' },
        descriptionTranslations: { en: 'House mascarpone, strong coffee, Baileys, Madagascar cocoa', de: 'Hausgemachter Mascarpone, starker Kaffee, Baileys, Madagaskar-Kakao', zh: '自制马斯卡彭、浓咖啡、贝利斯、马达加斯加可可' },
      },
      {
        cat: 'desserts', order: 5, price: 14.00, available: false, badge: null,
        name: 'Plateau de fromages affinés',
        description: "Sélection de 4 fromages, confiture de figues, miel d'acacia, noix fraîches",
        nameTranslations: { en: 'Aged Cheese Board', de: 'Käseplatte mit gereiften Käsesorten', zh: '精选熟成奶酪拼盘' },
        descriptionTranslations: { en: 'Selection of 4 cheeses, fig jam, acacia honey, fresh walnuts', de: 'Auswahl von 4 Käsesorten, Feigenmarmelade, Akazienhonig, frische Walnüsse', zh: '四款精选奶酪、无花果酱、洋槐蜂蜜、新鲜核桃' },
      },

      // ── Boissons ───────────────────────────────────────────────────────────
      {
        cat: 'boissons', order: 1, price: 3.00, available: true, badge: null,
        name: 'Eau minérale (50cl)',
        description: "Évian plate ou Perrier pétillante",
        nameTranslations: { en: 'Mineral Water (50cl)', de: 'Mineralwasser (50cl)', zh: '矿泉水 (50cl)' },
        descriptionTranslations: { en: 'Still Évian or sparkling Perrier', de: 'Stilles Évian oder prickelndes Perrier', zh: '依云静水或巴黎水气泡水' },
      },
      {
        cat: 'boissons', order: 2, price: 5.50, available: true, badge: 'popular',
        name: 'Jus de bissap maison',
        description: "Hibiscus frais infusé, gingembre, menthe, sucre de canne — servi frais",
        nameTranslations: { en: 'House Hibiscus Juice', de: 'Hausgemachter Hibiskussaft', zh: '自制芙蓉花汁' },
        descriptionTranslations: { en: 'Infused fresh hibiscus, ginger, mint, cane sugar — served chilled', de: 'Aufgebrühter frischer Hibiskus, Ingwer, Minze, Rohrzucker — gekühlt serviert', zh: '新鲜芙蓉花浸泡、生姜、薄荷、蔗糖 — 冷饮' },
      },
      {
        cat: 'boissons', order: 3, price: 6.50, available: true, badge: null,
        name: 'Jus de fruits frais pressés',
        description: "Orange, ananas, mangue, ou maracuja — au choix, pressé à la commande",
        nameTranslations: { en: 'Freshly Squeezed Fruit Juice', de: 'Frisch gepresster Fruchtsaft', zh: '鲜榨果汁' },
        descriptionTranslations: { en: 'Orange, pineapple, mango, or passion fruit — your choice, pressed to order', de: 'Orange, Ananas, Mango oder Maracuja — nach Wahl, frisch gepresst', zh: '橙子、菠萝、芒果或百香果 — 自选，现榨' },
      },
      {
        cat: 'boissons', order: 4, price: 4.50, available: true, badge: null,
        name: 'Bière locale (33cl)',
        description: "Flag, Castel ou Bock fraîche — servie en bouteille ou pression",
        nameTranslations: { en: 'Local Beer (33cl)', de: 'Lokales Bier (33cl)', zh: '本地啤酒 (33cl)' },
        descriptionTranslations: { en: 'Flag, Castel or Bock — bottle or draught', de: 'Flag, Castel oder Bock — Flasche oder vom Fass', zh: 'Flag、Castel 或 Bock — 瓶装或扎啤' },
      },
      {
        cat: 'boissons', order: 5, price: 8.00, available: true, badge: null,
        name: 'Vin rouge (verre 15cl)',
        description: "Sélection du sommelier — Bordeaux AOC ou Côtes du Rhône selon arrivage",
        nameTranslations: { en: 'Red Wine (glass 15cl)', de: 'Rotwein (Glas 15cl)', zh: '红酒 (杯装 15cl)' },
        descriptionTranslations: { en: "Sommelier's selection — Bordeaux AOC or Côtes du Rhône depending on stock", de: 'Sommelierauswahl — Bordeaux AOC oder Côtes du Rhône je nach Verfügbarkeit', zh: '侍酒师精选 — 波尔多AOC或罗纳河谷，视到货而定' },
      },
      {
        cat: 'boissons', order: 6, price: 10.00, available: true, badge: 'new',
        name: 'Cocktail du bar',
        description: "Mojito, Daïquiri, Piña Colada ou Spritz — demandez la carte complète",
        nameTranslations: { en: 'Bar Cocktail', de: 'Bar-Cocktail', zh: '酒吧特调鸡尾酒' },
        descriptionTranslations: { en: 'Mojito, Daiquiri, Piña Colada or Spritz — ask for the full menu', de: 'Mojito, Daiquiri, Piña Colada oder Spritz — fragen Sie nach der vollständigen Karte', zh: '莫吉托、代基里、椰林飘香或史普里兹 — 请索取完整酒单' },
      },
    ]

    for (const item of r1Items) {
      await upsertItem(r1.id, {
        categoryId: r1Cats[item.cat].id,
        name: item.name,
        description: item.description,
        nameTranslations: item.nameTranslations,
        descriptionTranslations: item.descriptionTranslations,
        price: item.price,
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
      entrees: await upsertCategory(r2.id, {
        name: 'Entrées', description: 'Mise en bouche africaine', sortOrder: 1, isVisible: true,
        nameTranslations: { en: 'Starters', de: 'Vorspeisen', zh: '开胃菜' },
        descriptionTranslations: { en: 'African appetizers', de: 'Afrikanische Häppchen', zh: '非洲开胃小食' },
      }),
      plats: await upsertCategory(r2.id, {
        name: 'Plats africains', description: 'Recettes authentiques du continent', sortOrder: 2, isVisible: true,
        nameTranslations: { en: 'African Dishes', de: 'Afrikanische Gerichte', zh: '非洲菜肴' },
        descriptionTranslations: { en: 'Authentic recipes from the continent', de: 'Authentische Rezepte vom Kontinent', zh: '正宗非洲大陆菜谱' },
      }),
      boissons: await upsertCategory(r2.id, {
        name: 'Boissons', description: 'Jus naturels & softs', sortOrder: 3, isVisible: true,
        nameTranslations: { en: 'Drinks', de: 'Getränke', zh: '饮品' },
        descriptionTranslations: { en: 'Natural juices & soft drinks', de: 'Natürliche Säfte & Softdrinks', zh: '天然果汁和软饮' },
      }),
    }

    type R2Item = {
      cat: keyof typeof r2Cats
      name: string; description: string
      nameTranslations: Record<string, string>
      descriptionTranslations: Record<string, string>
      price: number; available: boolean; badge: MenuItemBadge; order: number
    }

    // Exactly 15 items to respect the free plan limit
    const r2Items: R2Item[] = [
      // Entrées (4)
      {
        cat: 'entrees', order: 1, price: 7.00, available: true, badge: 'vegetarian',
        name: 'Salade de papaye verte',
        description: "Papaye verte râpée, tomates cerises, arachides grillées, vinaigrette citronnée",
        nameTranslations: { en: 'Green Papaya Salad', de: 'Grüner Papayasalat', zh: '青木瓜沙拉' },
        descriptionTranslations: { en: 'Grated green papaya, cherry tomatoes, roasted peanuts, lemon dressing', de: 'Geriebene grüne Papaya, Kirschtomaten, geröstete Erdnüsse, Zitronen-Vinaigrette', zh: '刨丝青木瓜、圣女果、烤花生、柠檬汁' },
      },
      {
        cat: 'entrees', order: 2, price: 8.50, available: true, badge: 'popular',
        name: 'Accras de morue maison',
        description: "Beignets croustillants à la morue, sauce piquante maison, citron vert",
        nameTranslations: { en: 'House Saltfish Fritters', de: 'Hausgemachte Kabeljau-Krapfen', zh: '自制鳕鱼炸饼' },
        descriptionTranslations: { en: 'Crispy codfish fritters, house hot sauce, lime', de: 'Knusprige Kabeljaukrapfen, hausgemachte Chilisauce, Limette', zh: '脆皮鳕鱼饼、自制辣酱、青柠' },
      },
      {
        cat: 'entrees', order: 3, price: 9.50, available: true, badge: 'spicy',
        name: 'Brochettes de bœuf yassa',
        description: "Bœuf mariné à l'oseille, oignons confits, moutarde douce — 4 pièces",
        nameTranslations: { en: 'Beef Yassa Skewers', de: 'Yassa-Rindfleischspieße', zh: '亚萨牛肉串' },
        descriptionTranslations: { en: 'Beef marinated in sorrel, caramelized onions, mild mustard — 4 pieces', de: 'In Sauerampfer mariniertes Rindfleisch, karamellisierte Zwiebeln, milder Senf — 4 Stück', zh: '酸模腌牛肉、焦糖洋葱、温和芥末 — 4串' },
      },
      {
        cat: 'entrees', order: 4, price: 7.50, available: true, badge: null,
        name: 'Soupe légère de poisson',
        description: "Bouillon de poisson fumé, tomates, oignons, herbes fraîches, chili doux",
        nameTranslations: { en: 'Light Fish Soup', de: 'Leichte Fischsuppe', zh: '清淡鱼汤' },
        descriptionTranslations: { en: 'Smoked fish broth, tomatoes, onions, fresh herbs, mild chili', de: 'Räucherfischbrühe, Tomaten, Zwiebeln, frische Kräuter, milder Chili', zh: '烟熏鱼汤底、番茄、洋葱、新鲜香草、温辣椒' },
      },

      // Plats africains (8)
      {
        cat: 'plats', order: 1, price: 14.00, available: true, badge: 'popular',
        name: 'Poulet braisé DG',
        description: "Poulet fermier braisé, sauce tomate-banane, légumes sautés — la spécialité de la maison",
        nameTranslations: { en: 'DG Braised Chicken', de: 'Geschmortes DG-Hähnchen', zh: 'DG焖鸡' },
        descriptionTranslations: { en: 'Braised free-range chicken, tomato-banana sauce, sautéed vegetables — house specialty', de: 'Geschmortes Freilandhuhn, Tomaten-Bananen-Sauce, gebratenes Gemüse — Hausspecialität', zh: '焖散养鸡、番茄香蕉酱、炒蔬菜 — 招牌菜' },
      },
      {
        cat: 'plats', order: 2, price: 13.00, available: true, badge: 'popular',
        name: 'Kedjenou de poulet',
        description: "Poulet mijoté à l'étouffée, légumes du jardin, épices douces — servi avec du riz gluant",
        nameTranslations: { en: 'Chicken Kedjenou', de: 'Hühnchen-Kedjenou', zh: '科杰努炖鸡' },
        descriptionTranslations: { en: 'Chicken slow-cooked in its own juices, garden vegetables, mild spices — served with sticky rice', de: 'Im eigenen Saft gedünstetes Hähnchen, Gartengemüse, milde Gewürze — mit Klebreis serviert', zh: '慢炖鸡、园蔬、温和香料 — 配糯米饭' },
      },
      {
        cat: 'plats', order: 3, price: 12.00, available: true, badge: null,
        name: 'Riz gras au mouton',
        description: "Riz parfumé cuit dans le bouillon de mouton, légumes, tomates, épices de Côte d'Ivoire",
        nameTranslations: { en: 'Mutton Jollof Rice', de: 'Hammel-Jollof-Reis', zh: '羊肉焖饭' },
        descriptionTranslations: { en: 'Aromatic rice cooked in mutton broth, vegetables, tomatoes, Ivorian spices', de: 'Aromatischer Reis in Hammelbrühe, Gemüse, Tomaten, ivorische Gewürze', zh: '羊肉汤汁焖香米、蔬菜、番茄、科特迪瓦香料' },
      },
      {
        cat: 'plats', order: 4, price: 11.00, available: true, badge: 'spicy',
        name: 'Alloco poisson frit',
        description: "Banane plantain mûre frite, poisson tilapia entier, oignons caramélisés, piment vert",
        nameTranslations: { en: 'Alloco Fried Fish', de: 'Alloco mit gebratenem Fisch', zh: '炸香蕉配炸鱼' },
        descriptionTranslations: { en: 'Fried ripe plantain, whole tilapia, caramelized onions, green chili', de: 'Gebratene reife Kochbanane, ganzer Tilapia, karamellisierte Zwiebeln, grüner Chili', zh: '炸熟香蕉、整条罗非鱼、焦糖洋葱、青辣椒' },
      },
      {
        cat: 'plats', order: 5, price: 11.50, available: true, badge: 'vegetarian',
        name: 'Foutou banane & sauce graine',
        description: "Foutou de banane pilé, sauce graine de palme au crabe, crevettes séchées",
        nameTranslations: { en: 'Plantain Foutou & Palm Nut Sauce', de: 'Bananen-Foutou & Palmkern-Sauce', zh: '香蕉泥配棕榈果酱' },
        descriptionTranslations: { en: 'Pounded plantain fufu, palm nut sauce with crab, dried shrimp', de: 'Gestampfter Kochbananenteig, Palmkern-Sauce mit Krabbe, getrocknete Garnelen', zh: '捣制香蕉泥、棕榈果螃蟹酱、虾干' },
      },
      {
        cat: 'plats', order: 6, price: 15.50, available: true, badge: 'new',
        name: 'Thiéboudienne sénégalais',
        description: "Riz au poisson à la sénégalaise, légumes, sauce tomate, poisson entier grillé",
        nameTranslations: { en: 'Senegalese Thiéboudienne', de: 'Senegalesisches Thiéboudienne', zh: '塞内加尔鱼饭' },
        descriptionTranslations: { en: 'Senegalese fish and rice, vegetables, tomato sauce, whole grilled fish', de: 'Senegalesischer Fisch-Reis, Gemüse, Tomatensauce, gegrillter ganzer Fisch', zh: '塞内加尔鱼汤泡饭、蔬菜、番茄酱、整条烤鱼' },
      },
      {
        cat: 'plats', order: 7, price: 12.00, available: false, badge: null,
        name: 'Brochettes de poulet grillé',
        description: "Poulet mariné herbes et citron, grillé au charbon, servi avec attiéké et salade",
        nameTranslations: { en: 'Grilled Chicken Skewers', de: 'Gegrillte Hähnchenspieße', zh: '烤鸡肉串' },
        descriptionTranslations: { en: 'Herb and lemon marinated chicken, charcoal grilled, served with attiéké and salad', de: 'Kräuter-Zitronen-mariniertes Hähnchen, auf Holzkohle gegrillt, mit Attiéké und Salat', zh: '香草柠檬腌鸡肉、炭火烤制、配木薯碎和沙拉' },
      },
      {
        cat: 'plats', order: 8, price: 17.00, available: true, badge: 'new',
        name: "Mafé d'agneau",
        description: "Épaule d'agneau fondante, sauce cacahuète crémeuse, riz blanc, légumes sautés",
        nameTranslations: { en: 'Lamb Mafé', de: 'Lamm-Mafé', zh: '羊肉花生酱炖' },
        descriptionTranslations: { en: 'Melt-in-the-mouth lamb shoulder, creamy peanut sauce, white rice, sautéed vegetables', de: 'Zartes Lammschulter, cremige Erdnusssauce, weißer Reis, gebratenes Gemüse', zh: '入口即化羊肩、奶油花生酱、白米饭、炒蔬菜' },
      },

      // Boissons (3)
      {
        cat: 'boissons', order: 1, price: 4.50, available: true, badge: 'popular',
        name: 'Jus de gingembre frais',
        description: "Gingembre pressé, citron, sucre de canne, glaçons — fortifiant et rafraîchissant",
        nameTranslations: { en: 'Fresh Ginger Juice', de: 'Frischer Ingwersaft', zh: '鲜姜汁' },
        descriptionTranslations: { en: 'Pressed ginger, lemon, cane sugar, ice — invigorating and refreshing', de: 'Gepresster Ingwer, Zitrone, Rohrzucker, Eiswürfel — belebend und erfrischend', zh: '鲜榨生姜、柠檬、蔗糖、冰块 — 强身提神' },
      },
      {
        cat: 'boissons', order: 2, price: 4.00, available: true, badge: null,
        name: 'Bissap hibiscus',
        description: "Fleurs d'hibiscus séchées infusées, menthe fraîche, eau de fleur d'oranger",
        nameTranslations: { en: 'Hibiscus Bissap', de: 'Hibiskus-Bissap', zh: '芙蓉花饮料' },
        descriptionTranslations: { en: 'Infused dried hibiscus flowers, fresh mint, orange blossom water', de: 'Aufgebrühte getrocknete Hibiskusblüten, frische Minze, Orangenblütenwasser', zh: '干芙蓉花浸泡、新鲜薄荷、橙花水' },
      },
      {
        cat: 'boissons', order: 3, price: 3.00, available: true, badge: null,
        name: 'Eau minérale (50cl)',
        description: "Eau plate ou gazeuse fraîche",
        nameTranslations: { en: 'Mineral Water (50cl)', de: 'Mineralwasser (50cl)', zh: '矿泉水 (50cl)' },
        descriptionTranslations: { en: 'Still or sparkling, chilled', de: 'Still oder prickelnd, gekühlt', zh: '静水或气泡水，冰镇' },
      },
    ]

    for (const item of r2Items) {
      await upsertItem(r2.id, {
        categoryId: r2Cats[item.cat].id,
        name: item.name,
        description: item.description,
        nameTranslations: item.nameTranslations,
        descriptionTranslations: item.descriptionTranslations,
        price: item.price,
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
    console.log(`     Email    : superadmin@saemenus.com`)
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
