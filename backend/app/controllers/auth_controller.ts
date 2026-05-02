// backend/app/controllers/auth_controller.ts
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import { loginValidator } from '#validators/auth_validator'

export default class AuthController {
  /**
   * POST /api/auth/login
   * Authentifie un admin et retourne un token d'accès.
   */
  async login({ request, response, auth }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    // verifyCredentials lève une exception si les identifiants sont incorrects
    const user = await User.verifyCredentials(email, password)

    const token = await auth.use('api').createToken(user, ['*'], {
      expiresIn: '30 days',
      name: `login:${Date.now()}`,
    })

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
      },
    })
  }

  /**
   * DELETE /api/auth/logout
   * Révoque le token courant.
   */
  async logout({ auth, response }: HttpContext) {
    await auth.use('api').invalidateToken()
    return response.ok({ message: 'Déconnexion réussie.' })
  }

  /**
   * GET /api/auth/me
   * Retourne les informations de l'utilisateur connecté.
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    })
  }
}
