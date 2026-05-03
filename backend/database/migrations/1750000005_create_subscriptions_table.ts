import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')
      table.integer('plan_id').unsigned().notNullable()
        .references('id').inTable('plans').onDelete('RESTRICT')

      // CinetPay
      table.string('cinetpay_transaction_id', 100).nullable().unique()
      table.string('cinetpay_payment_token', 500).nullable()

      table.enum('billing_cycle', ['monthly', 'yearly']).notNullable().defaultTo('monthly')
      table.enum('status', ['pending', 'active', 'past_due', 'canceled', 'expired'])
        .notNullable().defaultTo('pending')

      table.integer('amount_cents').unsigned().notNullable()
      table.string('currency', 3).notNullable().defaultTo('XOF')

      table.timestamp('current_period_start').nullable()
      table.timestamp('current_period_end').nullable()
      table.timestamp('canceled_at').nullable()

      // Métadonnées paiement
      table.json('payment_metadata').nullable().comment('Réponse brute CinetPay')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
