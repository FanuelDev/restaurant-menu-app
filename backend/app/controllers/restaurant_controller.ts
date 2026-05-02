// backend/app/controllers/restaurant_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import Restaurant from '#models/restaurant'
import ImageUploadService from '#services/image_upload_service'
import { updateRestaurantValidator } from '#validators/restaurant_validator'

const imageService = new ImageUploadService()

/**
 * Sérialise un restaurant en ajoutant l'URL publique du logo.
 */
async function serializeRestaurant(restaurant: Restaurant) {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slogan: restaurant.slogan,
    brandColor: restaurant.brandColor,
    logoUrl: await imageService.getUrl(restaurant.logoKey),
    openingHours: restaurant.openingHours,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
  }
}

export default class RestaurantController {
  /**
   * GET /api/public/restaurant
   * Données publiques du restaurant (sans auth).
   */
  async showPublic({ response }: HttpContext) {
    const restaurant = await Restaurant.getOrCreate()
    return response.ok(await serializeRestaurant(restaurant))
  }

  /**
   * GET /api/admin/restaurant
   */
  async show({ response }: HttpContext) {
    const restaurant = await Restaurant.getOrCreate()
    return response.ok(await serializeRestaurant(restaurant))
  }

  /**
   * PUT /api/admin/restaurant
   * Met à jour les informations du restaurant.
   */
  async update({ request, response }: HttpContext) {
    const data = await request.validateUsing(updateRestaurantValidator)
    const restaurant = await Restaurant.getOrCreate()
    restaurant.merge(data)
    await restaurant.save()
    return response.ok(await serializeRestaurant(restaurant))
  }

  /**
   * POST /api/admin/restaurant/logo
   * Remplace le logo du restaurant.
   */
  async uploadLogo({ request, response }: HttpContext) {
    const file = request.file('logo')

    if (!file) {
      return response.unprocessableEntity({ message: 'Aucun fichier fourni.' })
    }

    const restaurant = await Restaurant.getOrCreate()

    // Supprime l'ancien logo avant d'uploader le nouveau
    await imageService.delete(restaurant.logoKey)

    const { key } = await imageService.upload(file, 'logos')
    restaurant.logoKey = key
    await restaurant.save()

    return response.ok({
      logoUrl: await imageService.getUrl(key),
    })
  }
}
