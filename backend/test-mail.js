/**
 * Script de test d'envoi email — exécuter avec: node test-mail.js
 * Nécessite que SMTP_PASS soit correctement renseigné dans .env
 */
import 'dotenv/config'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
})

console.log('Config SMTP :')
console.log('  Host :', process.env.SMTP_HOST)
console.log('  Port :', process.env.SMTP_PORT)
console.log('  User :', process.env.SMTP_USER)
console.log('  Pass :', process.env.SMTP_PASS ? '****** (défini)' : '❌ NON DÉFINI')
console.log('')

try {
  console.log('Vérification connexion SMTP...')
  await transporter.verify()
  console.log('✅ Connexion SMTP OK\n')

  console.log('Envoi du mail test vers fanuelperse@gmail.com...')
  const info = await transporter.sendMail({
    from: `"SaeMenus Test" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to: 'fanuelperse@gmail.com',
    subject: '✅ Test mail SaeMenus — Configuration OK',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;">
        <h2 style="color:#C0392B;">Test d'envoi SaeMenus</h2>
        <p>Ce mail confirme que la configuration SMTP est fonctionnelle.</p>
        <ul>
          <li><strong>Serveur :</strong> ${process.env.SMTP_HOST}</li>
          <li><strong>Port :</strong> ${process.env.SMTP_PORT}</li>
          <li><strong>Expéditeur :</strong> ${process.env.SMTP_USER}</li>
          <li><strong>Environnement :</strong> ${process.env.NODE_ENV}</li>
          <li><strong>Date :</strong> ${new Date().toLocaleString('fr-FR')}</li>
        </ul>
        <p style="color:#888;font-size:13px;">SaeMenus — Plateforme de gestion de restaurant</p>
      </div>`,
    text: `Test SaeMenus — Configuration SMTP OK\n\nExpéditeur: ${process.env.SMTP_USER}\nDate: ${new Date().toLocaleString('fr-FR')}`,
  })

  console.log('✅ Mail envoyé avec succès !')
  console.log('   MessageId :', info.messageId)
  console.log('   Response  :', info.response)
} catch (err) {
  console.error('❌ Erreur :', err.message)
  if (err.code === 'EAUTH') {
    console.error('   → Authentification échouée : vérifiez SMTP_USER et SMTP_PASS dans .env')
  } else if (err.code === 'ECONNREFUSED') {
    console.error('   → Connexion refusée : vérifiez SMTP_HOST et SMTP_PORT')
  }
  process.exit(1)
}
