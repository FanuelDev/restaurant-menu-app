import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration 022 — Séparation commandes / réservations
 *
 * Avant : une seule clé `orders_and_reservations` donnant accès aux deux pour Pro+
 * Après :
 *   - `orders`       → commandes (Pro+)
 *   - `reservations` → réservations (Enterprise uniquement)
 *
 * L'objectif est que le JSON `features` soit l'unique source de vérité pour
 * les guards backend et les checks frontend, sans fallback sur le slug du plan.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // ── Pro : orders uniquement, pas de réservations ──────────────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          JSON_REMOVE(COALESCE(features, '{}'), '$.orders_and_reservations'),
          '$.orders',            TRUE,
          '$.stats',             TRUE,
          '$.priority_support',  TRUE
        )
        WHERE slug = 'pro'
      `)

      // ── Enterprise : toutes les features ──────────────────────────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          JSON_REMOVE(COALESCE(features, '{}'), '$.orders_and_reservations'),
          '$.orders',                TRUE,
          '$.reservations',          TRUE,
          '$.stats',                 TRUE,
          '$.priority_support',      TRUE,
          '$.api_access',            TRUE,
          '$.gift_qr',               TRUE,
          '$.financial_management',  TRUE
        )
        WHERE slug = 'enterprise'
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      // Pro : restaurer l'ancienne clé
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          JSON_REMOVE(COALESCE(features, '{}'), '$.orders', '$.reservations'),
          '$.orders_and_reservations', TRUE,
          '$.stats',                   TRUE,
          '$.priority_support',        TRUE
        )
        WHERE slug = 'pro'
      `)

      // Enterprise : restaurer l'ancienne clé
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          JSON_REMOVE(COALESCE(features, '{}'), '$.orders', '$.reservations', '$.financial_management'),
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
}
