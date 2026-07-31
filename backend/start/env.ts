// backend/start/env.ts
import { Env } from '@adonisjs/core/env'

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
  APP_KEY: Env.schema.string(),
  APP_URL: Env.schema.string.optional(),
  FRONTEND_URL: Env.schema.string.optional(),
  TZ: Env.schema.string.optional(),

  // Base de données
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  // Upload
  DRIVE_DISK: Env.schema.enum(['local', 's3'] as const),
  LOCAL_UPLOADS_PATH: Env.schema.string.optional(),
  LOCAL_UPLOADS_URL: Env.schema.string.optional(),

  // S3 / MinIO (optionnel si DRIVE_DISK=local)
  S3_KEY: Env.schema.string.optional(),
  S3_SECRET: Env.schema.string.optional(),
  S3_BUCKET: Env.schema.string.optional(),
  S3_ENDPOINT: Env.schema.string.optional(),
  S3_REGION: Env.schema.string.optional(),
  // URL publique pour les images S3 (ex: https://domain.com/media) — proxy nginx vers MinIO
  S3_CDN_URL: Env.schema.string.optional(),

  // CORS
  CORS_ORIGIN: Env.schema.string.optional(),

  // Limites
  MAX_IMAGE_SIZE_MB: Env.schema.number.optional(),

  // FedaPay
  FEDAPAY_SECRET_KEY: Env.schema.string.optional(),
  FEDAPAY_WEBHOOK_SECRET: Env.schema.string.optional(),
  FEDAPAY_CALLBACK_URL: Env.schema.string.optional(),
  FEDAPAY_RETURN_URL: Env.schema.string.optional(),
  FEDAPAY_SANDBOX: Env.schema.string.optional(),

  // SMTP — emails transactionnels (vérification de compte, etc.)
  SMTP_HOST: Env.schema.string.optional(),
  SMTP_PORT: Env.schema.number.optional(),
  SMTP_SECURE: Env.schema.string.optional(),
  SMTP_USER: Env.schema.string.optional(),
  SMTP_PASS: Env.schema.string.optional(),
  SMTP_FROM: Env.schema.string.optional(),

  // Cron automation
  CRON_SECRET: Env.schema.string.optional(),
  SUPER_ADMIN_EMAIL: Env.schema.string.optional(),
  CRITICAL_ALERT_THRESHOLD: Env.schema.number.optional(),
})
