// backend/adonisrc.ts
import { defineConfig } from '@adonisjs/core/app'

export default defineConfig({
  /*
   * Commands to load from registered packages and the app itself
   */
  commands: [
    () => import('@adonisjs/core/commands'),
    () => import('@adonisjs/lucid/commands'),
    () => import('@adonisjs/drive/commands'),
  ],

  /*
   * Service providers to register
   */
  providers: [
    () => import('@adonisjs/core/providers/app_provider'),
    () => import('@adonisjs/core/providers/hash_provider'),
    {
      file: () => import('@adonisjs/core/providers/repl_provider'),
      environment: ['repl'],
    },
    () => import('@adonisjs/core/providers/vinejs_provider'),
    () => import('@adonisjs/cors/cors_provider'),
    () => import('@adonisjs/lucid/database_provider'),
    () => import('@adonisjs/auth/auth_provider'),
    () => import('@adonisjs/drive/drive_provider'),
  ],

  /*
   * Test suites
   */
  tests: {
    suites: [
      {
        files: ['tests/unit/**/*.spec.(js|ts)'],
        name: 'unit',
        timeout: 2000,
      },
      {
        files: ['tests/functional/**/*.spec.(js|ts)'],
        name: 'functional',
        timeout: 30000,
      },
    ],
  },

  /*
   * Pre-loads files before the application boots
   */
  preloads: [() => import('#start/routes'), () => import('#start/kernel')],

  metaFiles: [
    {
      pattern: 'public/**',
      reloadServer: false,
    },
    {
      pattern: 'resources/views/**/*.edge',
      reloadServer: false,
    },
  ],

  assetsBundler: false,
})
