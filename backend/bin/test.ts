import { configure, processCLIArgs, run } from '@japa/runner'
import app from '@adonisjs/core/services/app'

processCLIArgs(process.argv.splice(2))

configure({
  suites: [
    {
      name: 'unit',
      files: ['tests/unit/**/*.spec.ts'],
      timeout: 2000,
    },
    {
      name: 'functional',
      files: ['tests/functional/**/*.spec.ts'],
      timeout: 30000,
    },
  ],
  plugins: [],
  reporters: {
    activated: ['spec'],
  },
  importer: (filePath) => import(filePath),
})

run()
