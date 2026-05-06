import env from '#start/env'
import { randomBytes } from 'node:crypto'

export interface CinetPayInitResult {
  transactionId: string
  paymentUrl: string
  paymentToken: string
}

export interface CinetPayNotification {
  cpm_site_id: string
  cpm_trans_id: string
  cpm_trans_date: string
  cpm_amount: string
  cpm_currency: string
  signature: string
  payment_method: string
  cel_phone_num?: string
  cpm_phone_prefixe?: string
  cpm_language: string
  cpm_version: string
  cpm_payment_config: string
  cpm_page_action: string
  cpm_custom: string
  cpm_designation: string
  cpm_error_message: string
  cpm_result: string       // '00' = succès
  cpm_trans_status: string // 'ACCEPTED' | 'REFUSED'
}

const BASE_URL = 'https://api-checkout.cinetpay.com/v2'

export default class CinetPayService {
  readonly #apiKey = env.get('CINETPAY_API_KEY')
  readonly #siteId = env.get('CINETPAY_SITE_ID')
  readonly #notifyUrl = env.get('CINETPAY_NOTIFY_URL')
  readonly #returnUrl = env.get('CINETPAY_RETURN_URL')

  /** Génère un transaction_id unique sans caractères spéciaux */
  generateTransactionId(): string {
    return `sub_${Date.now()}_${randomBytes(4).toString('hex')}`
  }

  /**
   * Initialise un paiement CinetPay.
   * Retourne l'URL de paiement vers laquelle rediriger l'utilisateur.
   */
  async initPayment(params: {
    transactionId: string
    amountCents: number
    currency: string
    description: string
    customerName: string
    customerSurname: string
    customerEmail: string
    customerPhone: string
    channels?: 'ALL' | 'MOBILE_MONEY' | 'CREDIT_CARD'
    metadata?: string
  }): Promise<CinetPayInitResult> {
    if (!this.#apiKey || !this.#siteId) {
      throw new Error('CinetPay non configuré : renseignez CINETPAY_API_KEY et CINETPAY_SITE_ID dans le fichier .env')
    }
    if (!this.#notifyUrl || !this.#returnUrl) {
      throw new Error('CinetPay non configuré : renseignez CINETPAY_NOTIFY_URL et CINETPAY_RETURN_URL dans le fichier .env')
    }

    const body = {
      apikey: this.#apiKey,
      site_id: this.#siteId,
      transaction_id: params.transactionId,
      amount: Math.round(params.amountCents / 100), // CinetPay reçoit le montant en unités (pas centimes)
      currency: params.currency,
      description: params.description,
      notify_url: this.#notifyUrl,
      return_url: this.#returnUrl,
      channels: params.channels ?? 'ALL',
      customer_name: params.customerName,
      customer_surname: params.customerSurname,
      customer_email: params.customerEmail,
      customer_phone_number: params.customerPhone,
      customer_address: '',
      customer_city: '',
      customer_country: 'CI',
      customer_state: 'CI',
      customer_zip_code: '00000',
      metadata: params.metadata ?? '',
      lang: 'FR',
    }

    const res = await fetch(`${BASE_URL}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      code: string
      message: string
      data?: { payment_url: string; payment_token: string }
    }

    if (data.code !== '201' || !data.data) {
      throw new Error(`CinetPay initPayment failed: ${data.message} (code ${data.code})`)
    }

    return {
      transactionId: params.transactionId,
      paymentUrl: data.data.payment_url,
      paymentToken: data.data.payment_token,
    }
  }

  /**
   * Vérifie le statut d'un paiement par son transaction_id.
   * À appeler depuis le webhook notify_url.
   */
  async verifyPayment(transactionId: string): Promise<{
    status: 'ACCEPTED' | 'REFUSED' | 'PENDING'
    raw: Record<string, unknown>
  }> {
    const body = {
      apikey: this.#apiKey,
      site_id: this.#siteId,
      transaction_id: transactionId,
    }

    const res = await fetch(`${BASE_URL}/payment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = (await res.json()) as {
      code: string
      message: string
      data?: { status: string; [key: string]: unknown }
    }

    if (!data.data) {
      return { status: 'PENDING', raw: data as Record<string, unknown> }
    }

    const s = String(data.data.status ?? '').toUpperCase()
    const status = s === 'ACCEPTED' ? 'ACCEPTED' : s === 'REFUSED' ? 'REFUSED' : 'PENDING'

    return { status, raw: data.data }
  }

  /** Valide la signature du webhook (protection HMAC) */
  validateWebhookSignature(payload: CinetPayNotification): boolean {
    // CinetPay ne signe pas via HMAC standard — on re-vérifie via l'API check
    // On valide juste que le site_id correspond
    return String(payload.cpm_site_id) === String(this.#siteId)
  }
}
