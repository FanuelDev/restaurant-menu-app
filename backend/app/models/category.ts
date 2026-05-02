// backend/app/models/category.ts
import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import MenuItem from '#models/menu_item'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  /** Ordre d'affichage dans le menu client (drag-and-drop côté admin) */
  @column()
  declare sortOrder: number

  /** Masque la catégorie entière sans la supprimer */
  @column()
  declare isVisible: boolean

  @hasMany(() => MenuItem)
  declare menuItems: HasMany<typeof MenuItem>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null
}
