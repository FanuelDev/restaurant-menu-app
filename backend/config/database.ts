// backend/config/database.ts
import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'mysql',
  connections: {
    mysql: {
      client: 'mysql2',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
        // Encodage UTF-8 complet pour les emojis et caractères spéciaux
        charset: 'utf8mb4',
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
      seeders: {
        paths: ['database/seeders'],
      },
      // Logue les requêtes en dev uniquement
      debug: env.get('NODE_ENV') === 'development',
    },
  },
})

export default dbConfig
