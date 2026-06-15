import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class GdprDeletionRequest extends BaseModel {
  static table = 'gdpr_deletion_requests'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare email: string

  @column()
  declare ipAddress: string | null

  @column()
  declare status: 'pending' | 'processed' | 'rejected'

  @column.dateTime()
  declare processedAt: DateTime | null

  @column()
  declare processedById: number | null

  @column()
  declare adminNotes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => User, { foreignKey: 'processedById' })
  declare processedBy: BelongsTo<typeof User>
}
