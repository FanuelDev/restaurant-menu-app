import { Component, inject, computed, signal, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'
import { StatsService } from '../../shared/services/stats.service'
import type { StatsData } from '../../shared/models'

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('stats.title') }}</h1>
          <p class="page-subtitle">{{ t('stats.subtitle') }}</p>
        </div>
      </header>

      @if (!hasAccess()) {
        <div class="upgrade-card">
          <div class="upgrade-icon">📊</div>
          <h2 class="upgrade-title">{{ t('stats.proFeature') }}</h2>
          <p class="upgrade-desc">{{ t('stats.proDescription') }}</p>
          <a routerLink="/admin/subscription" class="btn btn-primary">{{ t('stats.upgradeBtn') }}</a>
        </div>

      } @else if (loading()) {
        <div class="stats-skeleton">
          <div class="skeleton-cards">
            @for (i of [1,2,3,4]; track i) { <div class="skeleton-card"></div> }
          </div>
          <div class="skeleton-chart"></div>
        </div>

      } @else if (data()) {
        <!-- Overview cards -->
        <div class="overview-grid">
          <div class="stat-card">
            <div class="stat-label">{{ t('stats.cardToday') }}</div>
            <div class="stat-value">{{ data()!.overview.viewsToday }}</div>
            <div class="stat-sub">{{ t('stats.cardTodayHint') }}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ t('stats.cardWeek') }}</div>
            <div class="stat-value">{{ data()!.overview.viewsThisWeek }}</div>
            <div class="stat-sub">{{ t('stats.cardWeekHint') }}</div>
          </div>
          <div class="stat-card stat-card-accent">
            <div class="stat-label">{{ t('stats.cardMonth') }}</div>
            <div class="stat-value">{{ data()!.overview.viewsThisMonth }}</div>
            <div class="stat-sub stat-growth" [class.growth-pos]="(data()!.overview.growthPct ?? 0) >= 0" [class.growth-neg]="(data()!.overview.growthPct ?? 0) < 0">
              @if (data()!.overview.growthPct !== null) {
                @if (data()!.overview.growthPct! >= 0) {
                  {{ t('stats.cardMonthGrowthPos', { value: data()!.overview.growthPct }) }}
                } @else {
                  {{ t('stats.cardMonthGrowth', { value: data()!.overview.growthPct }) }}
                }
              } @else {
                {{ t('stats.firstMonth') }}
              }
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-label">{{ t('stats.cardCatalog') }}</div>
            <div class="stat-value">{{ data()!.overview.totalItems }}</div>
            <div class="stat-sub">{{ t('stats.catalogDetail', { categories: data()!.overview.totalCategories }) }}</div>
          </div>
        </div>

        <!-- Daily views chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h2 class="chart-title">{{ t('stats.chartTitle') }}</h2>
            <span class="chart-range">{{ t('stats.chartSubtitle') }}</span>
          </div>

          @if (chartMax() === 0) {
            <div class="chart-empty">
              <p>{{ t('stats.chartEmpty') }}</p>
              <p class="chart-empty-hint">{{ t('stats.chartEmptyHint') }}</p>
            </div>
          } @else {
            <div class="chart-wrap">
              <!-- Y-axis labels -->
              <div class="y-axis">
                @for (tick of yTicks(); track tick) {
                  <span>{{ tick }}</span>
                }
              </div>
              <!-- SVG bar chart -->
              <div class="chart-svg-wrap">
                <svg [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH" preserveAspectRatio="none" class="chart-svg" [attr.aria-label]="t('stats.chartTitle')">
                  <!-- Grid lines -->
                  @for (tick of yTicks(); track tick) {
                    <line
                      x1="0" [attr.y1]="svgH - (tick / chartMax()) * svgH"
                      [attr.x2]="svgW" [attr.y2]="svgH - (tick / chartMax()) * svgH"
                      stroke="var(--border)" stroke-width="1"
                    />
                  }
                  <!-- Bars -->
                  @for (day of data()!.dailyViews; track day.date; let i = $index) {
                    <rect
                      [attr.x]="i * barStep() + barStep() * 0.15"
                      [attr.y]="day.count === 0 ? svgH : svgH - (day.count / chartMax()) * svgH"
                      [attr.width]="barStep() * 0.7"
                      [attr.height]="day.count === 0 ? 0 : (day.count / chartMax()) * svgH"
                      [attr.fill]="day.count === 0 ? 'var(--gray-100)' : 'var(--color-brand)'"
                      rx="2"
                      class="chart-bar"
                    >
                      <title>{{ day.date }} : {{ day.count }}</title>
                    </rect>
                  }
                </svg>
                <!-- X-axis labels (every 7 days) -->
                <div class="x-axis">
                  @for (day of data()!.dailyViews; track day.date; let i = $index) {
                    @if (i % 7 === 0 || i === 29) {
                      <span [style.left.%]="(i / 29) * 100">{{ day.date | date:'dd/MM' }}</span>
                    }
                  }
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Bottom grid: top items + top categories -->
        <div class="bottom-grid">

          <!-- Top plats -->
          <div class="list-card">
            <h2 class="list-title">{{ t('stats.topItemsTitle') }}</h2>
            <p class="list-desc">{{ t('stats.topItemsSubtitle') }}</p>
            @if (data()!.topItems.length === 0) {
              <div class="list-empty">{{ t('stats.topItemsEmpty') }}</div>
            } @else {
              <ul class="top-list">
                @for (item of data()!.topItems; track item.id; let i = $index) {
                  <li class="top-item">
                    <span class="rank">{{ i + 1 }}</span>
                    <div class="item-thumb">
                      @if (item.imageUrl) {
                        <img [src]="item.imageUrl" [alt]="item.name" />
                      } @else {
                        <span class="item-thumb-placeholder">🍽️</span>
                      }
                    </div>
                    <div class="item-info">
                      <span class="item-name">{{ item.name }}</span>
                      <span class="item-cat">{{ item.categoryName }}</span>
                    </div>
                    @if (item.badge) {
                      <span class="item-badge badge-{{ item.badge }}">{{ badgeLabel(item.badge, t) }}</span>
                    }
                    <span class="item-price">{{ formatPrice(item.priceInCents) }}</span>
                  </li>
                }
              </ul>
            }
          </div>

          <!-- Top catégories -->
          <div class="list-card">
            <h2 class="list-title">{{ t('stats.topCatsTitle') }}</h2>
            <p class="list-desc">{{ t('stats.topCatsSubtitle') }}</p>
            @if (data()!.topCategories.length === 0) {
              <div class="list-empty">{{ t('stats.topCatsEmpty') }}</div>
            } @else {
              <ul class="cat-list">
                @for (cat of data()!.topCategories; track cat.id; let i = $index) {
                  <li class="cat-item">
                    <span class="rank">{{ i + 1 }}</span>
                    <span class="cat-name">{{ cat.name }}</span>
                    <div class="cat-bar-wrap">
                      <div class="cat-bar" [style.width.%]="catBarPct(cat.itemCount)"></div>
                    </div>
                    <span class="cat-count">
                      {{ cat.itemCount > 1 ? t('stats.itemCountPlural', { count: cat.itemCount }) : t('stats.itemCount', { count: cat.itemCount }) }}
                    </span>
                  </li>
                }
              </ul>
            }
          </div>

        </div>

        <p class="tracking-note">{{ t('stats.footerNote') }}</p>
      }
    </div>
    </ng-container>
  `,
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

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(cents / 100)
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
