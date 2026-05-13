import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Restaurant from './restaurant.js'
import User from './user.js'

export type ExpenseCategory = 'ingredient' | 'tool' | 'accessory' | 'other'

export default class FinanceExpense extends BaseModel {
  static table = 'finance_expenses'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare restaurantId: number

  @column()
  declare createdBy: number | null

  @column()
  declare category: ExpenseCategory

  @column()
  declare label: string

  @column()
  declare amount: number

  @column()
  declare date: string

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Restaurant)
  declare restaurant: BelongsTo<typeof Restaurant>

  @belongsTo(() => User, { foreignKey: 'createdBy' })
  declare creator: BelongsTo<typeof User>
}
