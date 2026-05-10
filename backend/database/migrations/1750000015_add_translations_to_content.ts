import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('categories', (table) => {
      table.jsonb('name_translations').nullable().defaultTo('{}')
      table.jsonb('description_translations').nullable().defaultTo('{}')
    })
    this.schema.alterTable('menu_items', (table) => {
      table.jsonb('name_translations').nullable().defaultTo('{}')
      table.jsonb('description_translations').nullable().defaultTo('{}')
    })
  }

  async down() {
    this.schema.alterTable('categories', (table) => {
      table.dropColumn('name_translations')
      table.dropColumn('description_translations')
    })
    this.schema.alterTable('menu_items', (table) => {
      table.dropColumn('name_translations')
      table.dropColumn('description_translations')
    })
  }
}
