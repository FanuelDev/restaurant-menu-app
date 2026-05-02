// backend/config/bodyparser.ts
import { defineConfig, multipart } from '@adonisjs/core/bodyparser'

const bodyParserConfig = defineConfig({
  allowedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],

  form: {
    convertEmptyStringsToNull: true,
    types: ['application/x-www-form-urlencoded'],
  },

  json: {
    convertEmptyStringsToNull: true,
    types: [
      'application/json',
      'application/json-patch+json',
      'application/vnd.api+json',
      'application/csp-report',
    ],
  },

  multipart: multipart({
    convertEmptyStringsToNull: true,
    // 10 Mo max (sera re-validé dans ImageUploadService)
    limit: '10mb',
    types: ['multipart/form-data'],
    processManually: [],
  }),
})

export default bodyParserConfig
