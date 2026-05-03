import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'restaurants'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Identité SaaS
      table.string('slug', 100).notNullable().unique().comment('Identifiant sous-domaine: bistrot.monapp.com')
      table.string('name', 255).notNullable()
      table.string('slogan', 512).nullable()
      table.string('brand_color', 7).notNullable().defaultTo('#C0392B')
      table.string('logo_key').nullable()

      // Infos contact
      table.string('address', 500).nullable()
      table.string('phone', 20).nullable()
      table.string('email', 254).nullable()
      table.string('website', 500).nullable()
      table.string('siret', 20).nullable().comment('Numéro SIRET ou équivalent local')
      table.string('country', 3).notNullable().defaultTo('CI').comment('Code ISO pays')
      table.string('currency', 3).notNullable().defaultTo('XOF').comment('XOF, XAF, CDF, GNF, USD')

      // Horaires
      table.json('opening_hours').nullable()

      // Abonnement
      table.integer('plan_id').unsigned().nullable().references('id').inTable('plans').onDelete('SET NULL')
      table.enum('subscription_status', ['trialing', 'active', 'past_due', 'canceled', 'suspended'])
        .notNullable().defaultTo('trialing')
      table.timestamp('trial_ends_at').nullable()

      // CinetPay (référence client)
      table.string('cinetpay_customer_ref').nullable().unique()

      // Statut compte (peut être bloqué par super admin)
      table.boolean('is_active').notNullable().defaultTo(true)
      table.timestamp('blocked_at').nullable()
      table.text('blocked_reason').nullable()
      table.integer('blocked_by_id').unsigned().nullable().comment('ID super_admin ayant bloqué — pas de FK pour éviter circularité')

      table.timestamp('created_at', { useTz: true }).defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
