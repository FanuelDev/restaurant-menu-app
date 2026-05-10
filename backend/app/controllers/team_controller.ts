import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import User from '#models/user'
import AuditService from '#services/audit_service'
import SubscriptionService from '#services/subscription_service'

const createMemberValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8),
    phone: vine.string().trim().optional(),
  })
)

const updateMemberValidator = vine.compile(
  vine.object({
    fullName: vine.string().trim().minLength(2).maxLength(100).optional(),
    phone: vine.string().trim().optional(),
    isActive: vine.boolean().optional(),
  })
)

export default class TeamController {
  readonly #auditService = new AuditService()
  readonly #subscriptionService = new SubscriptionService()

  /** GET /api/admin/team */
  async index({ restaurant, response }: HttpContext) {
    const members = await User.query()
      .where('restaurant_id', restaurant.id)
      .where('role', 'cashier')
      .orderBy('created_at', 'desc')

    return response.ok(members)
  }

  /** POST /api/admin/team */
  async store({ request, response, auth, restaurant }: HttpContext) {
    const limit = await this.#subscriptionService.checkLimit(restaurant, 'users')
    if (!limit.allowed) {
      return response.paymentRequired({
        message: `Limite atteinte (${limit.current}/${limit.max} caissier${limit.max > 1 ? 's' : ''}). Passez à un plan supérieur.`,
        limit,
      })
    }

    const data = await request.validateUsing(createMemberValidator)

    const emailExists = await User.findBy('email', data.email)
    if (emailExists) {
      return response.conflict({ message: 'Cet email est déjà utilisé.', field: 'email' })
    }

    const member = await User.create({
      restaurantId: restaurant.id,
      role: 'cashier',
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      phone: data.phone ?? null,
      isActive: true,
    })

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'user.created',
      resourceType: 'user',
      resourceId: member.id,
      resourceName: member.fullName ?? undefined,
      newValues: { email: member.email, role: member.role },
    })

    return response.created(member)
  }

  /** PUT /api/admin/team/:id */
  async update({ request, response, auth, restaurant, params }: HttpContext) {
    const member = await User.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .where('role', 'cashier')
      .firstOrFail()

    const data = await request.validateUsing(updateMemberValidator)
    const old = AuditService.serialize(member as never, ['fullName', 'phone', 'isActive'])

    member.merge({
      fullName: data.fullName ?? member.fullName,
      phone: data.phone !== undefined ? (data.phone ?? null) : member.phone,
      isActive: data.isActive !== undefined ? data.isActive : member.isActive,
    })
    await member.save()

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'user.updated',
      resourceType: 'user',
      resourceId: member.id,
      resourceName: member.fullName ?? undefined,
      oldValues: old,
      newValues: AuditService.serialize(member as never, ['fullName', 'phone', 'isActive']),
    })

    return response.ok(member)
  }

  /** DELETE /api/admin/team/:id */
  async destroy({ response, auth, restaurant, params, request }: HttpContext) {
    const member = await User.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .where('role', 'cashier')
      .firstOrFail()

    await this.#auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'user.deleted',
      resourceType: 'user',
      resourceId: member.id,
      resourceName: member.fullName ?? undefined,
      oldValues: { email: member.email },
    })

    await member.delete()

    return response.ok({ message: 'Membre supprimé.' })
  }
}
