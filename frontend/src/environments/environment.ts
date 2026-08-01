export const environment = {
  production: false,
  apiUrl: 'http://localhost:3333/api',
  fedapayPublicKey: 'pk_sandbox_REMPLACER_PAR_VOTRE_CLE_PUBLIQUE',
  fedapayEnvironment: 'sandbox' as 'sandbox' | 'live',
  /**
   * Base URL du menu public.
   * En dev : http://{slug}.localhost:4200/menu
   * En prod : https://{slug}.menuapp.com/menu
   * Le placeholder {slug} est remplacé dynamiquement par QrCodeService.
   */
  publicMenuBaseUrl: 'http://{slug}.localhost:4200/menu',
}
