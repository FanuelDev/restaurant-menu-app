import { Component, signal, computed, inject, OnInit } from '@angular/core'
import { CommonModule, NgTemplateOutlet } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { SubscriptionService } from '../../shared/services/subscription.service'
import type { Plan, BillingCycle } from '../../shared/models'

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, NgTemplateOutlet, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="pricing-page">

      <!-- Nav -->
      <header class="pricing-nav">
        <a routerLink="/" class="nav-brand">
          <div class="nav-logo">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          SaeMenus
        </a>
        <div class="nav-actions">
          <a routerLink="/login" class="btn btn-ghost btn-sm">{{ t('public.pricing.navLogin') }}</a>
          <a routerLink="/register" class="btn btn-primary btn-sm">{{ t('public.pricing.navRegister') }}</a>
        </div>
      </header>

      <!-- Hero -->
      <section class="pricing-hero">
        <div class="hero-badge animate-fade">
          <span class="hero-badge-dot"></span>
          {{ t('public.pricing.noCreditCard') }}
        </div>
        <h1 class="hero-title animate-up">
          {{ t('public.pricing.heroTitle') }}<br/>
          <span class="hero-title-accent">{{ t('public.pricing.heroTitleAccent') }}</span>
        </h1>
        <p class="hero-sub animate-up delay-1">
          {{ t('public.pricing.heroSub') }}
        </p>

        <div class="cycle-toggle animate-up delay-2">
          <button [class.active]="cycle() === 'monthly'" (click)="cycle.set('monthly')">{{ t('public.pricing.monthly') }}</button>
          <button [class.active]="cycle() === 'yearly'" (click)="cycle.set('yearly')">
            {{ t('public.pricing.yearly') }}
            @if (bestSavingPct() > 0) {
              <span class="saving-pill">−{{ bestSavingPct() }}%</span>
            }
          </button>
        </div>
      </section>

      <!-- Plans -->
      @if (loading()) {
        <section class="plans-section">
          <div class="plans-grid" [style.--plan-cols]="3">
            @for (_ of [1,2,3]; track $index) {
              <div class="plan-card-skeleton">
                <div class="skeleton" style="height:24px;width:60%;margin-bottom:12px"></div>
                <div class="skeleton" style="height:14px;width:85%;margin-bottom:8px"></div>
                <div class="skeleton" style="height:14px;width:70%;margin-bottom:32px"></div>
                <div class="skeleton" style="height:48px;width:50%;margin-bottom:24px"></div>
                <div class="skeleton" style="height:44px;border-radius:10px;margin-bottom:24px"></div>
                @for (_ of [1,2,3,4]; track $index) {
                  <div class="skeleton" style="height:12px;width:80%;margin-bottom:10px"></div>
                }
              </div>
            }
          </div>
        </section>
      } @else {
        <section class="plans-section">
          <div class="plans-grid" [style.--plan-cols]="plans().length">
            @for (plan of plans(); track plan.id; let i = $index) {
              <div class="plan-card animate-up"
                   [class.plan-featured]="isFeatured(i)"
                   [style.animation-delay]="(i * 80) + 'ms'">

                @if (isFeatured(i)) {
                  <div class="plan-popular">{{ t('public.pricing.popular') }}</div>
                }

                <div class="plan-top">
                  <div class="plan-icon" [class.plan-icon-featured]="isFeatured(i)">
                    <ng-container [ngTemplateOutlet]="planIcon" [ngTemplateOutletContext]="{ i: i, total: plans().length }"/>
                  </div>
                  <div>
                    <h3 class="plan-name">{{ plan.name }}</h3>
                    <p class="plan-desc">{{ plan.description }}</p>
                  </div>
                </div>

                <div class="plan-price">
                  @if (plan.priceMonthlyCents === 0) {
                    <span class="price-main">{{ t('public.pricing.free') }}</span>
                    <span class="price-forever">{{ t('public.pricing.forever') }}</span>
                  } @else {
                    <span class="price-main">{{ formatPrice(plan, cycle()) }}</span>
                    <span class="price-period">{{ cycle() === 'monthly' ? t('public.pricing.perMonth') : t('public.pricing.perYear') }}</span>
                    @if (cycle() === 'yearly' && savingPct(plan) > 0) {
                      <span class="price-saving">{{ t('public.pricing.savePercent', { value: savingPct(plan) }) }}</span>
                    }
                  }
                </div>


                <a routerLink="/register" class="plan-cta" [class.plan-cta-featured]="isFeatured(i)">
                  {{ plan.priceMonthlyCents === 0 ? t('public.pricing.choosePlan') : t('public.pricing.startTrial') }}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke-linejoin="round"/>
                  </svg>
                </a>

                <ul class="plan-features">
                  @for (entry of featureEntries(plan); track entry.key) {
                    <li [class.feature-disabled]="!entry.value">
                      @if (entry.value) {
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                          <path d="M3 8l3.5 3.5 7-7" stroke-linejoin="round"/>
                        </svg>
                      } @else {
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                          <path d="M4 4l8 8M12 4l-8 8"/>
                        </svg>
                      }
                      {{ entry.label }}
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </section>
      }

      <!-- Social proof -->
      <section class="proof-section animate-up">
        <div class="proof-inner">
          <div class="proof-stat">
            <span class="proof-num">1 200+</span>
            <span class="proof-label">{{ t('public.pricing.proofRestaurants') }}</span>
          </div>
          <div class="proof-divider"></div>
          <div class="proof-stat">
            <span class="proof-num">14 pays</span>
            <span class="proof-label">{{ t('public.pricing.proofPresence') }}</span>
          </div>
          <div class="proof-divider"></div>
          <div class="proof-stat">
            <span class="proof-num">4.9 ★</span>
            <span class="proof-label">{{ t('public.pricing.proofRating') }}</span>
          </div>
          <div class="proof-divider"></div>
          <div class="proof-stat">
            <span class="proof-num">{{ t('public.pricing.proofPayment') }}</span>
            <span class="proof-label">Orange · MTN · Wave</span>
          </div>
        </div>
      </section>

      <!-- FAQ -->
      <section class="faq-section">
        <h2 class="faq-title animate-up">{{ t('public.pricing.faqTitle') }}</h2>
        <div class="faq-grid">
          @for (i of [0,1,2,3]; track i; let idx = $index) {
            <div class="faq-item animate-up" [style.animation-delay]="(idx * 60) + 'ms'">
              <h4 class="faq-q">{{ t('public.pricing.faq' + i + 'q') }}</h4>
              <p class="faq-a">{{ t('public.pricing.faq' + i + 'a') }}</p>
            </div>
          }
        </div>
      </section>

      <!-- CTA footer -->
      <section class="cta-section animate-up">
        <div class="cta-inner">
          <h2 class="cta-title">{{ t('public.landing.ctaTitle') }}</h2>
          <p class="cta-sub">{{ t('public.pricing.ctaSub') }}</p>
          <a routerLink="/register" class="btn btn-primary btn-lg">{{ t('public.pricing.ctaCreate') }}</a>
        </div>
      </section>

    </div>
    </ng-container>

    <!-- Icon templates by position -->
    <ng-template #planIcon let-i="i" let-total="total">
      @if (i === 0) {
        <!-- First plan: starter / clock -->
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <circle cx="10" cy="10" r="8"/>
          <path d="M10 6v4l2.5 2.5"/>
        </svg>
      } @else if (i === total - 1 && total > 2) {
        <!-- Last plan (3+): enterprise / chart -->
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M17 12l-5 5-4-4-5 3"/>
          <path d="M14 12h3v3"/>
        </svg>
      } @else {
        <!-- Middle / featured plan: star -->
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
          <path d="M10 2l2.5 5 5.5.8-4 3.9.9 5.3L10 14.5l-4.9 2.5.9-5.3L2 7.8l5.5-.8z" stroke-linejoin="round"/>
        </svg>
      }
    </ng-template>
  `,
  styles: [`
    .pricing-page {
      min-height: 100vh;
      background: var(--white);
    }

    /* ── Nav ─────────────────────────────────────── */
    .pricing-nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-4) var(--space-8);
      border-bottom: 1px solid var(--border);
      position: sticky; top: 0; background: rgba(255,255,255,.92);
      backdrop-filter: blur(12px); z-index: 50;
    }
    .nav-brand {
      display: flex; align-items: center; gap: var(--space-3);
      text-decoration: none; font-weight: 700; font-size: 1.0625rem; color: var(--text-primary);
    }
    .nav-logo {
      width: 34px; height: 34px; background: var(--brand);
      border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
    }
    .nav-actions { display: flex; gap: var(--space-2); align-items: center; }

    /* ── Hero ─────────────────────────────────────── */
    .pricing-hero {
      text-align: center; padding: var(--space-16) var(--space-4) var(--space-12);
      max-width: 680px; margin: 0 auto;
    }

    .hero-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .35rem .9rem; border-radius: var(--radius-full);
      background: var(--success-bg); color: var(--success);
      font-size: .8125rem; font-weight: 600; margin-bottom: var(--space-6);
    }
    .hero-badge-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--success);
      animation: pulse 2s ease infinite;
    }

    .hero-title {
      font-family: var(--font-display);
      font-size: clamp(2.4rem, 5vw, 3.6rem);
      line-height: 1.12; color: var(--text-primary);
      margin: 0 0 var(--space-5);
    }
    .hero-title-accent { color: var(--brand); }

    .hero-sub {
      color: var(--text-muted); font-size: 1.0625rem;
      line-height: 1.6; margin: 0 0 var(--space-8);
    }

    .cycle-toggle {
      display: inline-flex; background: var(--gray-100);
      border-radius: var(--radius-full); padding: 4px; gap: 4px;
    }
    .cycle-toggle button {
      padding: .5rem 1.375rem; border: none; background: transparent;
      border-radius: var(--radius-full); cursor: pointer; font-weight: 500;
      font-size: .9rem; color: var(--text-muted);
      transition: all var(--t-fast); display: flex; align-items: center; gap: var(--space-2);
    }
    .cycle-toggle button.active { background: white; color: var(--text-primary); box-shadow: var(--shadow-sm); }

    .saving-pill {
      background: var(--success-bg); color: var(--success);
      font-size: .7rem; padding: .15rem .4rem; border-radius: var(--radius-full); font-weight: 700;
    }

    /* ── Plans ─────────────────────────────────────── */
    .plans-section { padding: 0 var(--space-6) var(--space-12); }
    .plans-grid {
      display: grid;
      grid-template-columns: repeat(min(var(--plan-cols, 3), 3), 1fr);
      gap: var(--space-5); max-width: 1080px; margin: 0 auto;
    }
    @media (max-width: 860px) { .plans-grid { grid-template-columns: 1fr; max-width: 420px; } }

    .plan-card {
      background: white; border: 1.5px solid var(--border);
      border-radius: var(--radius-2xl); padding: var(--space-6);
      position: relative; transition: box-shadow var(--t-normal), transform var(--t-normal);
    }
    .plan-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }

    .plan-featured {
      border-color: var(--brand);
      box-shadow: 0 0 0 4px var(--brand-light), var(--shadow-md);
    }
    .plan-featured:hover { box-shadow: 0 0 0 4px var(--brand-light), var(--shadow-xl); }

    .plan-popular {
      position: absolute; top: -14px; left: 50%; transform: translateX(-50%);
      background: var(--brand); color: white;
      padding: .3rem 1rem; border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 700; white-space: nowrap;
      box-shadow: var(--shadow-brand);
    }

    .plan-top { display: flex; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-5); }
    .plan-icon {
      width: 44px; height: 44px; flex-shrink: 0; border-radius: var(--radius-md);
      background: var(--gray-100); color: var(--gray-600);
      display: flex; align-items: center; justify-content: center;
    }
    .plan-icon-featured { background: var(--brand-subtle); color: var(--brand); }
    .plan-name { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px; }
    .plan-desc { font-size: .8125rem; color: var(--text-muted); margin: 0; line-height: 1.5; }

    .plan-price { margin-bottom: var(--space-4); }
    .price-main { font-size: 2.25rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .price-period { font-size: .875rem; color: var(--text-muted); margin-left: 4px; }
    .price-forever { display: block; font-size: .8125rem; color: var(--text-muted); margin-top: 4px; }
    .price-saving {
      display: inline-block; margin-left: 8px;
      font-size: .75rem; font-weight: 700; color: var(--success);
      background: var(--success-bg); padding: .15rem .5rem; border-radius: var(--radius-full);
    }


    .plan-cta {
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      padding: .75rem 1.25rem; border-radius: var(--radius-md); font-weight: 600;
      font-size: .9375rem; text-decoration: none; margin-bottom: var(--space-5);
      border: 1.5px solid var(--border); color: var(--text-secondary); background: white;
      transition: all var(--t-fast);
    }
    .plan-cta:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
    .plan-cta-featured {
      background: var(--brand); color: white; border-color: var(--brand);
      box-shadow: var(--shadow-brand);
    }
    .plan-cta-featured:hover { background: var(--brand-dark); border-color: var(--brand-dark); color: white; }

    .plan-features { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .plan-features li {
      display: flex; align-items: flex-start; gap: var(--space-2);
      font-size: .875rem; color: var(--text-secondary); line-height: 1.4;
    }
    .plan-features li svg { flex-shrink: 0; color: var(--success); margin-top: 1px; }
    .plan-features li.feature-disabled { opacity: .45; }
    .plan-features li.feature-disabled svg { color: var(--text-muted); }

    .plan-card-skeleton {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-2xl); padding: var(--space-6);
    }

    /* ── Social proof ─────────────────────────────── */
    .proof-section { padding: var(--space-10) var(--space-6) var(--space-12); }
    .proof-inner {
      display: flex; align-items: center; justify-content: center;
      flex-wrap: wrap; gap: var(--space-8); max-width: 860px; margin: 0 auto;
    }
    .proof-stat { text-align: center; }
    .proof-num   { display: block; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1.2; }
    .proof-label { display: block; font-size: .8125rem; color: var(--text-muted); margin-top: 4px; }
    .proof-divider { width: 1px; height: 40px; background: var(--border); flex-shrink: 0; }
    @media (max-width: 640px) { .proof-divider { display: none; } }

    /* ── FAQ ─────────────────────────────────────── */
    .faq-section { padding: 0 var(--space-6) var(--space-12); max-width: 960px; margin: 0 auto; }
    .faq-title {
      text-align: center; font-family: var(--font-display);
      font-size: 2rem; margin-bottom: var(--space-8); color: var(--text-primary);
    }
    .faq-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    @media (max-width: 640px) { .faq-grid { grid-template-columns: 1fr; } }
    .faq-item {
      background: var(--gray-50); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6);
    }
    .faq-q { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-2); font-family: var(--font-body); }
    .faq-a { font-size: .875rem; color: var(--text-muted); margin: 0; line-height: 1.6; }

    /* ── CTA footer ───────────────────────────────── */
    .cta-section { padding: 0 var(--space-6) var(--space-16); }
    .cta-inner {
      max-width: 680px; margin: 0 auto; text-align: center;
      background: linear-gradient(135deg, #B03020 0%, #7A1A10 100%);
      border-radius: var(--radius-2xl); padding: var(--space-12) var(--space-8);
    }
    .cta-title { font-family: var(--font-display); font-size: 2rem; color: white; margin: 0 0 var(--space-3); }
    .cta-sub   { color: rgba(255,255,255,.7); margin: 0 0 var(--space-8); }
    .cta-inner .btn-primary {
      background: white; color: var(--brand);
      box-shadow: 0 4px 20px rgba(0,0,0,.2);
    }
    .cta-inner .btn-primary:hover { background: var(--gray-50); transform: translateY(-2px); }
  `],
})
export class PricingComponent implements OnInit {
  private readonly subscriptionService = inject(SubscriptionService)

  readonly plans   = signal<Plan[]>([])
  readonly loading = signal(true)
  readonly cycle   = signal<BillingCycle>('monthly')

  /** Index of the featured plan: middle plan by position */
  readonly featuredIndex = computed(() => Math.floor(this.plans().length / 2))

  /** Best saving % across all paid plans (for the toggle pill) */
  readonly bestSavingPct = computed(() => {
    const paidPlans = this.plans().filter(p => p.priceMonthlyCents > 0)
    if (!paidPlans.length) return 0
    const savings = paidPlans.map(p => this.savingPct(p))
    return Math.max(...savings)
  })

  ngOnInit(): void {
    this.subscriptionService.getPublicPlans().subscribe({
      next: (plans) => { this.plans.set(plans); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  isFeatured(index: number): boolean {
    return index === this.featuredIndex()
  }

  private readonly FEATURE_DEFS: Array<{
    key: string
    label: (p: Plan) => string
    value: (p: Plan) => boolean
  }> = [
    {
      key: 'qr',
      label: () => 'Menu digital & QR code',
      value: () => true,
    },
    {
      key: 'categories',
      label: (p) => p.maxCategories === -1 ? 'Catégories illimitées' : `${p.maxCategories} catégories de menu`,
      value: () => true,
    },
    {
      key: 'items',
      label: (p) => p.maxMenuItems === -1 ? 'Plats illimités' : `${p.maxMenuItems} plats maximum`,
      value: () => true,
    },
    {
      key: 'users',
      label: (p) => p.maxUsers === -1 ? 'Caissiers illimités' : p.maxUsers <= 1 ? '1 utilisateur' : `${p.maxUsers} caissiers`,
      value: () => true,
    },
    {
      key: 'templates',
      label: () => '5 templates visuels',
      value: () => true,
    },
    {
      key: 'orders_and_reservations',
      label: () => 'Commandes & réservations en ligne',
      value: (p) => !!(p.features?.['orders_and_reservations']) || p.slug === 'pro' || p.slug === 'enterprise',
    },
    {
      key: 'stats',
      label: () => 'Statistiques avancées',
      value: (p) => !!(p.features?.['stats']) || p.slug === 'pro' || p.slug === 'enterprise',
    },
    {
      key: 'priority_support',
      label: (p) => p.slug === 'enterprise' ? 'Support 24/7 & SLA garanti' : 'Support prioritaire',
      value: (p) => !!(p.features?.['priority_support']) || p.slug === 'pro' || p.slug === 'enterprise',
    },
    {
      key: 'api_access',
      label: () => 'API dédiée',
      value: (p) => !!(p.features?.['api_access']) || p.slug === 'enterprise',
    },
    {
      key: 'gift_qr',
      label: () => 'QR codes cadeaux',
      value: (p) => !!(p.features?.['gift_qr']) || p.slug === 'enterprise',
    },
    {
      key: 'finance',
      label: () => 'Gestion financière complète',
      value: (p) => !!(p.features?.['financial_management']) || !!(p.features?.['api_access']) || p.slug === 'enterprise',
    },
  ]

  featureEntries(plan: Plan): { key: string; label: string; value: boolean }[] {
    return this.FEATURE_DEFS.map(def => ({
      key: def.key,
      label: def.label(plan),
      value: def.value(plan),
    }))
  }

  /** Yearly saving % compared to paying monthly × 12 */
  savingPct(plan: Plan): number {
    if (!plan.priceMonthlyCents || !plan.priceYearlyCents) return 0
    const monthly12 = plan.priceMonthlyCents * 12
    const pct = Math.round((1 - plan.priceYearlyCents / monthly12) * 100)
    return Math.max(0, pct)
  }

  formatPrice(plan: Plan, cycle: BillingCycle): string {
    const cents  = cycle === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents
    const amount = cents / 100
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
  }
}
