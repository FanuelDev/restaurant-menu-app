// backend/database/migrations/1700000005_create_menu_items_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'menu_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('category_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('categories')
        .onDelete('CASCADE')

      table.string('name', 255).notNullable()
      table.text('description').nullable()
      // Prix stocké en centimes (entier) pour éviter les problèmes de virgule flottante
      table.integer('price_in_cents').unsigned().notNullable().defaultTo(0)
      table.string('image_key').nullable()
      table.boolean('is_available').notNullable().defaultTo(true)
      table.enum('badge', ['new', 'popular', 'vegetarian', 'spicy']).nullable()
      table.integer('sort_order').notNullable().defaultTo(0)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
