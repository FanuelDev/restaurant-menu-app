import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 8000,
    requestTimeout: 10000,
    video: false,
    env: {
      apiUrl: 'http://localhost:3333/api',
      // Credentials (from seeder)
      superAdminEmail: 'superadmin@menuapp.com',
      superAdminPassword: 'SuperAdmin1234!',
      adminEmail: 'admin@demo.ci',
      adminPassword: 'Admin1234!',
      cashierEmail: 'caissier@demo.ci',
      cashierPassword: 'Caissier1234!',
      adminEmail2: 'admin@savana.ci',
      adminPassword2: 'Admin1234!',
      tenantSlug: 'demo',
      tenantSlug2: 'savana',
    },
    setupNodeEvents(on, config) {
      on('task', {
        log(message: string) {
          console.log(message)
          return null
        },
      })
      return config
    },
  },
})
