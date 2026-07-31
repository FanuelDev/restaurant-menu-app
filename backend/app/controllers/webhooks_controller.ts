import type { HttpContext } from '@adonisjs/core/http'
import FedaPayService, { type FedaPayWebhookEvent } from '#services/fedapay_service'
import SubscriptionService from '#services/subscription_service'

export default class WebhooksController {
  readonly #fedapay = new FedaPayService()
  readonly #subscriptionService = new SubscriptionService()

  /**
   * POST /webhooks/fedapay
   * FedaPay envoie une notification POST à cette URL après un événement de paiement.
   * On valide la signature HMAC puis on active l'abonnement si le paiement est approuvé.
   */
  async fedapay({ request, response }: HttpContext) {
    const rawBody = request.raw() ?? ''
    const signature = request.header('FedaPay-Signature') ?? ''

    if (!this.#fedapay.validateWebhookSignature(rawBody, signature)) {
      return response.unauthorized({ message: 'Signature invalide.' })
    }

    const event = request.body() as FedaPayWebhookEvent

    // On traite uniquement les événements de transaction approuvée
    if (event.name === 'transaction.approved' || event.name === 'transaction.transferred') {
      const tx = event.entity as { id?: number | string; status?: string }
      const fedapayTransactionId = String(tx.id ?? '')

      if (fedapayTransactionId) {
        // Re-vérifier via l'API FedaPay pour éviter les faux webhooks
        const { status, raw } = await this.#fedapay.verifyPayment(fedapayTransactionId)
        if (status === 'ACCEPTED') {
          await this.#subscriptionService.activateSubscription(fedapayTransactionId, raw)
        }
      }
    }

    // FedaPay attend un 200
    return response.ok({ message: 'OK' })
  }
}
