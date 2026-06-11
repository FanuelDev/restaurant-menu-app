import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import { mailService } from '#services/mail_service'

/**
 * Cron endpoint — appelable par un scheduler externe (crontab, GitHub Actions, Railway cron…)
 * Protégé par une clé secrète dans l'en-tête X-Cron-Secret.
 */
export default class CronController {
  private authorize({ request, response }: HttpContext): boolean {
    const secret = env.get('CRON_SECRET', '')
    if (!secret || request.header('x-cron-secret') !== secret) {
      response.unauthorized({ message: 'Unauthorized' })
      return false
    }
    return true
  }

  /**
   * POST /api/cron/trial-reminders
   * Envoie les emails de rappel d'expiration du trial (J-7, J-3, J-0).
   * Idempotent — filtre les restaurants déjà notifiés aujourd'hui via le champ
   * `trial_reminder_sent_at` (on stocke le jour en YYYY-MM-DD pour pouvoir rejouer).
   */
  async trialReminders(ctx: HttpContext) {
    if (!this.authorize(ctx)) return

    const { response } = ctx
    const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
    const upgradeUrl = `${frontendUrl}/admin/subscription`
    const today = DateTime.now().toISODate()

    // Cibles : restaurants en trial dont le trial expire dans exactement J-7, J-3, J-0
    // On utilise DATEDIFF pour cibler précisément chaque bucket.
    const targets = await db
      .from('restaurants as r')
      .join('users as u', function (q) {
        q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
      })
      .whereNotNull('r.trial_ends_at')
      .where('r.subscription_status', 'trialing')
      .where('r.is_active', true)
      .whereIn(
        db.raw('DATEDIFF(r.trial_ends_at, NOW())'),
        [7, 3, 0]
      )
      // Ne pas re-notifier si déjà fait aujourd'hui
      .where(function (q) {
        q.whereNull('r.trial_reminder_sent_at').orWhereRaw('DATE(r.trial_reminder_sent_at) != ?', [today])
      })
      .select(
        'r.id as restaurantId',
        'r.name as restaurantName',
        'r.slug as restaurantSlug',
        'r.trial_ends_at as trialEndsAt',
        'u.email',
        'u.full_name as fullName',
        db.raw('DATEDIFF(r.trial_ends_at, NOW()) as daysLeft')
      )

    const results: { email: string; daysLeft: number; status: string }[] = []

    for (const t of targets) {
      try {
        await mailService.sendTrialReminder(
          t.email,
          t.fullName ?? t.email,
          t.restaurantName,
          Number(t.daysLeft),
          upgradeUrl
        )

        await db.from('restaurants').where('id', t.restaurantId).update({
          trial_reminder_sent_at: DateTime.now().toSQL({ includeOffset: false }),
        })

        results.push({ email: t.email, daysLeft: Number(t.daysLeft), status: 'sent' })
      } catch (err) {
        console.error(`[Cron] Erreur envoi trial reminder à ${t.email}:`, err)
        results.push({ email: t.email, daysLeft: Number(t.daysLeft), status: 'error' })
      }
    }

    return response.ok({ processed: results.length, results })
  }
}
