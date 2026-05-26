import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { AuthService } from '../../shared/services/auth.service'
import type { SaInvoice } from '../../shared/models'
import { printInvoice } from '../../shared/utils/invoice-print'

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
      background: var(--surface-1); border: 1px solid var(--border);
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
    .amount-free { font-size: 1.125rem; font-weight: 800; color: var(--success); }
    .amount-value { font-size: 1.125rem; font-weight: 800; color: var(--text-primary); }

    .status-chip {
      display: inline-flex; padding: 3px 9px;
      border-radius: var(--radius-full); font-size: .7rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em;
    }
    .chip-free { background: var(--success-bg); color: var(--success); }
    .chip-reduced { background: var(--warning-bg); color: var(--warning); }
    .chip-full { background: rgba(3,105,161,0.15); color: #38bdf8; }

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
    .savings-val { color: var(--success); font-weight: 600; }

    .cycle-tag {
      display: inline-flex; margin-left: 6px;
      font-size: .65rem; font-weight: 700; padding: 1px 6px;
      border-radius: var(--radius-full); background: var(--gray-100); color: var(--text-muted);
    }

    /* Footer */
    .invoice-footer {
      padding: var(--space-3) var(--space-5);
      border-top: 1px solid var(--border);
      background: var(--surface-1);
    }
    .btn-pdf {
      display: inline-flex; align-items: center; gap: 6px;
      padding: .4rem var(--space-4); background: var(--surface-1);
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .8125rem; font-weight: 600; color: var(--text-secondary);
      transition: all var(--t-fast);
    }
    .btn-pdf:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
  `],
})
export class AdminInvoicesComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService)
  private readonly authService       = inject(AuthService)

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
    // Utilise les infos du restaurant depuis l'auth (tenant courant)
    const rest = this.authService.restaurant()
    printInvoice(invoice, {
      name:    rest?.name    ?? invoice.restaurant?.name    ?? 'Restaurant',
      address: rest?.address ?? invoice.restaurant?.address ?? null,
      phone:   rest?.phone   ?? invoice.restaurant?.phone   ?? null,
      email:   rest?.email   ?? invoice.restaurant?.email   ?? null,
      website: rest?.website ?? invoice.restaurant?.website ?? null,
      country: rest?.country,
      currency: rest?.currency ?? invoice.currency,
    })
  }
}
