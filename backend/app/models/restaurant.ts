import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, hasOne } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, HasOne } from '@adonisjs/lucid/types/relations'
import Plan from '#models/plan'
import Category from '#models/category'

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'suspended'

export default class Restaurant extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare slug: string

  @column()
  declare name: string

  @column()
  declare slogan: string | null

  @column()
  declare brandColor: string

  @column()
  declare logoKey: string | null

  logoUrl?: string | null

  @column()
  declare address: string | null

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare website: string | null

  @column()
  declare siret: string | null

  @column()
  declare country: string

  @column()
  declare currency: string

  @column({
    prepare: (v) => JSON.stringify(v),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare openingHours: Record<string, { open: string; close: string; closed: boolean }> | null

  @column()
  declare planId: number | null

  @column()
  declare subscriptionStatus: SubscriptionStatus

  @column.dateTime()
  declare trialEndsAt: DateTime | null

  @column()
  declare cinetpayCustomerRef: string | null

  @column()
  declare isActive: boolean

  @column.dateTime()
  declare blockedAt: DateTime | null

  @column()
  declare blockedReason: string | null

  @column()
  declare blockedById: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Plan)
  declare plan: BelongsTo<typeof Plan>

  @hasMany(() => Category)
  declare categories: HasMany<typeof Category>

  get isTrialing() {
    return (
      this.subscriptionStatus === 'trialing' &&
      this.trialEndsAt !== null &&
      this.trialEndsAt > DateTime.now()
    )
  }

  get isBlocked() {
    return !this.isActive
  }
}
