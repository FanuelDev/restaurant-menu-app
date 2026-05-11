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
    templateId: restaurant.templateId ?? 1,
    logoUrl: await imageService.getUrl(restaurant.logoKey),
    coverImageUrl: await imageService.getUrl(restaurant.coverKey),
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
    // Normalize openingHours: closed is optional in the validator but required in the model (defaults to false)
    const openingHours = data.openingHours
      ? (Object.fromEntries(
          Object.entries(data.openingHours).map(([day, sched]) => [
            day,
            sched ? { ...sched, closed: sched.closed ?? false } : sched,
          ])
        ) as Restaurant['openingHours'])
      : data.openingHours
    restaurant.merge({ ...data, openingHours })
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

  /** POST /api/admin/restaurant/cover */
  async uploadCover({ request, response, restaurant }: HttpContext) {
    const file = request.file('cover')
    if (!file) {
      return response.unprocessableEntity({ message: 'Aucun fichier fourni.' })
    }

    await imageService.delete(restaurant.coverKey)
    const { key } = await imageService.upload(file, 'covers')
    restaurant.coverKey = key
    await restaurant.save()

    return response.ok({ coverImageUrl: await imageService.getUrl(key) })
  }

  /** DELETE /api/admin/restaurant/cover */
  async deleteCover({ response, restaurant }: HttpContext) {
    await imageService.delete(restaurant.coverKey)
    restaurant.coverKey = null
    await restaurant.save()
    return response.ok({ coverImageUrl: null })
  }
}
