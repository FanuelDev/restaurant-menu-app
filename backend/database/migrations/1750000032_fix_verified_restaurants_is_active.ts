import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  async up() {
    // Activate restaurants whose admin email is verified but restaurant is_active = 0
    // This fixes a bug in verifyUser() that activated the user but not the restaurant.
    await this.db.rawQuery(`
      UPDATE restaurants r
      INNER JOIN users u ON u.restaurant_id = r.id AND u.role = 'admin'
      SET r.is_active = 1
      WHERE r.is_active = 0
        AND r.blocked_at IS NULL
        AND u.email_verified_at IS NOT NULL
    `)
  }

  async down() {
    // No rollback — this is a targeted data fix, not a schema change
  }
}
