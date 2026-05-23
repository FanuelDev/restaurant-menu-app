import { Component, signal, inject, OnInit, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { SaInvoice } from '../../shared/models'

@Component({
  selector: 'app-sa-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Factures</h1>
          <p class="page-subtitle">Historique de toutes les factures émises</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <div class="search-wrap">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          <input
            type="text"
            class="search-input"
            placeholder="Filtrer par ID restaurant..."
            [(ngModel)]="restaurantIdFilter"
            (ngModelChange)="onFilterChange()"
          />
        </div>
        <div class="filter-meta">
          @if (!loading()) {
            <span class="count-badge">{{ invoices().length }} facture(s)</span>
          }
        </div>
      </div>

      <!-- Table -->
      @if (loading()) {
        <div class="skeleton-table">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton row-sk"></div>
          }
        </div>
      } @else if (invoices().length === 0) {
        <div class="empty-state">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>Aucune facture trouvée</span>
        </div>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>N° Facture</th>
                <th>Restaurant</th>
                <th>Plan</th>
                <th>Période</th>
                <th>Montant payé</th>
                <th>Prix normal</th>
                <th>Économie</th>
                <th>Statut</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (invoice of invoices(); track invoice.id) {
                <tr>
                  <td>
                    <span class="invoice-num">{{ invoice.invoiceNumber }}</span>
                  </td>
                  <td>
                    <a [routerLink]="['/super-admin/restaurants', invoice.restaurantId]" class="restaurant-link">
                      {{ invoice.restaurant?.name ?? ('Restaurant #' + invoice.restaurantId) }}
                    </a>
                  </td>
                  <td>
                    <div class="plan-cell">
                      <span class="plan-name">{{ invoice.planName }}</span>
                      <span class="cycle-badge">{{ invoice.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel' }}</span>
                    </div>
                  </td>
                  <td class="period-cell">
                    <span>{{ invoice.periodStart | date:'dd/MM/yy' }}</span>
                    <span class="period-sep">→</span>
                    <span>{{ invoice.periodEnd | date:'dd/MM/yy' }}</span>
                  </td>
                  <td class="amount-cell">
                    @if (invoice.amountPaidCents === 0) {
                      <span class="amount-free">GRATUIT</span>
                    } @else {
                      <span class="amount-paid">{{ formatAmount(invoice.amountPaidCents, invoice.currency) }}</span>
                    }
                  </td>
                  <td class="amount-cell muted">
                    {{ formatAmount(invoice.originalPriceCents, invoice.currency) }}
                  </td>
                  <td class="amount-cell">
                    @if (getSavings(invoice) > 0) {
                      <span class="savings">{{ formatAmount(getSavings(invoice), invoice.currency) }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td>
                    <span class="status-badge" [class]="getStatusClass(invoice)">
                      {{ getStatusLabel(invoice) }}
                    </span>
                  </td>
                  <td class="date-cell">{{ invoice.createdAt | date:'dd/MM/yyyy' }}</td>
                  <td>
                    <button class="btn-download" (click)="downloadInvoice(invoice)" title="Télécharger la facture">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      PDF
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (meta()) {
          <div class="pagination">
            <button class="page-btn" [disabled]="currentPage() <= 1" (click)="goToPage(currentPage() - 1)">
              ‹ Précédent
            </button>
            <span class="page-info">Page {{ meta()!.currentPage }} / {{ meta()!.lastPage }}</span>
            <button class="page-btn" [disabled]="currentPage() >= meta()!.lastPage" (click)="goToPage(currentPage() + 1)">
              Suivant ›
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: var(--space-6);
    }
    .page-title { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .page-subtitle { margin: 0; font-size: .875rem; color: var(--text-muted); }

    /* Filter bar */
    .filter-bar {
      display: flex; align-items: center; gap: var(--space-3);
      margin-bottom: var(--space-5);
    }
    .search-wrap {
      position: relative; flex: 1; max-width: 320px;
    }
    .search-icon {
      position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
      color: var(--text-muted); pointer-events: none;
    }
    .search-input {
      width: 100%; padding: .5rem .75rem .5rem 2rem;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      font-size: .875rem; background: white; color: var(--text-primary);
      box-sizing: border-box; transition: border-color var(--t-fast);
    }
    .search-input:focus { outline: none; border-color: var(--brand); }
    .filter-meta { margin-left: auto; }
    .count-badge {
      font-size: .8125rem; color: var(--text-muted); font-weight: 500;
    }

    /* Skeleton */
    .skeleton { background: linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-md); }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .skeleton-table { display: flex; flex-direction: column; gap: var(--space-2); }
    .row-sk { height: 52px; }

    /* Empty */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-12) 0; color: var(--text-muted); font-size: .9rem;
    }

    /* Table */
    .table-wrap {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); overflow: hidden;
    }
    .table {
      width: 100%; border-collapse: collapse;
    }
    .table th {
      text-align: left; padding: 10px 14px;
      font-size: .75rem; font-weight: 700; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: .05em;
      background: var(--gray-50); border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    .table td {
      padding: 12px 14px; border-bottom: 1px solid var(--border);
      font-size: .875rem; color: var(--text-primary); vertical-align: middle;
    }
    .table tr:last-child td { border-bottom: none; }
    .table tr:hover td { background: var(--gray-50); }

    .invoice-num { font-family: monospace; font-weight: 600; font-size: .8125rem; color: var(--brand); }
    .restaurant-link { color: var(--text-primary); text-decoration: none; font-weight: 600; }
    .restaurant-link:hover { color: var(--brand); }

    .plan-cell { display: flex; align-items: center; gap: var(--space-2); }
    .plan-name { font-weight: 600; }
    .cycle-badge {
      font-size: .65rem; font-weight: 700; padding: 2px 6px;
      border-radius: var(--radius-full); background: var(--gray-100); color: var(--text-muted);
    }

    .period-cell { white-space: nowrap; color: var(--text-secondary); font-size: .8125rem; }
    .period-sep { margin: 0 4px; color: var(--text-muted); }

    .amount-cell { white-space: nowrap; }
    .amount-free { font-weight: 800; color: #16a34a; font-size: .8125rem; }
    .amount-paid { font-weight: 700; color: var(--text-primary); }
    .savings { color: #16a34a; font-weight: 600; font-size: .8125rem; }
    .muted { color: var(--text-muted); }

    .status-badge {
      display: inline-flex; padding: 3px 9px;
      border-radius: var(--radius-full); font-size: .7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .badge-free { background: #dcfce7; color: #166534; }
    .badge-reduced { background: #fef9c3; color: #854d0e; }
    .badge-full { background: #f0f9ff; color: #0369a1; }

    .date-cell { color: var(--text-muted); font-size: .8125rem; white-space: nowrap; }

    .btn-download {
      display: inline-flex; align-items: center; gap: 5px;
      padding: 5px 10px; background: white;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .75rem; font-weight: 600; color: var(--text-secondary);
      transition: all var(--t-fast); white-space: nowrap;
    }
    .btn-download:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }

    /* Pagination */
    .pagination {
      display: flex; align-items: center; justify-content: center; gap: var(--space-4);
      margin-top: var(--space-5);
    }
    .page-btn {
      padding: .4rem var(--space-4); background: white; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); cursor: pointer; font-size: .875rem;
      color: var(--text-secondary); transition: all var(--t-fast);
    }
    .page-btn:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); }
    .page-btn:disabled { opacity: .5; cursor: not-allowed; }
    .page-info { font-size: .875rem; color: var(--text-muted); }
  `],
})
export class SaInvoicesComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly invoices = signal<SaInvoice[]>([])
  readonly loading = signal(true)
  readonly meta = signal<{ currentPage: number; lastPage: number; total: number } | null>(null)
  readonly currentPage = signal(1)

  restaurantIdFilter = ''
  private filterTimeout: ReturnType<typeof setTimeout> | null = null

  ngOnInit(): void {
    this.loadInvoices()
  }

  onFilterChange(): void {
    if (this.filterTimeout) clearTimeout(this.filterTimeout)
    this.filterTimeout = setTimeout(() => {
      this.currentPage.set(1)
      this.loadInvoices()
    }, 400)
  }

  loadInvoices(): void {
    this.loading.set(true)
    const restaurantId = this.restaurantIdFilter ? Number(this.restaurantIdFilter) : undefined
    this.saService.getInvoices({ restaurantId, page: this.currentPage() }).subscribe({
      next: (res) => {
        this.invoices.set(res.data)
        this.meta.set(res.meta)
        this.loading.set(false)
      },
      error: () => this.loading.set(false),
    })
  }

  goToPage(page: number): void {
    this.currentPage.set(page)
    this.loadInvoices()
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
    const savings = this.getSavings(invoice)
    if (savings > 0) return 'Réduit'
    return 'Plein tarif'
  }

  getStatusClass(invoice: SaInvoice): string {
    if (invoice.amountPaidCents === 0) return 'status-badge badge-free'
    if (this.getSavings(invoice) > 0) return 'status-badge badge-reduced'
    return 'status-badge badge-full'
  }

  downloadInvoice(invoice: SaInvoice): void {
    const restaurantName = invoice.restaurant?.name ?? `Restaurant #${invoice.restaurantId}`
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
