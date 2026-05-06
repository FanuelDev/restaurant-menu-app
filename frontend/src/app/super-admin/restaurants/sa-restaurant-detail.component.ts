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
  template: `
    <ng-container *transloco="let t">
    <div class="detail-page">
      <div class="page-header">
        <a routerLink="/super-admin/restaurants" class="back-link">← {{ t('superAdmin.restaurantDetail.back') }}</a>
      </div>

      @if (loading()) {
        <div class="loading">{{ t('common.loading') }}</div>
      } @else if (restaurant()) {
        <div class="detail-grid">
          <div class="main-col">
            <div class="info-card">
              <div class="card-head">
                <div class="restaurant-title">
                  <h2>{{ restaurant()!.name }}</h2>
                  <code class="slug">{{ restaurant()!.slug }}</code>
                </div>
                <span class="status-badge status-{{ restaurant()!.blockedAt ? 'blocked' : restaurant()!.subscriptionStatus }}">
                  {{ t('superAdmin.status.' + (restaurant()!.blockedAt ? 'blocked' : restaurant()!.subscriptionStatus)) }}
                </span>
              </div>
              <div class="info-grid">
                <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldCountry') }}</span><span>{{ restaurant()!.country }}</span></div>
                <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldEmail') }}</span><span>{{ restaurant()!.currency }}</span></div>
                <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldPlan') }}</span><span>{{ restaurant()!.plan?.name ?? '—' }}</span></div>
                <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldCreated') }}</span><span>{{ restaurant()!.createdAt | date:'dd/MM/yyyy' }}</span></div>
                @if (restaurant()!.trialEndsAt) {
                  <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldStatus') }}</span><span>{{ restaurant()!.trialEndsAt | date:'dd/MM/yyyy' }}</span></div>
                }
                @if (restaurant()!.phone) {
                  <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.fieldPhone') }}</span><span>{{ restaurant()!.phone }}</span></div>
                }
                @if (restaurant()!.address) {
                  <div class="info-row"><span class="label">{{ t('superAdmin.restaurantDetail.sectionInfo') }}</span><span>{{ restaurant()!.address }}</span></div>
                }
              </div>

              @if (restaurant()!.blockedAt) {
                <div class="blocked-notice">
                  <div class="blocked-title">🔒 {{ t('superAdmin.restaurantDetail.blockTitle') }} {{ restaurant()!.blockedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  @if (restaurant()!.blockedReason) {
                    <div class="blocked-reason">{{ t('superAdmin.restaurantDetail.blockedReason', { reason: restaurant()!.blockedReason }) }}</div>
                  }
                  <button class="btn-success" (click)="unblock()" [disabled]="actionLoading()">
                    @if (actionLoading()) { {{ t('common.loading') }} }
                    @else { 🔓 {{ t('superAdmin.restaurantDetail.unblockSubmit') }} }
                  </button>
                </div>
              } @else {
                <button class="btn-danger-outline" (click)="showBlockForm.set(true)">🔒 {{ t('superAdmin.restaurantDetail.blockTitle') }}</button>
              }

              @if (showBlockForm()) {
                <div class="block-form">
                  <div class="form-group">
                    <label>{{ t('superAdmin.restaurantDetail.blockReasonLabel') }} *</label>
                    <textarea [(ngModel)]="blockReason" rows="3" [placeholder]="t('superAdmin.restaurantDetail.blockReasonLabel')"></textarea>
                  </div>
                  @if (actionError()) { <div class="error-msg">{{ actionError() }}</div> }
                  <div class="block-form-actions">
                    <button class="btn-outline" (click)="showBlockForm.set(false)">{{ t('common.cancel') }}</button>
                    <button class="btn-danger" (click)="block()" [disabled]="actionLoading() || !blockReason.trim()">
                      @if (actionLoading()) { {{ t('common.loading') }} }
                      @else { {{ t('superAdmin.restaurantDetail.blockSubmit') }} }
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="side-col">

            <!-- Grant plan -->
            <div class="grant-card">
              <div class="grant-header">
                <h3>{{ t('superAdmin.restaurantDetail.grantPlanTitle') }}</h3>
                <span class="sa-badge">Super Admin</span>
              </div>
              <p class="grant-desc">{{ t('superAdmin.restaurantDetail.grantPlanSubtitle') }}</p>

              <div class="form-group">
                <label>{{ t('superAdmin.restaurantDetail.grantFieldPlan') }}</label>
                <select [(ngModel)]="grantForm.planSlug" class="form-select">
                  <option value="">— {{ t('common.loading') }} —</option>
                  @for (p of plans(); track p.id) {
                    @if (p.priceMonthlyCents > 0) {
                      <option [value]="p.slug">{{ p.name }}</option>
                    }
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>{{ t('superAdmin.restaurantDetail.grantFieldCycle') }}</label>
                  <select [(ngModel)]="grantForm.billingCycle" class="form-select">
                    <option value="monthly">{{ t('superAdmin.restaurantDetail.cycleMonthly') }}</option>
                    <option value="yearly">{{ t('superAdmin.restaurantDetail.cycleYearly') }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>{{ t('superAdmin.restaurantDetail.grantFieldDuration') }}</label>
                  <div class="duration-input">
                    <input type="number" [(ngModel)]="grantForm.duration" min="1" max="24" class="form-input" />
                    <span class="duration-unit">{{ grantForm.billingCycle === 'yearly' ? t('superAdmin.restaurantDetail.cycleYearly') : t('superAdmin.restaurantDetail.cycleMonthly') }}</span>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>{{ t('superAdmin.restaurantDetail.grantFieldNote') }} <span class="opt">{{ t('common.optional') }}</span></label>
                <input type="text" [(ngModel)]="grantForm.note" class="form-input" [placeholder]="t('superAdmin.restaurantDetail.grantFieldNotePlaceholder')" />
              </div>

              @if (grantSuccess()) {
                <div class="alert-success">{{ grantSuccess() }}</div>
              }
              @if (grantError()) {
                <div class="error-msg">{{ grantError() }}</div>
              }

              <button
                class="btn-grant"
                (click)="assignPlan()"
                [disabled]="grantLoading() || !grantForm.planSlug"
              >
                @if (grantLoading()) { <span class="spinner"></span> }
                {{ t('superAdmin.restaurantDetail.grantSubmit') }}
              </button>
            </div>

            <!-- Recent activity -->
            <div class="logs-card">
              <h3>{{ t('superAdmin.restaurantDetail.sectionLogs') }}</h3>
              @if (logs().length === 0) {
                <div class="no-logs">{{ t('common.loading') }}</div>
              } @else {
                @for (log of logs(); track log.id) {
                  <div class="log-item">
                    <div class="log-action">{{ log.action }}</div>
                    <div class="log-meta">
                      <span>{{ log.userEmail }}</span>
                      <span>{{ log.createdAt | date:'dd/MM HH:mm' }}</span>
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      }
    </div>
    </ng-container>
  `,
  styles: [`
    .detail-page { max-width: 1000px; }
    .page-header { margin-bottom: var(--space-5); }
    .back-link { color: var(--brand); text-decoration: none; font-size: .875rem; font-weight: 500; }
    .back-link:hover { text-decoration: underline; }

    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); align-items: start; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    .info-card, .logs-card {
      background: white; border-radius: var(--radius-lg);
      border: 1px solid var(--border); padding: var(--space-6);
      animation: slideUpFade .4s var(--ease-spring) both;
    }

    .card-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .restaurant-title h2 { margin: 0 0 var(--space-2); font-size: 1.25rem; color: var(--text-primary); font-weight: 700; }
    .slug { background: var(--gray-100); padding: .15rem .45rem; border-radius: var(--radius-xs); font-size: .78rem; color: var(--text-muted); }

    .status-badge { display: inline-flex; align-items: center; padding: .25rem .65rem; border-radius: var(--radius-full); font-size: .75rem; font-weight: 700; }
    .status-trialing  { background: var(--warning-bg); color: var(--warning); }
    .status-active    { background: var(--success-bg); color: var(--success); }
    .status-blocked, .status-canceled, .status-suspended { background: var(--error-bg); color: var(--error); }

    .info-grid { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-5); }
    .info-row  { display: flex; gap: var(--space-4); font-size: .875rem; }
    .info-row .label { color: var(--text-muted); min-width: 100px; font-weight: 500; font-size: .8125rem; }

    .blocked-notice {
      background: var(--error-bg); border: 1px solid var(--error-border);
      border-radius: var(--radius-lg); padding: var(--space-4); margin-bottom: var(--space-4);
    }
    .blocked-title  { font-weight: 700; color: var(--error); margin-bottom: var(--space-2); font-size: .9rem; }
    .blocked-reason { font-size: .8125rem; color: var(--text-secondary); margin-bottom: var(--space-4); }

    .btn-success {
      padding: var(--space-2) var(--space-5); background: var(--success);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: opacity var(--t-fast);
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .btn-danger-outline {
      padding: var(--space-2) var(--space-5); background: transparent;
      color: var(--error); border: 1.5px solid var(--error);
      border-radius: var(--radius-md); cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: background var(--t-fast);
      &:hover { background: var(--error-bg); }
    }

    .block-form { margin-top: var(--space-4); padding: var(--space-4); background: var(--gray-50); border-radius: var(--radius-lg); border: 1px solid var(--border); }
    .form-group { margin-bottom: var(--space-4); }
    .form-group label { display: block; font-size: .8125rem; font-weight: 500; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-group textarea {
      width: 100%; padding: var(--space-3) var(--space-4); border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; resize: vertical; box-sizing: border-box;
      font-family: var(--font-body); color: var(--text-primary);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .error-msg { background: var(--error-bg); color: var(--error); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: .8125rem; border: 1px solid var(--error-border); margin-bottom: var(--space-3); }
    .block-form-actions { display: flex; gap: var(--space-3); justify-content: flex-end; }
    .btn-outline {
      padding: var(--space-2) var(--space-4); background: transparent;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; color: var(--text-secondary);
      &:hover { border-color: var(--gray-400); }
    }
    .btn-danger {
      padding: var(--space-2) var(--space-4); background: var(--error);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      &:disabled { opacity: .6; cursor: not-allowed; }
    }

    .logs-card h3 { margin: 0 0 var(--space-4); font-size: .9375rem; color: var(--text-primary); font-weight: 700; }
    .no-logs { color: var(--text-muted); font-size: .8125rem; }
    .log-item { padding: var(--space-2) 0; border-bottom: 1px solid var(--border); &:last-child { border-bottom: none; } }
    .log-action { font-size: .8125rem; color: var(--text-primary); font-weight: 500; }
    .log-meta { display: flex; justify-content: space-between; font-size: .75rem; color: var(--text-muted); margin-top: 2px; }

    /* Grant plan card */
    .grant-card {
      background: white; border-radius: var(--radius-lg);
      border: 2px solid var(--brand); padding: var(--space-5);
      margin-bottom: var(--space-4);
      animation: slideUpFade .4s var(--ease-spring) both;
    }
    .grant-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-2); }
    .grant-header h3 { margin: 0; font-size: .9375rem; color: var(--text-primary); font-weight: 700; }
    .sa-badge {
      font-size: .65rem; font-weight: 700; padding: 2px 7px;
      border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: .05em;
      background: var(--brand); color: white;
    }
    .grant-desc { font-size: .8125rem; color: var(--text-muted); margin: 0 0 var(--space-4); }

    .form-row { display: flex; gap: var(--space-3); }
    .form-row .form-group { flex: 1; }
    .form-group { margin-bottom: var(--space-3); }
    .form-group label { display: block; font-size: .75rem; font-weight: 600; color: var(--text-secondary); margin-bottom: var(--space-1); text-transform: uppercase; letter-spacing: .04em; }
    .opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); font-size: .7rem; }

    .form-select, .form-input {
      width: 100%; padding: .5rem .75rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; background: white;
      color: var(--text-primary); box-sizing: border-box;
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .duration-input { display: flex; align-items: center; gap: var(--space-2); }
    .duration-input .form-input { flex: 1; }
    .duration-unit { font-size: .8125rem; color: var(--text-muted); white-space: nowrap; }

    .alert-success {
      background: var(--success-bg); color: var(--success);
      border: 1px solid #bbf7d0; padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md); font-size: .8125rem; margin-bottom: var(--space-3);
    }

    .btn-grant {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      background: var(--brand); color: white; border: none;
      border-radius: var(--radius-md); padding: .625rem var(--space-4);
      font-size: .875rem; font-weight: 600; cursor: pointer;
      transition: opacity var(--t-fast); margin-top: var(--space-2);
      &:hover:not(:disabled) { opacity: .88; }
      &:disabled { opacity: .5; cursor: not-allowed; }
    }

    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.35);
      border-top-color: white; border-radius: 50%;
      animation: spin .6s linear infinite; display: inline-block;
    }
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
