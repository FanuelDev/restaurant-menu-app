// backend/config/drive.ts
import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'

/**
 * Configuration du stockage de fichiers.
 * Disk "local" : fichiers servis depuis public/uploads
 * Disk "s3"    : fichiers hébergés sur MinIO (ou AWS S3)
 */
const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),
  services: {
    local: services.fs({
      location: app.makePath(env.get('LOCAL_UPLOADS_PATH', './public/uploads')),
      serveFiles: true,
      routeBasePath: '/uploads',
      visibility: 'public',
    }),

    s3: services.s3({
      credentials: {
        accessKeyId: env.get('S3_KEY', ''),
        secretAccessKey: env.get('S3_SECRET', ''),
      },
      region: env.get('S3_REGION', 'us-east-1'),
      bucket: env.get('S3_BUCKET', 'restaurant-menu'),
      endpoint: env.get('S3_ENDPOINT'),
      // Obligatoire pour MinIO (path-style au lieu de virtual-hosted)
      forcePathStyle: true,
      visibility: 'public',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
