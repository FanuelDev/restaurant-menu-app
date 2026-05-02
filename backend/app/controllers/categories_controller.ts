// backend/app/controllers/categories_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Category from '#models/category'
import {
  createCategoryValidator,
  updateCategoryValidator,
  reorderCategoriesValidator,
} from '#validators/category_validator'
import db from '@adonisjs/lucid/services/db'

export default class CategoriesController {
  /**
   * GET /api/public/categories
   * Catégories visibles triées pour la page client.
   */
  async indexPublic({ response }: HttpContext) {
    const categories = await Category.query()
      .where('is_visible', true)
      .preload('menuItems', (query) => {
        query.where('is_available', true).orderBy('sort_order', 'asc')
      })
      .orderBy('sort_order', 'asc')

    return response.ok(categories.map((c) => c.serialize()))
  }

  /**
   * GET /api/admin/categories
   * Toutes les catégories (incluant les masquées).
   */
  async index({ response }: HttpContext) {
    const categories = await Category.query()
      .withCount('menuItems')
      .orderBy('sort_order', 'asc')

    return response.ok(categories.map((c) => c.serialize()))
  }

  /**
   * POST /api/admin/categories
   */
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(createCategoryValidator)

    // Si sortOrder non fourni, place la catégorie en dernier
    if (data.sortOrder === undefined) {
      const last = await Category.query().max('sort_order as max').first()
      data.sortOrder = ((last?.$extras.max as number) ?? 0) + 1
    }

    const category = await Category.create({
      ...data,
      isVisible: data.isVisible ?? true,
    })

    return response.created(category.serialize())
  }

  /**
   * PUT /api/admin/categories/:id
   */
  async update({ params, request, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    const data = await request.validateUsing(updateCategoryValidator)
    category.merge(data)
    await category.save()
    return response.ok(category.serialize())
  }

  /**
   * DELETE /api/admin/categories/:id
   * Supprime la catégorie et tous ses plats (CASCADE en BDD).
   */
  async destroy({ params, response }: HttpContext) {
    const category = await Category.findOrFail(params.id)
    await category.delete()
    return response.noContent()
  }

  /**
   * PATCH /api/admin/categories/reorder
   * Met à jour l'ordre d'affichage de plusieurs catégories en une transaction.
   */
  async reorder({ request, response }: HttpContext) {
    const { items } = await request.validateUsing(reorderCategoriesValidator)

    await db.transaction(async (trx) => {
      for (const { id, sortOrder } of items) {
        await Category.query({ client: trx })
          .where('id', id)
          .update({ sort_order: sortOrder })
      }
    })

    return response.ok({ message: 'Ordre mis à jour.' })
  }
}
