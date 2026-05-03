import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'audit_logs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')

      // Dénormalisé pour conserver l'historique même si l'utilisateur est supprimé
      table.integer('user_id').unsigned().nullable()
        .references('id').inTable('users').onDelete('SET NULL')
      table.string('user_email', 254).notNullable()
      table.enum('user_role', ['super_admin', 'admin', 'cashier']).notNullable()

      // Action
      table.string('action', 100).notNullable().comment('ex: category.created, menu_item.updated')
      table.string('resource_type', 50).nullable().comment('category, menu_item, restaurant')
      table.integer('resource_id').unsigned().nullable()
      table.string('resource_name', 255).nullable().comment('Nom dénormalisé de la ressource')

      // Diff avant/après
      table.json('old_values').nullable()
      table.json('new_values').nullable()

      // Contexte réseau
      table.string('ip_address', 45).nullable()
      table.string('user_agent', 500).nullable()

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())

      // Index pour recherches fréquentes
      table.index(['restaurant_id', 'created_at'])
      table.index(['user_id'])
      table.index(['resource_type', 'resource_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
