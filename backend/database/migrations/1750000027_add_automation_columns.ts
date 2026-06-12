import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    this.schema.alterTable('restaurants', (table) => {
      table.dateTime('upsell_email_sent_at').nullable().defaultTo(null)
      table.dateTime('suspension_email_sent_at').nullable().defaultTo(null)
      table.dateTime('alert_email_sent_at').nullable().defaultTo(null)
      table.boolean('auto_availability_by_hours').notNullable().defaultTo(false)
    })

    this.schema.alterTable('reservations', (table) => {
      table.dateTime('reminder_sent_at').nullable().defaultTo(null)
    })
  }

  async down() {
    this.schema.alterTable('restaurants', (table) => {
      table.dropColumn('upsell_email_sent_at')
      table.dropColumn('suspension_email_sent_at')
      table.dropColumn('alert_email_sent_at')
      table.dropColumn('auto_availability_by_hours')
    })

    this.schema.alterTable('reservations', (table) => {
      table.dropColumn('reminder_sent_at')
    })
  }
}
