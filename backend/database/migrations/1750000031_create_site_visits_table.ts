import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'site_visits'

  async up() {
    const exists = await this.schema.hasTable(this.tableName)
    if (!exists) {
      await this.schema.createTable(this.tableName, (table) => {
        table.increments('id')
        table.string('visitor_id', 64).notNullable()
        table.string('session_id', 64).notNullable()
        table.string('path', 500).notNullable()
        table.string('referrer', 500).nullable()
        table.string('restaurant_slug', 100).nullable()
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

        table.index(['created_at'])
        table.index(['visitor_id', 'created_at'])
      })
    }
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
