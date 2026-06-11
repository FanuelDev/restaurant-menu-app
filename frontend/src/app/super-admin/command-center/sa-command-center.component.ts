import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  DestroyRef,
} from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { RouterLink } from '@angular/router'
import { FormsModule } from '@angular/forms'
import { interval, forkJoin } from 'rxjs'
import { switchMap, filter } from 'rxjs/operators'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { SaIntelligence, SaAlertRestaurant, Plan } from '../../shared/models'

@Component({
  selector: 'app-sa-command-center',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './sa-command-center.component.html',
  styles: [`
    /* ── Shell ─────────────────────────────────────────────────────────── */
    .cc { max-width: 1200px; }

    /* ── Header ──────────────────────────────────────────────────────── */
    .cc-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: var(--space-6); flex-wrap: wrap; gap: var(--space-3);
    }
    .cc-title { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 4px; }
    .cc-sub   { color: var(--text-muted); font-size: .875rem; margin: 0; display: flex; align-items: center; gap: var(--space-2); }
    .cc-header-right { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }

    .live-indicator {
      display: flex; align-items: center; gap: 6px;
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-full); padding: 5px 10px;
      font-size: .75rem; font-weight: 600; color: var(--text-secondary);
    }
    .live-dot {
      width: 7px; height: 7px; border-radius: 50%; background: var(--gray-400);
      transition: background .3s;
    }
    .live-dot.active { background: #22c55e; box-shadow: 0 0 0 3px rgba(34,197,94,.2); animation: pulse-dot 2s infinite; }
    @keyframes pulse-dot { 0%,100%{box-shadow:0 0 0 3px rgba(34,197,94,.2)} 50%{box-shadow:0 0 0 6px rgba(34,197,94,.08)} }

    .btn-icon {
      display: flex; align-items: center; gap: 6px;
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: 6px 12px;
      font-size: .8125rem; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; transition: all var(--t-fast);
      &:hover:not(:disabled) { background: var(--gray-50); color: var(--text-primary); }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
    .btn-icon.spinning svg { animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Alert banner ─────────────────────────────────────────────── */
    .alert-banner {
      display: flex; align-items: center; gap: var(--space-3);
      background: var(--error-bg); border: 1px solid var(--error-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4); margin-bottom: var(--space-5);
      font-size: .875rem; font-weight: 600; color: var(--error);
      animation: slideUpFade .3s var(--ease-spring) both;
    }
    .alert-banner.warning { background: var(--warning-bg); border-color: var(--warning-border); color: var(--warning); }

    /* ── KPI Strip ─────────────────────────────────────────────────── */
    .kpi-strip {
      display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media(max-width:900px) { .kpi-strip { grid-template-columns: repeat(3,1fr); } }
    @media(max-width:600px) { .kpi-strip { grid-template-columns: repeat(2,1fr); } }

    .kpi-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4);
      position: relative; overflow: hidden;
      animation: slideUpFade .35s var(--ease-spring) calc(var(--d,0)*55ms) both;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      &:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    }
    .kpi-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .kpi-label { font-size: .70rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 6px; }
    .kpi-value { font-size: 1.6rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-sub   { font-size: .75rem; margin-top: 5px; display: flex; align-items: center; gap: 4px; }
    .trend-up   { color: #16a34a; }
    .trend-down { color: #dc2626; }
    .trend-flat { color: var(--text-muted); }

    /* ── Skeleton ──────────────────────────────────────────────────── */
    .skeleton { background: var(--gray-100); border-radius: var(--radius-md); animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.5} }
    .kpi-strip-skeleton { display: grid; grid-template-columns: repeat(5,1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .kpi-skeleton { height: 88px; }

    /* ── Sections ──────────────────────────────────────────────────── */
    .section-label {
      font-size: .70rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
      color: var(--text-muted); margin: 0 0 var(--space-3);
      display: flex; align-items: center; gap: var(--space-2);
    }
    .section-label .count-badge {
      background: var(--gray-100); color: var(--text-secondary);
      font-size: .65rem; padding: 1px 6px; border-radius: var(--radius-full); font-weight: 700;
    }

    /* ── Alert cards grid ─────────────────────────────────────────── */
    .alert-grid {
      display: grid; grid-template-columns: repeat(3,1fr); gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    @media(max-width:900px) { .alert-grid { grid-template-columns: 1fr; } }

    .alert-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
      animation: slideUpFade .4s var(--ease-spring) calc(var(--d,0)*60ms) both;
    }
    .alert-card-head {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border);
    }
    .alert-icon {
      width: 32px; height: 32px; border-radius: var(--radius-md); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: .9rem;
    }
    .alert-card-title { font-size: .875rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .alert-card-count {
      margin-left: auto; font-size: .75rem; font-weight: 800;
      padding: 2px 8px; border-radius: var(--radius-full);
    }

    /* Color variants — use CSS vars for dark mode compatibility */
    .alert-red    .alert-card-head  { background: var(--error-bg); border-bottom-color: var(--error-border); }
    .alert-red    .alert-icon       { background: var(--error-border); color: var(--error); }
    .alert-red    .alert-card-title { color: var(--error); }
    .alert-red    .alert-card-count { background: var(--error); color: #fff; }
    .alert-orange .alert-card-head  { background: var(--warning-bg); border-bottom-color: var(--warning-border); }
    .alert-orange .alert-icon       { background: var(--warning-border); color: var(--warning); }
    .alert-orange .alert-card-title { color: var(--warning); }
    .alert-orange .alert-card-count { background: var(--warning); color: #fff; }
    .alert-green  .alert-card-head  { background: var(--success-bg); border-bottom-color: var(--success-border); }
    .alert-green  .alert-icon       { background: var(--success-border); color: var(--success); }
    .alert-green  .alert-card-title { color: var(--success); }
    .alert-green  .alert-card-count { background: var(--success); color: #fff; }
    .alert-blue   .alert-card-head  { background: var(--info-bg); border-bottom-color: var(--info-border); }
    .alert-blue   .alert-icon       { background: var(--info-border); color: var(--info); }
    .alert-blue   .alert-card-title { color: var(--info); }
    .alert-blue   .alert-card-count { background: var(--info); color: #fff; }

    .alert-card-body { max-height: 280px; overflow-y: auto; }

    /* ── Restaurant row ───────────────────────────────────────────── */
    .rest-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--border);
      transition: background var(--t-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); }
    }
    .rest-avatar {
      width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
      background: var(--gray-100); color: var(--text-secondary);
      font-size: .75rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .rest-info    { flex: 1; min-width: 0; }
    .rest-name    { font-size: .8125rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .rest-meta    { font-size: .70rem; color: var(--text-muted); margin-top: 1px; }
    .rest-actions { display: flex; gap: 4px; flex-shrink: 0; }

    .action-btn {
      font-size: .70rem; font-weight: 600; padding: 3px 8px;
      border-radius: var(--radius-sm); border: 1px solid var(--border);
      background: var(--surface-1); color: var(--text-secondary);
      cursor: pointer; text-decoration: none; display: inline-flex; align-items: center;
      transition: all var(--t-fast); white-space: nowrap;
      &:hover { background: var(--gray-100); color: var(--text-primary); }
    }
    .action-btn.primary {
      background: var(--text-primary); color: var(--surface-1); border-color: var(--text-primary);
      &:hover { opacity: .85; }
    }
    .action-btn.danger {
      &:hover { background: var(--error-bg); border-color: var(--error-border); color: var(--error); }
    }
    .action-btn.success {
      &:hover { background: var(--success-bg); border-color: var(--success-border); color: var(--success); }
    }

    .empty-card {
      text-align: center; padding: var(--space-5); color: var(--text-muted); font-size: .8125rem;
    }

    /* ── Activity + Upsell grid ───────────────────────────────────── */
    .bottom-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4);
      margin-bottom: var(--space-4);
    }
    @media(max-width:768px) { .bottom-grid { grid-template-columns: 1fr; } }

    .panel {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
      animation: slideUpFade .4s var(--ease-spring) calc(var(--d,0)*50ms) both;
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border);
      background: var(--surface-1);
    }
    .panel-title { font-size: .875rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .panel-see   { font-size: .75rem; color: var(--brand); text-decoration: none; font-weight: 600; }
    .panel-body  { max-height: 220px; overflow-y: auto; }

    /* ── Recent actions ────────────────────────────────────────────── */
    .action-row {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-2) var(--space-4); border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .action-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; margin-top: 5px; }
    .action-text { flex: 1; font-size: .8rem; color: var(--text-primary); }
    .action-by   { font-size: .7rem; color: var(--text-muted); margin-top: 2px; }
    .action-time { font-size: .7rem; color: var(--text-muted); flex-shrink: 0; }

    .action-badge {
      display: inline-block; font-size: .65rem; font-weight: 700;
      padding: 1px 5px; border-radius: 3px; margin-right: 4px;
    }
    .ab-block    { background: var(--error-bg);   color: var(--error);   border: 1px solid var(--error-border); }
    .ab-grant    { background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); }
    .ab-verify   { background: var(--info-bg);    color: var(--info);    border: 1px solid var(--info-border); }
    .ab-update   { background: var(--surface-2);  color: var(--text-secondary); border: 1px solid var(--border); }
    .ab-delete   { background: var(--warning-bg); color: var(--warning); border: 1px solid var(--warning-border); }
    .ab-default  { background: var(--surface-2);  color: var(--text-secondary); border: 1px solid var(--border); }

    /* ── Modal overlay ─────────────────────────────────────────────── */
    .modal-overlay {
      position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center;
      padding: var(--space-4); animation: fadeIn .15s ease both;
    }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }

    .modal {
      background: var(--surface-1); border-radius: var(--radius-xl);
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      width: 100%; max-width: 480px;
      animation: slideUpFade .2s var(--ease-spring) both;
      overflow: hidden;
    }
    .modal-head {
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between;
    }
    .modal-title    { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-subtitle { font-size: .8125rem; color: var(--text-muted); margin: 2px 0 0; }
    .modal-close {
      background: none; border: none; cursor: pointer; color: var(--text-muted);
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      border-radius: var(--radius-md); transition: all var(--t-fast);
      &:hover { background: var(--gray-100); color: var(--text-primary); }
    }
    .modal-body { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .modal-foot {
      padding: var(--space-4) var(--space-6); border-top: 1px solid var(--border);
      display: flex; gap: var(--space-3); justify-content: flex-end;
    }

    /* ── Form fields ──────────────────────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 5px; }
    .field label { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); }
    .field select, .field input, .field textarea {
      border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 8px 10px; font-size: .875rem; color: var(--text-primary);
      background: var(--surface-1); width: 100%;
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle, rgba(0,0,0,.06)); }
    }
    .field textarea { resize: vertical; min-height: 72px; font-family: inherit; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .price-preview {
      background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: var(--space-3); display: flex; justify-content: space-between; align-items: center;
      font-size: .875rem;
    }
    .price-original { color: var(--text-muted); text-decoration: line-through; }
    .price-paid     { font-weight: 700; color: var(--text-primary); font-size: 1rem; }
    .price-discount { font-size: .75rem; background: var(--success-bg); color: var(--success); border: 1px solid var(--success-border); padding: 1px 6px; border-radius: var(--radius-full); font-weight: 700; }

    .btn-cancel {
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 8px 16px; font-size: .875rem; font-weight: 600; color: var(--text-secondary);
      cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); }
    }
    .btn-primary {
      background: var(--text-primary); color: var(--surface-1); border: none;
      border-radius: var(--radius-md); padding: 8px 18px;
      font-size: .875rem; font-weight: 700; cursor: pointer;
      transition: opacity var(--t-fast); display: flex; align-items: center; gap: 6px;
      &:hover:not(:disabled) { opacity: .85; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }
    .btn-danger {
      background: #dc2626; color: #fff; border: none;
      border-radius: var(--radius-md); padding: 8px 18px;
      font-size: .875rem; font-weight: 700; cursor: pointer;
      &:hover:not(:disabled) { background: #b91c1c; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .mini-spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
      animation: spin .7s linear infinite;
    }

    /* ── Toast ─────────────────────────────────────────────────────── */
    .toast-wrap {
      position: fixed; bottom: var(--space-6); right: var(--space-6); z-index: 2000;
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .toast {
      background: var(--text-primary); color: var(--surface-1);
      border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
      font-size: .875rem; font-weight: 500; box-shadow: var(--shadow-md);
      animation: slideUpFade .25s var(--ease-spring) both;
      max-width: 340px;
    }
    .toast.error { background: #dc2626; }

    @keyframes slideUpFade { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none} }
  `],
})
export class SaCommandCenterComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)
  private readonly destroyRef = inject(DestroyRef)

  // ── State ─────────────────────────────────────────────────────────────────
  readonly intelligence = signal<SaIntelligence | null>(null)
  readonly plans        = signal<Plan[]>([])
  readonly loading      = signal(true)
  readonly refreshing   = signal(false)
  readonly autoRefresh  = signal(true)
  readonly lastRefresh  = signal<Date | null>(null)

  // ── Alert tab (today / 3d / 7d) ───────────────────────────────────────────
  readonly trialTab = signal<'today' | '3d' | '7d'>('today')

  readonly trialsShown = computed(() => {
    const intel = this.intelligence()
    if (!intel) return []
    switch (this.trialTab()) {
      case '3d': return intel.alerts.trialsExpiring3Days
      case '7d': return intel.alerts.trialsExpiring7Days
      default:   return intel.alerts.trialsExpiringToday
    }
  })

  // ── Modals ─────────────────────────────────────────────────────────────────
  readonly activeModal      = signal<'grant' | 'block' | null>(null)
  readonly selectedTarget   = signal<SaAlertRestaurant | null>(null)
  readonly actionLoading    = signal(false)

  // Grant form
  readonly grantPlanSlug    = signal('')
  readonly grantCycle       = signal<'monthly' | 'yearly'>('monthly')
  readonly grantDuration    = signal(1)
  readonly grantAmount      = signal(0)
  readonly grantNote        = signal('')

  // Block form
  readonly blockReason      = signal('')

  // Toasts
  readonly toasts = signal<{ id: number; msg: string; error?: boolean }[]>([])
  private toastId = 0

  // ── Computed helpers ───────────────────────────────────────────────────────
  readonly selectedPlan = computed(() =>
    this.plans().find((p) => p.slug === this.grantPlanSlug()) ?? null
  )

  readonly originalPriceCents = computed(() => {
    const p = this.selectedPlan()
    if (!p) return 0
    const unit = this.grantCycle() === 'monthly' ? p.priceMonthlyCents : p.priceYearlyCents
    return unit * this.grantDuration()
  })

  readonly discountPct = computed(() => {
    const orig = this.originalPriceCents()
    if (!orig) return 0
    const paid = this.grantAmount() * 100
    return Math.max(0, Math.round((1 - paid / orig) * 100))
  })

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadAll()
    interval(30_000)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(() => this.autoRefresh()),
        switchMap(() => this.saService.getIntelligence()),
      )
      .subscribe((intel) => {
        this.intelligence.set(intel)
        this.lastRefresh.set(new Date())
        this.refreshing.set(false)
      })
  }

  loadAll(): void {
    this.refreshing.set(true)
    forkJoin({
      intel: this.saService.getIntelligence(),
      plans: this.saService.getPlans(),
    }).subscribe({
      next: ({ intel, plans }) => {
        this.intelligence.set(intel)
        this.plans.set(plans)
        this.lastRefresh.set(new Date())
        this.loading.set(false)
        this.refreshing.set(false)
      },
      error: () => {
        this.loading.set(false)
        this.refreshing.set(false)
        this.showToast('Erreur lors du chargement des données.', true)
      },
    })
  }

  toggleAutoRefresh(): void {
    this.autoRefresh.update((v) => !v)
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  openGrantModal(r: SaAlertRestaurant): void {
    this.selectedTarget.set(r)
    this.grantPlanSlug.set(this.plans()[0]?.slug ?? '')
    this.grantCycle.set('monthly')
    this.grantDuration.set(1)
    this.grantAmount.set(0)
    this.grantNote.set('')
    this.activeModal.set('grant')
  }

  openBlockModal(r: SaAlertRestaurant): void {
    this.selectedTarget.set(r)
    this.blockReason.set('')
    this.activeModal.set('block')
  }

  closeModal(): void {
    if (this.actionLoading()) return
    this.activeModal.set(null)
    this.selectedTarget.set(null)
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  submitGrant(): void {
    const target = this.selectedTarget()
    if (!target || !this.grantPlanSlug() || this.actionLoading()) return
    this.actionLoading.set(true)
    this.saService
      .assignPlan(target.id, {
        planSlug: this.grantPlanSlug(),
        billingCycle: this.grantCycle(),
        duration: this.grantDuration(),
        note: this.grantNote() || undefined,
        amountPaidCents: Math.round(this.grantAmount() * 100),
      })
      .subscribe({
        next: (res) => {
          this.actionLoading.set(false)
          this.closeModal()
          this.showToast(`✓ Plan attribué à ${target.name}`)
          this.saService.getIntelligence().subscribe((intel) => {
            this.intelligence.set(intel)
            this.lastRefresh.set(new Date())
          })
        },
        error: () => {
          this.actionLoading.set(false)
          this.showToast("Erreur lors de l'attribution du plan.", true)
        },
      })
  }

  submitBlock(): void {
    const target = this.selectedTarget()
    if (!target || !this.blockReason().trim() || this.actionLoading()) return
    this.actionLoading.set(true)
    this.saService.blockRestaurant(target.id, this.blockReason()).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.closeModal()
        this.showToast(`Restaurant "${target.name}" bloqué.`)
        this.saService.getIntelligence().subscribe((intel) => {
          this.intelligence.set(intel)
          this.lastRefresh.set(new Date())
        })
      },
      error: () => {
        this.actionLoading.set(false)
        this.showToast('Erreur lors du blocage.', true)
      },
    })
  }

  verifyUser(r: SaAlertRestaurant): void {
    this.saService.verifyUser(r.id).subscribe({
      next: () => {
        this.showToast(`Compte de ${r.name} activé.`)
        this.saService.getIntelligence().subscribe((intel) => {
          this.intelligence.set(intel)
          this.lastRefresh.set(new Date())
        })
      },
      error: () => this.showToast('Erreur lors de la vérification.', true),
    })
  }

  // ── Formatting helpers ────────────────────────────────────────────────────
  formatMoney(cents: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      maximumFractionDigits: 0,
    }).format(cents / 100)
  }

  initials(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  actionBadgeClass(action: string): string {
    if (action.includes('block'))    return 'ab-block'
    if (action.includes('grant') || action.includes('subscription')) return 'ab-grant'
    if (action.includes('verify'))   return 'ab-verify'
    if (action.includes('delete') || action.includes('destroy')) return 'ab-delete'
    if (action.includes('update') || action.includes('updated')) return 'ab-update'
    return 'ab-default'
  }

  actionLabel(action: string): string {
    const map: Record<string, string> = {
      'restaurant.blocked': 'Bloqué',
      'restaurant.unblocked': 'Débloqué',
      'subscription.granted': 'Plan attribué',
      'user.email_verified_by_admin': 'Vérifié',
      'restaurant.updated': 'Modifié',
      'plan.created': 'Plan créé',
      'plan.updated': 'Plan modifié',
      'plan.deleted': 'Plan supprimé',
    }
    return map[action] ?? action.split('.').pop() ?? action
  }

  actionDotColor(action: string): string {
    if (action.includes('block'))  return '#ef4444'
    if (action.includes('grant') || action.includes('subscription')) return '#22c55e'
    if (action.includes('verify')) return '#3b82f6'
    if (action.includes('delete')) return '#f59e0b'
    return '#94a3b8'
  }

  trialDaysLeft(endsAt: string | null | undefined): number {
    if (!endsAt) return 0
    const diff = new Date(endsAt).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / 86_400_000))
  }

  // ── Toast ─────────────────────────────────────────────────────────────────
  private showToast(msg: string, error = false): void {
    const id = ++this.toastId
    this.toasts.update((t) => [...t, { id, msg, error }])
    setTimeout(() => this.toasts.update((t) => t.filter((x) => x.id !== id)), 3500)
  }

  // ── Track by ──────────────────────────────────────────────────────────────
  trackById(_: number, item: { id: number }): number { return item.id }
}
