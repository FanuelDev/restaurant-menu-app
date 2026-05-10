import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import MenuItem from '#models/menu_item'
import Restaurant from '#models/restaurant'

/** Transforme une valeur DB (string JSON ou objet) en Record. */
function consumeJson(v: unknown): Record<string, string> {
  if (!v) return {}
  if (typeof v === 'string') {
    try { return JSON.parse(v) } catch { return {} }
  }
  return v as Record<string, string>
}

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

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

  @column()
  declare sortOrder: number

  @column()
  declare isVisible: boolean

  @hasMany(() => MenuItem)
  declare menuItems: HasMany<typeof MenuItem>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
