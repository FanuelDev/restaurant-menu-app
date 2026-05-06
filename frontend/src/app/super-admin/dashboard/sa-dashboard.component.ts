import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { SuperAdminStats } from '../../shared/models'

@Component({
  selector: 'app-sa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="sa-dashboard">

      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('superAdmin.dashboard.title') }}</h1>
          <p class="page-sub">{{ t('superAdmin.dashboard.subtitle') }}</p>
        </div>
      </header>

      @if (loading()) {
        <div class="skeleton-grid">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (stats()) {

        <div class="kpi-grid">
          <div class="kpi-card animate-up" style="--d:0">
            <div class="kpi-icon-wrap" style="background:var(--gray-100);color:var(--gray-600)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ stats()!.totals.restaurants }}</div>
              <div class="kpi-label">{{ t('superAdmin.dashboard.restaurants') }}</div>
            </div>
          </div>

          <div class="kpi-card animate-up" style="--d:1">
            <div class="kpi-icon-wrap" style="background:#EFF6FF;color:#2563EB">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ stats()!.totals.users }}</div>
              <div class="kpi-label">{{ t('superAdmin.dashboard.users') }}</div>
            </div>
          </div>

          <div class="kpi-card animate-up" style="--d:2">
            <div class="kpi-icon-wrap" style="background:var(--success-bg);color:var(--success)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ stats()!.totals.activeSubscriptions }}</div>
              <div class="kpi-label">{{ t('superAdmin.dashboard.activeSubscriptions') }}</div>
            </div>
            <div class="kpi-accent" style="background:var(--success)"></div>
          </div>

          <div class="kpi-card animate-up" style="--d:3">
            <div class="kpi-icon-wrap" style="background:var(--warning-bg);color:var(--warning)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ stats()!.totals.trialRestaurants }}</div>
              <div class="kpi-label">{{ t('superAdmin.dashboard.trialRestaurants') }}</div>
            </div>
            <div class="kpi-accent" style="background:var(--warning)"></div>
          </div>

          <div class="kpi-card animate-up" style="--d:4">
            <div class="kpi-icon-wrap" style="background:var(--error-bg);color:var(--error)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-value">{{ stats()!.totals.blockedRestaurants }}</div>
              <div class="kpi-label">{{ t('superAdmin.dashboard.blockedRestaurants') }}</div>
            </div>
            <div class="kpi-accent" style="background:var(--error)"></div>
          </div>
        </div>

        <div class="bottom-grid">
          <div class="panel animate-up" style="--d:5">
            <div class="panel-head">
              <h2 class="panel-title">{{ t('superAdmin.dashboard.planDistribution') }}</h2>
            </div>
            <div class="plan-list">
              @for (p of stats()!.planStats; track p.planSlug) {
                <div class="plan-row">
                  <span class="plan-name">{{ p.planName }}</span>
                  <span class="plan-pill">{{ p.count }}</span>
                </div>
              }
              @if (!stats()!.planStats.length) {
                <p class="empty-hint">{{ t('common.loading') }}</p>
              }
            </div>
          </div>

          <div class="panel animate-up" style="--d:6">
            <div class="panel-head">
              <h2 class="panel-title">{{ t('superAdmin.dashboard.recentSignups') }}</h2>
              <a routerLink="/super-admin/restaurants" class="see-all">{{ t('common.show') }}</a>
            </div>
            <div class="signup-list">
              @for (r of stats()!.recentSignups; track r.id) {
                <a [routerLink]="['/super-admin/restaurants', r.id]" class="signup-row">
                  <div class="signup-avatar">{{ r.name[0] }}</div>
                  <div class="signup-info">
                    <div class="signup-name">{{ r.name }}</div>
                    <div class="signup-slug">{{ r.slug }}</div>
                  </div>
                  <div class="signup-right">
                    <span class="status-badge status-{{ r.subscriptionStatus }}">{{ t('superAdmin.status.' + r.subscriptionStatus) }}</span>
                    <div class="signup-date">{{ r.createdAt | date:'dd MMM yy' }}</div>
                  </div>
                </a>
              }
              @if (!stats()!.recentSignups.length) {
                <p class="empty-hint">{{ t('superAdmin.dashboard.recentSignups') }}</p>
              }
            </div>
          </div>
        </div>
      }
    </div>
    </ng-container>
  `,
  styles: [`
    .sa-dashboard { max-width: 1100px; }

    .page-header { margin-bottom: var(--space-7); }
    .page-title  { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-sub    { color: var(--text-muted); font-size: .9rem; margin: 0; }

    /* Skeleton */
    .skeleton-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .skeleton-card { height: 108px; background: var(--gray-100); border-radius: var(--radius-lg); animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      display: flex; align-items: center; gap: var(--space-3);
      position: relative; overflow: hidden;
      animation: slideUpFade .4s var(--ease-spring) calc(var(--d, 0) * 60ms) both;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      &:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }
    }
    .kpi-accent {
      position: absolute; top: 0; left: 0; right: 0; height: 3px;
    }
    .kpi-icon-wrap {
      width: 44px; height: 44px; border-radius: var(--radius-md); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-body { min-width: 0; }
    .kpi-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-label { font-size: .75rem; color: var(--text-muted); margin-top: 3px; white-space: nowrap; }

    /* Bottom */
    .bottom-grid { display: grid; grid-template-columns: 260px 1fr; gap: var(--space-5); }
    @media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }

    .panel {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
      animation: slideUpFade .4s var(--ease-spring) calc(var(--d, 0) * 50ms) both;
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
    }
    .panel-title { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin: 0; }
    .see-all { font-size: .8125rem; color: var(--brand); text-decoration: none; font-weight: 500; display: flex; align-items: center; gap: 4px; }
    .see-all:hover { text-decoration: underline; }

    /* Plan list */
    .plan-list { padding: var(--space-2) 0; }
    .plan-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-5);
      &:hover { background: var(--gray-50); }
    }
    .plan-name { font-size: .875rem; color: var(--text-secondary); }
    .plan-pill {
      background: var(--gray-100); color: var(--text-primary);
      font-size: .75rem; font-weight: 700;
      padding: .2rem .55rem; border-radius: var(--radius-full);
    }

    /* Signup list */
    .signup-list { padding: var(--space-2) 0; }
    .signup-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      text-decoration: none; color: inherit;
      transition: background var(--t-fast);
      &:hover { background: var(--gray-50); }
    }
    .signup-avatar {
      width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
      background: var(--brand-50, #FEF2F2); color: var(--brand);
      font-size: .8125rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .signup-info { flex: 1; min-width: 0; }
    .signup-name { font-size: .875rem; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .signup-slug { font-size: .75rem; color: var(--text-muted); }
    .signup-right { text-align: right; flex-shrink: 0; }
    .signup-date  { font-size: .70rem; color: var(--text-muted); margin-top: 3px; }

    .status-badge { display: inline-block; padding: .2rem .55rem; border-radius: var(--radius-full); font-size: .70rem; font-weight: 700; }
    .status-trialing { background: var(--warning-bg); color: var(--warning); }
    .status-active   { background: var(--success-bg); color: var(--success); }
    .status-canceled, .status-suspended { background: var(--error-bg); color: var(--error); }

    .empty-hint { color: var(--text-muted); font-size: .875rem; padding: var(--space-4) var(--space-5); margin: 0; }

    .animate-up { animation: slideUpFade .4s var(--ease-spring) calc(var(--d, 0) * 55ms) both; }
  `],
})
export class SaDashboardComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly stats = signal<SuperAdminStats | null>(null)
  readonly loading = signal(true)

  ngOnInit(): void {
    this.saService.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

}
