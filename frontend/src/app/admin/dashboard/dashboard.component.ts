import { Component, inject, OnInit, signal, computed, AfterViewInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink, Router } from '@angular/router'
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
      background: var(--surface-1);
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
      background: var(--surface-1); border: 1px solid var(--border);
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
      background: var(--surface-1); border: 1px solid var(--border);
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
      background: var(--surface-1); border: 1px solid var(--border);
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
      background: var(--surface-1); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      transition: all var(--t-fast);
    }
    .qa-item:hover .qa-icon { background: var(--brand); border-color: var(--brand); color: white; }

    /* Onboarding checklist */
    .onboarding-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border: 1px solid #bfdbfe; border-radius: var(--radius-lg);
      padding: var(--space-5) var(--space-6); margin-bottom: var(--space-6);
      animation: slideUpFade .4s var(--ease-spring) both;
    }
    .ob-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-4); }
    .ob-title { font-size: 1rem; font-weight: 700; color: #1e40af; margin: 0; }
    .ob-progress-text { font-size: .8125rem; font-weight: 600; color: #1e40af; }
    .ob-bar { height: 6px; background: #bfdbfe; border-radius: 999px; margin-bottom: var(--space-4); overflow: hidden; }
    .ob-bar-fill { height: 100%; background: linear-gradient(90deg, #2563eb, #22c55e); border-radius: 999px; transition: width .5s var(--ease-spring); }
    .ob-steps { display: grid; grid-template-columns: repeat(2, 1fr); gap: var(--space-3); }
    @media(max-width:700px) { .ob-steps { grid-template-columns: 1fr; } }
    .ob-step {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-3); border-radius: var(--radius-md);
      text-decoration: none; color: inherit;
      background: rgba(255,255,255,.7); border: 1px solid rgba(59,130,246,.15);
      transition: all var(--t-fast);
      &:hover:not(.ob-done) { background: #fff; border-color: #93c5fd; transform: translateY(-1px); box-shadow: 0 2px 8px rgba(59,130,246,.1); }
    }
    .ob-step.ob-done { opacity: .6; }
    .ob-check {
      width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid #93c5fd; color: #93c5fd; font-size: .7rem;
      transition: all var(--t-fast);
    }
    .ob-done .ob-check { background: #22c55e; border-color: #22c55e; color: #fff; }
    .ob-step-label { font-size: .8125rem; font-weight: 500; color: var(--text-primary); }
    .ob-done .ob-step-label { text-decoration: line-through; color: var(--text-muted); }
    .ob-step-hint { font-size: .7rem; color: var(--text-muted); margin-top: 1px; }
    .ob-all-done {
      text-align: center; padding: var(--space-4);
      font-size: .9375rem; font-weight: 700; color: #166534;
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
    }

    /* QR share row */
    .qr-share-row { display: flex; gap: var(--space-2); margin-top: var(--space-4); flex-wrap: wrap; }
    .qr-share-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: var(--radius-md);
      font-size: .78rem; font-weight: 600; cursor: pointer;
      border: 1px solid var(--border); background: var(--surface-1); color: var(--text-secondary);
      text-decoration: none; transition: all var(--t-fast);
      &:hover { background: var(--gray-100); color: var(--text-primary); }
    }
    .qr-share-btn.wa  { border-color: #86efac; color: #166534; background: #f0fdf4; &:hover { background: #dcfce7; } }
    .qr-share-btn.copied { border-color: #93c5fd; color: #1e40af; background: #eff6ff; }

    /* Subscription status pill */
    .sub-status {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md); border: 1px solid var(--border);
      background: var(--gray-50);
    }
    .sub-active { background: var(--success-bg); border-color: #86efac; }
    .sub-trial  { background: rgba(37,99,235,0.12); border-color: rgba(37,99,235,0.3); }
    .sub-expired { background: rgba(234,88,12,0.12); border-color: rgba(234,88,12,0.3); }

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

    /* Poster download section */
    .poster-section {
      margin-top: var(--space-5);
      padding-top: var(--space-5);
      border-top: 1px solid var(--border);
    }
    .poster-section-title {
      font-size: .72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: .06em; color: var(--text-muted); margin: 0 0 var(--space-3);
    }
    .poster-designs {
      display: flex; gap: var(--space-3); margin-bottom: var(--space-4);
    }
    .design-card {
      flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
      padding: var(--space-2) var(--space-1); border-radius: var(--radius-md);
      border: 2px solid var(--border); background: transparent; cursor: pointer;
      transition: all var(--t-fast);
      &:hover:not(.design-locked) { border-color: var(--brand-light); }
    }
    .design-card.design-active { border-color: var(--brand); background: var(--brand-subtle); }
    .design-card.design-locked { cursor: not-allowed; opacity: .75; }
    .design-preview {
      width: 62px; height: 86px; border-radius: 5px; overflow: hidden;
      position: relative; flex-shrink: 0;
    }
    /* Icône fourchette/couteau partagée */
    .dp-icon {
      position: absolute; z-index: 2; left: 50%; transform: translateX(-50%);
    }
    /* Design 1 - Classique (blanc) */
    .dp-1 { background: #fff; border: 1px solid #e5e7eb; }
    .dp-1 .dp-bar { position: absolute; top: 0; left: 0; right: 0; height: 11px; background: var(--dp-color); }
    .dp-1 .dp-name-line { position: absolute; top: 14px; left: 9px; right: 9px; height: 2px; background: #1f2937; border-radius: 1px; }
    .dp-1 .dp-icon { top: 19px; color: #374151; }
    .dp-1 .dp-qr {
      position: absolute; top: 35px; left: 50%; transform: translateX(-50%);
      width: 22px; height: 22px; border-radius: 2px;
      background: repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 0 0/4px 4px;
    }
    .dp-1 .dp-url-line { position: absolute; bottom: 8px; left: 12px; right: 12px; height: 2px; background: var(--dp-color); border-radius: 1px; opacity: .7; }
    /* Design 2 - Élégante (sombre) */
    .dp-2 { background: #0f172a; }
    .dp-2 .dp-grad { position: absolute; top: 0; left: 0; right: 0; height: 16px; background: var(--dp-color); opacity: .55; }
    .dp-2 .dp-name-dark { position: absolute; top: 18px; left: 10px; right: 10px; height: 2px; background: rgba(255,255,255,.55); border-radius: 1px; }
    .dp-2 .dp-card { position: absolute; top: 24px; left: 7px; right: 7px; bottom: 7px; background: #fff; border-radius: 3px; }
    .dp-2 .dp-icon { top: 29px; color: #374151; }
    .dp-2 .dp-qr {
      position: absolute; top: 45px; left: 50%; transform: translateX(-50%);
      width: 22px; height: 22px; border-radius: 2px;
      background: repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 0 0/4px 4px;
    }
    /* Design 3 - Vivante (couleur brand) */
    .dp-3 { background: var(--dp-color); }
    .dp-3 .dp-circle-tl { position: absolute; top: -10px; right: -10px; width: 30px; height: 30px; border-radius: 50%; background: rgba(255,255,255,.15); }
    .dp-3 .dp-circle-br { position: absolute; bottom: -8px; left: -8px; width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,.10); }
    .dp-3 .dp-name-white { position: absolute; top: 8px; left: 10px; right: 10px; height: 2px; background: rgba(255,255,255,.85); border-radius: 1px; }
    .dp-3 .dp-card { position: absolute; top: 18px; left: 6px; right: 6px; bottom: 6px; background: #fff; border-radius: 4px; }
    .dp-3 .dp-icon { top: 24px; color: #374151; }
    .dp-3 .dp-qr {
      position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
      width: 22px; height: 22px; border-radius: 2px;
      background: repeating-conic-gradient(#111 0% 25%, #fff 0% 50%) 0 0/4px 4px;
    }
    .dp-lock {
      position: absolute; inset: 0; z-index: 3; border-radius: 5px;
      background: rgba(0,0,0,.48); display: flex; align-items: center; justify-content: center;
    }
    .design-name { font-size: .72rem; font-weight: 600; color: var(--text-primary); }
    .design-badge {
      font-size: .58rem; font-weight: 700; border-radius: var(--radius-full);
      padding: .1rem .35rem; line-height: 1.4;
    }
    .design-badge-free { background: var(--success-bg); color: var(--success); }
    .design-badge-pro  { background: #fef3c7; color: #92400e; }
    .poster-dl-btn { width: 100%; justify-content: center; }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private readonly menuService       = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly authService       = inject(AuthService)
  private readonly qrCodeService     = inject(QrCodeService)
  private readonly transloco         = inject(TranslocoService)
  private readonly router            = inject(Router)

  readonly user        = this.authService.user
  readonly restaurant  = this.restaurantService.restaurant
  readonly categories  = this.menuService.categories
  readonly menuItems   = this.menuService.menuItems
  readonly totalItems       = computed(() => this.menuItems().length)
  readonly availableItems   = computed(() => this.menuItems().filter((i) => i.isAvailable).length)
  readonly unavailableItems = computed(() => this.menuItems().filter((i) => !i.isAvailable).length)
  readonly qrDataUrl      = signal<string | null>(null)
  readonly qrLoading      = signal(false)
  readonly linkCopied     = signal(false)
  readonly menuShared     = signal(false)
  readonly selectedDesign = signal<1 | 2 | 3>(1)
  readonly posterLoading  = signal(false)

  readonly isPro = computed(() => {
    const features = ((this.authService.restaurant()?.plan as any)?.features ?? {}) as Record<string, boolean>
    return Object.values(features).some(Boolean)
  })

  readonly brandColor = computed(() => this.restaurant()?.brandColor ?? '#111827')

  // ── Onboarding checklist ──────────────────────────────────────────────────
  private readonly SHARED_KEY = () => `menu_shared_${this.authService.restaurant()?.id ?? ''}`

  readonly onboardingSteps = computed(() => [
    {
      label: 'Logo du restaurant',
      hint: 'Importez votre logo depuis Paramètres',
      done: !!this.restaurant()?.logoUrl,
      link: '/admin/restaurant',
    },
    {
      label: 'Première catégorie créée',
      hint: 'Ex : Entrées, Plats, Desserts…',
      done: this.categories().length > 0,
      link: '/admin/categories',
    },
    {
      label: 'Premier plat ajouté',
      hint: 'Ajoutez au moins un article à votre menu',
      done: this.menuItems().length > 0,
      link: '/admin/menu-items',
    },
    {
      label: 'Lien du menu partagé',
      hint: 'Copiez ou partagez votre QR code',
      done: this.menuShared(),
      link: '',
    },
  ])

  readonly onboardingProgress = computed(() => {
    const steps = this.onboardingSteps()
    return Math.round((steps.filter((s) => s.done).length / steps.length) * 100)
  })

  readonly showOnboarding = computed(() => this.onboardingProgress() < 100)

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
      next: () => {
        this.generateQr()
        this.menuShared.set(!!localStorage.getItem(this.SHARED_KEY()))
      },
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
      this.markShared()
    } finally {
      this.qrLoading.set(false)
    }
  }

  async copyMenuLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.menuUrl())
      this.linkCopied.set(true)
      this.markShared()
      setTimeout(() => this.linkCopied.set(false), 2500)
    } catch { /* ignore */ }
  }

  shareOnWhatsApp(): void {
    const msg = `Retrouvez notre menu en ligne : ${this.menuUrl()}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
    this.markShared()
  }

  selectDesign(n: 1 | 2 | 3): void {
    if (n !== 1 && !this.isPro()) {
      this.router.navigate(['/admin/subscription'])
      return
    }
    this.selectedDesign.set(n)
  }

  async downloadPoster(): Promise<void> {
    this.posterLoading.set(true)
    try {
      const design    = this.selectedDesign()
      const brand     = this.brandColor()
      const name      = this.restaurant()?.name ?? ''
      const slogan    = this.restaurant()?.slogan ?? ''
      const slug      = this.restaurant()?.slug ?? 'menu'
      const url       = this.menuUrl()
      const qrDataUrl = await this.qrCodeService.generate(url, 600, brand)
      const qrImg     = await this.loadImage(qrDataUrl)

      const canvas    = document.createElement('canvas')
      canvas.width    = 800
      canvas.height   = 1100
      const ctx       = canvas.getContext('2d')!

      if (design === 1)      this.drawDesign1(ctx, qrImg, name, slogan, url, brand)
      else if (design === 2) this.drawDesign2(ctx, qrImg, name, slogan, url, brand)
      else                   this.drawDesign3(ctx, qrImg, name, slogan, url, brand)

      canvas.toBlob((blob) => {
        if (!blob) return
        const dlUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = dlUrl
        a.download = `affiche-menu-${slug}-design${design}.png`
        a.click()
        URL.revokeObjectURL(dlUrl)
      }, 'image/png')

      this.markShared()
    } finally {
      this.posterLoading.set(false)
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  private fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    if (ctx.measureText(text).width <= maxWidth) return text
    let t = text
    while (ctx.measureText(t + '…').width > maxWidth && t.length > 0) t = t.slice(0, -1)
    return t + '…'
  }

  private drawDesign1(ctx: CanvasRenderingContext2D, qrImg: HTMLImageElement, name: string, slogan: string, url: string, brand: string): void {
    // Background blanc
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 800, 1100)

    // Bande couleur haut
    ctx.fillStyle = brand
    ctx.fillRect(0, 0, 800, 70)

    // Nom du restaurant
    ctx.textAlign = 'center'
    ctx.font = 'bold 38px Georgia, serif'
    ctx.fillStyle = '#111827'
    ctx.fillText(this.fitText(ctx, name, 680), 400, 145)

    // Slogan
    if (slogan) {
      ctx.font = 'italic 20px Georgia, serif'
      ctx.fillStyle = '#6b7280'
      ctx.fillText(this.fitText(ctx, slogan, 660), 400, 185)
    }

    // Ligne décorative
    ctx.strokeStyle = brand
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(280, 210)
    ctx.lineTo(520, 210)
    ctx.stroke()

    // Carte QR code
    const qrSize = 320
    const qrX = (800 - qrSize) / 2
    const qrY = 240
    ctx.fillStyle = '#f9fafb'
    this.roundRect(ctx, qrX - 24, qrY - 24, qrSize + 48, qrSize + 48, 20)
    ctx.fill()
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

    // CTA
    ctx.font = 'bold 22px Arial, sans-serif'
    ctx.fillStyle = '#111827'
    ctx.fillText('Scannez pour voir notre menu', 400, 680)

    // URL
    ctx.font = '15px monospace'
    ctx.fillStyle = brand
    ctx.fillText(this.fitText(ctx, url, 660), 400, 715)

    // Divider bas
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(80, 755); ctx.lineTo(720, 755); ctx.stroke()

    // Tips
    ctx.font = '14px Arial, sans-serif'
    ctx.fillStyle = '#9ca3af'
    ctx.fillText('Compatible avec tous les smartphones', 400, 790)
    ctx.fillText('Menu toujours a jour en temps reel', 400, 818)

    // Footer
    ctx.fillStyle = brand
    ctx.fillRect(0, 1055, 800, 45)
    ctx.font = 'bold 14px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Genere par SaeMenus', 400, 1083)
  }

  private drawDesign2(ctx: CanvasRenderingContext2D, qrImg: HTMLImageElement, name: string, slogan: string, url: string, brand: string): void {
    // Background sombre
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, 800, 1100)

    // Gradient top brand color
    const grad = ctx.createLinearGradient(0, 0, 0, 200)
    grad.addColorStop(0, brand)
    grad.addColorStop(1, 'rgba(15,23,42,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 800, 200)

    // Nom restaurant
    ctx.textAlign = 'center'
    ctx.font = 'bold 34px Georgia, serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(this.fitText(ctx, name, 680), 400, 110)

    // Slogan
    if (slogan) {
      ctx.font = 'italic 18px Georgia, serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText(this.fitText(ctx, slogan, 660), 400, 148)
    }

    // Petite ligne déco
    ctx.strokeStyle = brand
    ctx.lineWidth = 1.5
    ctx.globalAlpha = 0.6
    ctx.beginPath(); ctx.moveTo(320, 172); ctx.lineTo(480, 172); ctx.stroke()
    ctx.globalAlpha = 1

    // Carte blanche pour QR
    const cardX = 130, cardY = 195, cardW = 540, cardH = 660, cardR = 24
    ctx.fillStyle = '#ffffff'
    this.roundRect(ctx, cardX, cardY, cardW, cardH, cardR)
    ctx.fill()

    // Label "VOTRE MENU" dans la carte
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.fillStyle = brand
    ctx.letterSpacing = '0.1em'
    ctx.fillText('VOTRE MENU', 400, 248)
    ctx.letterSpacing = '0'

    // QR dans la carte
    const qrSize = 360
    const qrX = (800 - qrSize) / 2
    ctx.drawImage(qrImg, qrX, 268, qrSize, qrSize)

    // URL dans la carte
    ctx.font = '13px monospace'
    ctx.fillStyle = '#64748b'
    ctx.fillText(this.fitText(ctx, url, 480), 400, 672)

    // Accents décoratifs coins de la carte
    const accentSize = 14
    ctx.strokeStyle = brand
    ctx.lineWidth = 2
    // coin haut-gauche
    ctx.beginPath(); ctx.moveTo(cardX + 12, cardY + 12 + accentSize); ctx.lineTo(cardX + 12, cardY + 12); ctx.lineTo(cardX + 12 + accentSize, cardY + 12); ctx.stroke()
    // coin haut-droit
    ctx.beginPath(); ctx.moveTo(cardX + cardW - 12 - accentSize, cardY + 12); ctx.lineTo(cardX + cardW - 12, cardY + 12); ctx.lineTo(cardX + cardW - 12, cardY + 12 + accentSize); ctx.stroke()
    // coin bas-gauche
    ctx.beginPath(); ctx.moveTo(cardX + 12, cardY + cardH - 12 - accentSize); ctx.lineTo(cardX + 12, cardY + cardH - 12); ctx.lineTo(cardX + 12 + accentSize, cardY + cardH - 12); ctx.stroke()
    // coin bas-droit
    ctx.beginPath(); ctx.moveTo(cardX + cardW - 12 - accentSize, cardY + cardH - 12); ctx.lineTo(cardX + cardW - 12, cardY + cardH - 12); ctx.lineTo(cardX + cardW - 12, cardY + cardH - 12 - accentSize); ctx.stroke()

    // Texte bas
    ctx.font = 'italic 16px Georgia, serif'
    ctx.fillStyle = '#475569'
    ctx.fillText('Scannez et explorez notre carte', 400, 920)

    // Footer
    ctx.font = 'bold 13px Arial, sans-serif'
    ctx.fillStyle = '#334155'
    ctx.fillText('SaeMenus — Menu digital QR', 400, 1070)
  }

  private drawDesign3(ctx: CanvasRenderingContext2D, qrImg: HTMLImageElement, name: string, slogan: string, url: string, brand: string): void {
    // Background couleur brand
    ctx.fillStyle = brand
    ctx.fillRect(0, 0, 800, 1100)

    // Cercle décoratif haut-droit
    ctx.fillStyle = 'rgba(255,255,255,0.12)'
    ctx.beginPath(); ctx.arc(760, -30, 200, 0, Math.PI * 2); ctx.fill()

    // Cercle décoratif bas-gauche
    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.beginPath(); ctx.arc(40, 1080, 160, 0, Math.PI * 2); ctx.fill()

    // Cercle décoratif centre-droit (petit)
    ctx.fillStyle = 'rgba(255,255,255,0.07)'
    ctx.beginPath(); ctx.arc(740, 550, 90, 0, Math.PI * 2); ctx.fill()

    // Nom restaurant (grand)
    ctx.textAlign = 'center'
    ctx.font = 'bold 46px Georgia, serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(this.fitText(ctx, name, 700), 400, 120)

    // Slogan
    if (slogan) {
      ctx.font = 'italic 20px Georgia, serif'
      ctx.fillStyle = 'rgba(255,255,255,0.78)'
      ctx.fillText(this.fitText(ctx, slogan, 660), 400, 162)
    }

    // Carte blanche QR (plus grande)
    const cardX = 90, cardY = 195, cardW = 620, cardH = 690, cardR = 28
    ctx.fillStyle = '#ffffff'
    this.roundRect(ctx, cardX, cardY, cardW, cardH, cardR)
    ctx.fill()

    // "Scannez pour voir notre menu" en deux lignes dans la carte
    ctx.font = 'bold 18px Arial, sans-serif'
    ctx.fillStyle = brand
    ctx.fillText('Scannez pour voir notre menu', 400, 252)

    // QR dans la carte
    const qrSize = 380
    const qrX = (800 - qrSize) / 2
    ctx.drawImage(qrImg, qrX, 272, qrSize, qrSize)

    // URL
    ctx.font = '14px monospace'
    ctx.fillStyle = '#6b7280'
    ctx.fillText(this.fitText(ctx, url, 550), 400, 698)

    // Petite ligne sous l'url
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(200, 718); ctx.lineTo(600, 718); ctx.stroke()

    // Tagline sous la carte
    ctx.font = 'bold 20px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('Decouvrez notre carte digitale', 400, 950)

    // Petits points décoratifs
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    for (let i = 0; i < 7; i++) {
      ctx.beginPath()
      ctx.arc(280 + i * 40, 980, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    // Footer
    ctx.fillStyle = 'rgba(0,0,0,0.2)'
    ctx.fillRect(0, 1045, 800, 55)
    ctx.font = 'bold 14px Arial, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText('SaeMenus — Propulsez votre restaurant en ligne', 400, 1078)
  }

  private markShared(): void {
    localStorage.setItem(this.SHARED_KEY(), '1')
    this.menuShared.set(true)
  }
}
