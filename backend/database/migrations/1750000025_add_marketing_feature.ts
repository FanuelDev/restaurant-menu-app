import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration 025 — Ajout de la feature "marketing" aux plans Enterprise.
 *
 * La fonctionnalité marketing (bons de commande événementiels) est désormais
 * une feature plan distincte, séparée de "financial_management".
 * Elle est réservée au plan Enterprise.
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          COALESCE(features, '{}'),
          '$.marketing', TRUE
        )
        WHERE slug = 'enterprise'
      `)
    })
  }

  async down() {
    this.defer(async (db) => {
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_REMOVE(features, '$.marketing')
        WHERE slug = 'enterprise'
      `)
    })
  }
}
