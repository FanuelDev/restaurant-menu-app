import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Restaurant from '#models/restaurant'

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'no_show'

export default class Reservation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare customerName: string

  @column()
  declare customerPhone: string

  @column()
  declare customerEmail: string | null

  @column()
  declare reservedDate: string

  @column()
  declare reservedTime: string

  @column()
  declare guestsCount: number

  @column()
  declare specialRequests: string | null

  @column()
  declare status: ReservationStatus

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>
}
