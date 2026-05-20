import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Restaurant, AuditLog, Plan, BillingCycle } from '../../shared/models'

@Component({
  selector: 'app-sa-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  templateUrl: './sa-restaurant-detail.component.html',
  styles: [`
    .detail-page { max-width: 1060px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--text-muted); text-decoration: none; font-size: .8125rem; font-weight: 500;
      margin-bottom: var(--space-5); transition: color var(--t-fast);
      &:hover { color: var(--brand); }
    }

    /* ── Skeleton ── */
    .skeleton { background: linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-lg); }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .hero-sk { height: 110px; margin-bottom: var(--space-5); }
    .sk-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); }
    .card-sk { height: 260px; }
    .card-sk.short { height: 180px; }

    /* ── Hero ── */
    .hero {
      display: flex; align-items: center; gap: var(--space-5);
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-5) var(--space-6);
      margin-bottom: var(--space-6); animation: slideUpFade .4s var(--ease-spring) both;
    }
    .hero-blocked { border-color: var(--error-border); background: var(--error-bg); }
    .hero-avatar {
      width: 64px; height: 64px; border-radius: var(--radius-lg);
      background: var(--brand); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800; flex-shrink: 0;
    }
    .hero-blocked .hero-avatar { background: var(--error); }
    .hero-info { flex: 1; min-width: 0; }
    .hero-top { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2); }
    .hero-name { margin: 0; font-size: 1.375rem; font-weight: 800; color: var(--text-primary); }
    .hero-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    .meta-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--gray-100); color: var(--text-muted);
      padding: 3px 10px; border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 500;
    }
    .plan-chip { background: #ede9fe; color: #6d28d9; }

    .status-pill {
      display: inline-flex; align-items: center;
      padding: .25rem .7rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
    }
    .status-trialing  { background: #fef9c3; color: #854d0e; }
    .status-active    { background: #dcfce7; color: #166534; }
    .status-blocked, .status-canceled, .status-suspended { background: #fee2e2; color: #991b1b; }

    /* ── Grid ── */
    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); align-items: start; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    /* ── Cards ── */
    .card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-5);
      margin-bottom: var(--space-4); animation: slideUpFade .4s var(--ease-spring) both;
    }
    .card-title {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: .8125rem; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: .06em;
      margin-bottom: var(--space-4); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border);
    }
    .danger-zone { border-color: var(--error-border); }
    .danger-title { color: var(--error); }

    /* ── Info grid ── */
    .info-grid { display: flex; flex-direction: column; gap: 2px; }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: .875rem;
      &:nth-child(odd) { background: var(--gray-50); }
    }
    .info-label { color: var(--text-muted); font-weight: 500; font-size: .8125rem; }
    .info-val { color: var(--text-primary); font-weight: 500; }
    .info-val.trial { color: var(--warning); font-weight: 600; }

    /* ── Block section ── */
    .danger-desc { font-size: .8125rem; color: var(--text-muted); margin: 0 0 var(--space-4); }
    .blocked-banner {
      background: #fff1f2; border: 1px solid #fecdd3;
      border-radius: var(--radius-lg); padding: var(--space-4);
    }
    .blocked-top { display: flex; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-3); }
    .blocked-icon { font-size: 1.5rem; }
    .blocked-title { font-weight: 700; color: var(--error); font-size: .9375rem; }
    .blocked-date { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
    .blocked-reason {
      font-size: .8125rem; color: var(--text-secondary); font-style: italic;
      background: white; padding: var(--space-3); border-radius: var(--radius-md);
      border: 1px solid #fecdd3; margin-bottom: var(--space-4);
    }
    .btn-success {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: var(--success);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: opacity var(--t-fast);
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .btn-danger-outline {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: transparent;
      color: var(--error); border: 1.5px solid var(--error);
      border-radius: var(--radius-md); cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: background var(--t-fast);
      &:hover { background: #fff1f2; }
    }
    .block-form { margin-top: var(--space-4); }
    .block-actions { display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-3); }
    .btn-ghost {
      padding: .5rem var(--space-4); background: transparent;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; color: var(--text-secondary);
      &:hover { border-color: var(--gray-400); }
    }
    .btn-danger {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: var(--error);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .required { color: var(--error); }

    /* ── Timeline logs ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-6) 0; color: var(--text-muted); font-size: .8125rem;
    }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item {
      display: flex; gap: var(--space-3); padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .timeline-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--brand);
      flex-shrink: 0; margin-top: 5px;
    }
    .timeline-content { flex: 1; min-width: 0; }
    .log-action { font-size: .8125rem; color: var(--text-primary); font-weight: 600; font-family: monospace; }
    .log-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .log-user { font-size: .75rem; color: var(--text-muted); }
    .log-time { font-size: .75rem; color: var(--text-muted); }

    /* ── Form shared ── */
    .form-group { margin-bottom: var(--space-4); }
    .form-group label {
      display: block; font-size: .75rem; font-weight: 700;
      color: var(--text-secondary); margin-bottom: var(--space-2);
      text-transform: uppercase; letter-spacing: .05em;
    }
    .opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); font-size: .7rem; }
    .form-select, .form-input {
      width: 100%; padding: .5rem .75rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; background: white;
      color: var(--text-primary); box-sizing: border-box; font-family: var(--font-body);
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .form-group textarea {
      width: 100%; padding: var(--space-3); border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; resize: vertical;
      box-sizing: border-box; font-family: var(--font-body); color: var(--text-primary);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .form-row { display: flex; gap: var(--space-3); }
    .form-row .form-group { flex: 1; }
    .duration-row { display: flex; align-items: center; gap: var(--space-2); }
    .duration-row .form-input { flex: 1; }
    .duration-unit { font-size: .8125rem; color: var(--text-muted); white-space: nowrap; }

    .alert-success {
      display: flex; align-items: center; gap: var(--space-2);
      background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      font-size: .8125rem; font-weight: 500; margin-bottom: var(--space-3);
    }
    .alert-error {
      background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      font-size: .8125rem; margin-bottom: var(--space-3);
    }

    /* ── Grant card ── */
    .grant-card {
      background: white; border-radius: var(--radius-xl);
      border: 2px solid var(--brand);
      animation: slideUpFade .4s var(--ease-spring) both;
      overflow: hidden;
    }
    .grant-header {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-5); border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, #f8f4ff 0%, #fff 100%);
    }
    .grant-icon {
      width: 40px; height: 40px; background: var(--brand); border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; flex-shrink: 0;
    }
    .grant-header h3 { margin: 0 0 2px; font-size: .9375rem; color: var(--text-primary); font-weight: 700; }
    .grant-header p { margin: 0; font-size: .75rem; color: var(--text-muted); }
    .sa-pill {
      margin-left: auto; flex-shrink: 0;
      font-size: .6rem; font-weight: 800; padding: 3px 8px;
      border-radius: var(--radius-full); letter-spacing: .08em;
      background: var(--brand); color: white;
    }
    .grant-body { padding: var(--space-5); }

    .btn-grant {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      background: var(--brand); color: white; border: none;
      border-radius: var(--radius-md); padding: .7rem var(--space-4);
      font-size: .9375rem; font-weight: 700; cursor: pointer;
      transition: opacity var(--t-fast), transform var(--t-fast);
      &:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: .45; cursor: not-allowed; }
    }

    /* ── Spinner ── */
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    .spinner.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--success); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SaRestaurantDetailComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)
  private readonly route = inject(ActivatedRoute)

  readonly restaurant = signal<Restaurant | null>(null)
  readonly logs = signal<AuditLog[]>([])
  readonly plans = signal<Plan[]>([])
  readonly loading = signal(true)
  readonly showBlockForm = signal(false)
  readonly actionLoading = signal(false)
  readonly actionError = signal<string | null>(null)

  // Grant plan form
  readonly grantLoading = signal(false)
  readonly grantError = signal<string | null>(null)
  readonly grantSuccess = signal<string | null>(null)
  grantForm: { planSlug: string; billingCycle: BillingCycle; duration: number; note: string } = {
    planSlug: '', billingCycle: 'monthly', duration: 1, note: '',
  }

  blockReason = ''

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id'])
    this.saService.getRestaurant(id).subscribe({
      next: (r) => { this.restaurant.set(r.restaurant); this.logs.set(r.recentLogs); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
    this.saService.getPlans().subscribe({ next: (p) => this.plans.set(p) })
  }

  assignPlan(): void {
    const r = this.restaurant()
    if (!r || !this.grantForm.planSlug) return
    this.grantLoading.set(true)
    this.grantError.set(null)
    this.grantSuccess.set(null)
    this.saService.assignPlan(r.id, {
      planSlug: this.grantForm.planSlug,
      billingCycle: this.grantForm.billingCycle,
      duration: this.grantForm.duration,
      note: this.grantForm.note || undefined,
    }).subscribe({
      next: (res) => {
        this.grantLoading.set(false)
        this.grantSuccess.set(res.message)
        this.restaurant.set(res.restaurant)
        this.grantForm = { planSlug: '', billingCycle: 'monthly', duration: 1, note: '' }
      },
      error: (err) => {
        this.grantLoading.set(false)
        this.grantError.set(err.error?.message ?? 'Erreur lors de l\'attribution.')
      },
    })
  }

  block(): void {
    const r = this.restaurant()
    if (!r) return
    this.actionLoading.set(true)
    this.saService.blockRestaurant(r.id, this.blockReason).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.showBlockForm.set(false)
        this.restaurant.update((prev) => prev ? { ...prev, blockedAt: new Date().toISOString(), blockedReason: this.blockReason } : prev)
      },
      error: (err) => { this.actionLoading.set(false); this.actionError.set(err.error?.message) },
    })
  }

  unblock(): void {
    const r = this.restaurant()
    if (!r) return
    this.actionLoading.set(true)
    this.saService.unblockRestaurant(r.id).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.restaurant.update((prev) => prev ? { ...prev, blockedAt: null, blockedReason: null } : prev)
      },
      error: (err) => { this.actionLoading.set(false); this.actionError.set(err.error?.message) },
    })
  }
}
