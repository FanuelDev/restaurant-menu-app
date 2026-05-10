import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import OrderItem from '#models/order_item'
import Restaurant from '#models/restaurant'

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare orderNumber: string

  @column()
  declare customerName: string

  @column()
  declare customerPhone: string | null

  @column()
  declare customerEmail: string | null

  @column()
  declare status: OrderStatus

  @column()
  declare notes: string | null

  /** Total de la commande en euros */
  @column()
  declare total: number

  @column()
  declare isGift: boolean

  @column()
  declare giftMessage: string | null

  @column()
  declare giftToken: string | null

  @column.dateTime()
  declare giftRedeemedAt: DateTime | null

  @column()
  declare giftRedeemedBy: string | null

  @column()
  declare giftRedeemedContact: string | null

  @column.dateTime()
  declare giftRevokedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>
}
