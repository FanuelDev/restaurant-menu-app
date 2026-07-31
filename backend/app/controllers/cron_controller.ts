import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'
import { mailService } from '#services/mail_service'
import FedaPayService from '#services/fedapay_service'
import SubscriptionService from '#services/subscription_service'

const fedapay = new FedaPayService()
const subscriptionService = new SubscriptionService()

export default class CronController {
  private authorize({ request, response }: HttpContext): boolean {
    const secret = env.get('CRON_SECRET', '')
    if (!secret || request.header('x-cron-secret') !== secret) {
      response.unauthorized({ message: 'Unauthorized' })
      return false
    }
    return true
  }

  /** Répond 202 immédiatement et exécute fn en arrière-plan (fire & forget) */
  private asyncCron(ctx: HttpContext, name: string, fn: () => Promise<void>): void {
    ctx.response.accepted({ message: `${name} started` })
    setImmediate(() => {
      fn().catch((err) => console.error(`[Cron] ${name} error:`, err))
    })
  }

  // ─── 1. Trial reminders (J-7, J-3, J-0) ─────────────────────────────────

  async trialReminders(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'trialReminders', async () => {
      const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
      const upgradeUrl = `${frontendUrl}/admin/subscription`
      const today = DateTime.now().toISODate()

      const targets = await db
        .from('restaurants as r')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .whereNotNull('r.trial_ends_at')
        .where('r.subscription_status', 'trialing')
        .where('r.is_active', true)
        .whereIn(db.raw('DATEDIFF(r.trial_ends_at, NOW())'), [7, 3, 0])
        .where(function (q) {
          q.whereNull('r.trial_reminder_sent_at').orWhereRaw('DATE(r.trial_reminder_sent_at) != ?', [today])
        })
        .select(
          'r.id as restaurantId',
          'r.name as restaurantName',
          'r.trial_ends_at as trialEndsAt',
          'u.email',
          'u.full_name as fullName',
          db.raw('DATEDIFF(r.trial_ends_at, NOW()) as daysLeft')
        )

      for (const t of targets) {
        try {
          await mailService.sendTrialReminder(t.email, t.fullName ?? t.email, t.restaurantName, Number(t.daysLeft), upgradeUrl)
          await db.from('restaurants').where('id', t.restaurantId).update({
            trial_reminder_sent_at: DateTime.now().toSQL({ includeOffset: false }),
          })
        } catch (err) {
          console.error(`[Cron] Trial reminder error ${t.email}:`, err)
        }
      }
    })
  }

  // ─── 2. Subscription lifecycle — suspend expired trials & subscriptions ──

  async subscriptionLifecycle(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'subscriptionLifecycle', async () => {
      const now = DateTime.now()
      const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
      const upgradeUrl = `${frontendUrl}/admin/subscription`

      const expiredTrials = await db
        .from('restaurants as r')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .where('r.subscription_status', 'trialing')
        .where('r.is_active', true)
        .whereNotNull('r.trial_ends_at')
        .whereRaw('r.trial_ends_at < NOW()')
        .select('r.id as restaurantId', 'r.name as restaurantName', 'u.email', 'u.full_name as fullName', 'r.suspension_email_sent_at as suspensionEmailSentAt')

      for (const r of expiredTrials) {
        try {
          await db.transaction(async (trx) => {
            await trx.from('restaurants').where('id', r.restaurantId).update({ subscription_status: 'suspended', is_active: false })
          })
          if (!r.suspensionEmailSentAt) {
            await mailService.sendSubscriptionSuspended(r.email, r.fullName ?? r.email, r.restaurantName, upgradeUrl)
            await db.from('restaurants').where('id', r.restaurantId).update({ suspension_email_sent_at: now.toSQL({ includeOffset: false }) })
          }
        } catch (err) { console.error(`[Cron] Trial suspend error ${r.restaurantId}:`, err) }
      }

      const expiredSubscriptions = await db
        .from('restaurants as r')
        .join('subscriptions as s', 's.restaurant_id', 'r.id')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .where('r.subscription_status', 'active').where('r.is_active', true)
        .where('s.status', 'active').whereNotNull('s.current_period_end')
        .whereRaw('s.current_period_end < NOW()')
        .select('r.id as restaurantId', 'r.name as restaurantName', 'u.email', 'u.full_name as fullName', 'r.suspension_email_sent_at as suspensionEmailSentAt', 's.id as subscriptionId')

      for (const r of expiredSubscriptions) {
        try {
          await db.transaction(async (trx) => {
            await trx.from('subscriptions').where('id', r.subscriptionId).update({ status: 'expired' })
            await trx.from('restaurants').where('id', r.restaurantId).update({ subscription_status: 'suspended', is_active: false })
          })
          if (!r.suspensionEmailSentAt) {
            await mailService.sendSubscriptionSuspended(r.email, r.fullName ?? r.email, r.restaurantName, upgradeUrl)
            await db.from('restaurants').where('id', r.restaurantId).update({ suspension_email_sent_at: now.toSQL({ includeOffset: false }) })
          }
        } catch (err) { console.error(`[Cron] Sub expire error ${r.restaurantId}:`, err) }
      }

      const renewalReminders = await db
        .from('restaurants as r')
        .join('subscriptions as s', 's.restaurant_id', 'r.id')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .where('r.subscription_status', 'active').where('r.is_active', true)
        .where('s.status', 'active').whereNotNull('s.current_period_end')
        .whereRaw('DATEDIFF(s.current_period_end, NOW()) = 7')
        .whereRaw('(r.trial_reminder_sent_at IS NULL OR DATE(r.trial_reminder_sent_at) != ?)', [now.toISODate()])
        .select('r.id as restaurantId', 'r.name as restaurantName', 'u.email', 'u.full_name as fullName')

      for (const r of renewalReminders) {
        try {
          await mailService.sendTrialReminder(r.email, r.fullName ?? r.email, r.restaurantName, 7, upgradeUrl)
          await db.from('restaurants').where('id', r.restaurantId).update({ trial_reminder_sent_at: now.toSQL({ includeOffset: false }) })
        } catch (err) { console.error(`[Cron] Renewal reminder error ${r.restaurantId}:`, err) }
      }
    })
  }

  // ─── 3. FedaPay reconciliation — detect missed webhooks ──────────────────

  async fedapayReconciliation(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'fedapayReconciliation', async () => {
      const pending = await db
        .from('subscriptions')
        .where('status', 'pending')
        .whereRaw('created_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)')
        .whereRaw('created_at > DATE_SUB(NOW(), INTERVAL 48 HOUR)')
        .select('id', 'fedapay_transaction_id as transactionId', 'restaurant_id as restaurantId')

      for (const sub of pending) {
        if (!sub.transactionId) continue
        try {
          const { status, raw } = await fedapay.verifyPayment(sub.transactionId)
          if (status === 'ACCEPTED') {
            await subscriptionService.activateSubscription(sub.transactionId, raw as Record<string, unknown>)
          } else if (status === 'REFUSED') {
            await db.from('subscriptions').where('id', sub.id).update({ status: 'canceled' })
          }
        } catch (err) { console.error(`[Cron] FedaPay reconcile error ${sub.transactionId}:`, err) }
      }
    })
  }

  // ─── 4. Upsell nudge — Free restaurants approaching plan limits ───────────

  async upsellNudge(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'upsellNudge', async () => {
      const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
      const upgradeUrl = `${frontendUrl}/admin/subscription`
      const sevenDaysAgo = DateTime.now().minus({ days: 7 }).toSQL({ includeOffset: false })!

      const candidates = await db
        .from('restaurants as r')
        .join('plans as p', 'p.id', 'r.plan_id')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .where('p.slug', 'free').where('r.is_active', true).where('r.subscription_status', 'active')
        .where(function (q) {
          q.whereNull('r.upsell_email_sent_at').orWhere('r.upsell_email_sent_at', '<', sevenDaysAgo)
        })
        .select('r.id as restaurantId', 'r.name as restaurantName', 'u.email', 'u.full_name as fullName', 'p.max_menu_items as maxMenuItems', 'p.max_categories as maxCategories')

      for (const r of candidates) {
        try {
          const [itemsRow, catsRow] = await Promise.all([
            db.from('menu_items').where('restaurant_id', r.restaurantId).count('* as total'),
            db.from('categories').where('restaurant_id', r.restaurantId).count('* as total'),
          ])
          const items = Number((itemsRow[0] as any).total)
          const cats = Number((catsRow[0] as any).total)
          const maxItems = Number(r.maxMenuItems)
          const maxCats = Number(r.maxCategories)
          let resource = '', current = 0, max = 0
          if (maxItems > 0 && items / maxItems >= 0.8) { resource = 'Plats du menu'; current = items; max = maxItems }
          else if (maxCats > 0 && cats / maxCats >= 0.8) { resource = 'Catégories'; current = cats; max = maxCats }
          if (resource) {
            await mailService.sendUpsellNudge(r.email, r.fullName ?? r.email, r.restaurantName, resource, current, max, upgradeUrl)
            await db.from('restaurants').where('id', r.restaurantId).update({ upsell_email_sent_at: DateTime.now().toSQL({ includeOffset: false }) })
          }
        } catch (err) { console.error(`[Cron] Upsell nudge error ${r.restaurantId}:`, err) }
      }
    })
  }

  // ─── 5. Reservation reminders — 24h before + admin pending alert ──────────

  async reservationReminders(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'reservationReminders', async () => {
      const now = DateTime.now()
      const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
      const tomorrow = now.plus({ days: 1 }).toISODate()!

      const upcoming = await db
        .from('reservations as res')
        .join('restaurants as r', 'r.id', 'res.restaurant_id')
        .where('res.status', 'confirmed').where('res.reserved_date', tomorrow)
        .whereNotNull('res.customer_email').whereNull('res.reminder_sent_at')
        .select('res.id', 'res.customer_name as customerName', 'res.customer_email as customerEmail',
          'res.reserved_date as reservedDate', 'res.reserved_time as reservedTime',
          'res.guests_count as guestsCount', 'r.name as restaurantName', 'r.phone as restaurantPhone')

      for (const res of upcoming) {
        try {
          await mailService.sendReservationReminder(res.customerEmail, res.customerName, res.restaurantName, res.reservedDate, res.reservedTime, Number(res.guestsCount), res.restaurantPhone)
          await db.from('reservations').where('id', res.id).update({ reminder_sent_at: now.toSQL({ includeOffset: false }) })
        } catch (err) { console.error(`[Cron] Reservation reminder error ${res.id}:`, err) }
      }

      const thirtyMinAgo = now.minus({ minutes: 30 }).toSQL({ includeOffset: false })!
      const pendingGroups = await db
        .from('reservations as res')
        .join('restaurants as r', 'r.id', 'res.restaurant_id')
        .join('users as u', function (q) {
          q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin')
        })
        .where('res.status', 'pending').where('r.is_active', true)
        .where('res.created_at', '<', thirtyMinAgo)
        .whereRaw('(r.alert_email_sent_at IS NULL OR r.alert_email_sent_at < DATE_SUB(NOW(), INTERVAL 1 HOUR))')
        .select('r.id as restaurantId', 'r.name as restaurantName', 'u.email', 'u.full_name as fullName', db.raw('COUNT(res.id) as pendingCount'))
        .groupBy('r.id', 'r.name', 'u.email', 'u.full_name')

      for (const g of pendingGroups) {
        try {
          await mailService.sendAdminPendingReservationAlert(g.email, g.fullName ?? g.email, g.restaurantName, Number(g.pendingCount), `${frontendUrl}/admin/reservations`)
          await db.from('restaurants').where('id', g.restaurantId).update({ alert_email_sent_at: now.toSQL({ includeOffset: false }) })
        } catch (err) { console.error(`[Cron] Pending reservation alert error ${g.restaurantId}:`, err) }
      }
    })
  }

  // ─── 6. Weekly revenue reports — send to each restaurant admin (Monday) ──

  async weeklyReports(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    const today = DateTime.now()
    if (today.weekday !== 1) {
      return ctx.response.ok({ skipped: true, reason: 'Not Monday' })
    }
    this.asyncCron(ctx, 'weeklyReports', async () => {
      const weekStart = today.minus({ days: 7 }).startOf('day').toSQL({ includeOffset: false })!
      const weekEnd = today.startOf('day').toSQL({ includeOffset: false })!
      const periodLabel = `${today.minus({ days: 7 }).toLocaleString(DateTime.DATE_MED)} – ${today.minus({ days: 1 }).toLocaleString(DateTime.DATE_MED)}`

      const restaurants = await db
        .from('restaurants as r')
        .join('plans as p', 'p.id', 'r.plan_id')
        .join('users as u', function (q) { q.on('u.restaurant_id', 'r.id').andOnVal('u.role', 'admin') })
        .where('r.is_active', true).whereRaw(`JSON_CONTAINS(p.features, '"finance"')`)
        .select('r.id as restaurantId', 'r.name as restaurantName', 'r.currency', 'u.email', 'u.full_name as fullName')

      for (const r of restaurants) {
        try {
          const [incomesRow, expensesRow, ordersRow] = await Promise.all([
            db.from('finance_incomes').where('restaurant_id', r.restaurantId).whereBetween('date', [weekStart.slice(0, 10), weekEnd.slice(0, 10)]).sum('amount as total'),
            db.from('finance_expenses').where('restaurant_id', r.restaurantId).whereBetween('date', [weekStart.slice(0, 10), weekEnd.slice(0, 10)]).sum('amount as total'),
            db.from('orders').where('restaurant_id', r.restaurantId).where('status', 'delivered').whereBetween('created_at', [weekStart, weekEnd]).sum('total_price_cents as total'),
          ])
          const manualRevenue = Number((incomesRow[0] as any).total ?? 0)
          const totalExpenses = Number((expensesRow[0] as any).total ?? 0)
          const ordersRevenue = Number((ordersRow[0] as any).total ?? 0) / 100
          await mailService.sendWeeklyRevenueReport(r.email, r.fullName ?? r.email, r.restaurantName, manualRevenue + ordersRevenue, ordersRevenue, manualRevenue, totalExpenses, manualRevenue + ordersRevenue - totalExpenses, r.currency ?? 'XOF', periodLabel)
        } catch (err) { console.error(`[Cron] Weekly report error ${r.restaurantId}:`, err) }
      }
    })
  }

  // ─── 7. Monthly MRR report — send to super-admin (1st of month) ──────────

  async monthlyMrrReport(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    const today = DateTime.now()
    if (today.day !== 1) return ctx.response.ok({ skipped: true, reason: 'Not 1st of month' })
    const superAdminEmail = env.get('SUPER_ADMIN_EMAIL', '')
    if (!superAdminEmail) return ctx.response.ok({ skipped: true, reason: 'SUPER_ADMIN_EMAIL not configured' })

    this.asyncCron(ctx, 'monthlyMrrReport', async () => {
      const prevMonthStart = today.minus({ months: 1 }).startOf('month').toSQL({ includeOffset: false })!
      const prevMonthEnd = today.startOf('month').toSQL({ includeOffset: false })!

      const [mrrRows, prevRevRow, newSignupsRow, churnRow, activeRow, trialingRow] = await Promise.all([
        db.from('restaurants')
          .join('subscriptions', (q) => { q.on('subscriptions.restaurant_id', '=', 'restaurants.id').andOnVal('subscriptions.status', '=', 'active') })
          .join('plans', 'plans.id', '=', 'restaurants.plan_id')
          .where('restaurants.subscription_status', 'active')
          .select(db.raw(`SUM(CASE WHEN subscriptions.billing_cycle = 'monthly' THEN plans.price_monthly_cents ELSE ROUND(plans.price_yearly_cents / 12) END) as mrrCents`)),
        db.from('sa_invoices').whereBetween('created_at', [prevMonthStart, prevMonthEnd]).sum('amount_paid_cents as total'),
        db.from('restaurants').whereBetween('created_at', [prevMonthStart, prevMonthEnd]).count('* as total'),
        db.from('restaurants').whereIn('subscription_status', ['canceled', 'suspended']).whereBetween('updated_at', [prevMonthStart, prevMonthEnd]).count('* as total'),
        db.from('restaurants').where('subscription_status', 'active').count('* as total'),
        db.from('restaurants').where('subscription_status', 'trialing').count('* as total'),
      ])

      const mrrCents = Number((mrrRows[0] as any)?.mrrCents ?? 0)
      const prevRevCents = Number((prevRevRow[0] as any)?.total ?? 0)
      await mailService.sendMonthlyMrrReport(
        superAdminEmail, mrrCents,
        prevRevCents > 0 ? Math.round(((mrrCents - prevRevCents) / prevRevCents) * 100) : 0,
        Number((newSignupsRow[0] as any)?.total ?? 0),
        Number((churnRow[0] as any)?.total ?? 0),
        Number((activeRow[0] as any)?.total ?? 0),
        Number((trialingRow[0] as any)?.total ?? 0),
        today.minus({ months: 1 }).setLocale('fr').toFormat('MMMM yyyy')
      )
    })
  }

  // ─── 8. Availability by hours — toggle items per restaurant schedule ──────

  async availabilityByHours(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    this.asyncCron(ctx, 'availabilityByHours', async () => {
      const restaurants = await db
        .from('restaurants')
        .where('auto_availability_by_hours', true)
        .where('is_active', true)
        .select('id', 'opening_hours as openingHours')

      const now = DateTime.now()
      const dayKey = now.weekdayLong?.toLowerCase() ?? ''
      const dayMap: Record<string, string> = {
        monday: 'monday', tuesday: 'tuesday', wednesday: 'wednesday',
        thursday: 'thursday', friday: 'friday', saturday: 'saturday', sunday: 'sunday',
      }

      for (const r of restaurants) {
        try {
          const hours = typeof r.openingHours === 'string' ? JSON.parse(r.openingHours) : r.openingHours
          if (!hours) continue
          const daySchedule = hours[dayMap[dayKey]]
          if (!daySchedule) continue
          const isOpen = !daySchedule.closed && (() => {
            const [openH, openM] = (daySchedule.open ?? '00:00').split(':').map(Number)
            const [closeH, closeM] = (daySchedule.close ?? '23:59').split(':').map(Number)
            const cur = now.hour * 60 + now.minute
            return cur >= openH * 60 + openM && cur < closeH * 60 + closeM
          })()
          await db.from('menu_items').where('restaurant_id', r.id).update({ is_available: isOpen })
        } catch (err) { console.error(`[Cron] Availability hours error ${r.id}:`, err) }
      }
    })
  }

  // ─── 9. Command center alerts — notify super-admin when KPIs are critical ─

  async commandCenterAlerts(ctx: HttpContext) {
    if (!this.authorize(ctx)) return
    const superAdminEmail = env.get('SUPER_ADMIN_EMAIL', '')
    if (!superAdminEmail) return ctx.response.ok({ skipped: true, reason: 'SUPER_ADMIN_EMAIL not configured' })

    this.asyncCron(ctx, 'commandCenterAlerts', async () => {
      const CRITICAL_THRESHOLD = Number(env.get('CRITICAL_ALERT_THRESHOLD', '5'))
      const frontendUrl = env.get('FRONTEND_URL', 'https://saemenus.com')
      const now = DateTime.now()

      const [trialsToday, churnRisk] = await Promise.all([
        db.from('restaurants').where('subscription_status', 'trialing').where('is_active', true)
          .whereRaw('trial_ends_at >= NOW()').whereRaw('trial_ends_at < DATE_ADD(NOW(), INTERVAL 24 HOUR)').count('* as total'),
        db.from('restaurants').where('subscription_status', 'trialing').where('is_active', true)
          .whereRaw('created_at <= DATE_SUB(NOW(), INTERVAL 10 DAY)').count('* as total'),
      ])

      const trialsExpiringToday = Number((trialsToday[0] as any).total ?? 0)
      const churnRiskCount = Number((churnRisk[0] as any).total ?? 0)
      const criticalCount = trialsExpiringToday + churnRiskCount

      if (criticalCount < CRITICAL_THRESHOLD) return

      const lastAlertRow = await db.from('restaurants').whereRaw('alert_email_sent_at IS NOT NULL').orderBy('alert_email_sent_at', 'desc').select('alert_email_sent_at').first()
      if (lastAlertRow?.alert_email_sent_at) {
        if (now.diff(DateTime.fromJSDate(new Date(lastAlertRow.alert_email_sent_at)), 'hours').hours < 12) return
      }

      await mailService.sendCommandCenterAlert(superAdminEmail, criticalCount, trialsExpiringToday, churnRiskCount, `${frontendUrl}/super-admin/command-center`)

      const firstResto = await db.from('restaurants').orderBy('id', 'asc').select('id').first()
      if (firstResto) {
        await db.from('restaurants').where('id', firstResto.id).update({ alert_email_sent_at: now.toSQL({ includeOffset: false }) })
      }
    })
  }
}
