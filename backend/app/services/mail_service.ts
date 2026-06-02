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
