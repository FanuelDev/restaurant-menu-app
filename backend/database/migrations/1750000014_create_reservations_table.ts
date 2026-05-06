import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reservations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')
      table.string('customer_name', 255).notNullable()
      table.string('customer_phone', 50).notNullable()
      table.string('customer_email', 255).nullable()
      table.date('reserved_date').notNullable()
      table.string('reserved_time', 5).notNullable()
      table.integer('guests_count').unsigned().notNullable().defaultTo(1)
      table.text('special_requests').nullable()
      table.enum('status', ['pending', 'confirmed', 'cancelled', 'no_show']).notNullable().defaultTo('pending')
      table.text('notes').nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
