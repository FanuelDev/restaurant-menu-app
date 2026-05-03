import { Component, signal, inject, OnInit, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SubscriptionService, SubscriptionShowResponse } from '../../shared/services/subscription.service'
import { AuthService } from '../../shared/services/auth.service'
import type { Plan, BillingCycle } from '../../shared/models'

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subscription-page">
      <h1>Abonnement</h1>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else if (data()) {
        <!-- Current status -->
        <div class="status-card" [class]="'status-' + (data()!.restaurant.subscriptionStatus)">
          <div class="status-icon">
            {{ statusIcon(data()!.restaurant.subscriptionStatus) }}
          </div>
          <div class="status-info">
            <div class="status-label">{{ statusLabel(data()!.restaurant.subscriptionStatus) }}</div>
            @if (data()!.restaurant.subscriptionStatus === 'trialing' && data()!.restaurant.trialEndsAt) {
              <div class="status-detail">
                Période d'essai se termine le {{ data()!.restaurant.trialEndsAt | date:'dd/MM/yyyy' }}
              </div>
            }
            @if (data()!.activeSubscription?.currentPeriodEnd) {
              <div class="status-detail">
                Renouvellement le {{ data()!.activeSubscription!.currentPeriodEnd | date:'dd/MM/yyyy' }}
              </div>
            }
            @if (data()!.restaurant.plan) {
              <div class="current-plan">Plan actuel : <strong>{{ data()!.restaurant.plan!.name }}</strong></div>
            }
          </div>
          @if (data()!.activeSubscription?.status === 'active') {
            <button class="btn-danger-outline" (click)="showCancelConfirm.set(true)">Annuler l'abonnement</button>
          }
        </div>

        <!-- Cancel confirmation -->
        @if (showCancelConfirm()) {
          <div class="confirm-overlay">
            <div class="confirm-box">
              <h3>Annuler l'abonnement ?</h3>
              <p>Votre accès sera maintenu jusqu'à la fin de la période en cours, puis votre compte basculera sur le plan Gratuit.</p>
              <div class="confirm-actions">
                <button class="btn-outline" (click)="showCancelConfirm.set(false)">Annuler</button>
                <button class="btn-danger" (click)="cancelSubscription()" [disabled]="actionLoading()">
                  {{ actionLoading() ? 'Annulation...' : 'Confirmer l\'annulation' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Available plans -->
        <div class="plans-section">
          <div class="plans-header">
            <h2>Choisir un plan</h2>
            <div class="cycle-toggle">
              <button [class.active]="cycle() === 'monthly'" (click)="cycle.set('monthly')">Mensuel</button>
              <button [class.active]="cycle() === 'yearly'" (click)="cycle.set('yearly')">
                Annuel <span class="discount">-17%</span>
              </button>
            </div>
          </div>

          <div class="plans-grid">
            @for (plan of data()!.availablePlans; track plan.id) {
              @if (plan.priceMonthlyCents > 0) {
                <div class="plan-card" [class.current]="isCurrentPlan(plan)">
                  <div class="plan-name">{{ plan.name }}</div>
                  <div class="plan-price">
                    <span class="amount">{{ formatPrice(plan, cycle()) }}</span>
                    <span class="period">/ {{ cycle() === 'monthly' ? 'mois' : 'an' }}</span>
                  </div>
                  <ul class="features">
                    @for (f of plan.features; track f) { <li>✓ {{ f }}</li> }
                  </ul>
                  @if (isCurrentPlan(plan)) {
                    <div class="current-badge">Plan actuel</div>
                  } @else {
                    <button class="btn-subscribe" (click)="initPayment(plan)"
                            [disabled]="actionLoading()">
                      {{ actionLoading() && selectedPlan()?.id === plan.id ? 'Redirection...' : 'Choisir ce plan' }}
                    </button>
                  }
                </div>
              }
            }
          </div>
        </div>

        @if (error()) {
          <div class="error-msg">{{ error() }}</div>
        }
      }
    </div>
  `,
  styles: [`
    .subscription-page { max-width: 900px; }

    .status-card {
      display: flex; align-items: center; gap: var(--space-5);
      padding: var(--space-5) var(--space-6); border-radius: var(--radius-lg);
      margin-bottom: var(--space-6); border-left: 4px solid var(--success);
      background: var(--success-bg); animation: slideUpFade .4s var(--ease-spring) both;
    }
    .status-trialing { background: var(--warning-bg); border-left-color: var(--warning); }
    .status-active   { background: var(--success-bg); border-left-color: var(--success); }
    .status-canceled, .status-past_due, .status-suspended { background: var(--error-bg); border-left-color: var(--error); }

    .status-icon  { font-size: 2rem; flex-shrink: 0; }
    .status-info  { flex: 1; }
    .status-label { font-weight: 700; color: var(--text-primary); font-size: .9375rem; }
    .status-detail, .current-plan { font-size: .8125rem; color: var(--text-muted); margin-top: var(--space-1); }

    .btn-danger-outline {
      padding: var(--space-2) var(--space-4); background: transparent;
      color: var(--error); border: 1.5px solid var(--error);
      border-radius: var(--radius-md); font-size: .8125rem;
      font-weight: 600; cursor: pointer; white-space: nowrap;
      transition: background var(--t-fast);
      &:hover { background: var(--error-bg); }
    }

    .confirm-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .confirm-box {
      background: white; border-radius: var(--radius-xl);
      padding: var(--space-6); max-width: 440px; width: 90%;
      box-shadow: var(--shadow-xl); animation: scaleIn .3s var(--ease-spring) both;
    }
    .confirm-box h3 { margin: 0 0 var(--space-3); color: var(--text-primary); font-size: 1.125rem; }
    .confirm-box p  { color: var(--text-secondary); font-size: .9rem; margin: 0 0 var(--space-5); line-height: 1.6; }
    .confirm-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }
    .btn-outline {
      padding: var(--space-2) var(--space-5); background: transparent;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .9rem; color: var(--text-secondary);
      transition: border-color var(--t-fast);
      &:hover { border-color: var(--gray-400); }
    }
    .btn-danger {
      padding: var(--space-2) var(--space-5); background: var(--error);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .9rem; font-weight: 600;
      transition: opacity var(--t-fast);
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    .plans-section  { margin-top: var(--space-2); }
    .plans-header   { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-5); }
    .plans-header h2 { font-size: 1.125rem; color: var(--text-primary); margin: 0; font-weight: 700; }

    .cycle-toggle {
      display: flex; background: var(--gray-100);
      border-radius: var(--radius-lg); padding: 3px; gap: 2px;
    }
    .cycle-toggle button {
      padding: var(--space-2) var(--space-4); border: none; border-radius: var(--radius-md);
      background: transparent; cursor: pointer; font-size: .8125rem; font-weight: 500;
      color: var(--text-muted); transition: all var(--t-fast);
    }
    .cycle-toggle button.active { background: white; color: var(--text-primary); box-shadow: var(--shadow-xs); }
    .discount {
      background: var(--success-bg); color: var(--success);
      font-size: .65rem; padding: .1rem .35rem;
      border-radius: var(--radius-xs); font-weight: 700; margin-left: var(--space-2);
    }

    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: var(--space-4); }
    .plan-card {
      background: white; border-radius: var(--radius-lg);
      padding: var(--space-6); border: 2px solid var(--border);
      transition: box-shadow var(--t-fast), border-color var(--t-fast);
      animation: slideUpFade .4s var(--ease-spring) both;
      &:hover { box-shadow: var(--shadow-md); }
    }
    .plan-card.current { border-color: var(--brand); box-shadow: 0 0 0 4px var(--brand-subtle); }

    .plan-name  { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-3); }
    .plan-price { margin-bottom: var(--space-4); }
    .amount     { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); }
    .period     { font-size: .8125rem; color: var(--text-muted); }

    .features { list-style: none; padding: 0; margin: 0 0 var(--space-5); }
    .features li {
      font-size: .8125rem; color: var(--text-secondary);
      padding: var(--space-2) 0; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }

    .current-badge {
      text-align: center; padding: var(--space-3);
      background: var(--brand-subtle); color: var(--brand);
      border-radius: var(--radius-md); font-size: .8125rem; font-weight: 700;
    }
    .btn-subscribe {
      width: 100%; padding: var(--space-3); background: var(--brand);
      color: white; border: none; border-radius: var(--radius-md);
      font-weight: 700; cursor: pointer; font-size: .9rem;
      transition: background var(--t-fast), opacity var(--t-fast);
      &:hover:not(:disabled) { background: var(--brand-dark); }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .error-msg { background: var(--error-bg); color: var(--error); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: .875rem; border: 1px solid var(--error-border); margin-top: var(--space-4); }
  `],
})
export class SubscriptionComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService)
  private readonly authService = inject(AuthService)

  readonly data = signal<SubscriptionShowResponse | null>(null)
  readonly loading = signal(true)
  readonly actionLoading = signal(false)
  readonly showCancelConfirm = signal(false)
  readonly error = signal<string | null>(null)
  readonly cycle = signal<BillingCycle>('monthly')
  readonly selectedPlan = signal<Plan | null>(null)

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    this.subscriptionService.getSubscription().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  isCurrentPlan(plan: Plan): boolean {
    const activeSub = this.data()?.activeSubscription
    if (activeSub?.status === 'active') return activeSub.planId === plan.id
    return this.data()?.restaurant.plan?.id === plan.id
  }

  formatPrice(plan: Plan, cycle: BillingCycle): string {
    const cents = cycle === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents
    return new Intl.NumberFormat('fr-FR').format(cents / 100) + ' FCFA'
  }

  statusIcon(status: string): string {
    const icons: Record<string, string> = {
      trialing: '⏳', active: '✅', past_due: '⚠️', canceled: '❌', suspended: '🔒',
    }
    return icons[status] ?? '❓'
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      trialing: 'Période d\'essai', active: 'Abonnement actif',
      past_due: 'Paiement en retard', canceled: 'Abonnement annulé', suspended: 'Compte suspendu',
    }
    return labels[status] ?? status
  }

  initPayment(plan: Plan): void {
    this.selectedPlan.set(plan)
    this.actionLoading.set(true)
    this.error.set(null)

    this.subscriptionService.subscribe({ planSlug: plan.slug, billingCycle: this.cycle() }).subscribe({
      next: (res) => {
        window.location.href = res.paymentUrl
      },
      error: (err) => {
        this.actionLoading.set(false)
        this.error.set(err.error?.message ?? 'Erreur lors de l\'initiation du paiement.')
      },
    })
  }

  cancelSubscription(): void {
    this.actionLoading.set(true)
    this.subscriptionService.cancel().subscribe({
      next: () => {
        this.showCancelConfirm.set(false)
        this.actionLoading.set(false)
        this.load()
      },
      error: (err) => {
        this.actionLoading.set(false)
        this.error.set(err.error?.message ?? 'Erreur lors de l\'annulation.')
      },
    })
  }
}
