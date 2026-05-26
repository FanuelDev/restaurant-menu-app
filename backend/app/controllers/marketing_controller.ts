import { randomBytes } from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import vine from '@vinejs/vine'
import MarketingVoucher from '../models/marketing_voucher.js'
import MarketingVoucherUsage from '../models/marketing_voucher_usage.js'
import FinanceIncome from '../models/finance_income.js'
import AuditService from '#services/audit_service'

// ── Validators ───────────────────────────────────────────────────────────────

const createVoucherValidator = vine.compile(
  vine.object({
    label: vine.string().minLength(1).maxLength(255),
    eventType: vine.enum(['after_work', 'birthday', 'christmas', 'easter', 'new_year', 'other']),
    amount: vine.number().positive(),
    validFrom: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    validUntil: vine.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    maxUsages: vine.number().positive().optional(),
    notes: vine.string().maxLength(1000).optional(),
  })
)

const redeemVoucherValidator = vine.compile(
  vine.object({
    customerName: vine.string().minLength(1).maxLength(255),
    orderTotal: vine.number().positive(),
    orderId: vine.number().optional(),
  })
)

// ── Controller ───────────────────────────────────────────────────────────────

export default class MarketingController {

  // ── Private helper ────────────────────────────────────────────────────────

  private _computeStatus(voucher: MarketingVoucher): 'active' | 'expired' | 'fully_used' {
    const today = DateTime.now().toISODate()!
    if (voucher.validUntil < today) return 'expired'
    if (voucher.maxUsages !== null && voucher.usageCount >= voucher.maxUsages) return 'fully_used'
    return 'active'
  }

  // GET /api/admin/marketing/vouchers?status=active&page=1
  async index({ auth, request }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!
    const { page = 1, status } = request.qs()

    const today = DateTime.now().toISODate()!

    const query = MarketingVoucher.query()
      .where('restaurant_id', restaurantId)
      .orderBy('created_at', 'desc')

    if (status === 'active') {
      query.where('valid_until', '>=', today).andWhere((q) => {
        q.whereNull('max_usages').orWhereRaw('usage_count < max_usages')
      })
    } else if (status === 'expired') {
      query.where('valid_until', '<', today)
    }

    const result = await query.paginate(Number(page), 20)
    const json = result.toJSON()

    json.data = json.data.map((v: MarketingVoucher) => ({
      ...v.serialize(),
      status: this._computeStatus(v),
    }))

    return json
  }

  // POST /api/admin/marketing/vouchers
  async store({ auth, request, response }: HttpContext) {
    const data = await request.validateUsing(createVoucherValidator)
    const qrToken = randomBytes(20).toString('hex')

    const voucher = await MarketingVoucher.create({
      ...data,
      restaurantId: auth.user!.restaurantId!,
      createdBy: auth.user!.id,
      usageCount: 0,
      qrToken,
    })

    await new AuditService().log({
      ctx: { request },
      user: auth.user!,
      restaurantId: auth.user!.restaurantId!,
      action: 'marketing_voucher.created',
      resourceType: 'marketing_voucher',
      resourceId: voucher.id,
      resourceName: voucher.label,
      newValues: {
        label: voucher.label,
        eventType: voucher.eventType,
        amount: voucher.amount,
        validFrom: voucher.validFrom,
        validUntil: voucher.validUntil,
        maxUsages: voucher.maxUsages,
      },
    })

    return response.created({ ...voucher.serialize(), status: this._computeStatus(voucher) })
  }

  // GET /api/admin/marketing/vouchers/:id
  async show({ auth, params }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!

    const voucher = await MarketingVoucher.query()
      .where('id', params.id)
      .where('restaurant_id', restaurantId)
      .preload('usages', (q) => q.orderBy('redeemed_at', 'desc').limit(10))
      .firstOrFail()

    return { ...voucher.serialize(), status: this._computeStatus(voucher) }
  }

  // PATCH /api/admin/marketing/vouchers/:id
  async update({ auth, params, request }: HttpContext) {
    const voucher = await MarketingVoucher.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()

    const oldValues = {
      label: voucher.label,
      eventType: voucher.eventType,
      amount: voucher.amount,
      validFrom: voucher.validFrom,
      validUntil: voucher.validUntil,
      maxUsages: voucher.maxUsages,
      notes: voucher.notes,
    }

    const data = await request.validateUsing(createVoucherValidator)
    await voucher.merge(data).save()

    await new AuditService().log({
      ctx: { request },
      user: auth.user!,
      restaurantId: auth.user!.restaurantId!,
      action: 'marketing_voucher.updated',
      resourceType: 'marketing_voucher',
      resourceId: voucher.id,
      resourceName: voucher.label,
      oldValues,
      newValues: {
        label: voucher.label,
        eventType: voucher.eventType,
        amount: voucher.amount,
        validFrom: voucher.validFrom,
        validUntil: voucher.validUntil,
        maxUsages: voucher.maxUsages,
        notes: voucher.notes,
      },
    })

    return { ...voucher.serialize(), status: this._computeStatus(voucher) }
  }

  // DELETE /api/admin/marketing/vouchers/:id
  async destroy({ auth, params, request, response }: HttpContext) {
    const voucher = await MarketingVoucher.query()
      .where('id', params.id)
      .where('restaurant_id', auth.user!.restaurantId!)
      .firstOrFail()

    await voucher.delete()

    await new AuditService().log({
      ctx: { request },
      user: auth.user!,
      restaurantId: auth.user!.restaurantId!,
      action: 'marketing_voucher.deleted',
      resourceType: 'marketing_voucher',
      resourceId: Number(params.id),
      resourceName: voucher.label,
      oldValues: { label: voucher.label, amount: voucher.amount },
    })

    return response.noContent()
  }

  // GET /api/admin/marketing/vouchers/scan/:token
  async scan({ auth, params, response }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!

    const voucher = await MarketingVoucher.query()
      .where('qr_token', params.token)
      .where('restaurant_id', restaurantId)
      .preload('usages', (q) => q.orderBy('redeemed_at', 'desc').limit(5))
      .first()

    if (!voucher) {
      return response.notFound({ message: 'Voucher not found' })
    }

    const status = this._computeStatus(voucher)

    return {
      ...voucher.serialize(),
      status,
      canRedeem: status === 'active',
    }
  }

  // POST /api/admin/marketing/vouchers/:id/redeem
  async redeem({ auth, params, request, response }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!

    const voucher = await MarketingVoucher.query()
      .where('id', params.id)
      .where('restaurant_id', restaurantId)
      .firstOrFail()

    const status = this._computeStatus(voucher)
    if (status !== 'active') {
      return response.unprocessableEntity({
        message: status === 'expired'
          ? 'This voucher has expired'
          : 'This voucher has reached its maximum usage limit',
        status,
      })
    }

    const data = await request.validateUsing(redeemVoucherValidator)
    const { customerName, orderTotal, orderId } = data

    const voucherAmountUsed = Math.min(voucher.amount, orderTotal)
    const surplusPaid = Math.max(0, orderTotal - voucher.amount)

    const usage = await MarketingVoucherUsage.create({
      voucherId: voucher.id,
      orderId: orderId ?? null,
      customerName,
      voucherAmountUsed,
      orderTotal,
      surplusPaid,
      redeemedBy: auth.user!.id,
      redeemedAt: DateTime.now(),
    })

    voucher.usageCount += 1
    await voucher.save()

    const today = DateTime.now().toISODate()!
    await FinanceIncome.create({
      restaurantId,
      createdBy: auth.user!.id,
      label: `Marketing: ${voucher.label}`,
      amount: voucherAmountUsed,
      date: today,
      notes: `Bon utilisé par ${customerName}`,
    })

    await new AuditService().log({
      ctx: { request },
      user: auth.user!,
      restaurantId,
      action: 'marketing_voucher.redeemed',
      resourceType: 'marketing_voucher',
      resourceId: voucher.id,
      resourceName: voucher.label,
      newValues: {
        customerName,
        orderTotal,
        voucherAmountUsed,
        surplusPaid,
        usageId: usage.id,
      },
    })

    return response.created({
      usage: usage.serialize(),
      voucherAmountUsed,
      surplusPaid,
      message: `Voucher redeemed successfully for ${customerName}`,
    })
  }

  // GET /api/admin/marketing/stats
  async stats({ auth }: HttpContext) {
    const restaurantId = auth.user!.restaurantId!
    const today = DateTime.now().toISODate()!

    const totalVouchers = await MarketingVoucher.query()
      .where('restaurant_id', restaurantId)
      .count('* as total')
      .first()

    const activeVouchers = await MarketingVoucher.query()
      .where('restaurant_id', restaurantId)
      .where('valid_until', '>=', today)
      .andWhere((q) => {
        q.whereNull('max_usages').orWhereRaw('usage_count < max_usages')
      })
      .count('* as total')
      .first()

    const redemptionStats = await MarketingVoucherUsage.query()
      .whereHas('voucher', (q) => q.where('restaurant_id', restaurantId))
      .count('* as totalRedemptions')
      .sum('voucher_amount_used as totalValueRedeemed')
      .first()

    return {
      totalVouchers: Number((totalVouchers as any).$extras.total ?? 0),
      activeVouchers: Number((activeVouchers as any).$extras.total ?? 0),
      totalRedemptions: Number((redemptionStats as any).$extras.totalRedemptions ?? 0),
      totalValueRedeemed: Number((redemptionStats as any).$extras.totalValueRedeemed ?? 0),
    }
  }
}
