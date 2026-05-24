import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Agrandit key_prefix de varchar(20) à varchar(24).
 * Le préfixe "saem_live_XXXXXXXX…" fait 19 chars — cette colonne avait 20 chars
 * ce qui causait une erreur MySQL "Data too long" si le format changeait.
 * varchar(24) offre une marge confortable.
 */
export default class extends BaseSchema {
  protected tableName = 'api_keys'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('key_prefix', 24).notNullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('key_prefix', 20).notNullable().alter()
    })
  }
}
