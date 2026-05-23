import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RestaurantService } from '../../shared/services/restaurant.service'
import type { SaInvoice } from '../../shared/models'

@Component({
  selector: 'app-admin-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Factures</h1>
          <p class="page-subtitle">Historique de vos abonnements et paiements</p>
        </div>
      </div>

      @if (loading()) {
        <div class="skeleton-list">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton card-sk"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <h3 class="empty-title">Aucune facture</h3>
          <p class="empty-desc">Vos factures apparaîtront ici après l'activation d'un abonnement.</p>
        </div>
      } @else {
        <div class="invoices-list">
          @for (invoice of invoices(); track invoice.id) {
            <div class="invoice-card">
              <div class="invoice-header">
                <div class="invoice-left">
                  <div class="invoice-number">{{ invoice.invoiceNumber }}</div>
                  <div class="invoice-date">{{ invoice.createdAt | date:'dd MMMM yyyy' }}</div>
                </div>
                <div class="invoice-right">
                  <div class="invoice-amount">
                    @if (invoice.amountPaidCents === 0) {
                      <span class="amount-free">Gratuit</span>
                    } @else {
                      <span class="amount-value">{{ formatAmount(invoice.amountPaidCents, invoice.currency) }}</span>
                    }
                  </div>
                  <span class="status-chip" [class]="getStatusClass(invoice)">
                    {{ getStatusLabel(invoice) }}
                  </span>
                </div>
              </div>

              <div class="invoice-body">
                <div class="invoice-detail">
                  <span class="detail-label">Plan</span>
                  <span class="detail-val">
                    {{ invoice.planName }}
                    <span class="cycle-tag">{{ invoice.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel' }}</span>
                  </span>
                </div>
                <div class="invoice-detail">
                  <span class="detail-label">Période</span>
                  <span class="detail-val">
                    {{ invoice.periodStart | date:'dd/MM/yyyy' }} → {{ invoice.periodEnd | date:'dd/MM/yyyy' }}
                  </span>
                </div>
                @if (invoice.notes) {
                  <div class="invoice-detail">
                    <span class="detail-label">Note</span>
                    <span class="detail-val detail-note">{{ invoice.notes }}</span>
                  </div>
                }
                @if (getSavings(invoice) > 0) {
                  <div class="invoice-detail">
                    <span class="detail-label">Économie</span>
                    <span class="detail-val savings-val">
                      {{ formatAmount(getSavings(invoice), invoice.currency) }} de réduction
                      (prix normal : {{ formatAmount(invoice.originalPriceCents, invoice.currency) }})
                    </span>
                  </div>
                }
              </div>

              <div class="invoice-footer">
                <button class="btn-pdf" (click)="downloadInvoice(invoice)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Télécharger PDF
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 760px; }

    .page-header { margin-bottom: var(--space-6); }
    .page-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .page-subtitle { margin: 0; font-size: .875rem; color: var(--text-muted); }

    /* Skeleton */
    .skeleton { background: linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-xl); }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .skeleton-list { display: flex; flex-direction: column; gap: var(--space-4); }
    .card-sk { height: 140px; }

    /* Empty state */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-12) 0; color: var(--text-muted); text-align: center;
    }
    .empty-icon { color: var(--gray-300); }
    .empty-title { margin: 0; font-size: 1.125rem; font-weight: 700; color: var(--text-secondary); }
    .empty-desc { margin: 0; font-size: .875rem; color: var(--text-muted); max-width: 320px; }

    /* Invoice cards */
    .invoices-list { display: flex; flex-direction: column; gap: var(--space-4); }

    .invoice-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); overflow: hidden;
      animation: slideUpFade .35s var(--ease-spring) both;
    }

    .invoice-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
      background: var(--gray-50);
    }
    .invoice-left {}
    .invoice-number { font-family: monospace; font-weight: 700; font-size: .9375rem; color: var(--brand); }
    .invoice-date { font-size: .8125rem; color: var(--text-muted); margin-top: 2px; }

    .invoice-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: var(--space-2); }
    .invoice-amount {}
    .amount-free { font-size: 1.125rem; font-weight: 800; color: #16a34a; }
    .amount-value { font-size: 1.125rem; font-weight: 800; color: var(--text-primary); }

    .status-chip {
      display: inline-flex; padding: 3px 9px;
      border-radius: var(--radius-full); font-size: .7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .chip-free { background: #dcfce7; color: #166534; }
    .chip-reduced { background: #fef9c3; color: #854d0e; }
    .chip-full { background: #f0f9ff; color: #0369a1; }

    /* Body */
    .invoice-body {
      padding: var(--space-4) var(--space-5);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .invoice-detail { display: flex; align-items: baseline; gap: var(--space-3); }
    .detail-label {
      font-size: .75rem; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .04em;
      min-width: 72px; flex-shrink: 0;
    }
    .detail-val { font-size: .875rem; color: var(--text-primary); }
    .detail-note { color: var(--text-secondary); font-style: italic; }
    .savings-val { color: #16a34a; font-weight: 600; }

    .cycle-tag {
      display: inline-flex; margin-left: 6px;
      font-size: .65rem; font-weight: 700; padding: 1px 6px;
      border-radius: var(--radius-full); background: var(--gray-100); color: var(--text-muted);
    }

    /* Footer */
    .invoice-footer {
      padding: var(--space-3) var(--space-5);
      border-top: 1px solid var(--border);
      background: white;
    }
    .btn-pdf {
      display: inline-flex; align-items: center; gap: 6px;
      padding: .4rem var(--space-4); background: white;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .8125rem; font-weight: 600; color: var(--text-secondary);
      transition: all var(--t-fast);
    }
    .btn-pdf:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
  `],
})
export class AdminInvoicesComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService)

  readonly invoices = signal<SaInvoice[]>([])
  readonly loading = signal(true)

  ngOnInit(): void {
    this.restaurantService.getInvoices().subscribe({
      next: (data) => { this.invoices.set(data); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  formatAmount(cents: number, currency: string): string {
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100)
    } catch {
      return `${cents / 100} ${currency}`
    }
  }

  getSavings(invoice: SaInvoice): number {
    return Math.max(0, invoice.originalPriceCents - invoice.amountPaidCents)
  }

  getStatusLabel(invoice: SaInvoice): string {
    if (invoice.amountPaidCents === 0) return 'Gratuit'
    if (this.getSavings(invoice) > 0) return 'Réduit'
    return 'Plein tarif'
  }

  getStatusClass(invoice: SaInvoice): string {
    if (invoice.amountPaidCents === 0) return 'status-chip chip-free'
    if (this.getSavings(invoice) > 0) return 'status-chip chip-reduced'
    return 'status-chip chip-full'
  }

  downloadInvoice(invoice: SaInvoice): void {
    const restaurantName = invoice.restaurant?.name ?? 'Votre restaurant'
    const cycleLabel = invoice.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'
    const formattedDate = new Date(invoice.createdAt).toLocaleDateString('fr-FR')
    const periodStart = new Date(invoice.periodStart).toLocaleDateString('fr-FR')
    const periodEnd = new Date(invoice.periodEnd).toLocaleDateString('fr-FR')

    const formatAmt = (cents: number) => this.formatAmount(cents, invoice.currency)
    const savings = this.getSavings(invoice)
    const amountHtml = invoice.amountPaidCents === 0
      ? '<span style="color:#16a34a;font-weight:700">GRATUIT</span>'
      : formatAmt(invoice.amountPaidCents)

    const originalRow = savings > 0 ? `
      <tr>
        <td colspan="2" style="padding:8px 16px; color:#999; font-size:13px">Prix normal</td>
        <td style="padding:8px 16px; text-align:right; color:#999; text-decoration:line-through">${formatAmt(invoice.originalPriceCents)}</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:8px 16px; color:#16a34a; font-size:13px">Économie</td>
        <td style="padding:8px 16px; text-align:right; color:#16a34a; font-weight:600">-${formatAmt(savings)}</td>
      </tr>
    ` : ''

    const totalFooterHtml = invoice.amountPaidCents === 0
      ? '<p style="color:#16a34a;font-size:14px;margin:4px 0 0">Abonnement offert</p>'
      : savings > 0
        ? `<p style="color:#16a34a;font-size:14px;margin:4px 0 0">Économie : ${formatAmt(savings)}</p>`
        : ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture ${invoice.invoiceNumber}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; font-family: Inter, -apple-system, sans-serif; background: white; }
    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
<div style="font-family:Inter,sans-serif; max-width:700px; margin:0 auto; padding:40px; color:#1a1a1a">
  <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:40px">
    <div>
      <h1 style="font-size:28px; font-weight:800; color:#111; margin:0">FACTURE</h1>
      <p style="color:#666; margin:4px 0 0">${invoice.invoiceNumber}</p>
    </div>
    <div style="text-align:right">
      <p style="font-weight:700; font-size:18px; margin:0">${restaurantName}</p>
      <p style="color:#666; margin:4px 0 0">${formattedDate}</p>
    </div>
  </div>
  <hr style="border:none; border-top:2px solid #f0f0f0; margin:0 0 32px"/>
  <table style="width:100%; border-collapse:collapse">
    <thead>
      <tr style="background:#f8f8f8">
        <th style="text-align:left; padding:12px 16px; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#666">Description</th>
        <th style="text-align:center; padding:12px 16px; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#666">Période</th>
        <th style="text-align:right; padding:12px 16px; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:#666">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="padding:16px; border-bottom:1px solid #f0f0f0">
          <p style="font-weight:600; margin:0">${invoice.planName} — ${cycleLabel}</p>
          ${invoice.notes ? `<p style="color:#666; font-size:13px; margin:4px 0 0">${invoice.notes}</p>` : ''}
        </td>
        <td style="padding:16px; text-align:center; border-bottom:1px solid #f0f0f0; color:#555">
          ${periodStart} → ${periodEnd}
        </td>
        <td style="padding:16px; text-align:right; border-bottom:1px solid #f0f0f0">
          ${amountHtml}
        </td>
      </tr>
      ${originalRow}
    </tbody>
  </table>
  <div style="margin-top:24px; text-align:right">
    <p style="font-size:22px; font-weight:800; margin:0">Total : ${invoice.amountPaidCents === 0 ? '<span style="color:#16a34a">0,00 ' + invoice.currency + '</span>' : formatAmt(invoice.amountPaidCents)}</p>
    ${totalFooterHtml}
  </div>
  <div style="margin-top:48px; padding-top:24px; border-top:1px solid #f0f0f0; font-size:12px; color:#999; text-align:center">
    <p>Ce document est émis par l'administration de la plateforme.</p>
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
}
