import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class SiteVisit extends BaseModel {
  static table = 'site_visits'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare visitorId: string

  @column()
  declare sessionId: string

  @column()
  declare path: string

  @column()
  declare referrer: string | null

  @column()
  declare restaurantSlug: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
}
