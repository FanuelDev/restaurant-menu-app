import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Retire les clés snake_case parasites (doublons programmatiques) des features JSON
 * des plans Pro et Enterprise. Seules les clés lisibles (avec espaces/accents) restent.
 */
export default class extends BaseSchema {
  async up() {
    const keysToRemove = ['stats', 'gift_qr', 'api_access', 'priority_support', 'orders_and_reservations']

    const plans = await this.db.from('plans').select('id', 'features')
    for (const plan of plans) {
      let features: Record<string, unknown>
      try {
        features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features ?? {}
      } catch { features = {} }

      let changed = false
      for (const key of keysToRemove) {
        if (key in features) {
          delete features[key]
          changed = true
        }
      }
      if (changed) {
        await this.db.from('plans').where('id', plan.id).update({ features: JSON.stringify(features) })
      }
    }
  }

  async down() {
    // Irreversible — les clés parasites ne doivent pas revenir
  }
}
