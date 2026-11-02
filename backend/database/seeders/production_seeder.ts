import { DateTime } from 'luxon'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import db from '@adonisjs/lucid/services/db'
import Plan from '#models/plan'
import User from '#models/user'

/**
 * ProductionSeeder — à lancer UNE SEULE FOIS avant le lancement en production.
 *
 * Ce qu'il fait :
 *   1. Purge toutes les données de test (restaurants, utilisateurs, commandes, etc.)
 *   2. Conserve uniquement les plans et le super admin
 *
 * Lancement :
 *   node ace db:seed --files database/seeders/production_seeder.ts
 */
export default class ProductionSeeder extends BaseSeeder {
  async run() {
    console.log('\n⚠️  PRODUCTION SEEDER — Nettoyage de la base de données')
    console.log('═'.repeat(60))

    // ── 1. Désactivation des FK pour truncate propre ──────────────────────────
    await db.rawQuery('SET FOREIGN_KEY_CHECKS = 0')

    const tables = [
      'gdpr_deletion_requests',
      'marketing_voucher_usages',
      'marketing_vouchers',
      'order_items',
      'orders',
      'reservations',
      'finance_expenses',
      'finance_incomes',
      'sa_invoices',
      'page_views',
      'audit_logs',
      'api_keys',
      'auth_access_tokens',
      'subscriptions',
      'menu_items',
      'categories',
    ]

    for (const table of tables) {
      try {
        await db.from(table).delete()
        console.log(`  🗑️  ${table} vidée`)
      } catch {
        console.log(`  ⏭️  ${table} ignorée (table inexistante)`)
      }
    }

    // Supprimer les utilisateurs non super_admin
    const deletedUsers = await db.from('users').whereNot('role', 'super_admin').delete()
    console.log(`  🗑️  users (non super_admin) : ${deletedUsers[0] ?? 0} supprimé(s)`)

    // Supprimer les restaurants de test
    const deletedRestaurants = await db.from('restaurants').delete()
    console.log(`  🗑️  restaurants : ${deletedRestaurants[0] ?? 0} supprimé(s)`)

    await db.rawQuery('SET FOREIGN_KEY_CHECKS = 1')
    console.log('  ✅ FK réactivées\n')

    // ── 2. Plans (upsert — prix en centimes XOF) ──────────────────────────────
    const plansData = [
      {
        name: 'Gratuit',
        slug: 'free',
        description: 'Idéal pour démarrer sans engagement',
        priceMonthlyCents: 0,
        priceYearlyCents: 0,
        maxCategories: 3,
        maxMenuItems: 10,
        maxUsers: 1,
        features: {
          '3 catégories de menu': true,
          '10 plats maximum': true,
          '1 utilisateur': true,
          'Page menu QR publique': true,
          'Statistiques avancées': false,
          'Gestion d\'équipe': false,
          'Journal d\'audit': false,
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
          'Gestion d\'équipe': true,
          'Journal d\'audit': true,
          'Support prioritaire': true,
          'Commandes & réservations': true,
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
          'Commandes & réservations': true,
        } as Record<string, boolean>,
        isActive: true,
        isPublic: true,
        sortOrder: 2,
      },
    ]

    for (const data of plansData) {
      await Plan.updateOrCreate({ slug: data.slug }, data)
    }
    console.log('  ✅ Plans : Gratuit, Pro, Enterprise')

    // ── 3. Super Admin ────────────────────────────────────────────────────────
    const [superAdmin] = await User.updateOrCreateMany('email', [
      {
        email: 'superadmin@saemenus.com',
        password: 'SuperAdmin1234!',
        fullName: 'Super Administrateur',
        role: 'super_admin',
        restaurantId: null,
        isActive: true,
        emailVerifiedAt: DateTime.now(),
      },
    ])
    console.log(`  ✅ Super admin : ${superAdmin.email}`)

    // ── Récap ─────────────────────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(60))
    console.log('🚀  BASE DE DONNÉES PRÊTE POUR LA PRODUCTION')
    console.log('═'.repeat(60))
    console.log('  Plans actifs    : Gratuit | Pro (100 XOF/mois) | Enterprise (300 XOF/mois)')
    console.log('  Super admin     : superadmin@saemenus.com')
    console.log('  Restaurants test: aucun — base propre')
    console.log('\n  ⚠️  Changez le mot de passe du super admin après connexion !')
    console.log('═'.repeat(60) + '\n')
  }
}
