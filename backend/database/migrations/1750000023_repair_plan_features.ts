import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration 023 — Réparation des features de plans
 *
 * Contexte : après la migration 022, un SA a édité le plan Enterprise via l'ancienne
 * UI textarea et n'a saisi que ["orders", "stats", "api_access"], écrasant les autres
 * features (reservations, financial_management, priority_support, gift_qr).
 *
 * Cette migration restaure les features complètes pour Enterprise et Pro,
 * en fusionnant avec ce qui existe déjà (JSON_SET n'écrase que les clés listées).
 */
export default class extends BaseSchema {
  async up() {
    this.defer(async (db) => {
      // ── Enterprise : toutes les 7 features ───────────────────────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          COALESCE(features, '{}'),
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

      // ── Pro : orders + stats + priority_support ───────────────────────────
      await db.rawQuery(`
        UPDATE plans
        SET features = JSON_SET(
          COALESCE(features, '{}'),
          '$.orders',            TRUE,
          '$.stats',             TRUE,
          '$.priority_support',  TRUE
        )
        WHERE slug = 'pro'
      `)
    })
  }

  async down() {
    // Pas de rollback automatique : les features précédentes sont inconnues.
    // En cas de besoin, utiliser le SA UI pour remettre manuellement.
  }
}
