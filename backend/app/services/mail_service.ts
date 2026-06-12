import nodemailer from 'nodemailer'
import env from '#start/env'

const BRAND_RED = '#C0392B'
const BRAND_DARK = '#922B21'

class MailService {
  /** Transporter singleton — créé une seule fois, partagé par tous les envois */
  private readonly transporter = nodemailer.createTransport({
    host: env.get('SMTP_HOST') ?? 'smtp.hostinger.com',
    port: Number(env.get('SMTP_PORT') ?? 587),
    secure: (env.get('SMTP_SECURE') ?? 'false') === 'true',
    auth: {
      user: env.get('SMTP_USER') ?? '',
      pass: env.get('SMTP_PASS') ?? '',
    },
    tls: {
      // Accepter les certificats auto-signés en dev si besoin
      rejectUnauthorized: env.get('NODE_ENV') === 'production',
    },
  })

  private get from(): string {
    const addr = env.get('SMTP_FROM') ?? env.get('SMTP_USER') ?? 'sophie@saemenus.com'
    return `"SaeMenus" <${addr}>`
  }

  /** Vérifie la connexion SMTP au démarrage (appelée une fois) */
  async verify(): Promise<void> {
    await this.transporter.verify()
  }

  // ─── Templates partagés ──────────────────────────────────────────────────────

  private header() {
    return `
      <tr>
        <td style="background:linear-gradient(135deg,${BRAND_RED},${BRAND_DARK});padding:32px 40px;text-align:center;">
          <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">SaeMenus</div>
          <div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Plateforme de gestion de restaurant</div>
        </td>
      </tr>`
  }

  private footer() {
    return `
      <tr>
        <td style="padding:20px 40px;background:#f9f9fb;border-top:1px solid #eee;">
          <p style="margin:0;font-size:12px;color:#999;text-align:center;">
            © ${new Date().getFullYear()} SaeMenus · Tous droits réservés<br/>
            Cet email est envoyé automatiquement, merci de ne pas y répondre.
          </p>
        </td>
      </tr>`
  }

  private wrap(body: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        ${this.header()}
        ${body}
        ${this.footer()}
      </table>
    </td></tr>
  </table>
</body>
</html>`
  }

  // ─── Emails ──────────────────────────────────────────────────────────────────

  /** Code OTP de vérification de compte */
  async sendVerificationCode(email: string, fullName: string, code: string): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Bonjour, ${firstName} 👋</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Merci de vous être inscrit sur <strong>SaeMenus</strong>. Pour activer votre compte,
            saisissez le code ci-dessous dans le formulaire d'inscription.
          </p>

          <div style="background:#fef2f2;border:2px dashed ${BRAND_RED};border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
            <div style="font-size:13px;color:#666;margin-bottom:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">Votre code de vérification</div>
            <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:${BRAND_RED};font-family:monospace;">${code}</div>
            <div style="margin-top:12px;font-size:12px;color:#999;">Valide pendant <strong>15 minutes</strong></div>
          </div>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${env.get('FRONTEND_URL') ?? 'https://saemenus.com'}/register?email=${encodeURIComponent(email)}"
               style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
                      text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:.2px;">
              Entrer mon code de vérification →
            </a>
          </div>

          <p style="margin:0;font-size:14px;color:#666;line-height:1.6;">
            Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email.
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `${code} — Activez votre compte SaeMenus`,
      html,
      text: `Bonjour ${firstName},\n\nVotre code de vérification SaeMenus : ${code}\n\nValide 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez cet email.`,
    })
  }

  /** Email de bienvenue après activation du compte */
  async sendWelcome(email: string, fullName: string, restaurantName: string, menuUrl: string): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]
    const frontendUrl = env.get('FRONTEND_URL') ?? 'https://saemenus.com'

    const html = this.wrap(`
      <tr>
        <td style="padding:0;">

          <!-- Hero banner -->
          <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%);padding:36px 40px 32px;text-align:center;">
            <div style="font-size:40px;margin-bottom:12px;">🎉</div>
            <p style="margin:0 0 6px;font-size:26px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
              Bienvenue, ${firstName} !
            </p>
            <p style="margin:0;font-size:14px;color:rgba(255,255,255,.65);font-weight:400;">
              Votre restaurant est prêt à accueillir vos clients
            </p>
          </div>

          <!-- Restaurant name pill -->
          <div style="text-align:center;margin-top:-16px;margin-bottom:0;padding:0 40px;">
            <span style="display:inline-block;background:#fff;border:2px solid #e5e7eb;border-radius:999px;
                         padding:8px 20px;font-size:14px;font-weight:700;color:#111;
                         box-shadow:0 2px 8px rgba(0,0,0,.08);">
              🍽️ ${restaurantName}
            </span>
          </div>

          <!-- Body -->
          <div style="padding:32px 40px 0;">
            <p style="margin:0 0 28px;font-size:15px;color:#444;line-height:1.7;text-align:center;">
              Votre menu digital est <strong style="color:#111;">en ligne</strong> et vos clients peuvent le consulter dès maintenant.
            </p>

            <!-- Steps -->
            <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:28px;">
              <div style="font-size:11px;font-weight:700;color:#6b7280;margin-bottom:18px;text-transform:uppercase;letter-spacing:1px;">
                3 étapes pour bien démarrer
              </div>

              <!-- Step 1 -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:14px;">
                <tr>
                  <td style="width:36px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:${BRAND_RED};border-radius:8px;
                                color:#fff;font-size:14px;font-weight:800;text-align:center;line-height:32px;">1</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Ajoutez votre logo</div>
                    <div style="font-size:12px;color:#6b7280;">Personnalisez l'apparence de votre menu</div>
                  </td>
                </tr>
              </table>

              <!-- Step 2 -->
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:14px;">
                <tr>
                  <td style="width:36px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:${BRAND_RED};border-radius:8px;
                                color:#fff;font-size:14px;font-weight:800;text-align:center;line-height:32px;">2</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Créez vos catégories</div>
                    <div style="font-size:12px;color:#6b7280;">Entrées, Plats, Desserts, Boissons…</div>
                  </td>
                </tr>
              </table>

              <!-- Step 3 -->
              <table cellpadding="0" cellspacing="0" style="width:100%;">
                <tr>
                  <td style="width:36px;vertical-align:top;">
                    <div style="width:32px;height:32px;background:${BRAND_RED};border-radius:8px;
                                color:#fff;font-size:14px;font-weight:800;text-align:center;line-height:32px;">3</div>
                  </td>
                  <td style="padding-left:12px;vertical-align:middle;">
                    <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px;">Partagez votre QR code</div>
                    <div style="font-size:12px;color:#6b7280;">Imprimez-le et placez-le sur vos tables</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- CTA principal -->
            <div style="text-align:center;margin-bottom:16px;">
              <a href="${frontendUrl}/admin/dashboard"
                 style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
                        text-decoration:none;padding:15px 36px;border-radius:10px;letter-spacing:.2px;
                        box-shadow:0 4px 14px rgba(192,57,43,.35);">
                Accéder à mon espace admin →
              </a>
            </div>

            <!-- CTA secondaire -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${menuUrl}"
                 style="font-size:13px;color:${BRAND_RED};font-weight:600;text-decoration:none;">
                Voir mon menu en ligne ↗
              </a>
            </div>

            <!-- Trial badge -->
            <div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border:1px solid #fed7aa;
                        border-radius:10px;padding:16px 20px;text-align:center;margin-bottom:32px;">
              <div style="font-size:13px;font-weight:600;color:#92400e;">
                ⏰ Essai gratuit de <strong>14 jours</strong> activé
              </div>
              <div style="font-size:12px;color:#b45309;margin-top:4px;">
                Toutes les fonctionnalités disponibles, sans engagement
              </div>
            </div>
          </div>

        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `🎉 Bienvenue sur SaeMenus — ${restaurantName} est en ligne !`,
      html,
      text: `Bienvenue ${firstName} !\n\nVotre restaurant ${restaurantName} est actif.\n\nConnectez-vous : ${frontendUrl}/admin/dashboard\nVotre menu : ${menuUrl}`,
    })
  }

  /** Rappel d'expiration du trial — J-7, J-3 ou J-0 */
  async sendTrialReminder(
    email: string,
    fullName: string,
    restaurantName: string,
    daysLeft: number,
    upgradeUrl: string
  ): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]
    const isUrgent = daysLeft <= 1
    const accentColor = isUrgent ? '#dc2626' : daysLeft <= 3 ? '#d97706' : '#2563eb'
    const emoji = isUrgent ? '🚨' : daysLeft <= 3 ? '⚠️' : '⏰'

    const subjectMap: Record<number, string> = {
      7: `⏰ Plus que 7 jours d'essai — ${restaurantName}`,
      3: `⚠️ Votre essai expire dans 3 jours — ne perdez pas vos données`,
      0: `🚨 Votre essai SaeMenus expire aujourd'hui`,
    }
    const subject = subjectMap[daysLeft] ?? `Votre essai SaeMenus expire bientôt`

    const urgencyMsg = isUrgent
      ? `Votre essai gratuit <strong>expire aujourd'hui</strong>. Sans abonnement, votre menu sera suspendu.`
      : daysLeft <= 3
        ? `Il ne vous reste plus que <strong>${daysLeft} jours</strong> avant la fin de votre essai.`
        : `Votre essai gratuit se termine dans <strong>${daysLeft} jours</strong>.`

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">${emoji} ${firstName}, agissez maintenant</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">${urgencyMsg}</p>

          <div style="background:${accentColor}10;border:2px solid ${accentColor}40;border-radius:12px;padding:24px;text-align:center;margin-bottom:28px;">
            <div style="font-size:48px;font-weight:900;color:${accentColor};line-height:1;">${isUrgent ? 'AUJOURD\'HUI' : `J-${daysLeft}`}</div>
            <div style="font-size:14px;color:#666;margin-top:8px;">Fin de votre essai gratuit pour <strong>${restaurantName}</strong></div>
          </div>

          <div style="background:#f9f9fb;border-radius:10px;padding:20px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:#333;margin-bottom:12px;">Ce que vous perdrez sans abonnement :</div>
            <div style="font-size:13px;color:#555;line-height:1.8;">
              ❌ Accès à votre menu digital<br/>
              ❌ QR code de vos tables<br/>
              ❌ Gestion des commandes et réservations<br/>
              ❌ Toutes vos données (catégories, plats, photos)
            </div>
          </div>

          <div style="text-align:center;margin-bottom:16px;">
            <a href="${upgradeUrl}"
               style="display:inline-block;background:${accentColor};color:#fff;font-size:16px;font-weight:800;
                      text-decoration:none;padding:16px 40px;border-radius:8px;letter-spacing:.2px;">
              Continuer avec SaeMenus →
            </a>
          </div>
          <p style="text-align:center;font-size:12px;color:#aaa;margin:0;">
            À partir de seulement quelques XOF/mois · Annulable à tout moment
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({ from: this.from, to: email, subject, html,
      text: `Bonjour ${firstName},\n\n${urgencyMsg.replace(/<[^>]+>/g, '')}\n\nPassez à Pro : ${upgradeUrl}` })
  }

  /** Confirmation d'activation d'abonnement après paiement */
  async sendSubscriptionActivated(
    email: string,
    fullName: string,
    restaurantName: string,
    planName: string,
    periodEnd: string,
    invoiceNumber: string
  ): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]
    const frontendUrl = env.get('FRONTEND_URL') ?? 'https://saemenus.com'

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">Abonnement activé, ${firstName} ✅</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Votre paiement a été confirmé. Le plan <strong>${planName}</strong> est maintenant actif
            pour <strong>${restaurantName}</strong>.
          </p>

          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">Plan</td>
                <td style="font-size:13px;font-weight:700;color:#111;text-align:right;">${planName}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">Restaurant</td>
                <td style="font-size:13px;font-weight:700;color:#111;text-align:right;">${restaurantName}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">Valable jusqu'au</td>
                <td style="font-size:13px;font-weight:700;color:#111;text-align:right;">${periodEnd}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">N° facture</td>
                <td style="font-size:13px;font-weight:600;color:#166534;text-align:right;">${invoiceNumber}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;margin-bottom:16px;">
            <a href="${frontendUrl}/admin/invoices"
               style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
                      text-decoration:none;padding:13px 28px;border-radius:8px;">
              Télécharger ma facture →
            </a>
          </div>
          <p style="text-align:center;font-size:13px;color:#888;margin:0;">
            Merci pour votre confiance. Bonne gestion de menu !
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `✅ Abonnement ${planName} activé — ${restaurantName}`,
      html,
      text: `Bonjour ${firstName},\n\nVotre abonnement ${planName} est actif pour ${restaurantName}.\nFacture : ${invoiceNumber}\nValable jusqu'au : ${periodEnd}\n\nGérer mon compte : ${frontendUrl}/admin/invoices`,
    })
  }

  /** Notification de suspension d'abonnement */
  async sendSubscriptionSuspended(
    email: string,
    fullName: string,
    restaurantName: string,
    upgradeUrl: string
  ): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">⛔ Compte suspendu, ${firstName}</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            L'accès au menu digital de <strong>${restaurantName}</strong> a été <strong style="color:#dc2626;">suspendu</strong>
            car votre période d'abonnement est arrivée à expiration.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:#991b1b;margin-bottom:12px;">Ce qui est actuellement suspendu :</div>
            <div style="font-size:13px;color:#555;line-height:1.8;">
              🔒 Menu digital inaccessible aux clients<br/>
              🔒 Gestion des commandes et réservations<br/>
              🔒 QR codes désactivés<br/>
              🔒 Toutes les données conservées et récupérables
            </div>
          </div>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${upgradeUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-size:16px;font-weight:800;
               text-decoration:none;padding:16px 40px;border-radius:8px;">
              Réactiver mon abonnement →
            </a>
          </div>
          <p style="text-align:center;font-size:12px;color:#aaa;margin:0;">
            Vos données sont conservées pendant 30 jours après la suspension.
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `⛔ Compte suspendu — ${restaurantName}`,
      html,
      text: `Bonjour ${firstName},\n\nLe compte de ${restaurantName} a été suspendu.\nRéactivez votre abonnement : ${upgradeUrl}`,
    })
  }

  /** Email de nudge upsell — restaurant Free qui approche de sa limite */
  async sendUpsellNudge(
    email: string,
    fullName: string,
    restaurantName: string,
    resource: string,
    current: number,
    max: number,
    upgradeUrl: string
  ): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]
    const pct = Math.round((current / max) * 100)

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">📈 ${firstName}, vous atteignez vos limites</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Le restaurant <strong>${restaurantName}</strong> approche de la limite du plan gratuit pour <strong>${resource}</strong>.
          </p>
          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="font-size:13px;color:#92400e;margin-bottom:12px;font-weight:700;">${resource}</div>
            <div style="background:#e5e7eb;border-radius:999px;height:10px;overflow:hidden;margin-bottom:8px;">
              <div style="background:#f59e0b;height:100%;width:${pct}%;border-radius:999px;"></div>
            </div>
            <div style="font-size:13px;color:#555;">${current} / ${max} utilisés (${pct}%)</div>
          </div>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${upgradeUrl}" style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
               text-decoration:none;padding:14px 36px;border-radius:8px;box-shadow:0 4px 14px rgba(192,57,43,.35);">
              Passer au plan Pro →
            </a>
          </div>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `📈 ${pct}% de votre limite atteinte — ${restaurantName}`,
      html,
      text: `Bonjour ${firstName},\n\n${restaurantName} a utilisé ${current}/${max} (${pct}%) pour ${resource}.\nPassez au Pro : ${upgradeUrl}`,
    })
  }

  /** Rappel de réservation envoyé au client 24h avant */
  async sendReservationReminder(
    email: string,
    customerName: string,
    restaurantName: string,
    reservedDate: string,
    reservedTime: string,
    guestsCount: number,
    restaurantPhone: string | null
  ): Promise<void> {
    const firstName = customerName.split(' ')[0]

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">📅 Rappel de votre réservation</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Bonjour <strong>${firstName}</strong>, votre réservation chez <strong>${restaurantName}</strong> est confirmée pour demain !
          </p>
          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">📅 Date</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${reservedDate}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">⏰ Heure</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${reservedTime}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">👥 Couverts</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${guestsCount} personne${guestsCount > 1 ? 's' : ''}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">🍽️ Restaurant</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${restaurantName}</td>
              </tr>
              ${restaurantPhone ? `<tr><td style="font-size:13px;color:#555;padding:6px 0;">📞 Contact</td><td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${restaurantPhone}</td></tr>` : ''}
            </table>
          </div>
          <p style="text-align:center;font-size:13px;color:#666;margin:0;">
            Pour annuler ou modifier, contactez directement le restaurant.
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `📅 Rappel — Votre réservation demain chez ${restaurantName}`,
      html,
      text: `Bonjour ${firstName},\n\nRappel de votre réservation chez ${restaurantName}.\nDate : ${reservedDate} à ${reservedTime}\nCouverts : ${guestsCount}`,
    })
  }

  /** Alerte admin : réservation en attente non traitée */
  async sendAdminPendingReservationAlert(
    email: string,
    adminName: string,
    restaurantName: string,
    pendingCount: number,
    reservationsUrl: string
  ): Promise<void> {
    const firstName = (adminName || email).split(' ')[0]

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">⚠️ ${pendingCount} réservation${pendingCount > 1 ? 's' : ''} en attente</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Bonjour <strong>${firstName}</strong>, le restaurant <strong>${restaurantName}</strong> a
            <strong style="color:#d97706;">${pendingCount} réservation${pendingCount > 1 ? 's' : ''}</strong>
            en attente de confirmation depuis plus de 30 minutes.
          </p>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${reservationsUrl}" style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
               text-decoration:none;padding:14px 36px;border-radius:8px;">
              Gérer les réservations →
            </a>
          </div>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `⚠️ ${pendingCount} réservation${pendingCount > 1 ? 's' : ''} en attente — ${restaurantName}`,
      html,
      text: `Bonjour ${firstName},\n\n${pendingCount} réservation(s) en attente pour ${restaurantName}.\nGérer : ${reservationsUrl}`,
    })
  }

  /** Rapport hebdomadaire de revenus envoyé aux admins restaurant */
  async sendWeeklyRevenueReport(
    email: string,
    adminName: string,
    restaurantName: string,
    totalRevenue: number,
    ordersRevenue: number,
    manualRevenue: number,
    totalExpenses: number,
    netProfit: number,
    currency: string,
    periodLabel: string
  ): Promise<void> {
    const fmt = (n: number) => n.toLocaleString('fr-FR')
    const profitColor = netProfit >= 0 ? '#166534' : '#991b1b'
    const frontendUrl = env.get('FRONTEND_URL') ?? 'https://saemenus.com'

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111;">📊 Rapport hebdomadaire — ${(adminName || email).split(' ')[0]}</p>
          <p style="margin:0 0 28px;font-size:14px;color:#888;">${periodLabel} · ${restaurantName}</p>

          <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Revenus commandes</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #e5e7eb;">${fmt(ordersRevenue)} ${currency}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Revenus manuels</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #e5e7eb;">${fmt(manualRevenue)} ${currency}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Total revenus</td>
                <td style="font-size:14px;font-weight:700;color:#166534;text-align:right;border-bottom:1px solid #e5e7eb;">${fmt(totalRevenue)} ${currency}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Total dépenses</td>
                <td style="font-size:14px;font-weight:700;color:#991b1b;text-align:right;border-bottom:1px solid #e5e7eb;">−${fmt(totalExpenses)} ${currency}</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:700;color:#111;padding:10px 0;">Bénéfice net</td>
                <td style="font-size:16px;font-weight:800;color:${profitColor};text-align:right;">${netProfit >= 0 ? '+' : ''}${fmt(netProfit)} ${currency}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;margin-bottom:16px;">
            <a href="${frontendUrl}/admin/finance" style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:14px;font-weight:700;
               text-decoration:none;padding:12px 28px;border-radius:8px;">
              Voir le détail →
            </a>
          </div>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `📊 Rapport semaine — ${restaurantName} (${fmt(netProfit >= 0 ? netProfit : -netProfit)} ${currency} net)`,
      html,
      text: `Rapport hebdomadaire ${restaurantName}\n\nRevenus : ${fmt(totalRevenue)} ${currency}\nDépenses : ${fmt(totalExpenses)} ${currency}\nBénéfice net : ${fmt(netProfit)} ${currency}`,
    })
  }

  /** Rapport mensuel MRR envoyé au super-admin */
  async sendMonthlyMrrReport(
    email: string,
    mrrCents: number,
    mrrGrowthPct: number,
    newRestaurants: number,
    churnCount: number,
    activeCount: number,
    trialingCount: number,
    periodLabel: string
  ): Promise<void> {
    const mrrFormatted = (mrrCents / 100).toLocaleString('fr-FR')
    const growthColor = mrrGrowthPct >= 0 ? '#166534' : '#991b1b'
    const growthSign = mrrGrowthPct >= 0 ? '+' : ''
    const frontendUrl = env.get('FRONTEND_URL') ?? 'https://saemenus.com'

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:#111;">📈 Rapport mensuel SaeMenus</p>
          <p style="margin:0 0 28px;font-size:14px;color:#888;">${periodLabel}</p>

          <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">MRR</td>
                <td style="font-size:16px;font-weight:800;color:#111;text-align:right;border-bottom:1px solid #e5e7eb;">${mrrFormatted} XOF</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Croissance MRR</td>
                <td style="font-size:14px;font-weight:700;color:${growthColor};text-align:right;border-bottom:1px solid #e5e7eb;">${growthSign}${mrrGrowthPct}%</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Nouveaux restaurants</td>
                <td style="font-size:14px;font-weight:700;color:#166534;text-align:right;border-bottom:1px solid #e5e7eb;">+${newRestaurants}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Churn (suspendus/annulés)</td>
                <td style="font-size:14px;font-weight:700;color:#991b1b;text-align:right;border-bottom:1px solid #e5e7eb;">${churnCount}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;border-bottom:1px solid #e5e7eb;">Abonnés actifs</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;border-bottom:1px solid #e5e7eb;">${activeCount}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:8px 0;">En trial</td>
                <td style="font-size:14px;font-weight:700;color:#111;text-align:right;">${trialingCount}</td>
              </tr>
            </table>
          </div>

          <div style="text-align:center;margin-bottom:16px;">
            <a href="${frontendUrl}/super-admin/command-center" style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:14px;font-weight:700;
               text-decoration:none;padding:12px 28px;border-radius:8px;">
              Ouvrir le Command Center →
            </a>
          </div>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `📈 Rapport mensuel SaeMenus — ${periodLabel} (MRR: ${mrrFormatted} XOF)`,
      html,
      text: `Rapport mensuel SaeMenus\n\nMRR : ${mrrFormatted} XOF (${growthSign}${mrrGrowthPct}%)\nNouveaux : +${newRestaurants}\nActifs : ${activeCount}\nTrialing : ${trialingCount}`,
    })
  }

  /** Alerte super-admin : indicateurs critiques dépassent un seuil */
  async sendCommandCenterAlert(
    email: string,
    criticalCount: number,
    trialsExpiringToday: number,
    churnRiskCount: number,
    dashboardUrl: string
  ): Promise<void> {
    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#dc2626;">🚨 Alerte Command Center</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            SaeMenus détecte <strong style="color:#dc2626;">${criticalCount} alertes critiques</strong> nécessitant votre attention.
          </p>
          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:24px;margin-bottom:28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">⏰ Trials expirant aujourd'hui</td>
                <td style="font-size:14px;font-weight:700;color:#dc2626;text-align:right;">${trialsExpiringToday}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#555;padding:6px 0;">📉 Risque churn (>10j sans upgrade)</td>
                <td style="font-size:14px;font-weight:700;color:#dc2626;text-align:right;">${churnRiskCount}</td>
              </tr>
            </table>
          </div>
          <div style="text-align:center;margin-bottom:16px;">
            <a href="${dashboardUrl}" style="display:inline-block;background:#dc2626;color:#fff;font-size:15px;font-weight:700;
               text-decoration:none;padding:14px 36px;border-radius:8px;">
              Ouvrir le Command Center →
            </a>
          </div>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `🚨 ${criticalCount} alertes critiques — SaeMenus Command Center`,
      html,
      text: `Alerte SaeMenus : ${criticalCount} alertes critiques.\nTrials expirant auj. : ${trialsExpiringToday}\nRisque churn : ${churnRiskCount}\nDashboard : ${dashboardUrl}`,
    })
  }

  /** Lien de réinitialisation du mot de passe */
  async sendPasswordReset(email: string, fullName: string, resetUrl: string): Promise<void> {
    const firstName = (fullName || email).split(' ')[0]

    const html = this.wrap(`
      <tr>
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Bonjour, ${firstName} 👋</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe SaeMenus.
            Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
          </p>

          <div style="text-align:center;margin-bottom:28px;">
            <a href="${resetUrl}"
               style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
                      text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:.2px;">
              Réinitialiser mon mot de passe
            </a>
          </div>

          <p style="margin:0 0 8px;font-size:13px;color:#999;line-height:1.6;">
            Ce lien est valide pendant <strong>1 heure</strong>. S'il a expiré, faites une nouvelle demande.
          </p>
          <p style="margin:0;font-size:12px;color:#bbb;word-break:break-all;">
            Lien : ${resetUrl}
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 40px 32px;">
          <p style="margin:0;font-size:13px;color:#666;background:#f9f9fb;border-radius:8px;padding:12px 16px;border:1px solid #eee;">
            🔒 Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
            Votre mot de passe ne sera pas modifié.
          </p>
        </td>
      </tr>`)

    await this.transporter.sendMail({
      from: this.from,
      to: email,
      subject: `Réinitialisation de votre mot de passe SaeMenus`,
      html,
      text: `Bonjour ${firstName},\n\nRéinitialisez votre mot de passe : ${resetUrl}\n\nLien valide 1 heure.\n\nSi vous n'avez pas fait cette demande, ignorez cet email.`,
    })
  }
}

export const mailService = new MailService()
