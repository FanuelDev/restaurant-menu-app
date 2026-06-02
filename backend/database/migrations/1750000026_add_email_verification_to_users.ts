import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('email_verification_token', 64).nullable().after('password')
      table.timestamp('email_verification_token_expires_at', { useTz: true }).nullable().after('email_verification_token')
      table.timestamp('email_verified_at', { useTz: true }).nullable().after('email_verification_token_expires_at')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('email_verification_token')
      table.dropColumn('email_verification_token_expires_at')
      table.dropColumn('email_verified_at')
    })
  }
}
