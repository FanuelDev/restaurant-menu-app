import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Migration 016 — Passage de tous les prix en euros (stockage décimal)
 *
 * Plans : les colonnes restent en centimes mais les valeurs sont mises à jour
 *         (Pro = 10 000 cts = 100 €/mois, Enterprise = 30 000 cts = 300 €/mois)
 *
 * menu_items   : price_in_cents (INT)  → price (DECIMAL 10,2 €)
 * order_items  : menu_item_price_in_cents / subtotal_in_cents → euros
 * orders       : total_in_cents → total (DECIMAL 10,2 €)
 */
export default class extends BaseSchema {
  async up() {
    // Toutes les opérations sont deferées pour pouvoir intercaler UPDATE de données
    this.defer(async (db) => {

      // ── Plans : mise à jour des tarifs ────────────────────────────────────
      await db.rawQuery(
        `UPDATE plans SET price_monthly_cents = 10000, price_yearly_cents = 100000 WHERE slug = 'pro'`
      )
      await db.rawQuery(
        `UPDATE plans SET price_monthly_cents = 30000, price_yearly_cents = 300000 WHERE slug = 'enterprise'`
      )

      // ── menu_items : price_in_cents → price (DECIMAL) ────────────────────
      await db.rawQuery(`ALTER TABLE menu_items ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE menu_items SET price = price_in_cents / 100.0`)
      await db.rawQuery(`ALTER TABLE menu_items DROP COLUMN price_in_cents`)

      // ── order_items : centimes → euros ───────────────────────────────────
      await db.rawQuery(`ALTER TABLE order_items ADD COLUMN menu_item_price DECIMAL(10,2) NOT NULL DEFAULT 0`)
      await db.rawQuery(`ALTER TABLE order_items ADD COLUMN subtotal DECIMAL(10,2) NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE order_items SET menu_item_price = menu_item_price_in_cents / 100.0`)
      await db.rawQuery(`UPDATE order_items SET subtotal = subtotal_in_cents / 100.0`)
      await db.rawQuery(`ALTER TABLE order_items DROP COLUMN menu_item_price_in_cents`)
      await db.rawQuery(`ALTER TABLE order_items DROP COLUMN subtotal_in_cents`)

      // ── orders : total_in_cents → total (DECIMAL) ────────────────────────
      await db.rawQuery(`ALTER TABLE orders ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE orders SET total = total_in_cents / 100.0`)
      await db.rawQuery(`ALTER TABLE orders DROP COLUMN total_in_cents`)
    })
  }

  async down() {
    this.defer(async (db) => {
      // Restaurer les plans à leurs valeurs précédentes (approximation)
      await db.rawQuery(
        `UPDATE plans SET price_monthly_cents = 1500000, price_yearly_cents = 15000000 WHERE slug = 'pro'`
      )
      await db.rawQuery(
        `UPDATE plans SET price_monthly_cents = 5000000, price_yearly_cents = 50000000 WHERE slug = 'enterprise'`
      )

      // Restaurer menu_items
      await db.rawQuery(`ALTER TABLE menu_items ADD COLUMN price_in_cents INTEGER NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE menu_items SET price_in_cents = ROUND(price * 100)`)
      await db.rawQuery(`ALTER TABLE menu_items DROP COLUMN price`)

      // Restaurer order_items
      await db.rawQuery(`ALTER TABLE order_items ADD COLUMN menu_item_price_in_cents INTEGER NOT NULL DEFAULT 0`)
      await db.rawQuery(`ALTER TABLE order_items ADD COLUMN subtotal_in_cents INTEGER NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE order_items SET menu_item_price_in_cents = ROUND(menu_item_price * 100)`)
      await db.rawQuery(`UPDATE order_items SET subtotal_in_cents = ROUND(subtotal * 100)`)
      await db.rawQuery(`ALTER TABLE order_items DROP COLUMN menu_item_price`)
      await db.rawQuery(`ALTER TABLE order_items DROP COLUMN subtotal`)

      // Restaurer orders
      await db.rawQuery(`ALTER TABLE orders ADD COLUMN total_in_cents INTEGER NOT NULL DEFAULT 0`)
      await db.rawQuery(`UPDATE orders SET total_in_cents = ROUND(total * 100)`)
      await db.rawQuery(`ALTER TABLE orders DROP COLUMN total`)
    })
  }
}
