import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import PageView from '#models/page_view'
import {
  createCategoryValidator,
  updateCategoryValidator,
  reorderCategoriesValidator,
} from '#validators/category_validator'
import AuditService from '#services/audit_service'
import SubscriptionService from '#services/subscription_service'
import db from '@adonisjs/lucid/services/db'

const auditService = new AuditService()
const subscriptionService = new SubscriptionService()

export default class CategoriesController {
  /** GET /api/public/categories */
  async indexPublic({ restaurant, response }: HttpContext) {
    // Fire-and-forget : on ne bloque pas la réponse en cas d'échec du tracking
    PageView.create({ restaurantId: restaurant.id, resourceType: 'menu', resourceId: null }).catch(() => {})

    const categories = await Category.query()
      .where('restaurant_id', restaurant.id)
      .where('is_visible', true)
      .preload('menuItems', (query) => {
        query.where('is_available', true).orderBy('sort_order', 'asc')
      })
      .orderBy('sort_order', 'asc')

    return response.ok(categories.map((c) => c.serialize()))
  }

  /** GET /api/admin/categories */
  async index({ restaurant, response }: HttpContext) {
    const categories = await Category.query()
      .where('restaurant_id', restaurant.id)
      .withCount('menuItems')
      .orderBy('sort_order', 'asc')

    return response.ok(categories.map((c) => c.serialize()))
  }

  /** POST /api/admin/categories */
  async store({ request, response, auth, restaurant }: HttpContext) {
    const limit = await subscriptionService.checkLimit(restaurant, 'categories')
    if (!limit.allowed) {
      return response.paymentRequired({
        message: `Limite atteinte (${limit.current}/${limit.max} catégories). Passez à un plan supérieur.`,
        limit,
      })
    }

    const data = await request.validateUsing(createCategoryValidator)

    if (data.sortOrder === undefined) {
      const last = await Category.query()
        .where('restaurant_id', restaurant.id)
        .max('sort_order as max')
        .first()
      data.sortOrder = ((last?.$extras.max as number) ?? 0) + 1
    }

    const category = await Category.create({
      ...data,
      restaurantId: restaurant.id,
      isVisible: data.isVisible ?? true,
    })

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'category.created',
      resourceType: 'category',
      resourceId: category.id,
      resourceName: category.name,
      newValues: AuditService.serialize(category as never, ['name', 'isVisible', 'sortOrder']),
    })

    return response.created(category.serialize())
  }

  /** PUT /api/admin/categories/:id */
  async update({ params, request, response, auth, restaurant }: HttpContext) {
    const category = await Category.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    const old = AuditService.serialize(category as never, ['name', 'isVisible', 'sortOrder'])
    const data = await request.validateUsing(updateCategoryValidator)
    category.merge(data)
    await category.save()

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'category.updated',
      resourceType: 'category',
      resourceId: category.id,
      resourceName: category.name,
      oldValues: old,
      newValues: AuditService.serialize(category as never, ['name', 'isVisible', 'sortOrder']),
    })

    return response.ok(category.serialize())
  }

  /** DELETE /api/admin/categories/:id */
  async destroy({ params, response, auth, restaurant, request }: HttpContext) {
    const category = await Category.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'category.deleted',
      resourceType: 'category',
      resourceId: category.id,
      resourceName: category.name,
      oldValues: AuditService.serialize(category as never, ['name']),
    })

    await category.delete()
    return response.noContent()
  }

  /** PATCH /api/admin/categories/reorder */
  async reorder({ request, response, restaurant }: HttpContext) {
    const { items } = await request.validateUsing(reorderCategoriesValidator)

    await db.transaction(async (trx) => {
      for (const { id, sortOrder } of items) {
        await Category.query({ client: trx })
          .where('id', id)
          .where('restaurant_id', restaurant.id)
          .update({ sort_order: sortOrder })
      }
    })

    return response.ok({ message: 'Ordre mis à jour.' })
  }
}
