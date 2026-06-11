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
        <td style="padding:40px;">
          <p style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111;">Bienvenue sur SaeMenus, ${firstName} 🎉</p>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
            Votre restaurant <strong>${restaurantName}</strong> est maintenant actif.
            Votre menu digital est en ligne et vos clients peuvent le consulter dès maintenant.
          </p>

          <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:24px;margin-bottom:28px;">
            <div style="font-size:13px;font-weight:700;color:#166534;margin-bottom:16px;text-transform:uppercase;letter-spacing:.5px;">✅ Vos 3 premières actions</div>
            <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
              <div style="width:24px;height:24px;background:${BRAND_RED};border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:24px;">1</div>
              <div><strong style="color:#111;">Ajoutez votre logo</strong><br/><span style="font-size:13px;color:#666;">Personnalisez l'apparence de votre menu</span></div>
            </div>
            <div style="margin-bottom:12px;display:flex;align-items:flex-start;gap:12px;">
              <div style="width:24px;height:24px;background:${BRAND_RED};border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:24px;">2</div>
              <div><strong style="color:#111;">Créez vos catégories</strong><br/><span style="font-size:13px;color:#666;">Entrées, Plats, Desserts, Boissons…</span></div>
            </div>
            <div style="display:flex;align-items:flex-start;gap:12px;">
              <div style="width:24px;height:24px;background:${BRAND_RED};border-radius:50%;color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;text-align:center;line-height:24px;">3</div>
              <div><strong style="color:#111;">Partagez votre QR code</strong><br/><span style="font-size:13px;color:#666;">Imprimez-le et placez-le sur vos tables</span></div>
            </div>
          </div>

          <div style="text-align:center;margin-bottom:24px;">
            <a href="${frontendUrl}/admin/dashboard"
               style="display:inline-block;background:${BRAND_RED};color:#fff;font-size:15px;font-weight:700;
                      text-decoration:none;padding:14px 32px;border-radius:8px;margin-bottom:12px;display:block;">
              Accéder à mon espace admin →
            </a>
            <a href="${menuUrl}"
               style="display:inline-block;font-size:13px;color:${BRAND_RED};font-weight:600;text-decoration:none;margin-top:8px;">
              Voir mon menu en ligne ↗
            </a>
          </div>

          <p style="margin:0;font-size:13px;color:#888;line-height:1.6;text-align:center;">
            Votre essai gratuit de <strong>14 jours</strong> est maintenant actif.
            Profitez de toutes les fonctionnalités sans engagement.
          </p>
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
