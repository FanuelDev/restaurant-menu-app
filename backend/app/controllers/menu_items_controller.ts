// backend/app/controllers/menu_items_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import MenuItem from '#models/menu_item'
import ImageUploadService from '#services/image_upload_service'
import { createMenuItemValidator, updateMenuItemValidator } from '#validators/menu_item_validator'
import { ImageUploadError } from '#services/image_upload_service'

const imageService = new ImageUploadService()

/**
 * Enrichit un MenuItem avec l'URL publique de son image.
 */
async function serializeItem(item: MenuItem) {
  const serialized = item.serialize()
  serialized.imageUrl = await imageService.getUrl(item.imageKey)
  // Expose le prix formaté (utile pour le débogage API)
  serialized.priceFormatted = item.priceFormatted
  return serialized
}

export default class MenuItemsController {
  /**
   * GET /api/public/menu-items
   * Plats disponibles avec leur catégorie, pour la page vitrine.
   */
  async indexPublic({ response }: HttpContext) {
    const items = await MenuItem.query()
      .preload('category', (q) => q.where('is_visible', true))
      .where('is_available', true)
      .orderBy('sort_order', 'asc')

    // Exclut les items dont la catégorie est masquée (preload peut retourner null)
    const visible = items.filter((i) => i.category)
    const serialized = await Promise.all(visible.map(serializeItem))
    return response.ok(serialized)
  }

  /**
   * GET /api/admin/menu-items
   * Tous les plats (admin).
   */
  async index({ request, response }: HttpContext) {
    const categoryId = request.input('categoryId')

    let query = MenuItem.query().preload('category').orderBy('sort_order', 'asc')
    if (categoryId) {
      query = query.where('category_id', categoryId)
    }

    const items = await query
    const serialized = await Promise.all(items.map(serializeItem))
    return response.ok(serialized)
  }

  /**
   * GET /api/admin/menu-items/:id
   */
  async show({ params, response }: HttpContext) {
    const item = await MenuItem.query()
      .where('id', params.id)
      .preload('category')
      .firstOrFail()

    return response.ok(await serializeItem(item))
  }

  /**
   * POST /api/admin/menu-items
   * Crée un plat avec upload optionnel d'image (multipart/form-data).
   */
  async store({ request, response }: HttpContext) {
    // Lecture des champs texte depuis le multipart
    const rawData = {
      categoryId: Number(request.input('categoryId')),
      name: request.input('name'),
      description: request.input('description'),
      priceInCents: Number(request.input('priceInCents')),
      isAvailable: request.input('isAvailable') !== 'false',
      badge: request.input('badge') || null,
      sortOrder: request.input('sortOrder') ? Number(request.input('sortOrder')) : undefined,
    }

    const data = await createMenuItemValidator.validate(rawData)

    // Position de tri automatique si non spécifiée
    if (data.sortOrder === undefined) {
      const last = await MenuItem.query()
        .where('category_id', data.categoryId)
        .max('sort_order as max')
        .first()
      data.sortOrder = ((last?.$extras.max as number) ?? 0) + 1
    }

    const item = await MenuItem.create(data)

    // Upload de l'image si fournie
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
    return response.created(await serializeItem(item))
  }

  /**
   * PUT /api/admin/menu-items/:id
   * Met à jour un plat. Si une nouvelle image est fournie, l'ancienne est supprimée.
   */
  async update({ params, request, response }: HttpContext) {
    const item = await MenuItem.findOrFail(params.id)

    const rawData = {
      categoryId: request.input('categoryId')
        ? Number(request.input('categoryId'))
        : undefined,
      name: request.input('name'),
      description: request.input('description'),
      priceInCents: request.input('priceInCents')
        ? Number(request.input('priceInCents'))
        : undefined,
      isAvailable:
        request.input('isAvailable') !== undefined
          ? request.input('isAvailable') !== 'false'
          : undefined,
      badge: request.input('badge') !== undefined ? request.input('badge') || null : undefined,
      sortOrder: request.input('sortOrder') ? Number(request.input('sortOrder')) : undefined,
    }

    // Retire les clés undefined pour merger uniquement ce qui est fourni
    const cleanData = Object.fromEntries(
      Object.entries(rawData).filter(([, v]) => v !== undefined)
    )

    const data = await updateMenuItemValidator.validate(cleanData)
    item.merge(data)

    // Nouvel upload d'image
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
    return response.ok(await serializeItem(item))
  }

  /**
   * DELETE /api/admin/menu-items/:id
   */
  async destroy({ params, response }: HttpContext) {
    const item = await MenuItem.findOrFail(params.id)
    await imageService.delete(item.imageKey)
    await item.delete()
    return response.noContent()
  }

  /**
   * PATCH /api/admin/menu-items/:id/toggle-availability
   * Bascule la disponibilité d'un plat (actif ↔ inactif).
   */
  async toggleAvailability({ params, response }: HttpContext) {
    const item = await MenuItem.findOrFail(params.id)
    item.isAvailable = !item.isAvailable
    await item.save()
    return response.ok({ id: item.id, isAvailable: item.isAvailable })
  }
}
