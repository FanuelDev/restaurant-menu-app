// backend/config/app.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  appKey: env.get('APP_KEY'),
  appUrl: env.get('APP_URL', 'http://localhost:3333'),
  http: {
    generateRequestId: true,
    allowMethodSpoofing: false,
    useAsyncLocalStorage: false,
    trustProxy: () => false,
    qs: {
      parse: {
        depth: 5,
        parameterLimit: 1000,
        allowSparse: false,
        arrayLimit: 20,
        comma: true,
      },
      stringify: {
        encode: true,
        encodeValuesOnly: false,
        arrayFormat: 'indices',
        skipNulls: false,
      },
    },
    cookie: {
      domain: '',
      path: '/',
      maxAge: '2h',
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    },
  },
})
