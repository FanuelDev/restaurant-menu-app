// backend/config/drive.ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'
import type { InferDriveDisks } from '@adonisjs/drive/types'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),
  services: {
    local: services.fs({
      location: app.makePath('public/uploads'),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    s3: services.s3({
      credentials: {
        accessKeyId: env.get('S3_KEY') ?? '',
        secretAccessKey: env.get('S3_SECRET') ?? '',
      },
      region: env.get('S3_REGION') ?? 'us-east-1',
      bucket: env.get('S3_BUCKET') ?? 'restaurant-menu',
      endpoint: env.get('S3_ENDPOINT'),
      forcePathStyle: true,
      visibility: 'public',
      // En prod, pointe vers le proxy nginx /media/ pour éviter d'exposer MinIO directement
      cdnUrl: env.get('S3_CDN_URL'),
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
