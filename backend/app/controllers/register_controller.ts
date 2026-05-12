import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import Restaurant from '#models/restaurant'
import User from '#models/user'
import Plan from '#models/plan'

const registerValidator = vine.compile(
  vine.object({
    // Infos restaurant
    restaurantName: vine.string().trim().minLength(2).maxLength(100),
    restaurantSlug: vine.string().trim().regex(/^[a-z0-9-]+$/).minLength(2).maxLength(50),
    country: vine.string().fixedLength(2).toUpperCase(),
    currency: vine.enum(['XOF', 'XAF', 'CDF', 'GNF', 'USD', 'EUR']),
    address: vine.string().trim().optional(),
    phone: vine.string().trim().optional(),
    website: vine.string().trim().url().optional(),
    siret: vine.string().trim().optional(),

    // Infos propriétaire
    fullName: vine.string().trim().minLength(2).maxLength(100),
    email: vine.string().trim().email(),
    password: vine.string().minLength(8).confirmed(),
    ownerPhone: vine.string().trim().optional(),

    // Plan initial
    planSlug: vine.string().trim().optional(),
  })
)

export default class RegisterController {
  async store({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    // Vérifier unicité du slug
    const slugExists = await Restaurant.findBy('slug', data.restaurantSlug)
    if (slugExists) {
      return response.conflict({ message: 'Ce sous-domaine est déjà utilisé.', field: 'restaurantSlug' })
    }

    // Vérifier unicité de l'email
    const emailExists = await User.findBy('email', data.email)
    if (emailExists) {
      return response.conflict({ message: 'Cet email est déjà utilisé.', field: 'email' })
    }

    const freePlan = await Plan.findByOrFail('slug', data.planSlug ?? 'free')

    const { restaurant, user } = await db.transaction(async (trx) => {
      const restaurant = await Restaurant.create(
        {
          slug: data.restaurantSlug,
          name: data.restaurantName,
          country: data.country,
          currency: data.currency,
          address: data.address ?? null,
          phone: data.phone ?? null,
          website: data.website ?? null,
          siret: data.siret ?? null,
          brandColor: '#C0392B',
          planId: freePlan.id,
          subscriptionStatus: 'trialing',
          trialEndsAt: DateTime.now().plus({ days: 14 }),
          isActive: true,
        },
        { client: trx }
      )

      const user = await User.create(
        {
          restaurantId: restaurant.id,
          role: 'admin',
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          phone: data.ownerPhone ?? null,
          isActive: true,
        },
        { client: trx }
      )

      return { restaurant, user }
    })

    const token = await User.accessTokens.create(user)

    return response.created({
      message: 'Restaurant créé avec succès. Période d\'essai de 14 jours activée.',
      restaurant: {
        id: restaurant.id,
        slug: restaurant.slug,
        name: restaurant.name,
        subscriptionStatus: restaurant.subscriptionStatus,
        trialEndsAt: restaurant.trialEndsAt,
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token: { type: 'bearer', value: token.value!.release() },
    })
  }

  /** Vérifie la disponibilité d'un slug en temps réel */
  async checkSlug({ request, response }: HttpContext) {
    const slug = request.input('slug', '')
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return response.ok({ available: false, reason: 'Format invalide (minuscules, chiffres, tirets)' })
    }
    const exists = await Restaurant.findBy('slug', slug)
    return response.ok({ available: !exists })
  }
}
