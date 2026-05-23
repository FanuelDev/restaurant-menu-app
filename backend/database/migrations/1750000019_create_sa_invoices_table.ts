import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'sa_invoices'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('invoice_number', 50).unique().notNullable()
      table.integer('restaurant_id').unsigned().references('id').inTable('restaurants').onDelete('CASCADE').notNullable()
      table.integer('subscription_id').unsigned().references('id').inTable('subscriptions').onDelete('SET NULL').nullable()
      table.integer('granted_by').unsigned().references('id').inTable('users').onDelete('SET NULL').nullable()
      table.string('plan_name').notNullable()
      table.string('plan_slug').notNullable()
      table.enum('billing_cycle', ['monthly', 'yearly']).notNullable()
      table.integer('duration_months').unsigned().notNullable()
      table.integer('amount_paid_cents').unsigned().defaultTo(0)
      table.integer('original_price_cents').unsigned().defaultTo(0)
      table.string('currency', 3).defaultTo('XOF')
      table.text('notes').nullable()
      table.timestamp('period_start', { useTz: true }).notNullable()
      table.timestamp('period_end', { useTz: true }).notNullable()
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
