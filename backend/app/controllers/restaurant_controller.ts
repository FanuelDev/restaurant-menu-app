import type { HttpContext } from '@adonisjs/core/http'
import Restaurant from '#models/restaurant'
import ImageUploadService from '#services/image_upload_service'
import { updateRestaurantValidator } from '#validators/restaurant_validator'

const imageService = new ImageUploadService()

async function serializeRestaurant(restaurant: Restaurant) {
  return {
    id: restaurant.id,
    slug: restaurant.slug,
    name: restaurant.name,
    slogan: restaurant.slogan,
    brandColor: restaurant.brandColor,
    logoUrl: await imageService.getUrl(restaurant.logoKey),
    openingHours: restaurant.openingHours,
    address: restaurant.address,
    phone: restaurant.phone,
    email: restaurant.email,
    website: restaurant.website,
    country: restaurant.country,
    currency: restaurant.currency,
    subscriptionStatus: restaurant.subscriptionStatus,
    trialEndsAt: restaurant.trialEndsAt,
  }
}

export default class RestaurantController {
  /** GET /api/public/restaurant — données publiques (via tenant middleware) */
  async showPublic({ restaurant, response }: HttpContext) {
    return response.ok(await serializeRestaurant(restaurant))
  }

  /** GET /api/admin/restaurant */
  async show({ restaurant, response }: HttpContext) {
    await restaurant.load('plan')
    const data = await serializeRestaurant(restaurant)
    return response.ok({ ...data, plan: restaurant.plan })
  }

  /** PUT /api/admin/restaurant */
  async update({ request, response, restaurant }: HttpContext) {
    const data = await request.validateUsing(updateRestaurantValidator)
    restaurant.merge(data)
    await restaurant.save()
    return response.ok(await serializeRestaurant(restaurant))
  }

  /** POST /api/admin/restaurant/logo */
  async uploadLogo({ request, response, restaurant }: HttpContext) {
    const file = request.file('logo')
    if (!file) {
      return response.unprocessableEntity({ message: 'Aucun fichier fourni.' })
    }

    await imageService.delete(restaurant.logoKey)
    const { key } = await imageService.upload(file, 'logos')
    restaurant.logoKey = key
    await restaurant.save()

    return response.ok({ logoUrl: await imageService.getUrl(key) })
  }
}
