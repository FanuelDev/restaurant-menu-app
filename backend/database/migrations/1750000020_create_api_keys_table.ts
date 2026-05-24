import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')
      table.string('name', 100).notNullable()
      // Préfixe visible dans l'UI (ex: "saem_live_Ab3x...")
      table.string('key_prefix', 20).notNullable()
      // Hash SHA-256 de la clé complète (jamais stockée en clair)
      table.string('key_hash', 64).notNullable().unique()
      table.boolean('is_active').defaultTo(true).notNullable()
      table.timestamp('last_used_at', { useTz: true }).nullable()
      table.timestamp('expires_at', { useTz: true }).nullable()
      table.timestamps(true, true)

      table.index(['restaurant_id'])
      table.index(['key_hash'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
