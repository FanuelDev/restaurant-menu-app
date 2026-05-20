import { Component, inject, computed, signal, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'
import { StatsService } from '../../shared/services/stats.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import type { StatsData } from '../../shared/models'

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  templateUrl: './stats.component.html',
  styles: [`
    .page-container { max-width: 1000px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-8); }
    .page-title  { font-family: var(--font-display); font-size: 1.875rem; margin: 0 0 var(--space-1); color: var(--text-primary); line-height: 1.15; }
    .page-subtitle { color: var(--text-muted); margin: 0; font-size: .9375rem; }

    /* Upgrade */
    .upgrade-card {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-12) var(--space-8); text-align: center;
      display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
    }
    .upgrade-icon { font-size: 3rem; line-height: 1; }
    .upgrade-title { font-size: 1.5rem; font-weight: 700; margin: 0; }
    .upgrade-desc { font-size: .9375rem; color: var(--text-secondary); max-width: 480px; line-height: 1.7; margin: 0; }
    .btn { display: inline-flex; align-items: center; padding: .625rem 1.5rem; border-radius: var(--radius-md); font-weight: 600; font-size: .9375rem; cursor: pointer; border: none; text-decoration: none; transition: all .2s; }
    .btn-primary { background: var(--color-brand); color: white; }
    .btn-primary:hover { background: var(--color-brand-dark); }

    /* Skeleton */
    .stats-skeleton { display: flex; flex-direction: column; gap: var(--space-5); }
    .skeleton-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4); }
    .skeleton-card, .skeleton-chart {
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    .skeleton-card  { height: 100px; }
    .skeleton-chart { height: 260px; }

    /* Overview cards */
    .overview-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    @media (max-width: 768px) { .overview-grid { grid-template-columns: repeat(2, 1fr); } }

    .stat-card {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-1);
      animation: slideUpFade .4s var(--ease-spring) both;
    }
    .stat-card-accent { border-color: var(--color-brand); background: linear-gradient(135deg, white 60%, color-mix(in srgb, var(--color-brand) 6%, white)); }
    .stat-label { font-size: .75rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .stat-value { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; font-family: var(--font-display); }
    .stat-sub { font-size: .75rem; color: var(--text-muted); }
    .stat-growth { font-weight: 600; }
    .growth-pos { color: var(--success); }
    .growth-neg { color: var(--error); }

    /* Chart */
    .chart-card {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-6); margin-bottom: var(--space-5);
      animation: slideUpFade .45s var(--ease-spring) .1s both;
    }
    .chart-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: var(--space-5); }
    .chart-title { font-size: 1rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .chart-range { font-size: .75rem; color: var(--text-muted); }

    .chart-empty { text-align: center; padding: var(--space-8) 0; color: var(--text-muted); }
    .chart-empty p { margin: 0 0 var(--space-2); font-size: .9375rem; }
    .chart-empty-hint { font-size: .8125rem !important; color: var(--text-muted); opacity: .7; }

    .chart-wrap { display: flex; gap: var(--space-3); align-items: stretch; }
    .y-axis {
      display: flex; flex-direction: column; justify-content: space-between;
      align-items: flex-end; padding-bottom: 24px;
      font-size: .6875rem; color: var(--text-muted); min-width: 28px;
    }
    .chart-svg-wrap { flex: 1; position: relative; }
    .chart-svg { width: 100%; height: 180px; display: block; overflow: visible; }
    .chart-bar { transition: opacity .15s; cursor: default; }
    .chart-bar:hover { opacity: .8; }
    .x-axis {
      position: relative; height: 24px; margin-top: 4px;
      font-size: .6875rem; color: var(--text-muted);
    }
    .x-axis span { position: absolute; transform: translateX(-50%); white-space: nowrap; }

    /* Bottom grid */
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); margin-bottom: var(--space-5); }
    @media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }

    .list-card {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-6); animation: slideUpFade .5s var(--ease-spring) .15s both;
    }
    .list-title { font-size: .9375rem; font-weight: 700; margin: 0 0 var(--space-1); color: var(--text-primary); }
    .list-desc { font-size: .8125rem; color: var(--text-muted); margin: 0 0 var(--space-4); }
    .list-empty { color: var(--text-muted); font-size: .875rem; padding: var(--space-4) 0; }

    /* Top items */
    .top-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .top-item { display: flex; align-items: center; gap: var(--space-3); }
    .rank { font-size: .75rem; font-weight: 700; color: var(--text-muted); min-width: 16px; text-align: right; }
    .item-thumb {
      width: 36px; height: 36px; border-radius: var(--radius-md); overflow: hidden;
      background: var(--gray-100); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .item-thumb img { width: 100%; height: 100%; object-fit: cover; }
    .item-thumb-placeholder { font-size: 1.125rem; }
    .item-info { flex: 1; min-width: 0; }
    .item-name { display: block; font-size: .875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-cat  { display: block; font-size: .75rem; color: var(--text-muted); margin-top: 1px; }
    .item-badge {
      font-size: .65rem; font-weight: 700; padding: 2px 6px;
      border-radius: var(--radius-full); white-space: nowrap; flex-shrink: 0;
    }
    .badge-new        { background: #dbeafe; color: #1d4ed8; }
    .badge-popular    { background: #fef3c7; color: #b45309; }
    .badge-vegetarian { background: #dcfce7; color: #15803d; }
    .badge-spicy      { background: #fee2e2; color: #b91c1c; }
    .item-price { font-size: .8125rem; font-weight: 700; color: var(--color-brand); white-space: nowrap; flex-shrink: 0; }

    /* Top categories */
    .cat-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--space-3); }
    .cat-item { display: flex; align-items: center; gap: var(--space-3); }
    .cat-name { font-size: .875rem; font-weight: 500; color: var(--text-primary); min-width: 90px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cat-bar-wrap { flex: 1; height: 6px; background: var(--gray-100); border-radius: 99px; overflow: hidden; }
    .cat-bar { height: 100%; background: var(--color-brand); border-radius: 99px; transition: width .6s var(--ease-spring); }
    .cat-count { font-size: .75rem; color: var(--text-muted); white-space: nowrap; min-width: 52px; text-align: right; flex-shrink: 0; }

    .tracking-note { font-size: .75rem; color: var(--text-muted); margin: 0; }
  `],
})
export class StatsComponent implements OnInit {
  private readonly authService = inject(AuthService)
  private readonly statsService = inject(StatsService)
  private readonly restaurantService = inject(RestaurantService)

  readonly hasAccess = computed(() => {
    const slug = this.authService.restaurant()?.plan?.slug
    return slug === 'pro' || slug === 'enterprise'
  })

  readonly data    = signal<StatsData | null>(null)
  readonly loading = signal(true)

  readonly svgW = 600
  readonly svgH = 180

  readonly chartMax = computed(() => {
    const views = this.data()?.dailyViews ?? []
    const max = Math.max(...views.map((d) => d.count), 1)
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
    return Math.ceil(max / magnitude) * magnitude
  })

  readonly barStep = computed(() => this.svgW / (this.data()?.dailyViews.length ?? 30))

  readonly yTicks = computed(() => {
    const max = this.chartMax()
    return [max, Math.round(max * 0.5), 0].reverse()
  })

  readonly catBarMax = computed(() =>
    Math.max(...(this.data()?.topCategories.map((c) => c.itemCount) ?? [1]), 1)
  )

  ngOnInit(): void {
    if (!this.hasAccess()) { this.loading.set(false); return }
    this.statsService.getStats().subscribe({
      next: (d) => { this.data.set(d); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  catBarPct(count: number): number {
    return Math.round((count / this.catBarMax()) * 100)
  }

  formatPrice(amount: number): string {
    const currency = this.restaurantService.restaurant()?.currency ?? 'XOF'
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
    } catch {
      return `${amount} ${currency}`
    }
  }

  badgeLabel(badge: string, t: (key: string) => string): string {
    const map: Record<string, string> = {
      new: t('menuItems.badgeNew'),
      popular: t('menuItems.badgePopular'),
      vegetarian: t('menuItems.badgeVegetarian'),
      spicy: t('menuItems.badgeSpicy'),
    }
    return map[badge] ?? badge
  }
}
