import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import MarketingVoucherUsage from './marketing_voucher_usage.js'
import Restaurant from './restaurant.js'

export type EventType = 'after_work' | 'birthday' | 'christmas' | 'easter' | 'new_year' | 'other'

export default class MarketingVoucher extends BaseModel {
  static table = 'marketing_vouchers'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare createdBy: number

  @column()
  declare label: string

  @column()
  declare eventType: EventType

  @column()
  declare amount: number

  @column()
  declare validFrom: string

  @column()
  declare validUntil: string

  @column()
  declare maxUsages: number | null

  @column()
  declare usageCount: number

  @column()
  declare qrToken: string

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @hasMany(() => MarketingVoucherUsage)
  declare usages: HasMany<typeof MarketingVoucherUsage>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  get status(): 'active' | 'expired' | 'fully_used' {
    const today = DateTime.now().toISODate()!
    if (this.validUntil < today) return 'expired'
    if (this.maxUsages !== null && this.usageCount >= this.maxUsages) return 'fully_used'
    return 'active'
  }
}
