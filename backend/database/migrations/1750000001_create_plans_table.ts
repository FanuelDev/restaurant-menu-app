import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'plans'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 100).notNullable()
      table.string('slug', 100).notNullable().unique()
      table.text('description').nullable()

      // Pricing
      table.integer('price_monthly_cents').unsigned().notNullable().defaultTo(0)
      table.integer('price_yearly_cents').unsigned().notNullable().defaultTo(0)

      // Limits (-1 = illimité)
      table.integer('max_categories').notNullable().defaultTo(3)
      table.integer('max_menu_items').notNullable().defaultTo(15)
      table.integer('max_users').notNullable().defaultTo(2)

      // Features JSON { analytics, api_access, custom_domain, priority_support }
      table.json('features').nullable()

      table.boolean('is_active').notNullable().defaultTo(true)
      table.boolean('is_public').notNullable().defaultTo(true)
      table.integer('sort_order').notNullable().defaultTo(0)

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
