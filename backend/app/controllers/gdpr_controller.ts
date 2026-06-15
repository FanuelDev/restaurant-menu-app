import type { HttpContext } from '@adonisjs/core/http'
import vine from '@vinejs/vine'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'
import GdprDeletionRequest from '#models/gdpr_deletion_request'
import mailService from '#services/mail_service'

const deleteApiValidator = vine.compile(
  vine.object({ email: vine.string().trim().email() })
)

const deleteFormValidator = vine.compile(
  vine.object({ email: vine.string().trim().email() })
)

const saUpdateValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'processed', 'rejected']),
    adminNotes: vine.string().trim().optional(),
  })
)

// ─── HTML page branding ────────────────────────────────────────────────────────

const BRAND = '#C0392B'

function renderForm(opts: { error?: string; success?: boolean } = {}): string {
  if (opts.success) {
    return page(`
      <div class="card">
        <div class="icon-wrap success">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1>Demande enregistrée</h1>
        <p>Votre demande de suppression a bien été prise en compte.<br>
        Vos données ont été anonymisées immédiatement.<br>
        Un email de confirmation vous a été envoyé.</p>
        <a href="https://saemenus.com" class="btn-secondary">Retour à SaeMenus</a>
      </div>`)
  }

  return page(`
    <div class="card">
      <div class="icon-wrap">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      </div>
      <h1>Suppression de vos données</h1>
      <p>Conformément au RGPD, vous pouvez demander la suppression de vos données personnelles
         (nom, email, téléphone) associées à vos commandes et réservations sur SaeMenus.</p>

      ${opts.error ? `<div class="alert">${opts.error}</div>` : ''}

      <form method="POST" action="/privacy/delete-request">
        <label for="email">Votre adresse email</label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="vous@exemple.com"
          required
          autocomplete="email"
        />
        <button type="submit">Supprimer mes données</button>
      </form>

      <div class="info">
        <strong>Ce qui sera supprimé :</strong> votre nom, email et numéro de téléphone
        associés à vos commandes et réservations.<br><br>
        <strong>Ce qui sera conservé :</strong> les données anonymisées nécessaires
        à la comptabilité des restaurants (montants, dates).<br><br>
        <a href="https://saemenus.com/privacy" target="_blank">Consulter notre politique de confidentialité →</a>
      </div>
    </div>`)
}

function page(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Suppression de données — SaeMenus</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f4f1;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #1a1a1a;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 520px;
      width: 100%;
      box-shadow: 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
    }
    .icon-wrap {
      width: 56px; height: 56px;
      background: ${BRAND};
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 24px;
    }
    .icon-wrap.success { background: #16a34a; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -.02em; }
    p  { font-size: .95rem; color: #555; line-height: 1.65; margin-bottom: 28px; }
    label { display: block; font-size: .8rem; font-weight: 700; text-transform: uppercase;
            letter-spacing: .06em; color: #888; margin-bottom: 8px; }
    input[type="email"] {
      width: 100%; padding: 13px 16px;
      border: 1.5px solid #e5e5e5; border-radius: 12px;
      font-size: .95rem; color: #1a1a1a; background: #fafaf8;
      transition: border-color .15s, box-shadow .15s;
      outline: none; margin-bottom: 16px;
    }
    input[type="email"]:focus { border-color: ${BRAND}; box-shadow: 0 0 0 3px rgba(192,57,43,.12); }
    button[type="submit"] {
      width: 100%; padding: 14px;
      background: ${BRAND}; color: white;
      border: none; border-radius: 12px;
      font-size: .95rem; font-weight: 700; cursor: pointer;
      transition: opacity .15s, transform .1s;
    }
    button[type="submit"]:hover { opacity: .9; }
    button[type="submit"]:active { transform: scale(.98); }
    .alert {
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px;
      padding: 12px 16px; color: #b91c1c; font-size: .875rem; margin-bottom: 20px;
    }
    .info {
      margin-top: 24px; padding: 18px;
      background: #f8f8f6; border-radius: 12px;
      font-size: .82rem; color: #666; line-height: 1.65;
    }
    .info a { color: ${BRAND}; text-decoration: none; }
    .info a:hover { text-decoration: underline; }
    .btn-secondary {
      display: inline-block; margin-top: 8px; padding: 10px 24px;
      border: 1.5px solid #e5e5e5; border-radius: 10px;
      font-size: .875rem; font-weight: 600; color: #555;
      text-decoration: none; transition: border-color .15s;
    }
    .btn-secondary:hover { border-color: #aaa; }
  </style>
</head>
<body>${content}</body>
</html>`
}

// ─── Controller ────────────────────────────────────────────────────────────────

export default class GdprController {
  /** GET /privacy/delete-request — Formulaire public */
  async showForm({ response }: HttpContext) {
    return response.header('Content-Type', 'text/html').send(renderForm())
  }

  /** POST /privacy/delete-request — Traitement formulaire */
  async handleForm({ request, response }: HttpContext) {
    let email: string
    try {
      const data = await request.validateUsing(deleteFormValidator)
      email = data.email
    } catch {
      return response.header('Content-Type', 'text/html').send(
        renderForm({ error: 'Adresse email invalide. Veuillez vérifier et réessayer.' })
      )
    }

    const ip = request.ip()

    // Enregistrer la demande
    const gdprReq = await GdprDeletionRequest.create({
      email,
      ipAddress: ip,
      status: 'pending',
    })

    // Anonymiser immédiatement les données dans orders + reservations
    let deletedOrders = 0
    let deletedReservations = 0

    await db.transaction(async (trx) => {
      deletedOrders = await trx
        .from('orders')
        .whereILike('customer_email', email)
        .update({ customer_name: '[supprimé]', customer_phone: null, customer_email: null })

      deletedReservations = await trx
        .from('reservations')
        .whereILike('customer_email', email)
        .update({ customer_name: '[supprimé]', customer_phone: null, customer_email: null })
    })

    // Marquer comme traité
    gdprReq.status = 'processed'
    gdprReq.processedAt = DateTime.now()
    gdprReq.adminNotes = `Traitement automatique : ${deletedOrders} commande(s), ${deletedReservations} réservation(s) anonymisée(s).`
    await gdprReq.save()

    // Emails en arrière-plan
    mailService.sendGdprConfirmation(email, deletedOrders + deletedReservations).catch((err) =>
      console.error('[GDPR] Erreur email confirmation:', err)
    )
    mailService.sendGdprAdminNotification(email, ip, deletedOrders, deletedReservations).catch((err) =>
      console.error('[GDPR] Erreur email admin:', err)
    )

    return response.header('Content-Type', 'text/html').send(renderForm({ success: true }))
  }

  /** DELETE /api/public/user-data — Suppression via API mobile */
  async deleteUserData({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(deleteApiValidator)
    const ip = request.ip()

    const gdprReq = await GdprDeletionRequest.create({ email, ipAddress: ip, status: 'pending' })

    let deletedOrders = 0
    let deletedReservations = 0

    await db.transaction(async (trx) => {
      deletedOrders = await trx
        .from('orders')
        .whereILike('customer_email', email)
        .update({ customer_name: '[supprimé]', customer_phone: null, customer_email: null })

      deletedReservations = await trx
        .from('reservations')
        .whereILike('customer_email', email)
        .update({ customer_name: '[supprimé]', customer_phone: null, customer_email: null })
    })

    gdprReq.status = 'processed'
    gdprReq.processedAt = DateTime.now()
    gdprReq.adminNotes = `API mobile : ${deletedOrders} commande(s), ${deletedReservations} réservation(s) anonymisée(s).`
    await gdprReq.save()

    mailService.sendGdprConfirmation(email, deletedOrders + deletedReservations).catch((err) =>
      console.error('[GDPR] Erreur email confirmation:', err)
    )
    mailService.sendGdprAdminNotification(email, ip, deletedOrders, deletedReservations).catch((err) =>
      console.error('[GDPR] Erreur email admin:', err)
    )

    return response.noContent()
  }

  /** GET /api/super-admin/gdpr-requests — Liste pour le super admin */
  async index({ request, response }: HttpContext) {
    const page    = Number(request.input('page', 1))
    const perPage = Number(request.input('perPage', 30))
    const status  = request.input('status') as string | undefined

    const query = GdprDeletionRequest.query()
      .preload('processedBy', (q) => q.select(['id', 'full_name', 'email']))
      .orderBy('created_at', 'desc')

    if (status && ['pending', 'processed', 'rejected'].includes(status)) {
      query.where('status', status)
    }

    const result = await query.paginate(page, perPage)
    return response.ok(result)
  }

  /** PATCH /api/super-admin/gdpr-requests/:id — Mise à jour manuelle */
  async update({ params, request, response, auth }: HttpContext) {
    const gdprReq = await GdprDeletionRequest.findOrFail(params.id)
    const data    = await request.validateUsing(saUpdateValidator)
    const user    = auth.user!

    gdprReq.status = data.status
    if (data.adminNotes !== undefined) gdprReq.adminNotes = data.adminNotes
    if (data.status !== 'pending') {
      gdprReq.processedAt   = DateTime.now()
      gdprReq.processedById = user.id
    }

    await gdprReq.save()
    await gdprReq.load('processedBy')

    return response.ok(gdprReq)
  }
}
