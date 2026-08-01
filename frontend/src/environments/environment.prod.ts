// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://backend.saemenus.com/api',
  publicMenuBaseUrl: 'https://{slug}.saemenus.com/menu',
  fedapayPublicKey: 'pk_live_REMPLACER_PAR_VOTRE_CLE_PUBLIQUE_LIVE',
  fedapayEnvironment: 'live' as 'sandbox' | 'live',
}
