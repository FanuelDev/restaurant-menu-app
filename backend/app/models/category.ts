import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import MenuItem from '#models/menu_item'
import Restaurant from '#models/restaurant'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

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
