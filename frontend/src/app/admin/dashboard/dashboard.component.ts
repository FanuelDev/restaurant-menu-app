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
  templateUrl: './dashboard.component.html',
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
