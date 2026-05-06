import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule } from '@jsverse/transloco'
import { OrderService } from '../../shared/services/order.service'
import type { Order } from '../../shared/models'

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('fr-FR') + ' FCFA'
}

@Component({
  selector: 'app-redeem',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <div class="redeem-page">
        <div class="redeem-card">

          <!-- Back to menu -->
          <a routerLink="/menu" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            {{ t('publicOrder.redeemBackToMenu') }}
          </a>

          <!-- Loading state -->
          @if (loading()) {
            <div class="skeleton-wrap">
              <div class="skeleton skeleton-title"></div>
              <div class="skeleton skeleton-sub"></div>
              <div class="skeleton skeleton-block"></div>
              <div class="skeleton skeleton-block"></div>
            </div>
          }

          <!-- Error state -->
          @if (!loading() && error()) {
            <div class="state-icon state-icon-error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            </div>
            <h2 class="state-title">{{ t('publicOrder.redeemErrorTitle') }}</h2>
            <p class="state-desc">{{ error() }}</p>
          }

          <!-- Revoked state -->
          @if (!loading() && isRevoked()) {
            <div class="state-icon state-icon-error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            </div>
            <h2 class="state-title">{{ t('publicOrder.redeemRevokedTitle') }}</h2>
            <p class="state-desc">{{ t('publicOrder.redeemRevokedDesc') }}</p>
          }

          <!-- Main content (order loaded, not revoked) -->
          @if (!loading() && !error() && !isRevoked() && order()) {
            <!-- Header -->
            <div class="redeem-header">
              <div class="restaurant-name">{{ restaurantName() }}</div>
              <div class="gift-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
                {{ t('publicOrder.redeemGiftBadge') }}
              </div>
            </div>

            <!-- Gift message -->
            @if (order()!.giftMessage) {
              <div class="gift-message">
                <div class="gift-message-label">{{ t('publicOrder.redeemGiftMessage') }}</div>
                <p class="gift-message-text">"{{ order()!.giftMessage }}"</p>
              </div>
            }

            <!-- Order items -->
            <div class="order-items-section">
              <div class="section-label">{{ t('publicOrder.redeemOrderItems') }}</div>
              <div class="items-list">
                @for (item of order()!.items; track item.id) {
                  <div class="item-row">
                    <div class="item-qty">×{{ item.quantity }}</div>
                    <div class="item-info">
                      <div class="item-name">{{ item.menuItemName }}</div>
                      @if (item.specialInstructions) {
                        <div class="item-note">{{ item.specialInstructions }}</div>
                      }
                    </div>
                    <div class="item-price">{{ formatPrice(item.subtotalInCents) }}</div>
                  </div>
                }
              </div>
              <div class="order-total">
                <span>{{ t('publicOrder.redeemTotal') }}</span>
                <span class="total-amount">{{ formatPrice(order()!.totalInCents) }}</span>
              </div>
            </div>

            <!-- Already redeemed state -->
            @if (alreadyRedeemed()) {
              <div class="already-redeemed">
                <div class="state-icon state-icon-success state-icon-inline">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <div class="redeemed-title">{{ t('publicOrder.redeemAlreadyRedeemedTitle') }}</div>
                  @if (order()!.giftRedeemedAt) {
                    <div class="redeemed-date">
                      {{ t('publicOrder.redeemRedeemedOn') }} {{ order()!.giftRedeemedAt | date:'dd/MM/yyyy à HH:mm' }}
                    </div>
                  }
                  @if (order()!.giftRedeemedBy) {
                    <div class="redeemed-by">{{ t('publicOrder.redeemRedeemedBy') }} {{ order()!.giftRedeemedBy }}</div>
                  }
                </div>
              </div>
            }

            <!-- Redeem form (not yet redeemed) -->
            @if (!alreadyRedeemed() && !redeemSuccess()) {
              <div class="redeem-form-section">
                <div class="section-label">{{ t('publicOrder.redeemFormTitle') }}</div>
                <p class="form-desc">{{ t('publicOrder.redeemFormDesc') }}</p>
                <div class="form-field">
                  <label class="form-label">{{ t('publicOrder.redeemNameLabel') }} *</label>
                  <input
                    type="text"
                    class="form-input"
                    [class.form-input-error]="submitted && !redeemerName"
                    [(ngModel)]="redeemerName"
                    [placeholder]="t('publicOrder.redeemNamePlaceholder')"
                  />
                  @if (submitted && !redeemerName) {
                    <span class="field-error">{{ t('publicOrder.redeemFieldRequired') }}</span>
                  }
                </div>
                <div class="form-field">
                  <label class="form-label">{{ t('publicOrder.redeemContactLabel') }} *</label>
                  <input
                    type="text"
                    class="form-input"
                    [class.form-input-error]="submitted && !redeemerContact"
                    [(ngModel)]="redeemerContact"
                    [placeholder]="t('publicOrder.redeemContactPlaceholder')"
                  />
                  @if (submitted && !redeemerContact) {
                    <span class="field-error">{{ t('publicOrder.redeemFieldRequired') }}</span>
                  }
                </div>
                <button
                  class="submit-btn"
                  (click)="submitRedeem()"
                  [disabled]="submitting()"
                >
                  @if (submitting()) {
                    <span class="spinner"></span>
                    {{ t('publicOrder.redeemSubmitting') }}
                  } @else {
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    {{ t('publicOrder.redeemSubmitBtn') }}
                  }
                </button>
                @if (submitError()) {
                  <div class="submit-error">{{ submitError() }}</div>
                }
              </div>
            }

            <!-- Success state after submit -->
            @if (redeemSuccess()) {
              <div class="success-state">
                <div class="state-icon state-icon-success">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 class="state-title">{{ t('publicOrder.redeemSuccessTitle') }}</h3>
                <p class="state-desc">{{ t('publicOrder.redeemSuccessDesc') }}</p>
              </div>
            }
          }
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: var(--gray-50); font-family: var(--font-body); }

    .redeem-page {
      min-height: 100vh;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: var(--space-8) var(--space-4);
    }

    .redeem-card {
      width: 100%;
      max-width: 480px;
      background: white;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      padding: var(--space-8);
      box-shadow: 0 4px 24px rgba(0,0,0,.07);
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .875rem;
      color: var(--text-secondary);
      text-decoration: none;
      margin-bottom: var(--space-6);
      transition: color var(--t-fast);
    }
    .back-link:hover { color: var(--text-primary); }

    /* Skeleton */
    .skeleton-wrap { display: flex; flex-direction: column; gap: var(--space-4); }
    .skeleton {
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
      border-radius: var(--radius-md);
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
    .skeleton-title { height: 28px; width: 60%; }
    .skeleton-sub { height: 16px; width: 80%; }
    .skeleton-block { height: 64px; }

    /* State icons */
    .state-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-5);
    }
    .state-icon-error { background: #FEE2E2; color: #EF4444; }
    .state-icon-success { background: #D1FAE5; color: #10B981; }
    .state-icon-inline { width: 44px; height: 44px; flex-shrink: 0; }

    .state-title {
      text-align: center;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-3);
    }
    .state-desc {
      text-align: center;
      font-size: .9375rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.6;
    }

    /* Header */
    .redeem-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-6);
      gap: var(--space-4);
    }
    .restaurant-name {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .gift-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: #FDF4FF;
      color: #9333EA;
      border: 1px solid #E9D5FF;
      border-radius: var(--radius-full);
      padding: var(--space-1) var(--space-3);
      font-size: .75rem;
      font-weight: 700;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* Gift message */
    .gift-message {
      background: #FFFBEB;
      border: 1px solid #FDE68A;
      border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-5);
      margin-bottom: var(--space-6);
    }
    .gift-message-label {
      font-size: .75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #92400E;
      margin-bottom: var(--space-2);
    }
    .gift-message-text {
      font-size: .9375rem;
      color: #78350F;
      font-style: italic;
      margin: 0;
      line-height: 1.6;
    }

    /* Order items */
    .order-items-section { margin-bottom: var(--space-6); }
    .section-label {
      font-size: .75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text-secondary);
      margin-bottom: var(--space-3);
    }
    .items-list {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
      margin-bottom: var(--space-3);
    }
    .item-row {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-4);
      border-bottom: 1px solid var(--border);
    }
    .item-row:last-child { border-bottom: none; }
    .item-qty {
      font-size: .8125rem;
      font-weight: 700;
      color: var(--text-secondary);
      min-width: 28px;
    }
    .item-info { flex: 1; }
    .item-name { font-size: .9375rem; font-weight: 600; color: var(--text-primary); }
    .item-note { font-size: .8125rem; color: var(--text-secondary); margin-top: 2px; font-style: italic; }
    .item-price { font-size: .9375rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }

    .order-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-3) var(--space-4);
      background: var(--surface-1);
      border-radius: var(--radius-md);
      font-size: .9375rem;
      color: var(--text-secondary);
    }
    .total-amount {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    /* Already redeemed */
    .already-redeemed {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      background: #D1FAE5;
      border: 1px solid #6EE7B7;
      border-radius: var(--radius-md);
      padding: var(--space-5);
      margin-top: var(--space-4);
    }
    .redeemed-title { font-size: .9375rem; font-weight: 700; color: #065F46; }
    .redeemed-date { font-size: .8125rem; color: #047857; margin-top: var(--space-1); }
    .redeemed-by { font-size: .8125rem; color: #047857; margin-top: 2px; }

    /* Redeem form */
    .redeem-form-section { margin-top: var(--space-6); }
    .form-desc {
      font-size: .875rem;
      color: var(--text-secondary);
      margin: 0 0 var(--space-5);
      line-height: 1.6;
    }
    .form-field { margin-bottom: var(--space-4); }
    .form-label {
      display: block;
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: var(--space-2);
    }
    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      font-size: .9375rem;
      font-family: var(--font-body);
      color: var(--text-primary);
      background: white;
      outline: none;
      transition: border-color var(--t-fast);
    }
    .form-input:focus { border-color: var(--color-brand); }
    .form-input-error { border-color: #EF4444 !important; }
    .field-error {
      display: block;
      font-size: .8125rem;
      color: #EF4444;
      margin-top: var(--space-1);
    }

    .submit-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: var(--space-4);
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-weight: 700;
      font-family: var(--font-body);
      cursor: pointer;
      transition: opacity var(--t-fast), transform var(--t-fast);
      margin-top: var(--space-2);
    }
    .submit-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: .6; cursor: not-allowed; }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.4);
      border-top-color: white;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .submit-error {
      margin-top: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: #FEE2E2;
      color: #DC2626;
      border-radius: var(--radius-md);
      font-size: .875rem;
    }

    /* Success state */
    .success-state {
      margin-top: var(--space-6);
      text-align: center;
      padding: var(--space-6) 0;
    }
  `],
})
export class RedeemComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private readonly orderService = inject(OrderService)

  readonly loading = signal(true)
  readonly order = signal<Order | null>(null)
  readonly restaurantName = signal('')
  readonly alreadyRedeemed = signal(false)
  readonly isRevoked = signal(false)
  readonly error = signal('')
  readonly submitting = signal(false)
  readonly redeemSuccess = signal(false)
  readonly submitError = signal('')

  redeemerName = ''
  redeemerContact = ''
  submitted = false

  readonly formatPrice = formatPrice

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token') ?? ''
    this.orderService.getRedeemInfo(token).subscribe({
      next: (res) => {
        this.order.set(res.order)
        this.restaurantName.set(res.restaurantName)
        this.alreadyRedeemed.set(res.alreadyRedeemed)
        if (res.order.giftRevokedAt) this.isRevoked.set(true)
        this.loading.set(false)
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Ce lien cadeau est invalide ou a expiré.'
        this.error.set(msg)
        this.loading.set(false)
      },
    })
  }

  submitRedeem(): void {
    this.submitted = true
    if (!this.redeemerName || !this.redeemerContact) return

    const token = this.route.snapshot.paramMap.get('token') ?? ''
    this.submitting.set(true)
    this.submitError.set('')

    this.orderService.redeemGift(token, this.redeemerName, this.redeemerContact).subscribe({
      next: () => {
        this.submitting.set(false)
        this.redeemSuccess.set(true)
      },
      error: (err) => {
        const msg = err?.error?.message ?? 'Une erreur est survenue. Veuillez réessayer.'
        this.submitError.set(msg)
        this.submitting.set(false)
      },
    })
  }
}
