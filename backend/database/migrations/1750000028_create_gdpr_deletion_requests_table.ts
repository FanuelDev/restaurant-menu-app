import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'gdpr_deletion_requests'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('email', 255).notNullable()
      table.string('ip_address', 45).nullable()
      table.enum('status', ['pending', 'processed', 'rejected']).defaultTo('pending').notNullable()
      table.timestamp('processed_at').nullable()
      table.integer('processed_by_id').unsigned().nullable().references('id').inTable('users').onDelete('set null')
      table.text('admin_notes').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
