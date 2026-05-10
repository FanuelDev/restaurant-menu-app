import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import Plan from '#models/plan'

const planValidator = vine.compile(
  vine.object({
    name: vine.string().trim().minLength(2).maxLength(100),
    slug: vine.string().trim().regex(/^[a-z0-9-]+$/),
    description: vine.string().trim().optional(),
    priceMonthlyCents: vine.number().min(0),
    priceYearlyCents: vine.number().min(0),
    maxCategories: vine.number().min(-1),
    maxMenuItems: vine.number().min(-1),
    maxUsers: vine.number().min(-1),
    features: vine.array(vine.string()).optional(),
    isActive: vine.boolean().optional(),
    isPublic: vine.boolean().optional(),
    sortOrder: vine.number().min(0).optional(),
  })
)

export default class SuperAdminPlansController {
  /** GET /api/super-admin/plans */
  async index({ response }: HttpContext) {
    const plans = await Plan.query().orderBy('sort_order')
    return response.ok(plans)
  }

  /** POST /api/super-admin/plans */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(planValidator)

    const existing = await Plan.findBy('slug', data.slug)
    if (existing) {
      return response.conflict({ message: 'Un plan avec ce slug existe déjà.' })
    }

    const plan = await Plan.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      priceMonthlyCents: data.priceMonthlyCents,
      priceYearlyCents: data.priceYearlyCents,
      maxCategories: data.maxCategories,
      maxMenuItems: data.maxMenuItems,
      maxUsers: data.maxUsers,
      features: data.features ? Object.fromEntries(data.features.map((f) => [f, true])) : {},
      isActive: data.isActive ?? true,
      isPublic: data.isPublic ?? true,
      sortOrder: data.sortOrder ?? 0,
    })

    return response.created(plan)
  }

  /** PUT /api/super-admin/plans/:id */
  async update({ params, request, response }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    const data = await request.validateUsing(planValidator)

    plan.merge({
      name: data.name,
      description: data.description ?? plan.description,
      priceMonthlyCents: data.priceMonthlyCents,
      priceYearlyCents: data.priceYearlyCents,
      maxCategories: data.maxCategories,
      maxMenuItems: data.maxMenuItems,
      maxUsers: data.maxUsers,
      features: data.features ? Object.fromEntries(data.features.map((f) => [f, true])) : plan.features,
      isActive: data.isActive ?? plan.isActive,
      isPublic: data.isPublic ?? plan.isPublic,
      sortOrder: data.sortOrder ?? plan.sortOrder,
    })
    await plan.save()

    return response.ok(plan)
  }

  /** DELETE /api/super-admin/plans/:id */
  async destroy({ params, response }: HttpContext) {
    const plan = await Plan.findOrFail(params.id)
    await plan.delete()
    return response.ok({ message: 'Plan supprimé.' })
  }
}
