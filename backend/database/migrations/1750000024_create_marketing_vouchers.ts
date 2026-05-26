import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasVouchers = await this.schema.hasTable('marketing_vouchers')
    if (!hasVouchers) {
      await this.schema.createTable('marketing_vouchers', (table) => {
        table.increments('id')
        table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurants').onDelete('CASCADE')
        table.integer('created_by').unsigned().notNullable().references('id').inTable('users')
        table.string('label', 255).notNullable()
        table.enum('event_type', ['after_work', 'birthday', 'christmas', 'easter', 'new_year', 'other']).notNullable().defaultTo('other')
        table.decimal('amount', 12, 2).notNullable()
        table.date('valid_from').notNullable()
        table.date('valid_until').notNullable()
        table.integer('max_usages').unsigned().nullable()
        table.integer('usage_count').unsigned().notNullable().defaultTo(0)
        table.string('qr_token', 64).unique().notNullable()
        table.text('notes').nullable()
        table.timestamps(true, true)
        table.index(['restaurant_id'])
        table.index(['qr_token'])
      })
    }

    const hasUsages = await this.schema.hasTable('marketing_voucher_usages')
    if (!hasUsages) {
      await this.schema.createTable('marketing_voucher_usages', (table) => {
        table.increments('id')
        table.integer('voucher_id').unsigned().notNullable().references('id').inTable('marketing_vouchers').onDelete('CASCADE')
        table.integer('order_id').unsigned().nullable().references('id').inTable('orders').onDelete('SET NULL')
        table.string('customer_name', 255).notNullable()
        table.decimal('voucher_amount_used', 12, 2).notNullable()
        table.decimal('order_total', 12, 2).notNullable()
        table.decimal('surplus_paid', 12, 2).notNullable().defaultTo(0)
        table.integer('redeemed_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
        table.timestamp('redeemed_at').notNullable()
        table.timestamps(true, true)
        table.index(['voucher_id'])
      })
    }
  }

  async down() {
    await this.schema.dropTableIfExists('marketing_voucher_usages')
    await this.schema.dropTableIfExists('marketing_vouchers')
  }
}
