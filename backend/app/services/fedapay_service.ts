import env from '#start/env'
import { createHmac } from 'node:crypto'
import { randomBytes } from 'node:crypto'

export interface FedaPayInitResult {
  transactionId: string       // FedaPay numeric ID as string
  paymentUrl: string
  paymentToken: string
}

export interface FedaPayWebhookEvent {
  name: string                // e.g. "transaction.approved"
  entity: Record<string, unknown>
}

type FedaPayStatus = 'approved' | 'declined' | 'canceled' | 'pending' | 'transferred'

const PROD_URL    = 'https://api.fedapay.com/v1'
const SANDBOX_URL = 'https://sandbox-api.fedapay.com/v1'

export default class FedaPayService {
  readonly #secretKey  = env.get('FEDAPAY_SECRET_KEY')
  readonly #webhookSecret = env.get('FEDAPAY_WEBHOOK_SECRET', '')
  readonly #callbackUrl = env.get('FEDAPAY_CALLBACK_URL')
  readonly #returnUrl   = env.get('FEDAPAY_RETURN_URL')
  readonly #sandbox     = env.get('FEDAPAY_SANDBOX', 'true') === 'true'

  get #baseUrl() {
    return this.#sandbox ? SANDBOX_URL : PROD_URL
  }

  get #headers() {
    return {
      'Authorization': `Bearer ${this.#secretKey}`,
      'Content-Type': 'application/json',
    }
  }

  /** Génère un référence interne unique */
  generateRef(): string {
    return `sub_fp_${Date.now()}_${randomBytes(4).toString('hex')}`
  }

  /**
   * Crée une transaction FedaPay et retourne l'URL de paiement Mobile Money.
   */
  async initPayment(params: {
    amountCents: number           // converti en XOF entier (divise par 100 si XOF = centimes)
    currency?: string             // défaut XOF
    description: string
    customerFirstname: string
    customerLastname: string
    customerEmail: string
    customerPhone?: string
    metadata?: Record<string, unknown>
  }): Promise<FedaPayInitResult> {
    if (!this.#secretKey) {
      throw new Error('FedaPay non configuré : renseignez FEDAPAY_SECRET_KEY dans le fichier .env')
    }
    if (!this.#callbackUrl) {
      throw new Error('FedaPay non configuré : renseignez FEDAPAY_CALLBACK_URL dans le fichier .env')
    }

    const currency = params.currency ?? 'XOF'
    // FedaPay travaille en unités entières (pas en centimes pour XOF)
    const amount = currency === 'XOF'
      ? Math.round(params.amountCents / 100)
      : Math.round(params.amountCents / 100)

    // 1. Créer la transaction
    const txBody: Record<string, unknown> = {
      description: params.description,
      amount,
      currency: { iso: currency },
      callback_url: this.#callbackUrl,
      customer: {
        email: params.customerEmail,
        firstname: params.customerFirstname,
        lastname:  params.customerLastname,
        ...(params.customerPhone ? { phone_number: { number: params.customerPhone, country: 'bj' } } : {}),
      },
    }
    if (params.metadata) {
      txBody['custom_metadata'] = params.metadata
    }

    const txRes = await fetch(`${this.#baseUrl}/transactions`, {
      method: 'POST',
      headers: this.#headers,
      body: JSON.stringify(txBody),
    })

    const txData = (await txRes.json()) as { 'v1/transaction'?: { id: number }; message?: string }

    if (!txRes.ok || !txData['v1/transaction']) {
      throw new Error(`FedaPay createTransaction failed: ${txData.message ?? txRes.statusText}`)
    }

    const fedapayId = txData['v1/transaction'].id

    // 2. Générer le token de paiement
    const tokenRes = await fetch(`${this.#baseUrl}/transactions/${fedapayId}/token`, {
      method: 'POST',
      headers: this.#headers,
    })

    const tokenData = (await tokenRes.json()) as { token?: string; url?: string; message?: string }

    if (!tokenRes.ok || !tokenData.token || !tokenData.url) {
      throw new Error(`FedaPay getToken failed: ${tokenData.message ?? tokenRes.statusText}`)
    }

    return {
      transactionId: String(fedapayId),
      paymentUrl: tokenData.url,
      paymentToken: tokenData.token,
    }
  }

  /**
   * Vérifie le statut d'une transaction FedaPay par son ID.
   */
  async verifyPayment(fedapayTransactionId: string): Promise<{
    status: 'ACCEPTED' | 'REFUSED' | 'PENDING'
    raw: Record<string, unknown>
  }> {
    const res = await fetch(`${this.#baseUrl}/transactions/${fedapayTransactionId}`, {
      headers: this.#headers,
    })

    const data = (await res.json()) as { 'v1/transaction'?: { status: FedaPayStatus; [key: string]: unknown } }
    const tx = data['v1/transaction']

    if (!tx) return { status: 'PENDING', raw: data as Record<string, unknown> }

    const statusMap: Record<FedaPayStatus, 'ACCEPTED' | 'REFUSED' | 'PENDING'> = {
      approved:    'ACCEPTED',
      transferred: 'ACCEPTED',
      declined:    'REFUSED',
      canceled:    'REFUSED',
      pending:     'PENDING',
    }

    const status = statusMap[tx.status] ?? 'PENDING'
    return { status, raw: tx as Record<string, unknown> }
  }

  /**
   * Valide la signature HMAC-SHA256 d'un webhook FedaPay.
   * FedaPay envoie l'en-tête `FedaPay-Signature: sha256=<hmac>`.
   */
  validateWebhookSignature(rawBody: string, signatureHeader: string): boolean {
    if (!this.#webhookSecret) return true // pas de secret configuré → accepter
    const expected = `sha256=${createHmac('sha256', this.#webhookSecret).update(rawBody).digest('hex')}`
    return expected === signatureHeader
  }
}
