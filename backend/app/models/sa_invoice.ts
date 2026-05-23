import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Restaurant from '#models/restaurant'
import User from '#models/user'

export type BillingCycle = 'monthly' | 'yearly'

export default class SaInvoice extends BaseModel {
  static table = 'sa_invoices'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare invoiceNumber: string

  @column()
  declare restaurantId: number

  @column()
  declare subscriptionId: number | null

  @column()
  declare grantedBy: number | null

  @column()
  declare planName: string

  @column()
  declare planSlug: string

  @column()
  declare billingCycle: BillingCycle

  @column()
  declare durationMonths: number

  @column()
  declare amountPaidCents: number

  @column()
  declare originalPriceCents: number

  @column()
  declare currency: string

  @column()
  declare notes: string | null

  @column.dateTime()
  declare periodStart: DateTime

  @column.dateTime()
  declare periodEnd: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  @belongsTo(() => User, { foreignKey: 'grantedBy' })
  declare granter: BelongsTo<typeof User>
}
