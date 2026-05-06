import { Component, inject, OnInit, signal, computed, ElementRef, ViewChild, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { MenuService } from '../../shared/services/menu.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { AuthService } from '../../shared/services/auth.service'
import { QrCodeService } from '../../shared/services/qrcode.service'

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="dashboard">

      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('dashboard.greeting', { name: firstName() }) }}</h1>
          <p class="page-subtitle">{{ t('dashboard.subtitle') }}</p>
        </div>
        <a [href]="menuUrl()" target="_blank" rel="noopener" class="btn btn-outline">
          <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.7">
            <path d="M1 9s3.5-7 8-7 8 7 8 7-3.5 7-8 7-8-7-8-7z"/>
            <circle cx="9" cy="9" r="2.5"/>
          </svg>
          {{ t('dashboard.viewMenu') }}
        </a>
      </header>

      <!-- KPI cards -->
      <div class="kpi-grid">
        <a routerLink="/admin/categories" class="kpi-card animate-up delay-1">
          <div class="kpi-icon kpi-icon-brand">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M2 2.5h5.5l8 8-5.5 5.5-8-8V2.5z" stroke-linejoin="round"/>
              <circle cx="5.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ categories().length }}</div>
            <div class="kpi-label">{{ t('dashboard.categories') }}</div>
          </div>
          <div class="kpi-arrow">→</div>
        </a>

        <a routerLink="/admin/menu-items" class="kpi-card animate-up delay-2">
          <div class="kpi-icon kpi-icon-slate">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M4 1v4a2 2 0 002 2v9"/>
              <path d="M6 1v4M8 1v4"/>
              <path d="M13 1c0 0 2 1.2 2 5.5h-4C11 2.2 13 1 13 1z"/>
              <path d="M13 6.5V17"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ totalItems() }}</div>
            <div class="kpi-label">{{ t('dashboard.totalItems') }}</div>
          </div>
          <div class="kpi-arrow">→</div>
        </a>

        <div class="kpi-card kpi-card-success animate-up delay-3">
          <div class="kpi-icon kpi-icon-success">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M3 9l4 4 8-8" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ availableItems() }}</div>
            <div class="kpi-label">{{ t('dashboard.available') }}</div>
          </div>
          <div class="kpi-percent">
            @if (totalItems() > 0) {
              {{ (availableItems() / totalItems() * 100) | number:'1.0-0' }}%
            }
          </div>
        </div>

        <div class="kpi-card kpi-card-warning animate-up delay-4">
          <div class="kpi-icon kpi-icon-warning">
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M9 3v6M9 13v1.5" stroke-linejoin="round"/>
              <path d="M1.5 15L9 2.5l7.5 12.5z" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="kpi-body">
            <div class="kpi-value">{{ unavailableItems() }}</div>
            <div class="kpi-label">{{ t('dashboard.unavailable') }}</div>
          </div>
        </div>
      </div>

      <!-- Bottom row -->
      <div class="bottom-row">

        <!-- Left column: restaurant info + QR code -->
        <div class="left-col">

          <!-- Restaurant card -->
          @if (restaurant()) {
            <div class="restaurant-card animate-up delay-3">
              <div class="rc-header">
                <h2 class="rc-title">{{ t('dashboard.yourRestaurant') }}</h2>
                <a routerLink="/admin/restaurant" class="btn btn-sm btn-outline">{{ t('dashboard.edit') }}</a>
              </div>
              <div class="rc-body">
                @if (restaurant()!.logoUrl) {
                  <img [src]="restaurant()!.logoUrl" [alt]="restaurant()!.name" class="rc-logo" />
                } @else {
                  <div class="rc-logo-placeholder" [style.background]="restaurant()!.brandColor + '22'" [style.color]="restaurant()!.brandColor">
                    {{ restaurant()!.name[0] }}
                  </div>
                }
                <div class="rc-info">
                  <h3 class="rc-name">{{ restaurant()!.name }}</h3>
                  @if (restaurant()!.slogan) {
                    <p class="rc-slogan">{{ restaurant()!.slogan }}</p>
                  }
                  <div class="rc-meta">
                    <div class="rc-color-dot" [style.background]="restaurant()!.brandColor"></div>
                    <span>{{ restaurant()!.brandColor }}</span>
                    <span class="rc-sep">·</span>
                    <span class="badge" [class]="subscriptionBadgeClass()">{{ subscriptionLabel(t) }}</span>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- QR Code card -->
          @if (restaurant()) {
            <div class="qr-card animate-up delay-4">
              <div class="qr-header">
                <div class="qr-title-wrap">
                  <h2 class="qr-title">{{ t('dashboard.qrCode') }}</h2>
                  <p class="qr-desc">{{ t('dashboard.qrDescription') }}</p>
                </div>
                <button
                  class="btn btn-primary btn-sm"
                  (click)="downloadQr()"
                  [disabled]="qrLoading()"
                >
                  @if (qrLoading()) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="spin">
                      <path d="M21 12a9 9 0 11-6.219-8.56"/>
                    </svg>
                  } @else {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  }
                  {{ t('dashboard.downloadPng') }}
                </button>
              </div>

              <div class="qr-body">
                <!-- QR code preview -->
                <div class="qr-preview-wrap">
                  @if (qrDataUrl()) {
                    <img [src]="qrDataUrl()!" alt="QR Code menu" class="qr-img" />
                  } @else {
                    <div class="qr-skeleton shimmer"></div>
                  }
                </div>

                <!-- URL + info -->
                <div class="qr-info">
                  <div class="qr-url-block">
                    <span class="qr-url-label">{{ t('dashboard.menuUrl') }}</span>
                    <a [href]="menuUrl()" target="_blank" rel="noopener" class="qr-url">{{ menuUrl() }}</a>
                  </div>
                  <div class="qr-tips">
                    <div class="qr-tip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      {{ t('dashboard.qrTip1') }}
                    </div>
                    <div class="qr-tip">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      </svg>
                      {{ t('dashboard.qrTip2') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Right column: quick actions -->
        <div class="quick-actions animate-up delay-4">
          <h2 class="qa-title">{{ t('dashboard.quickActions') }}</h2>
          <div class="qa-grid">
            <a routerLink="/admin/categories" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M9 3v12M3 9h12" stroke-linecap="round"/>
                </svg>
              </div>
              <span>{{ t('dashboard.quickCategory') }}</span>
            </a>
            <a routerLink="/admin/menu-items" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
                  <path d="M4 1v4a2 2 0 002 2v9"/><path d="M6 1v4M8 1v4"/>
                  <path d="M13 1c0 0 2 1.2 2 5.5h-4C11 2.2 13 1 13 1z"/>
                  <path d="M13 6.5V17"/>
                </svg>
              </div>
              <span>{{ t('dashboard.quickItem') }}</span>
            </a>
            <a routerLink="/admin/restaurant" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <circle cx="9" cy="9" r="2.5"/>
                  <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke-linecap="round"/>
                </svg>
              </div>
              <span>{{ t('dashboard.quickBranding') }}</span>
            </a>
            <a [href]="menuUrl()" target="_blank" rel="noopener" class="qa-item">
              <div class="qa-icon">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                  <path d="M1 9s3.5-7 8-7 8 7 8 7-3.5 7-8 7-8-7-8-7z"/>
                  <circle cx="9" cy="9" r="2.5"/>
                </svg>
              </div>
              <span>{{ t('dashboard.viewMenu') }}</span>
            </a>
          </div>

          <!-- Subscription status -->
          @if (restaurant()) {
            <div class="sub-status" [class.sub-active]="restaurant()!.subscriptionStatus === 'active'"
                 [class.sub-trial]="restaurant()!.subscriptionStatus === 'trialing'"
                 [class.sub-expired]="restaurant()!.subscriptionStatus === 'canceled'">
              <div class="sub-dot"></div>
              <div class="sub-info">
                <span class="sub-label">{{ subscriptionLabel(t) }}</span>
                @if (restaurant()!.subscriptionStatus === 'trialing' && restaurant()!.trialEndsAt) {
                  <span class="sub-detail">{{ t('dashboard.trialUntil', { date: (restaurant()!.trialEndsAt | date:'d MMM yyyy') }) }}</span>
                } @else if (restaurant()!.subscriptionStatus === 'active') {
                  <span class="sub-detail">{{ t('dashboard.plan', { name: restaurant()!.plan?.name ?? '' }) }}</span>
                }
              </div>
              @if (restaurant()!.subscriptionStatus !== 'active') {
                <a routerLink="/admin/subscription" class="btn btn-sm btn-primary" style="margin-left:auto">{{ t('dashboard.upgradePro') }}</a>
              }
            </div>
          }
        </div>

      </div>
    </div>
    </ng-container>
  `,
  styles: [`
    .dashboard { max-width: 1000px; }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-5);
      display: flex; align-items: flex-start; gap: var(--space-4);
      position: relative; text-decoration: none; color: inherit;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
    }
    .kpi-card-success { border-left: 3px solid var(--success); }
    .kpi-card-warning { border-left: 3px solid var(--warning); }

    .kpi-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon-brand   { background: var(--brand-subtle); color: var(--brand); }
    .kpi-icon-slate   { background: var(--gray-100); color: var(--gray-600); }
    .kpi-icon-success { background: var(--success-bg); color: var(--success); }
    .kpi-icon-warning { background: var(--warning-bg); color: var(--warning); }

    .kpi-body { flex: 1; }
    .kpi-value { font-size: 1.875rem; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .kpi-label { font-size: .8125rem; color: var(--text-muted); margin-top: 4px; }
    .kpi-arrow { position: absolute; top: var(--space-4); right: var(--space-4); color: var(--gray-300); font-size: 1.125rem; }
    .kpi-percent { position: absolute; top: var(--space-4); right: var(--space-4); font-size: .8125rem; font-weight: 600; color: var(--success); }

    /* Bottom row */
    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: var(--space-4);
      align-items: start;
    }
    @media (max-width: 900px) { .bottom-row { grid-template-columns: 1fr; } }

    .left-col { display: flex; flex-direction: column; gap: var(--space-4); }

    /* Restaurant card */
    .restaurant-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-6);
    }
    .rc-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--space-5);
    }
    .rc-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); margin: 0; }
    .rc-body { display: flex; align-items: center; gap: var(--space-5); }
    .rc-logo { width: 64px; height: 64px; border-radius: var(--radius-lg); object-fit: cover; border: 1px solid var(--border); flex-shrink: 0; }
    .rc-logo-placeholder {
      width: 64px; height: 64px; border-radius: var(--radius-lg); flex-shrink: 0;
      font-size: 1.5rem; font-weight: 700; font-family: var(--font-display);
      display: flex; align-items: center; justify-content: center;
    }
    .rc-info { flex: 1; }
    .rc-name   { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .rc-slogan { color: var(--text-muted); font-style: italic; font-size: .875rem; margin: 0 0 var(--space-2); }
    .rc-meta {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: .8125rem; color: var(--text-muted);
    }
    .rc-color-dot { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--border); flex-shrink: 0; }
    .rc-sep { color: var(--gray-300); }

    /* QR Code card */
    .qr-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-6);
    }
    .qr-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: var(--space-4); margin-bottom: var(--space-5);
    }
    .qr-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); margin: 0 0 2px; }
    .qr-desc  { font-size: .8rem; color: var(--text-muted); margin: 0; }

    .qr-body {
      display: flex; gap: var(--space-6); align-items: flex-start;
    }

    .qr-preview-wrap {
      flex-shrink: 0;
    }
    .qr-img {
      width: 140px; height: 140px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      display: block;
    }
    .qr-skeleton {
      width: 140px; height: 140px;
      border-radius: var(--radius-lg);
    }

    .qr-info { flex: 1; min-width: 0; }
    .qr-url-block { margin-bottom: var(--space-4); }
    .qr-url-label {
      font-size: .7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--text-muted); display: block; margin-bottom: 4px;
    }
    .qr-url {
      font-size: .78rem; color: var(--brand); word-break: break-all;
      text-decoration: none; font-family: 'SF Mono', 'Consolas', monospace;
      &:hover { text-decoration: underline; }
    }

    .qr-tips { display: flex; flex-direction: column; gap: var(--space-2); }
    .qr-tip {
      display: flex; align-items: flex-start; gap: var(--space-2);
      font-size: .75rem; color: var(--text-muted); line-height: 1.4;
      svg { margin-top: 1px; flex-shrink: 0; color: var(--gray-400); }
    }

    .spin {
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Quick actions */
    .quick-actions {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-6);
    }
    .qa-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); margin: 0 0 var(--space-4); }
    .qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-4); }
    .qa-item {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-4); background: var(--gray-50); border-radius: var(--radius-md);
      text-decoration: none; color: var(--text-secondary); font-size: .8125rem; font-weight: 500;
      border: 1px solid var(--border); transition: all var(--t-fast); text-align: center;
      &:hover { background: var(--brand-subtle); border-color: var(--brand-light); color: var(--brand); }
    }
    .qa-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: white; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      transition: all var(--t-fast);
    }
    .qa-item:hover .qa-icon { background: var(--brand); border-color: var(--brand); color: white; }

    /* Subscription status pill */
    .sub-status {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--gray-50);
    }
    .sub-active { background: var(--success-bg); border-color: #86efac; }
    .sub-trial  { background: #eff6ff; border-color: #93c5fd; }
    .sub-expired { background: #fff7ed; border-color: #fdba74; }

    .sub-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      background: var(--gray-300);
    }
    .sub-active .sub-dot  { background: var(--success); box-shadow: 0 0 0 3px #bbf7d0; animation: pulse 2s infinite; }
    .sub-trial  .sub-dot  { background: #3b82f6; box-shadow: 0 0 0 3px #bfdbfe; animation: pulse 2s infinite; }
    .sub-expired .sub-dot { background: #f97316; }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, currentColor 30%, transparent); }
      50%       { box-shadow: 0 0 0 6px color-mix(in srgb, currentColor 10%, transparent); }
    }

    .sub-info { display: flex; flex-direction: column; gap: 2px; }
    .sub-label  { font-size: .8rem; font-weight: 600; color: var(--text-primary); }
    .sub-detail { font-size: .75rem; color: var(--text-muted); }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly menuService       = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly authService       = inject(AuthService)
  private readonly qrCodeService     = inject(QrCodeService)
  private readonly transloco         = inject(TranslocoService)

  readonly user        = this.authService.user
  readonly restaurant  = this.restaurantService.restaurant
  readonly categories  = this.menuService.categories
  readonly menuItems   = this.menuService.menuItems
  readonly totalItems       = computed(() => this.menuItems().length)
  readonly availableItems   = computed(() => this.menuItems().filter((i) => i.isAvailable).length)
  readonly unavailableItems = computed(() => this.menuItems().filter((i) => !i.isAvailable).length)
  readonly qrDataUrl        = signal<string | null>(null)
  readonly qrLoading        = signal(false)

  readonly firstName = computed(() => {
    const name = this.user()?.fullName || 'Admin'
    return name.split(' ')[0]
  })

  readonly menuUrl = computed(() => {
    const slug = this.restaurant()?.slug ?? this.authService.getTenantSlug() ?? ''
    return this.qrCodeService.menuUrl(slug)
  })

  subscriptionLabel(t: (key: string) => string): string {
    const s = this.restaurant()?.subscriptionStatus
    if (s === 'active') return t('dashboard.subscriptionActive')
    if (s === 'trialing') return t('dashboard.subscriptionTrial')
    if (s === 'canceled') return t('dashboard.subscriptionExpired')
    return s ?? ''
  }

  readonly subscriptionBadgeClass = computed(() => {
    const s = this.restaurant()?.subscriptionStatus
    return s === 'active' ? 'badge badge-success' : s === 'trialing' ? 'badge badge-info' : 'badge badge-warning'
  })

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
    this.menuService.loadAdminItems().subscribe()
    this.restaurantService.loadAdmin().subscribe({
      next: () => this.generateQr(),
    })
  }

  ngAfterViewInit(): void {
    // Generate QR code if restaurant already loaded (e.g. signal updated before ngOnInit)
    if (this.restaurant() && !this.qrDataUrl()) {
      this.generateQr()
    }
  }

  private async generateQr(): Promise<void> {
    const url = this.menuUrl()
    if (!url) return
    const brandColor = this.restaurant()?.brandColor ?? '#111827'
    const dataUrl = await this.qrCodeService.generate(url, 400, brandColor)
    this.qrDataUrl.set(dataUrl)
  }

  async downloadQr(): Promise<void> {
    this.qrLoading.set(true)
    try {
      const url = this.menuUrl()
      const slug = this.restaurant()?.slug ?? 'menu'
      const brandColor = this.restaurant()?.brandColor ?? '#111827'
      await this.qrCodeService.download(url, `qrcode-menu-${slug}.png`, brandColor)
    } finally {
      this.qrLoading.set(false)
    }
  }
}
