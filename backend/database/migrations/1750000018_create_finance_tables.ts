import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    const hasExpenses = await this.schema.hasTable('finance_expenses')
    if (!hasExpenses) {
      await this.schema.createTable('finance_expenses', (table) => {
        table.increments('id')
        table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurants').onDelete('CASCADE')
        table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
        table.enum('category', ['ingredient', 'tool', 'accessory', 'other']).notNullable().defaultTo('other')
        table.string('label', 255).notNullable()
        table.decimal('amount', 12, 2).notNullable()
        table.date('date').notNullable()
        table.text('notes').nullable()
        table.timestamps(true, true)
        table.index(['restaurant_id', 'date'])
      })
    }

    const hasIncomes = await this.schema.hasTable('finance_incomes')
    if (!hasIncomes) {
      await this.schema.createTable('finance_incomes', (table) => {
        table.increments('id')
        table.integer('restaurant_id').unsigned().notNullable().references('id').inTable('restaurants').onDelete('CASCADE')
        table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL')
        table.string('label', 255).notNullable()
        table.decimal('amount', 12, 2).notNullable()
        table.date('date').notNullable()
        table.text('notes').nullable()
        table.timestamps(true, true)
        table.index(['restaurant_id', 'date'])
      })
    }
  }

  async down() {
    await this.schema.dropTableIfExists('finance_expenses')
    await this.schema.dropTableIfExists('finance_incomes')
  }
}
