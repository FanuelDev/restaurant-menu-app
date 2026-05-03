import type { HttpContext } from '@adonisjs/core/http'
import CinetPayService from '#services/cinetpay_service'
import SubscriptionService from '#services/subscription_service'

export default class WebhooksController {
  readonly #cinetpay = new CinetPayService()
  readonly #subscriptionService = new SubscriptionService()

  /**
   * POST /webhooks/cinetpay
   * CinetPay envoie une notification POST à cette URL après un paiement.
   * On re-vérifie via l'API CinetPay (ne pas faire confiance au payload seul).
   */
  async cinetpay({ request, response }: HttpContext) {
    const payload = request.body()

    // Vérification basique du site_id
    if (!this.#cinetpay.validateWebhookSignature(payload)) {
      return response.unauthorized({ message: 'Signature invalide.' })
    }

    const transactionId = payload.cpm_trans_id as string
    if (!transactionId) {
      return response.badRequest({ message: 'transaction_id manquant.' })
    }

    // Re-vérifier le statut via l'API CinetPay
    const { status, raw } = await this.#cinetpay.verifyPayment(transactionId)

    if (status === 'ACCEPTED') {
      await this.#subscriptionService.activateSubscription(transactionId, raw)
    }

    // CinetPay attend toujours un 200 en réponse
    return response.ok({ message: 'OK', status })
  }
}
