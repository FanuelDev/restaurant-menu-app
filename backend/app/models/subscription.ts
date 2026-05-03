import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'
import Restaurant from '#models/restaurant'

export type SubscriptionStatus = 'pending' | 'active' | 'past_due' | 'canceled' | 'expired'
export type BillingCycle = 'monthly' | 'yearly'

export default class Subscription extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare planId: number

  @column()
  declare cinetpayTransactionId: string | null

  @column()
  declare cinetpayPaymentToken: string | null

  @column()
  declare billingCycle: BillingCycle

  @column()
  declare status: SubscriptionStatus

  @column()
  declare amountCents: number

  @column()
  declare currency: string

  @column.dateTime()
  declare currentPeriodStart: DateTime | null

  @column.dateTime()
  declare currentPeriodEnd: DateTime | null

  @column.dateTime()
  declare canceledAt: DateTime | null

  @column({
    prepare: (v) => JSON.stringify(v),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare paymentMetadata: Record<string, unknown> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  get isActive() {
    return this.status === 'active'
  }

  get isExpired() {
    return this.currentPeriodEnd !== null && this.currentPeriodEnd < DateTime.now()
  }
}
