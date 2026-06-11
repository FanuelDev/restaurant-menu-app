import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'restaurants'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dateTime('trial_reminder_sent_at').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('trial_reminder_sent_at')
    })
  }
}
