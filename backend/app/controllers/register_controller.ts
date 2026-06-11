import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import { createHash } from 'node:crypto'
import db from '@adonisjs/lucid/services/db'
import Restaurant from '#models/restaurant'
import User from '#models/user'
import Plan from '#models/plan'
import { mailService } from '#services/mail_service'

// ─── Validateurs ──────────────────────────────────────────────────────────────

/**
 * Mot de passe fort : 8+ car., majuscule, minuscule, chiffre, caractère spécial
 */
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

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
    email: vine.string().trim().email().normalizeEmail(),
    password: vine.string()
      .minLength(8)
      .maxLength(128)
      .regex(STRONG_PASSWORD_REGEX)
      .confirmed(),
    ownerPhone: vine.string().trim().optional(),

    // Plan initial
    planSlug: vine.string().trim().optional(),
  })
)

const verifyEmailValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
    code: vine.string().trim().fixedLength(6).regex(/^\d{6}$/),
  })
)

const resendVerificationValidator = vine.compile(
  vine.object({
    email: vine.string().trim().email().normalizeEmail(),
  })
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateOtp(): { code: string; hash: string } {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const hash = createHash('sha256').update(code).digest('hex')
  return { code, hash }
}

// ─── Controller ───────────────────────────────────────────────────────────────

export default class RegisterController {
  /**
   * POST /api/register
   * Crée le restaurant + le compte propriétaire, envoie le code OTP par email.
   * Ne retourne PAS de token : le compte est inactif jusqu'à vérification.
   */
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
      // Si l'email existe mais n'est pas encore vérifié → renvoyer un code
      if (emailExists.emailVerifiedAt === null) {
        return response.conflict({
          message: 'Un compte avec cet email est déjà en attente de vérification.',
          field: 'email',
          requiresVerification: true,
        })
      }
      return response.conflict({ message: 'Cet email est déjà utilisé.', field: 'email' })
    }

    const freePlan = await Plan.findByOrFail('slug', data.planSlug ?? 'free')
    const { code, hash } = generateOtp()
    const expiresAt = DateTime.now().plus({ minutes: 15 })

    await db.transaction(async (trx) => {
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
          isActive: false, // actif seulement après vérification email
        },
        { client: trx }
      )

      await User.create(
        {
          restaurantId: restaurant.id,
          role: 'admin',
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          phone: data.ownerPhone ?? null,
          isActive: false, // inactif jusqu'à vérification
          emailVerificationToken: hash,
          emailVerificationTokenExpiresAt: expiresAt,
          emailVerifiedAt: null,
        },
        { client: trx }
      )
    })

    // Envoi asynchrone (non bloquant pour l'API)
    mailService.sendVerificationCode(data.email, data.fullName, code).catch((err) => {
      console.error('[Mail] Erreur envoi code vérification :', err)
    })

    return response.created({
      requiresVerification: true,
      email: data.email,
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
    })
  }

  /**
   * POST /api/register/verify-email
   * Valide le code OTP, active le compte et retourne le token d'authentification.
   */
  async verifyEmail({ request, response }: HttpContext) {
    const { email, code } = await request.validateUsing(verifyEmailValidator)

    const user = await User.query()
      .where('email', email)
      .whereNull('email_verified_at')
      .first()

    if (!user) {
      return response.notFound({ message: 'Aucun compte en attente de vérification pour cet email.' })
    }

    // Vérifier expiration
    if (!user.emailVerificationTokenExpiresAt || user.emailVerificationTokenExpiresAt < DateTime.now()) {
      return response.unprocessableEntity({
        message: 'Ce code a expiré. Demandez un nouveau code.',
        expired: true,
      })
    }

    // Vérifier le code
    const codeHash = createHash('sha256').update(code).digest('hex')
    if (codeHash !== user.emailVerificationToken) {
      return response.unprocessableEntity({ message: 'Code incorrect. Vérifiez et réessayez.' })
    }

    // Activer le compte
    user.emailVerifiedAt = DateTime.now()
    user.emailVerificationToken = null
    user.emailVerificationTokenExpiresAt = null
    user.isActive = true
    await user.save()

    // Activer le restaurant associé
    if (user.restaurantId) {
      await db
        .from('restaurants')
        .where('id', user.restaurantId)
        .update({ is_active: true })
    }

    user.lastLoginAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days',
      name: `register:${Date.now()}`,
    })

    await user.load('restaurant', (q) => q.preload('plan'))

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://saemenus.com'
    const menuUrl = `${frontendUrl}/menu/${user.restaurant.slug}`
    mailService.sendWelcome(user.email, user.fullName ?? user.email, user.restaurant.name, menuUrl).catch((err) => {
      console.error('[Mail] Erreur envoi welcome :', err)
    })

    return response.ok({
      message: 'Email vérifié avec succès. Bienvenue sur SaeMenus !',
      restaurant: {
        id: user.restaurant.id,
        slug: user.restaurant.slug,
        name: user.restaurant.name,
        subscriptionStatus: user.restaurant.subscriptionStatus,
        trialEndsAt: user.restaurant.trialEndsAt,
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

  /**
   * POST /api/register/resend-verification
   * Renvoie un nouveau code OTP (max 1 fois toutes les 60s côté token).
   */
  async resendVerification({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(resendVerificationValidator)

    const user = await User.query()
      .where('email', email)
      .whereNull('email_verified_at')
      .first()

    if (!user) {
      // Réponse neutre pour ne pas révéler si l'email existe
      return response.ok({ message: 'Si un compte existe, un nouveau code a été envoyé.' })
    }

    // Éviter les re-envois trop rapides (60s minimum entre deux envois)
    if (
      user.emailVerificationTokenExpiresAt &&
      user.emailVerificationTokenExpiresAt > DateTime.now().plus({ minutes: 14 })
    ) {
      return response.tooManyRequests({ message: 'Veuillez patienter avant de demander un nouveau code.' })
    }

    const { code, hash } = generateOtp()
    user.emailVerificationToken = hash
    user.emailVerificationTokenExpiresAt = DateTime.now().plus({ minutes: 15 })
    await user.save()

    mailService.sendVerificationCode(email, user.fullName ?? email, code).catch((err) => {
      console.error('[Mail] Erreur re-envoi code :', err)
    })

    return response.ok({ message: 'Un nouveau code a été envoyé à votre adresse email.' })
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
