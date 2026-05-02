// backend/config/app.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  appUrl: env.get('APP_URL', ''),
})
