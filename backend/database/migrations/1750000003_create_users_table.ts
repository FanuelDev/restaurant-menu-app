import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // NULL pour super_admin (pas de restaurant)
      table.integer('restaurant_id').unsigned().nullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')

      table.enum('role', ['super_admin', 'admin', 'cashier']).notNullable().defaultTo('admin')

      table.string('full_name', 255).nullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 255).notNullable()
      table.string('phone', 20).nullable()

      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('last_login_at').nullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
