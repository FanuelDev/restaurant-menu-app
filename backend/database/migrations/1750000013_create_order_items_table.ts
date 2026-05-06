import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().notNullable()
        .references('id').inTable('orders').onDelete('CASCADE')
      table.integer('menu_item_id').unsigned().nullable()
        .references('id').inTable('menu_items').onDelete('SET NULL')
      table.string('menu_item_name', 255).notNullable()
      table.integer('menu_item_price_in_cents').unsigned().notNullable()
      table.integer('quantity').unsigned().notNullable().defaultTo(1)
      table.text('special_instructions').nullable()
      table.integer('subtotal_in_cents').unsigned().notNullable()
      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
