// frontend/src/app/shared/utils/invoice-print.ts
// Génère et ouvre la fenêtre d'impression d'une facture SA

import type { SaInvoice } from '../models'

function fmtAmt(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency, minimumFractionDigits: 0,
    }).format(cents / 100)
  } catch {
    return `${(cents / 100).toLocaleString('fr-FR')} ${currency}`
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export interface InvoiceRestaurantInfo {
  name: string
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  country?: string
  currency?: string
}

export function printInvoice(invoice: SaInvoice, restaurant: InvoiceRestaurantInfo): void {
  const cycleLabel  = invoice.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'
  const durationLbl = invoice.billingCycle === 'yearly'
    ? `${invoice.durationMonths / 12} an${invoice.durationMonths / 12 > 1 ? 's' : ''}`
    : `${invoice.durationMonths} mois`

  const savings     = Math.max(0, invoice.originalPriceCents - invoice.amountPaidCents)
  const discountPct = invoice.originalPriceCents > 0
    ? Math.round((savings / invoice.originalPriceCents) * 100)
    : 0

  const amountHtml  = invoice.amountPaidCents === 0
    ? '<span style="color:#16a34a;font-weight:800;font-size:15px">GRATUIT</span>'
    : `<strong>${fmtAmt(invoice.amountPaidCents, invoice.currency)}</strong>`

  const granterName = invoice.granter?.fullName || invoice.granter?.email || '—'

  // ── Adresse restaurant
  const restLines = [
    `<div style="font-weight:700;font-size:15px;color:#111;margin-bottom:6px">${restaurant.name}</div>`,
    restaurant.address ? `<div>${restaurant.address}</div>` : '',
    restaurant.country  ? `<div>${restaurant.country}</div>` : '',
    restaurant.phone    ? `<div>📞 ${restaurant.phone}</div>` : '',
    restaurant.email    ? `<div>✉ ${restaurant.email}</div>` : '',
    restaurant.website  ? `<div>🌐 ${restaurant.website}</div>` : '',
  ].filter(Boolean).join('\n')

  // ── Lignes du tableau
  const mainRow = `
    <tr>
      <td style="padding:16px 20px;vertical-align:top;border-bottom:1px solid #f0f0f0">
        <div style="font-weight:700;color:#111;font-size:14px">${invoice.planName} — ${cycleLabel}</div>
        <div style="font-size:12px;color:#888;margin-top:4px">Durée : ${durationLbl}</div>
        ${invoice.notes ? `<div style="font-size:12px;color:#f59e0b;margin-top:4px;font-style:italic">📝 ${invoice.notes}</div>` : ''}
      </td>
      <td style="padding:16px 20px;text-align:center;vertical-align:top;border-bottom:1px solid #f0f0f0;color:#555;font-size:13px">
        <div>${fmtDateShort(invoice.periodStart)}</div>
        <div style="margin:4px 0;color:#ccc">↓</div>
        <div>${fmtDateShort(invoice.periodEnd)}</div>
      </td>
      <td style="padding:16px 20px;text-align:right;vertical-align:top;border-bottom:1px solid #f0f0f0">
        ${amountHtml}
        ${invoice.originalPriceCents > 0 && savings > 0
          ? `<div style="color:#aaa;text-decoration:line-through;font-size:12px;margin-top:4px">${fmtAmt(invoice.originalPriceCents, invoice.currency)}</div>`
          : ''}
      </td>
    </tr>`

  const discountRow = savings > 0 ? `
    <tr style="background:#f0fdf4">
      <td colspan="2" style="padding:10px 20px;font-size:13px;color:#16a34a">
        🎉 Réduction appliquée${discountPct > 0 ? ` (−${discountPct}%)` : ''}
      </td>
      <td style="padding:10px 20px;text-align:right;font-size:13px;color:#16a34a;font-weight:700">
        −${fmtAmt(savings, invoice.currency)}
      </td>
    </tr>` : ''

  const totalFooter = invoice.amountPaidCents === 0
    ? '<div style="color:#16a34a;font-size:13px;margin-top:6px">✓ Abonnement offert gratuitement</div>'
    : savings > 0
      ? `<div style="color:#16a34a;font-size:13px;margin-top:6px">✓ Économie de ${fmtAmt(savings, invoice.currency)}</div>`
      : ''

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Inter, -apple-system, 'Helvetica Neue', sans-serif; background: white; color: #1a1a1a; font-size: 13px; }
    @page { margin: 12mm; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
<div style="max-width:740px;margin:0 auto;padding:40px 40px 60px">

  <!-- ═══ EN-TÊTE ══════════════════════════════════════════════════════ -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px">

    <!-- Émetteur (plateforme) -->
    <div>
      <div style="font-size:22px;font-weight:900;color:#111;letter-spacing:-.02em;line-height:1">MenuDigital</div>
      <div style="font-size:11px;color:#888;margin-top:4px;letter-spacing:.04em;text-transform:uppercase">Plateforme SaaS de menus digitaux</div>
      <div style="margin-top:12px;font-size:12px;color:#555;line-height:1.7">
        <div>support@menudigital.app</div>
      </div>
    </div>

    <!-- Titre facture -->
    <div style="text-align:right">
      <div style="font-size:32px;font-weight:900;color:#111;letter-spacing:-.03em">FACTURE</div>
      <div style="font-size:13px;color:#888;margin-top:6px;font-family:monospace">${invoice.invoiceNumber}</div>
      <div style="font-size:12px;color:#aaa;margin-top:4px">Émise le ${fmtDate(invoice.createdAt)}</div>
    </div>
  </div>

  <div style="height:3px;background:linear-gradient(90deg,#111 0%,#555 100%);border-radius:2px;margin-bottom:32px"></div>

  <!-- ═══ BLOC INFOS (2 colonnes) ══════════════════════════════════════ -->
  <div style="display:flex;gap:24px;margin-bottom:36px">

    <!-- Facturé à -->
    <div style="flex:1;background:#f8f8f8;border-radius:12px;padding:20px">
      <div style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:12px">Facturé à</div>
      <div style="line-height:1.8;color:#333;font-size:13px">
        ${restLines}
      </div>
    </div>

    <!-- Détails de la transaction -->
    <div style="flex:1;background:#f8f8f8;border-radius:12px;padding:20px">
      <div style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#888;margin-bottom:12px">Détails de la transaction</div>
      <table style="width:100%;font-size:12px;border-collapse:collapse">
        <tr>
          <td style="color:#888;padding:3px 0;white-space:nowrap">N° Facture</td>
          <td style="text-align:right;font-weight:700;font-family:monospace">${invoice.invoiceNumber}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:3px 0">Date d'émission</td>
          <td style="text-align:right">${fmtDateShort(invoice.createdAt)}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:3px 0">Début de période</td>
          <td style="text-align:right">${fmtDateShort(invoice.periodStart)}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:3px 0">Fin de période</td>
          <td style="text-align:right">${fmtDateShort(invoice.periodEnd)}</td>
        </tr>
        <tr>
          <td style="color:#888;padding:3px 0">Devise</td>
          <td style="text-align:right">${invoice.currency}</td>
        </tr>
        ${invoice.granter ? `
        <tr>
          <td style="color:#888;padding:3px 0">Autorisé par</td>
          <td style="text-align:right;color:#555">${granterName}</td>
        </tr>` : ''}
        ${invoice.subscriptionId ? `
        <tr>
          <td style="color:#888;padding:3px 0">Réf. abonnement</td>
          <td style="text-align:right;font-family:monospace;font-size:11px">#${invoice.subscriptionId}</td>
        </tr>` : ''}
      </table>
    </div>
  </div>

  <!-- ═══ TABLEAU DES PRESTATIONS ══════════════════════════════════════ -->
  <table style="width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #f0f0f0">
    <thead>
      <tr style="background:#111;color:white">
        <th style="text-align:left;padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Description</th>
        <th style="text-align:center;padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:180px">Période</th>
        <th style="text-align:right;padding:14px 20px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;width:160px">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${mainRow}
      ${discountRow}
    </tbody>
  </table>

  <!-- ═══ TOTAL ═════════════════════════════════════════════════════════ -->
  <div style="margin-top:24px;display:flex;justify-content:flex-end">
    <div style="background:#f8f8f8;border-radius:12px;padding:20px 28px;text-align:right;min-width:260px">
      ${savings > 0 ? `
      <div style="display:flex;justify-content:space-between;gap:48px;font-size:13px;color:#888;margin-bottom:8px">
        <span>Sous-total</span>
        <span style="text-decoration:line-through">${fmtAmt(invoice.originalPriceCents, invoice.currency)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:48px;font-size:13px;color:#16a34a;margin-bottom:12px">
        <span>Réduction</span>
        <span>−${fmtAmt(savings, invoice.currency)}</span>
      </div>
      <div style="height:1px;background:#e0e0e0;margin-bottom:12px"></div>` : ''}
      <div style="display:flex;justify-content:space-between;gap:48px;align-items:baseline">
        <span style="font-size:14px;font-weight:700;color:#111;text-transform:uppercase;letter-spacing:.04em">Total</span>
        <span style="font-size:24px;font-weight:900;color:${invoice.amountPaidCents === 0 ? '#16a34a' : '#111'}">
          ${invoice.amountPaidCents === 0 ? 'GRATUIT' : fmtAmt(invoice.amountPaidCents, invoice.currency)}
        </span>
      </div>
      ${totalFooter}
    </div>
  </div>

  <!-- ═══ PIED DE PAGE ══════════════════════════════════════════════════ -->
  <div style="margin-top:48px;padding-top:24px;border-top:2px solid #f0f0f0;display:flex;justify-content:space-between;align-items:center">
    <div style="font-size:11px;color:#aaa;line-height:1.7">
      <div>Document généré automatiquement par MenuDigital.</div>
      <div>Ce document fait office de facture pour l'abonnement mentionné ci-dessus.</div>
    </div>
    <div style="font-size:11px;color:#ccc;font-family:monospace">${invoice.invoiceNumber}</div>
  </div>

</div>
<script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}
