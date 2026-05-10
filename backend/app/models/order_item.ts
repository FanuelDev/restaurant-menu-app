import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from '#models/order'

export default class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare orderId: number

  @column()
  declare menuItemId: number | null

  @column()
  declare menuItemName: string

  /** Prix unitaire en euros au moment de la commande */
  @column()
  declare menuItemPrice: number

  @column()
  declare quantity: number

  @column()
  declare specialInstructions: string | null

  /** Sous-total en euros (price × quantity) */
  @column()
  declare subtotal: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>
}
