import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration 017 — Plan Pro : activation de la feature commandes & réservations
 *
 * Ajoute les clés machine-readable (orders_and_reservations, stats, priority_support)
 * dans le JSON features du plan Pro et Enterprise pour les plans déjà en base.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // ── Pro : ajout orders_and_reservations + clés machine ───────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          COALESCE(features, '{}'),
          '$.orders_and_reservations', TRUE,
          '$.stats',                   TRUE,
          '$.priority_support',        TRUE
        )
        WHERE slug = 'pro'
      `)

      // ── Enterprise : ajout de toutes les clés machine ────────────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          COALESCE(features, '{}'),
          '$.orders_and_reservations', TRUE,
          '$.stats',                   TRUE,
          '$.api_access',              TRUE,
          '$.priority_support',        TRUE,
          '$.gift_qr',                 TRUE
        )
        WHERE slug = 'enterprise'
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      // Retire les clés machine du plan Pro
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_REMOVE(
          features,
          '$.orders_and_reservations',
          '$.stats',
          '$.priority_support'
        )
        WHERE slug = 'pro'
      `)

      // Retire les clés machine du plan Enterprise
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_REMOVE(
          features,
          '$.orders_and_reservations',
          '$.stats',
          '$.api_access',
          '$.priority_support',
          '$.gift_qr'
        )
        WHERE slug = 'enterprise'
      `)
    })
  }
}
