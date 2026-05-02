// backend/database/migrations/1700000003_create_restaurants_table.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'restaurants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name', 255).notNullable()
      table.string('slogan', 512).nullable()
      table.string('brand_color', 7).notNullable().defaultTo('#E85D04')
      table.string('logo_key').nullable()
      // Horaires JSON : { monday: { open: "12:00", close: "22:00", closed: false }, ... }
      table.json('opening_hours').nullable()
      table.string('address').nullable()
      table.string('phone', 20).nullable()
      table.string('email', 254).nullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
