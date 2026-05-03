import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import { randomBytes } from 'node:crypto'
import User from '#models/user'
import { loginValidator, forgotPasswordValidator, resetPasswordValidator } from '#validators/auth_validator'

export default class AuthController {
  /** POST /api/auth/login */
  async login({ request, response }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const user = await User.verifyCredentials(email, password)

    if (!user.isActive) {
      return response.forbidden({ message: 'Ce compte est désactivé.' })
    }

    user.lastLoginAt = DateTime.now()
    await user.save()

    const token = await User.accessTokens.create(user, ['*'], {
      expiresIn: '30 days',
      name: `login:${Date.now()}`,
    })

    let restaurantData = null
    if (user.restaurantId) {
      await user.load('restaurant', (q) => q.preload('plan'))
      restaurantData = {
        id: user.restaurant.id,
        slug: user.restaurant.slug,
        name: user.restaurant.name,
        subscriptionStatus: user.restaurant.subscriptionStatus,
        trialEndsAt: user.restaurant.trialEndsAt,
        plan: user.restaurant.plan,
      }
    }

    return response.ok({
      token: {
        type: 'bearer',
        value: token.value!.release(),
        expiresAt: token.expiresAt,
      },
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        restaurantId: user.restaurantId,
      },
      restaurant: restaurantData,
    })
  }

  /** DELETE /api/auth/logout */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    const currentToken = (user as unknown as { currentAccessToken?: { identifier: number } }).currentAccessToken
    if (currentToken) {
      await User.accessTokens.delete(user, currentToken.identifier)
    }
    return response.ok({ message: 'Déconnexion réussie.' })
  }

  /** POST /api/auth/forgot-password */
  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', email)

    // Always return success to avoid email enumeration attacks
    if (!user || !user.isActive) {
      return response.ok({ message: 'Si cet email existe, un lien a été envoyé.' })
    }

    const token = randomBytes(32).toString('hex')
    user.passwordResetToken = token
    user.passwordResetTokenExpiresAt = DateTime.now().plus({ hours: 1 })
    await user.save()

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:4200'
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`

    // TODO: Remplacer par envoi d'email via @adonisjs/mail
    console.log(`[PASSWORD RESET] Lien pour ${email} : ${resetUrl}`)

    return response.ok({ message: 'Si cet email existe, un lien a été envoyé.' })
  }

  /** POST /api/auth/reset-password */
  async resetPassword({ request, response }: HttpContext) {
    const { token, password } = await request.validateUsing(resetPasswordValidator)

    const user = await User.query()
      .where('password_reset_token', token)
      .where('password_reset_token_expires_at', '>', DateTime.now().toSQL()!)
      .first()

    if (!user) {
      return response.badRequest({ message: 'Lien invalide ou expiré. Veuillez refaire une demande.' })
    }

    user.password = password
    user.passwordResetToken = null
    user.passwordResetTokenExpiresAt = null
    await user.save()

    return response.ok({ message: 'Mot de passe mis à jour avec succès.' })
  }

  /** GET /api/auth/me */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    let restaurantData = null

    if (user.restaurantId) {
      await user.load('restaurant', (q) => q.preload('plan'))
      restaurantData = {
        id: user.restaurant.id,
        slug: user.restaurant.slug,
        name: user.restaurant.name,
        subscriptionStatus: user.restaurant.subscriptionStatus,
        trialEndsAt: user.restaurant.trialEndsAt,
        plan: user.restaurant.plan,
      }
    }

    return response.ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurant: restaurantData,
    })
  }
}
