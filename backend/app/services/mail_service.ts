import nodemailer from 'nodemailer'
import env from '#start/env'

class MailService {
  private get transporter() {
    return nodemailer.createTransport({
      host: env.get('SMTP_HOST') ?? 'smtp.gmail.com',
      port: env.get('SMTP_PORT') ?? 587,
      secure: (env.get('SMTP_SECURE') ?? 'false') === 'true',
      auth: {
        user: env.get('SMTP_USER') ?? '',
        pass: env.get('SMTP_PASS') ?? '',
      },
    })
  }

  private get fromAddress() {
    return env.get('SMTP_FROM') ?? 'noreply@saemenus.com'
  }

  /** Envoie le code de vérification à l'email du nouvel utilisateur */
  async sendVerificationCode(email: string, fullName: string, code: string): Promise<void> {
    const firstName = fullName.split(' ')[0]

    await this.transporter.sendMail({
      from: `"SaeMenus" <${this.fromAddress}>`,
      to: email,
      subject: `${code} — Vérification de votre compte SaeMenus`,
      html: `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vérification de compte</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#C0392B,#922B21);padding:32px 40px;text-align:center;">
            <div style="font-size:24px;font-weight:800;color:#fff;letter-spacing:-0.5px;">SaeMenus</div>
            <div style="font-size:13px;color:rgba(255,255,255,.7);margin-top:4px;">Plateforme de gestion de restaurant</div>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111;">Bonjour, ${firstName} 👋</p>
            <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6;">
              Merci de vous être inscrit sur SaeMenus. Pour activer votre compte, saisissez le code ci-dessous dans le formulaire d'inscription.
            </p>

            <!-- OTP Box -->
            <div style="background:#fef2f2;border:2px dashed #C0392B;border-radius:12px;padding:28px;text-align:center;margin-bottom:28px;">
              <div style="font-size:13px;color:#666;margin-bottom:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;">Votre code de vérification</div>
              <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#C0392B;font-family:monospace;">${code}</div>
              <div style="margin-top:12px;font-size:12px;color:#999;">Valide pendant <strong>15 minutes</strong></div>
            </div>

            <p style="margin:0 0 8px;font-size:14px;color:#666;line-height:1.6;">
              Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet email. Aucune action n'est requise.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px;background:#f9f9fb;border-top:1px solid #eee;">
            <p style="margin:0;font-size:12px;color:#999;text-align:center;">
              © ${new Date().getFullYear()} SaeMenus — Tous droits réservés<br/>
              Cet email est envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      text: `Bonjour ${firstName},\n\nVotre code de vérification SaeMenus : ${code}\n\nCe code est valide pendant 15 minutes.\n\nSi vous n'êtes pas à l'origine de cette inscription, ignorez cet email.`,
    })
  }
}

export const mailService = new MailService()
