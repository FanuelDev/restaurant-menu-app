import { Component, signal, inject, OnInit, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { SaRevenueStats } from '../../shared/models'

@Component({
  selector: 'app-sa-revenue',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sa-revenue">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Revenus & Analytique</h1>
          <p class="page-sub">Vue financière globale de la plateforme — lecture seule</p>
        </div>
        <div class="header-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Observateur uniquement
        </div>
      </div>

      @if (loading()) {
        <!-- Skeleton -->
        <div class="skeleton-row">
          @for (i of [1,2,3,4]; track i) { <div class="sk sk-kpi"></div> }
        </div>
        <div class="skeleton-row" style="margin-top:var(--space-5)">
          <div class="sk" style="height:240px;flex:2"></div>
          <div class="sk" style="height:240px;flex:1"></div>
        </div>
      } @else if (data()) {

        <!-- ── KPI row ─────────────────────────────────────────── -->
        <div class="kpi-row">
          <div class="kpi-card kpi-brand" style="--d:0">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmt(data()!.totalRevenueCents) }}</div>
              <div class="kpi-lbl">Revenus totaux</div>
            </div>
          </div>

          <div class="kpi-card kpi-green" style="--d:1">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmt(data()!.mrrCents) }}</div>
              <div class="kpi-lbl">MRR (mensuel récurrent)</div>
            </div>
          </div>

          <div class="kpi-card kpi-blue" style="--d:2">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmt(data()!.arrCents) }}</div>
              <div class="kpi-lbl">ARR (annuel projeté)</div>
            </div>
          </div>

          <div class="kpi-card kpi-amber" style="--d:3">
            <div class="kpi-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="kpi-body">
              <div class="kpi-val">{{ fmt(data()!.avgRevenuePerRestaurantCents) }}</div>
              <div class="kpi-lbl">Rev. moy. / restaurant</div>
            </div>
          </div>
        </div>

        <!-- ── Revenus mensuels chart + Entonnoir conversion ──── -->
        <div class="main-grid">

          <!-- Revenus mensuels -->
          <div class="panel panel-chart">
            <div class="panel-head">
              <h2 class="panel-title">Revenus mensuels — 12 derniers mois</h2>
            </div>
            <div class="chart-area">
              @if (maxRevenue() > 0) {
                <div class="bar-chart">
                  @for (m of data()!.months; track m.month) {
                    <div class="bar-col">
                      <div class="bar-tooltip">
                        {{ fmt(m.revenueCents) }}<br>
                        <small>{{ m.invoiceCount }} facture(s)</small>
                      </div>
                      <div
                        class="bar"
                        [style.height.%]="barPct(m.revenueCents, maxRevenue())"
                        [class.bar-zero]="m.revenueCents === 0"
                      ></div>
                      <div class="bar-label">{{ m.label }}</div>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-chart">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".3"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <span>Aucune donnée de revenus</span>
                </div>
              }
            </div>
          </div>

          <!-- Entonnoir de conversion -->
          <div class="panel panel-funnel">
            <div class="panel-head">
              <h2 class="panel-title">Conversion abonnements</h2>
            </div>
            <div class="funnel-body">
              <div class="funnel-step fs-total">
                <div class="fs-bar" style="width:100%"></div>
                <div class="fs-info">
                  <span class="fs-label">Total restaurants</span>
                  <span class="fs-count">{{ data()!.conversion.total }}</span>
                </div>
              </div>
              <div class="funnel-step fs-active">
                <div class="fs-bar" [style.width.%]="funnelPct('active')"></div>
                <div class="fs-info">
                  <span class="fs-label">Actifs payants</span>
                  <span class="fs-count fs-green">{{ data()!.conversion.active }}</span>
                </div>
                <div class="fs-pct">{{ funnelPct('active') | number:'1.0-0' }}%</div>
              </div>
              <div class="funnel-step fs-trial">
                <div class="fs-bar" [style.width.%]="funnelPct('trialing')"></div>
                <div class="fs-info">
                  <span class="fs-label">En période d'essai</span>
                  <span class="fs-count fs-amber">{{ data()!.conversion.trialing }}</span>
                </div>
                <div class="fs-pct">{{ funnelPct('trialing') | number:'1.0-0' }}%</div>
              </div>
              <div class="funnel-step fs-canceled">
                <div class="fs-bar" [style.width.%]="funnelPct('canceled')"></div>
                <div class="fs-info">
                  <span class="fs-label">Annulés / Expirés</span>
                  <span class="fs-count fs-red">{{ data()!.conversion.canceled }}</span>
                </div>
                <div class="fs-pct">{{ funnelPct('canceled') | number:'1.0-0' }}%</div>
              </div>
              @if (data()!.conversion.suspended > 0) {
                <div class="funnel-step fs-suspended">
                  <div class="fs-bar" [style.width.%]="funnelPct('suspended')"></div>
                  <div class="fs-info">
                    <span class="fs-label">Suspendus</span>
                    <span class="fs-count fs-red">{{ data()!.conversion.suspended }}</span>
                  </div>
                  <div class="fs-pct">{{ funnelPct('suspended') | number:'1.0-0' }}%</div>
                </div>
              }

              <!-- Taux de conversion -->
              <div class="conversion-rate">
                <div class="cr-label">Taux de conversion essai → payant</div>
                <div class="cr-val">
                  {{ conversionRate() | number:'1.1-1' }}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ── Inscriptions mensuelles chart ──────────────────── -->
        <div class="panel panel-signups">
          <div class="panel-head">
            <h2 class="panel-title">Nouvelles inscriptions — 12 derniers mois</h2>
          </div>
          <div class="chart-area chart-area-sm">
            @if (maxSignups() > 0) {
              <div class="bar-chart bar-chart-sm">
                @for (m of data()!.months; track m.month) {
                  <div class="bar-col">
                    <div class="bar-tooltip">{{ m.signupCount }} inscription(s)</div>
                    <div
                      class="bar bar-signup"
                      [style.height.%]="barPct(m.signupCount, maxSignups())"
                      [class.bar-zero]="m.signupCount === 0"
                    ></div>
                    <div class="bar-label">{{ m.label }}</div>
                  </div>
                }
              </div>
            } @else {
              <div class="empty-chart">
                <span>Aucune inscription sur la période</span>
              </div>
            }
          </div>
        </div>

        <!-- ── Revenus par plan + Top restaurants ─────────────── -->
        <div class="bottom-grid">

          <!-- Revenus par plan -->
          <div class="panel">
            <div class="panel-head">
              <h2 class="panel-title">Revenus par plan</h2>
            </div>
            @if (data()!.revenueByPlan.length === 0) {
              <p class="empty-hint">Aucune donnée disponible</p>
            } @else {
              <div class="plan-table">
                @for (p of data()!.revenueByPlan; track p.planSlug) {
                  <div class="plan-row">
                    <div class="plan-left">
                      <span class="plan-dot" [class]="'dot-' + p.planSlug"></span>
                      <span class="plan-name">{{ p.planName }}</span>
                    </div>
                    <div class="plan-bar-wrap">
                      <div class="plan-bar" [style.width.%]="p.pct"></div>
                    </div>
                    <div class="plan-right">
                      <span class="plan-revenue">{{ fmt(p.revenueCents) }}</span>
                      <span class="plan-pct">{{ p.pct }}%</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Top restaurants -->
          <div class="panel">
            <div class="panel-head">
              <h2 class="panel-title">Top restaurants générateurs</h2>
            </div>
            @if (data()!.topRestaurants.length === 0) {
              <p class="empty-hint">Aucune donnée disponible</p>
            } @else {
              <div class="top-list">
                @for (r of data()!.topRestaurants; track r.restaurantId; let idx = $index) {
                  <a [routerLink]="['/super-admin/restaurants', r.restaurantId]" class="top-row">
                    <div class="top-rank" [class.top-rank-gold]="idx === 0" [class.top-rank-silver]="idx === 1" [class.top-rank-bronze]="idx === 2">
                      {{ idx + 1 }}
                    </div>
                    <div class="top-info">
                      <div class="top-name">{{ r.restaurantName }}</div>
                      <div class="top-slug">{{ r.restaurantSlug }} · {{ r.invoiceCount }} facture(s)</div>
                    </div>
                    <div class="top-amount">
                      <div class="top-total">{{ fmt(r.totalCents) }}</div>
                      <span class="status-pill" [class]="'sp-' + r.subscriptionStatus">{{ r.subscriptionStatus }}</span>
                    </div>
                  </a>
                }
              </div>
            }
          </div>

        </div>
      } @else {
        <div class="error-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".4"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <p>Impossible de charger les données de revenus.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .sa-revenue { max-width: 1200px; }

    /* Header */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: var(--space-7);
    }
    .page-title { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); margin: 0 0 4px; }
    .page-sub   { font-size: .875rem; color: var(--text-muted); margin: 0; }
    .header-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .75rem; font-weight: 600; color: var(--text-muted);
      background: var(--gray-100); border: 1px solid var(--border);
      padding: .35rem .75rem; border-radius: var(--radius-full);
    }

    /* Skeleton */
    .skeleton-row { display: flex; gap: var(--space-4); }
    .sk { background: var(--gray-100); border-radius: var(--radius-lg); animation: pulse 1.4s ease-in-out infinite; }
    .sk-kpi { height: 110px; flex: 1; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

    /* ── KPI row ──────────────────────────────────────────────── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-4);
      margin-bottom: var(--space-5);
    }
    @media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .kpi-row { grid-template-columns: 1fr; } }

    .kpi-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      display: flex; align-items: center; gap: var(--space-4);
      animation: fadeUp .4s var(--ease-spring) calc(var(--d,0)*60ms) both;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      position: relative; overflow: hidden;
    }
    .kpi-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
    }
    .kpi-card:hover { box-shadow: var(--shadow-sm); transform: translateY(-1px); }

    .kpi-icon {
      width: 46px; height: 46px; border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .kpi-body { min-width: 0; }
    .kpi-val { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); line-height: 1.1; }
    .kpi-lbl { font-size: .72rem; color: var(--text-muted); margin-top: 3px; white-space: nowrap; }

    .kpi-brand::before { background: var(--brand); }
    .kpi-brand .kpi-icon { background: var(--brand-subtle); color: var(--brand); }

    .kpi-green::before { background: var(--success); }
    .kpi-green .kpi-icon { background: var(--success-bg); color: var(--success); }

    .kpi-blue::before { background: #2563EB; }
    .kpi-blue .kpi-icon { background: var(--info-bg, rgba(37,99,235,0.12)); color: #60a5fa; }

    .kpi-amber::before { background: #D97706; }
    .kpi-amber .kpi-icon { background: var(--warning-bg); color: var(--warning); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── Panels ──────────────────────────────────────────────── */
    .panel {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden;
    }
    .panel-head {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border);
    }
    .panel-title { font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin: 0; }

    /* ── Main grid (chart + funnel) ──────────────────────────── */
    .main-grid {
      display: grid; grid-template-columns: 1fr 340px; gap: var(--space-5);
      margin-bottom: var(--space-5);
    }
    @media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }

    /* ── Bar chart ───────────────────────────────────────────── */
    .chart-area {
      padding: var(--space-5); height: 220px;
      display: flex; align-items: flex-end;
    }
    .chart-area-sm { height: 160px; }

    .bar-chart {
      display: flex; align-items: flex-end; gap: 6px;
      width: 100%; height: 100%;
    }
    .bar-chart-sm { gap: 4px; }

    .bar-col {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      height: 100%; position: relative; gap: 4px;
    }
    .bar-col:hover .bar-tooltip { opacity: 1; transform: translateY(0); }

    .bar-tooltip {
      position: absolute; bottom: calc(100% + 6px);
      background: #1C1917; color: white; font-size: .68rem; font-weight: 600;
      padding: 5px 8px; border-radius: var(--radius-sm); white-space: nowrap;
      text-align: center; line-height: 1.4; z-index: 10;
      opacity: 0; transform: translateY(4px);
      transition: opacity .2s, transform .2s;
      pointer-events: none;
    }

    .bar {
      width: 100%; min-height: 3px;
      background: linear-gradient(to top, #C0392B, #E05A4A);
      border-radius: 4px 4px 0 0;
      transition: height .6s cubic-bezier(0.22,1,0.36,1);
      flex-shrink: 0; margin-top: auto;
    }
    .bar-signup {
      background: linear-gradient(to top, #2563EB, #60A5FA);
    }
    .bar-zero { background: var(--gray-100) !important; min-height: 3px; }
    .bar-label { font-size: .6rem; color: var(--text-muted); white-space: nowrap; text-align: center; flex-shrink: 0; }

    .panel-signups { margin-bottom: var(--space-5); }

    .empty-chart {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; width: 100%; gap: var(--space-2);
      color: var(--text-muted); font-size: .875rem;
    }

    /* ── Funnel ──────────────────────────────────────────────── */
    .funnel-body { padding: var(--space-4) var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); }

    .funnel-step { display: flex; flex-direction: column; gap: 5px; }

    .fs-bar {
      height: 8px; border-radius: var(--radius-full);
      transition: width .6s cubic-bezier(0.22,1,0.36,1);
    }
    .fs-total   .fs-bar { background: var(--gray-200); }
    .fs-active  .fs-bar { background: var(--success); }
    .fs-trial   .fs-bar { background: #F59E0B; }
    .fs-canceled .fs-bar { background: var(--error); }
    .fs-suspended .fs-bar { background: var(--error); opacity: .5; }

    .fs-info {
      display: flex; justify-content: space-between; align-items: center;
    }
    .fs-label { font-size: .8125rem; color: var(--text-secondary); }
    .fs-count { font-size: .875rem; font-weight: 700; color: var(--text-primary); }
    .fs-green  { color: var(--success) !important; }
    .fs-amber  { color: #D97706 !important; }
    .fs-red    { color: var(--error) !important; }
    .fs-pct { font-size: .7rem; color: var(--text-muted); text-align: right; }

    .conversion-rate {
      margin-top: var(--space-3); padding-top: var(--space-3);
      border-top: 1px solid var(--border);
      display: flex; justify-content: space-between; align-items: center;
    }
    .cr-label { font-size: .8125rem; color: var(--text-muted); }
    .cr-val { font-size: 1.25rem; font-weight: 800; color: var(--success); }

    /* ── Bottom grid ─────────────────────────────────────────── */
    .bottom-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5);
    }
    @media (max-width: 768px) { .bottom-grid { grid-template-columns: 1fr; } }

    /* Plan table */
    .plan-table { padding: var(--space-2) var(--space-5) var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); }
    .plan-row { display: grid; grid-template-columns: 140px 1fr 100px; align-items: center; gap: var(--space-3); }
    .plan-left { display: flex; align-items: center; gap: var(--space-2); }
    .plan-dot {
      width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-free       { background: var(--gray-400); }
    .dot-starter    { background: #2563EB; }
    .dot-pro        { background: var(--success); }
    .dot-enterprise { background: var(--brand); }
    .plan-name { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .plan-bar-wrap { height: 8px; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; }
    .plan-bar { height: 100%; background: var(--brand); border-radius: var(--radius-full); transition: width .6s; }
    .plan-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .plan-revenue { font-size: .8125rem; font-weight: 700; color: var(--text-primary); }
    .plan-pct { font-size: .7rem; color: var(--text-muted); }

    /* Top restaurants */
    .top-list { padding: var(--space-2) 0; }
    .top-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-5);
      text-decoration: none; color: inherit;
      transition: background var(--t-fast);
    }
    .top-row:hover { background: var(--gray-50); }

    .top-rank {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--gray-100); color: var(--text-muted);
      font-size: .75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .top-rank-gold   { background: var(--warning-bg); color: var(--warning); }
    .top-rank-silver { background: var(--surface-2); color: var(--text-secondary); }
    .top-rank-bronze { background: var(--error-bg); color: var(--warning); }

    .top-info { flex: 1; min-width: 0; }
    .top-name { font-size: .875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .top-slug { font-size: .72rem; color: var(--text-muted); }

    .top-amount { text-align: right; flex-shrink: 0; }
    .top-total { font-size: .875rem; font-weight: 700; color: var(--text-primary); }

    .status-pill {
      display: inline-block; font-size: .65rem; font-weight: 700;
      padding: 2px 7px; border-radius: var(--radius-full); text-transform: uppercase;
      letter-spacing: .04em; margin-top: 3px;
    }
    .sp-active   { background: var(--success-bg); color: var(--success); }
    .sp-trialing { background: var(--warning-bg); color: var(--warning); }
    .sp-canceled, .sp-expired, .sp-suspended { background: var(--error-bg); color: var(--error); }

    .empty-hint { color: var(--text-muted); font-size: .875rem; padding: var(--space-4) var(--space-5); margin: 0; }

    /* Error state */
    .error-state {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-3); padding: 80px 0; color: var(--text-muted); font-size: .9rem;
    }
  `],
})
export class SaRevenueComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly data    = signal<SaRevenueStats | null>(null)
  readonly loading = signal(true)

  readonly maxRevenue = computed(() =>
    Math.max(...(this.data()?.months.map((m) => m.revenueCents) ?? [0]), 1)
  )
  readonly maxSignups = computed(() =>
    Math.max(...(this.data()?.months.map((m) => m.signupCount) ?? [0]), 1)
  )

  readonly conversionRate = computed(() => {
    const c = this.data()?.conversion
    if (!c || c.total === 0) return 0
    const potentialConverts = c.active + c.trialing + c.canceled + c.suspended
    if (potentialConverts === 0) return 0
    return (c.active / potentialConverts) * 100
  })

  ngOnInit(): void {
    this.saService.getRevenue().subscribe({
      next:  (d) => { this.data.set(d); this.loading.set(false) },
      error: ()  => this.loading.set(false),
    })
  }

  fmt(cents: number): string {
    if (cents === 0) return '0 FCFA'
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: 'XOF', maximumFractionDigits: 0,
      }).format(cents / 100)
    } catch {
      return `${Math.round(cents / 100).toLocaleString('fr-FR')} FCFA`
    }
  }

  barPct(value: number, max: number): number {
    if (max === 0) return 0
    return Math.max((value / max) * 100, value > 0 ? 4 : 0)
  }

  funnelPct(key: 'active' | 'trialing' | 'canceled' | 'suspended'): number {
    const c = this.data()?.conversion
    if (!c || c.total === 0) return 0
    return (c[key] / c.total) * 100
  }
}
