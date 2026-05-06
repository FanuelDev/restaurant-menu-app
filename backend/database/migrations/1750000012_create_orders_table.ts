import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')
      table.string('order_number', 32).notNullable().unique()
      table.string('customer_name', 255).notNullable()
      table.string('customer_phone', 50).nullable()
      table.string('customer_email', 255).nullable()
      table.enum('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled']).notNullable().defaultTo('pending')
      table.text('notes').nullable()
      table.integer('total_in_cents').unsigned().notNullable().defaultTo(0)
      table.boolean('is_gift').notNullable().defaultTo(false)
      table.text('gift_message').nullable()
      table.string('gift_token', 100).nullable().unique()
      table.timestamp('gift_redeemed_at', { useTz: true }).nullable()
      table.string('gift_redeemed_by', 255).nullable()
      table.string('gift_redeemed_contact', 255).nullable()
      table.timestamp('gift_revoked_at', { useTz: true }).nullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
