import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import MarketingVoucher from './marketing_voucher.js'

export default class MarketingVoucherUsage extends BaseModel {
  static table = 'marketing_voucher_usages'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare voucherId: number

  @column()
  declare orderId: number | null

  @column()
  declare customerName: string

  @column()
  declare voucherAmountUsed: number

  @column()
  declare orderTotal: number

  @column()
  declare surplusPaid: number

  @column()
  declare redeemedBy: number | null

  @column.dateTime()
  declare redeemedAt: DateTime

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => MarketingVoucher)
  declare voucher: BelongsTo<typeof MarketingVoucher>
}
