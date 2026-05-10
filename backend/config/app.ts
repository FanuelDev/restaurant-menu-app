// backend/config/app.ts
import env from '#start/env'

export default {
  appKey: env.get('APP_KEY'),
  appUrl: env.get('APP_URL', 'http://localhost:3333'),
  http: {
    generateRequestId: true,
    allowMethodSpoofing: false,
    useAsyncLocalStorage: false,
    trustProxy: () => env.get('NODE_ENV') === 'production',
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
}
