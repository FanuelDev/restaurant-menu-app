import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import db from '@adonisjs/lucid/services/db'
import FinanceExpense from '../models/finance_expense.js'
import FinanceIncome from '../models/finance_income.js'

// ── Validators ──────────────────────────────────────────────────────────────

const expenseValidator = vine.compile(
  vine.object({
    category: vine.enum(['ingredient', 'tool', 'accessory', 'other']),
    label: vine.string().minLength(1).maxLength(255),
    amount: vine.number().positive(),
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: vine.string().maxLength(1000).optional(),
  })
)

const incomeValidator = vine.compile(
  vine.object({
    label: vine.string().minLength(1).maxLength(255),
    amount: vine.number().positive(),
    date: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    notes: vine.string().maxLength(1000).optional(),
  })
)

// ── Helpers ──────────────────────────────────────────────────────────────────

type Period = 'day' | 'week' | 'month' | 'semester' | 'year'

function periodBounds(period: Period): { start: DateTime; end: DateTime; groupBy: 'hour' | 'day' | 'month' } {
  const now = DateTime.now()
  switch (period) {
    case 'day':
      return { start: now.startOf('day'), end: now.endOf('day'), groupBy: 'hour' }
    case 'week':
      return { start: now.minus({ days: 6 }).startOf('day'), end: now.endOf('day'), groupBy: 'day' }
    case 'month':
      return { start: now.startOf('month'), end: now.endOf('month'), groupBy: 'day' }
    case 'semester':
      return { start: now.minus({ months: 5 }).startOf('month'), end: now.endOf('month'), groupBy: 'month' }
    case 'year':
      return { start: now.minus({ months: 11 }).startOf('month'), end: now.endOf('month'), groupBy: 'month' }
  }
}

function sqlDateFormat(groupBy: 'hour' | 'day' | 'month'): string {
  switch (groupBy) {
    case 'hour':  return '%Y-%m-%d %H:00'
    case 'day':   return '%Y-%m-%d'
    case 'month': return '%Y-%m'
  }
}

function generateLabels(start: DateTime, end: DateTime, groupBy: 'hour' | 'day' | 'month'): string[] {
  const labels: string[] = []
  let cursor = start
  while (cursor <= end) {
    switch (groupBy) {
      case 'hour':  labels.push(cursor.toFormat('yyyy-MM-dd HH:00')); cursor = cursor.plus({ hours: 1 }); break
      case 'day':   labels.push(cursor.toFormat('yyyy-MM-dd'));        cursor = cursor.plus({ days: 1 });  break
      case 'month': labels.push(cursor.toFormat('yyyy-MM'));           cursor = cursor.plus({ months: 1 }); break
    }
  }
  return labels
}

// ── Controller ───────────────────────────────────────────────────────────────

export default class FinanceController {

  // GET /api/admin/finance/summary?period=month
  async summary({ auth, request }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!
    const period = (request.qs().period ?? 'month') as Period
    const { start, end } = periodBounds(period)

    const startSql = start.toSQL()!
    const endSql   = end.toSQL()!

    // Orders revenue (non-cancelled, non-gift or redeemed gift)
    const [ordersRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(total), 0) as total
       FROM orders
       WHERE restaurant_id = ? AND status != 'cancelled'
         AND (is_gift = 0 OR gift_redeemed_at IS NOT NULL)
         AND created_at BETWEEN ? AND ?`,
      [restaurantId, startSql, endSql]
    )

    // Manual incomes
    const [incomesRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM finance_incomes
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?`,
      [restaurantId, start.toISODate(), end.toISODate()]
    )

    // Expenses total
    const [expensesRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM finance_expenses
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?`,
      [restaurantId, start.toISODate(), end.toISODate()]
    )

    // Expenses by category
    const categoryRows = await db.rawQuery(
      `SELECT category, COALESCE(SUM(amount), 0) as total
       FROM finance_expenses
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?
       GROUP BY category`,
      [restaurantId, start.toISODate(), end.toISODate()]
    )

    // Previous period for trend comparison
    const duration = end.diff(start)
    const prevStart = start.minus(duration)
    const prevEnd   = start.minus({ milliseconds: 1 })

    const [prevOrdersRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(total), 0) as total FROM orders
       WHERE restaurant_id = ? AND status != 'cancelled'
         AND (is_gift = 0 OR gift_redeemed_at IS NOT NULL)
         AND created_at BETWEEN ? AND ?`,
      [restaurantId, prevStart.toSQL(), prevEnd.toSQL()]
    )
    const [prevIncomesRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(amount), 0) as total FROM finance_incomes
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?`,
      [restaurantId, prevStart.toISODate(), prevEnd.toISODate()]
    )
    const [prevExpensesRow] = await db.rawQuery(
      `SELECT COALESCE(SUM(amount), 0) as total FROM finance_expenses
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?`,
      [restaurantId, prevStart.toISODate(), prevEnd.toISODate()]
    )

    const ordersRevenue  = Number(ordersRow[0]?.total  ?? 0)
    const manualRevenue  = Number(incomesRow[0]?.total ?? 0)
    const totalRevenue   = ordersRevenue + manualRevenue
    const totalExpenses  = Number(expensesRow[0]?.total ?? 0)
    const netProfit      = totalRevenue - totalExpenses
    const marginPct      = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0

    const prevRevenue  = Number(prevOrdersRow[0]?.total  ?? 0) + Number(prevIncomesRow[0]?.total ?? 0)
    const prevExpenses = Number(prevExpensesRow[0]?.total ?? 0)
    const prevNet      = prevRevenue - prevExpenses

    const trendRevenue  = prevRevenue  > 0 ? Math.round(((totalRevenue  - prevRevenue)  / prevRevenue)  * 100) : null
    const trendExpenses = prevExpenses > 0 ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100) : null
    const trendNet      = prevNet      !== 0 ? Math.round(((netProfit  - prevNet)      / Math.abs(prevNet)) * 100) : null

    const byCategory: Record<string, number> = { ingredient: 0, tool: 0, accessory: 0, other: 0 }
    for (const row of categoryRows[0] as any[]) {
      byCategory[row.category] = Number(row.total)
    }

    return {
      period,
      totalRevenue, ordersRevenue, manualRevenue,
      totalExpenses, netProfit, marginPct,
      byCategory,
      trends: { revenue: trendRevenue, expenses: trendExpenses, net: trendNet },
    }
  }

  // GET /api/admin/finance/chart?period=month
  async chart({ auth, request }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!
    const period = (request.qs().period ?? 'month') as Period
    const { start, end, groupBy } = periodBounds(period)
    const fmt = sqlDateFormat(groupBy)
    const labels = generateLabels(start, end, groupBy)

    // Orders revenue grouped
    const ordersRows = await db.rawQuery(
      `SELECT DATE_FORMAT(created_at, ?) as label, COALESCE(SUM(total), 0) as total
       FROM orders
       WHERE restaurant_id = ? AND status != 'cancelled'
         AND (is_gift = 0 OR gift_redeemed_at IS NOT NULL)
         AND created_at BETWEEN ? AND ?
       GROUP BY label`,
      [fmt, restaurantId, start.toSQL(), end.toSQL()]
    )

    // Manual incomes grouped
    const incomesRows = await db.rawQuery(
      `SELECT DATE_FORMAT(date, ?) as label, COALESCE(SUM(amount), 0) as total
       FROM finance_incomes
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?
       GROUP BY label`,
      [fmt, restaurantId, start.toISODate(), end.toISODate()]
    )

    // Expenses grouped
    const expensesRows = await db.rawQuery(
      `SELECT DATE_FORMAT(date, ?) as label, COALESCE(SUM(amount), 0) as total
       FROM finance_expenses
       WHERE restaurant_id = ? AND date BETWEEN ? AND ?
       GROUP BY label`,
      [fmt, restaurantId, start.toISODate(), end.toISODate()]
    )

    const ordersMap:  Record<string, number> = {}
    const incomesMap: Record<string, number> = {}
    const expMap:     Record<string, number> = {}

    for (const r of ordersRows[0]  as any[]) ordersMap[r.label]  = Number(r.total)
    for (const r of incomesRows[0] as any[]) incomesMap[r.label] = Number(r.total)
    for (const r of expensesRows[0] as any[]) expMap[r.label]    = Number(r.total)

    const points = labels.map((label) => {
      const revenue  = (ordersMap[label] ?? 0) + (incomesMap[label] ?? 0)
      const expenses = expMap[label] ?? 0
      return { label, revenue, expenses, net: revenue - expenses }
    })

    return { period, groupBy, points }
  }

  // ── Expenses CRUD ─────────────────────────────────────────────────────────

  async listExpenses({ auth, request }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!!
    const { page = 1, category, from, to } = request.qs()

    const query = FinanceExpense.query()
      .where('restaurant_id', restaurantId)
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')

    if (category) query.where('category', category)
    if (from)     query.where('date', '>=', from)
    if (to)       query.where('date', '<=', to)

    const result = await query.paginate(Number(page), 30)
    return result.toJSON()
  }

  async createExpense({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(expenseValidator)
    const expense = await FinanceExpense.create({
      ...data,
      restaurantId: auth.user!.restaurantId!,
      createdBy: auth.user!.id,
    })
    return response.created(expense)
  }

  async updateExpense({ auth, params, request }: HttpContext) {
    const expense = await FinanceExpense.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()
    const data = await request.validateUsing(expenseValidator)
    await expense.merge(data).save()
    return expense
  }

  async deleteExpense({ auth, params, response }: HttpContext) {
    const expense = await FinanceExpense.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()
    await expense.delete()
    return response.noContent()
  }

  // ── Incomes CRUD ──────────────────────────────────────────────────────────

  async listIncomes({ auth, request }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!!
    const { page = 1, from, to } = request.qs()

    const query = FinanceIncome.query()
      .where('restaurant_id', restaurantId)
      .orderBy('date', 'desc')
      .orderBy('id', 'desc')

    if (from) query.where('date', '>=', from)
    if (to)   query.where('date', '<=', to)

    const result = await query.paginate(Number(page), 30)
    return result.toJSON()
  }

  async createIncome({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(incomeValidator)
    const income = await FinanceIncome.create({
      ...data,
      restaurantId: auth.user!.restaurantId!,
      createdBy: auth.user!.id,
    })
    return response.created(income)
  }

  async updateIncome({ auth, params, request }: HttpContext) {
    const income = await FinanceIncome.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()
    const data = await request.validateUsing(incomeValidator)
    await income.merge(data).save()
    return income
  }

  async deleteIncome({ auth, params, response }: HttpContext) {
    const income = await FinanceIncome.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()
    await income.delete()
    return response.noContent()
  }
}
