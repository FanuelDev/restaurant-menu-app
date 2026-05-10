import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import Restaurant from '#models/restaurant'

export type MenuItemBadge = 'new' | 'popular' | 'vegetarian' | 'spicy' | null

/** Transforme une valeur DB (string JSON ou objet) en Record. */
function consumeJson(v: unknown): Record<string, string> {
  if (!v) return {}
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return {} }
  }
  return v as Record<string, string>
}

export default class MenuItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare categoryId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  @column({
    prepare: (v: Record<string, string> | null) => JSON.stringify(v ?? {}),
    consume: consumeJson,
  })
  declare nameTranslations: Record<string, string>

  @column({
    prepare: (v: Record<string, string> | null) => JSON.stringify(v ?? {}),
    consume: consumeJson,
  })
  declare descriptionTranslations: Record<string, string>

  /** Prix en euros (DECIMAL 10,2) — ex : 12.50 */
  @column()
  declare price: number

  @column()
  declare imageKey: string | null

  imageUrl?: string | null

  @column()
  declare isAvailable: boolean

  @column()
  declare badge: MenuItemBadge

  @column()
  declare sortOrder: number

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
