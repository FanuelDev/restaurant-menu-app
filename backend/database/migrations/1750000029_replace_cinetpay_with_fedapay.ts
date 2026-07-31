import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'subscriptions'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Remplace les colonnes CinetPay par FedaPay
      table.dropColumn('cinetpay_transaction_id')
      table.dropColumn('cinetpay_payment_token')
      table.string('fedapay_transaction_id').nullable().unique().after('plan_id')
      table.string('fedapay_payment_token').nullable().after('fedapay_transaction_id')
      table.string('payment_provider').notNullable().defaultTo('fedapay').after('id')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('payment_provider')
      table.dropColumn('fedapay_transaction_id')
      table.dropColumn('fedapay_payment_token')
      table.string('cinetpay_transaction_id').nullable().unique()
      table.string('cinetpay_payment_token').nullable()
    })
  }
}
