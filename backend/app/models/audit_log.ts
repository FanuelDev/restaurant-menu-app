import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'
import Restaurant from '#models/restaurant'

export type AuditAction =
  | 'category.created' | 'category.updated' | 'category.deleted' | 'category.reordered'
  | 'menu_item.created' | 'menu_item.updated' | 'menu_item.deleted' | 'menu_item.toggled'
  | 'restaurant.updated' | 'restaurant.logo_uploaded'
  | 'order.created' | 'order.status_updated' | 'order.gift_revoked'
  | 'reservation.created' | 'reservation.status_updated'
  | 'user.created' | 'user.updated' | 'user.deleted'
  | 'subscription.created' | 'subscription.canceled' | 'subscription.granted'
  | 'restaurant.blocked' | 'restaurant.unblocked'

export default class AuditLog extends BaseModel {
  static selfAssignPrimaryKey = true

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare userId: number | null

  @column()
  declare userEmail: string

  @column()
  declare userRole: 'super_admin' | 'admin' | 'cashier'

  @column()
  declare action: AuditAction

  @column()
  declare resourceType: string | null

  @column()
  declare resourceId: number | null

  @column()
  declare resourceName: string | null

  @column({
    prepare: (v) => (v ? JSON.stringify(v) : null),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare oldValues: Record<string, unknown> | null

  @column({
    prepare: (v) => (v ? JSON.stringify(v) : null),
    consume: (v) => (typeof v === 'string' ? JSON.parse(v) : v),
  })
  declare newValues: Record<string, unknown> | null

  @column()
  declare ipAddress: string | null

  @column()
  declare userAgent: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>
}
