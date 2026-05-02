// backend/config/auth.ts
import { defineConfig } from '@adonisjs/auth'
import { tokensGuard, tokensUserProvider } from '@adonisjs/auth/access_tokens'

/**
 * Configuration de l'authentification via Access Tokens (Bearer Token).
 * Les tokens sont stockés en base, chaque token est associé à un utilisateur.
 * La durée de vie est configurable via ACCESS_TOKEN_EXPIRY dans .env.
 */
const authConfig = defineConfig({
  default: 'api',
  guards: {
    api: tokensGuard({
      provider: tokensUserProvider({
        tokens: 'accessTokens',
        model: () => import('#models/user'),
      }),
    }),
  },
})

export default authConfig

declare module '@adonisjs/auth/types' {
  interface Authenticators extends InferAuthenticators<typeof authConfig> {}
}
