import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Restaurant from '#models/restaurant'

export default class ApiKey extends BaseModel {
  static table = 'api_keys'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare name: string

  /** Premiers caractères affichés dans l'UI (ex: "saem_live_Ab3x...") */
  @column()
  declare keyPrefix: string

  /** Hash SHA-256 de la clé complète — jamais renvoyé en clair après création */
  @column({ serializeAs: null })
  declare keyHash: string

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare lastUsedAt: DateTime | null

  @column.dateTime()
  declare expiresAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  get isExpired(): boolean {
    return this.expiresAt !== null && this.expiresAt < DateTime.now()
  }
}
