import type { HttpContext } from '@adonisjs/core/http'
import MenuItem from '#models/menu_item'
import Category from '#models/category'
import ImageUploadService from '#services/image_upload_service'
import AuditService from '#services/audit_service'
import SubscriptionService from '#services/subscription_service'
import { createMenuItemValidator, updateMenuItemValidator } from '#validators/menu_item_validator'
import { ImageUploadError } from '#services/image_upload_service'

const imageService = new ImageUploadService()
const auditService = new AuditService()
const subscriptionService = new SubscriptionService()

async function serializeItem(item: MenuItem) {
  const serialized = item.serialize()
  serialized.imageUrl = await imageService.getUrl(item.imageKey)
  return serialized
}

/** Parse une chaîne JSON venant du FormData en objet de traductions. */
function parseTranslations(raw: string | null | undefined): Record<string, string> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

export default class MenuItemsController {
  /** GET /api/public/menu-items */
  async indexPublic({ restaurant, response }: HttpContext) {
    const items = await MenuItem.query()
      .where('restaurant_id', restaurant.id)
      .preload('category', (q) => q.where('is_visible', true).where('restaurant_id', restaurant.id))
      .where('is_available', true)
      .orderBy('sort_order', 'asc')

    const visible = items.filter((i) => i.category)
    return response.ok(await Promise.all(visible.map(serializeItem)))
  }

  /** GET /api/admin/menu-items */
  async index({ request, response, restaurant }: HttpContext) {
    const categoryId = request.input('categoryId')

    let query = MenuItem.query()
      .where('restaurant_id', restaurant.id)
      .preload('category')
      .orderBy('sort_order', 'asc')

    if (categoryId) {
      query = query.where('category_id', categoryId)
    }

    return response.ok(await Promise.all((await query).map(serializeItem)))
  }

  /** GET /api/admin/menu-items/:id */
  async show({ params, response, restaurant }: HttpContext) {
    const item = await MenuItem.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .preload('category')
      .firstOrFail()

    return response.ok(await serializeItem(item))
  }

  /** POST /api/admin/menu-items */
  async store({ request, response, auth, restaurant }: HttpContext) {
    const limit = await subscriptionService.checkLimit(restaurant, 'menu_items')
    if (!limit.allowed) {
      return response.paymentRequired({
        message: `Limite atteinte (${limit.current}/${limit.max} plats). Passez à un plan supérieur.`,
        limit,
      })
    }

    // Validate category belongs to this restaurant
    const categoryId = Number(request.input('categoryId'))
    await Category.query()
      .where('id', categoryId)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    const rawData = {
      categoryId,
      name: request.input('name'),
      description: request.input('description'),
      price: Number(request.input('price')),
      isAvailable: request.input('isAvailable') !== 'false',
      badge: request.input('badge') || null,
      sortOrder: request.input('sortOrder') ? Number(request.input('sortOrder')) : undefined,
    }

    const data = await createMenuItemValidator.validate(rawData)

    if (data.sortOrder === undefined) {
      const last = await MenuItem.query()
        .where('category_id', data.categoryId)
        .where('restaurant_id', restaurant.id)
        .max('sort_order as max')
        .first()
      data.sortOrder = ((last?.$extras.max as number) ?? 0) + 1
    }

    // Traductions (envoyées en JSON via FormData)
    const nameTranslations = parseTranslations(request.input('nameTranslations'))
    const descriptionTranslations = parseTranslations(request.input('descriptionTranslations'))

    const item = await MenuItem.create({
      ...data,
      restaurantId: restaurant.id,
      nameTranslations,
      descriptionTranslations,
    })

    const imageFile = request.file('image')
    if (imageFile) {
      try {
        const { key } = await imageService.upload(imageFile, 'menu-items')
        item.imageKey = key
        await item.save()
      } catch (err) {
        if (err instanceof ImageUploadError) {
          await item.delete()
          return response.unprocessableEntity({ message: err.message })
        }
        throw err
      }
    }

    await item.load('category')

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'menu_item.created',
      resourceType: 'menu_item',
      resourceId: item.id,
      resourceName: item.name,
      newValues: AuditService.serialize(item as never, ['name', 'price', 'categoryId', 'isAvailable']),
    })

    return response.created(await serializeItem(item))
  }

  /** PUT /api/admin/menu-items/:id */
  async update({ params, request, response, auth, restaurant }: HttpContext) {
    const item = await MenuItem.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    const old = AuditService.serialize(item as never, ['name', 'price', 'categoryId', 'isAvailable'])

    // Validate category ownership if changed
    const categoryIdRaw = request.input('categoryId')
    if (categoryIdRaw) {
      await Category.query()
        .where('id', Number(categoryIdRaw))
        .where('restaurant_id', restaurant.id)
        .firstOrFail()
    }

    const rawData = {
      categoryId: categoryIdRaw ? Number(categoryIdRaw) : undefined,
      name: request.input('name'),
      description: request.input('description'),
      price: request.input('price') ? Number(request.input('price')) : undefined,
      isAvailable:
        request.input('isAvailable') !== undefined
          ? request.input('isAvailable') !== 'false'
          : undefined,
      badge: request.input('badge') !== undefined ? request.input('badge') || null : undefined,
      sortOrder: request.input('sortOrder') ? Number(request.input('sortOrder')) : undefined,
    }

    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([, v]) => v !== undefined)
    )

    const data = await updateMenuItemValidator.validate(cleanData)
    item.merge(data)

    // Traductions (optionnel — préservées si non envoyées)
    const ntRaw = request.input('nameTranslations')
    const dtRaw = request.input('descriptionTranslations')
    if (ntRaw !== undefined && ntRaw !== null) item.nameTranslations = parseTranslations(ntRaw)
    if (dtRaw !== undefined && dtRaw !== null) item.descriptionTranslations = parseTranslations(dtRaw)

    const imageFile = request.file('image')
    if (imageFile) {
      try {
        await imageService.delete(item.imageKey)
        const { key } = await imageService.upload(imageFile, 'menu-items')
        item.imageKey = key
      } catch (err) {
        if (err instanceof ImageUploadError) {
          return response.unprocessableEntity({ message: err.message })
        }
        throw err
      }
    }

    await item.save()
    await item.load('category')

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'menu_item.updated',
      resourceType: 'menu_item',
      resourceId: item.id,
      resourceName: item.name,
      oldValues: old,
      newValues: AuditService.serialize(item as never, ['name', 'price', 'categoryId', 'isAvailable']),
    })

    return response.ok(await serializeItem(item))
  }

  /** DELETE /api/admin/menu-items/:id */
  async destroy({ params, response, auth, restaurant, request }: HttpContext) {
    const item = await MenuItem.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'menu_item.deleted',
      resourceType: 'menu_item',
      resourceId: item.id,
      resourceName: item.name,
      oldValues: AuditService.serialize(item as never, ['name', 'price']),
    })

    await imageService.delete(item.imageKey)
    await item.delete()
    return response.noContent()
  }

  /** PATCH /api/admin/menu-items/:id/toggle-availability */
  async toggleAvailability({ params, response, auth, restaurant, request }: HttpContext) {
    const item = await MenuItem.query()
      .where('id', params.id)
      .where('restaurant_id', restaurant.id)
      .firstOrFail()

    item.isAvailable = !item.isAvailable
    await item.save()

    await auditService.log({
      ctx: { request } as never,
      user: auth.user!,
      restaurantId: restaurant.id,
      action: 'menu_item.toggled',
      resourceType: 'menu_item',
      resourceId: item.id,
      resourceName: item.name,
      newValues: { isAvailable: item.isAvailable },
    })

    return response.ok({ id: item.id, isAvailable: item.isAvailable })
  }
}
