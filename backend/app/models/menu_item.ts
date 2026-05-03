import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'
import Restaurant from '#models/restaurant'

export type MenuItemBadge = 'new' | 'popular' | 'vegetarian' | 'spicy' | null

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

  @column()
  declare priceInCents: number

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
