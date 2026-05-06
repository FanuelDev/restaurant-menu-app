import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'page_views'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('restaurant_id').unsigned().notNullable()
        .references('id').inTable('restaurants').onDelete('CASCADE')
      // 'menu' = ouverture du menu public, 'item' = clic sur un plat, 'category' = clic sur une catégorie
      table.enum('resource_type', ['menu', 'item', 'category']).notNullable().defaultTo('menu')
      table.integer('resource_id').unsigned().nullable()
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.index(['restaurant_id', 'created_at'])
      table.index(['restaurant_id', 'resource_type', 'resource_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
