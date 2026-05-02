// backend/app/models/restaurant.ts
import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

/**
 * Table singleton — un seul enregistrement représente le restaurant.
 * Les méthodes statiques facilitent la récupération de cet enregistrement unique.
 */
export default class Restaurant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slogan: string | null

  /** Couleur principale de la marque (hex, ex: "#E85D04") */
  @column()
  declare brandColor: string

  /** Clé du fichier logo dans le disk Drive */
  @column()
  declare logoKey: string | null

  /** URL publique calculée côté controller lors de la sérialisation */
  logoUrl?: string | null

  /** Horaires au format JSON structuré */
  @column({
    prepare: (value: Record<string, unknown>) => JSON.stringify(value),
    consume: (value: string) => {
      try {
        return JSON.parse(value)
      } catch {
        return null
      }
    },
  })
  declare openingHours: Record<string, { open: string; close: string; closed?: boolean }> | null

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /** Retourne le restaurant (crée un défaut s'il n'existe pas encore) */
  static async getOrCreate(): Promise<Restaurant> {
    let restaurant = await Restaurant.first()
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Mon Restaurant',
        slogan: 'Bienvenue !',
        brandColor: '#E85D04',
        logoKey: null,
        openingHours: null,
      })
    }
    return restaurant
  }
}
