import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Restaurant from '#models/restaurant'

export default class Plan extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare priceMonthlyCents: number

  @column()
  declare priceYearlyCents: number

  @column()
  declare maxCategories: number

  @column()
  declare maxMenuItems: number

  @column()
  declare maxUsers: number

  @column({
    prepare: (v) => JSON.stringify(v),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare features: Record<string, boolean> | null

  @column()
  declare isActive: boolean

  @column()
  declare isPublic: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Restaurant)
  declare restaurants: HasMany<typeof Restaurant>
}
