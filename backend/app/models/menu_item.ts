// backend/app/models/menu_item.ts
import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Category from '#models/category'

export type MenuItemBadge = 'new' | 'popular' | 'vegetarian' | 'spicy' | null

export default class MenuItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare categoryId: number

  @column()
  declare name: string

  @column()
  declare description: string | null

  /** Prix en centimes (entier) pour éviter les erreurs d'arrondi flottant */
  @column()
  declare priceInCents: number

  /** Clé du fichier image dans le disk Drive */
  @column()
  declare imageKey: string | null

  /** URL publique calculée lors de la sérialisation */
  imageUrl?: string | null

  @column()
  declare isAvailable: boolean

  /** Badge affiché sur la carte ("new" | "popular" | "vegetarian" | "spicy" | null) */
  @column()
  declare badge: MenuItemBadge

  /** Ordre d'affichage au sein de la catégorie */
  @column()
  declare sortOrder: number

  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  /** Retourne le prix formaté en euros (helper de commodité) */
  get priceFormatted(): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(this.priceInCents / 100)
  }
}
