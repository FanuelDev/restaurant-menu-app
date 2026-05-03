import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { SuperAdminStats } from '../../shared/models'

@Component({
  selector: 'app-sa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sa-dashboard">
      <h1>Tableau de bord</h1>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else if (stats()) {
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-icon">🏪</div>
            <div class="kpi-value">{{ stats()!.totals.restaurants }}</div>
            <div class="kpi-label">Restaurants</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-icon">👥</div>
            <div class="kpi-value">{{ stats()!.totals.users }}</div>
            <div class="kpi-label">Utilisateurs</div>
          </div>
          <div class="kpi-card kpi-success">
            <div class="kpi-icon">✅</div>
            <div class="kpi-value">{{ stats()!.totals.activeSubscriptions }}</div>
            <div class="kpi-label">Abonnements actifs</div>
          </div>
          <div class="kpi-card kpi-warning">
            <div class="kpi-icon">⏳</div>
            <div class="kpi-value">{{ stats()!.totals.trialRestaurants }}</div>
            <div class="kpi-label">En période d'essai</div>
          </div>
          <div class="kpi-card kpi-danger">
            <div class="kpi-icon">🔒</div>
            <div class="kpi-value">{{ stats()!.totals.blockedRestaurants }}</div>
            <div class="kpi-label">Bloqués</div>
          </div>
        </div>

        <div class="bottom-grid">
          <div class="card">
            <h3>Répartition par plan</h3>
            @for (p of stats()!.planStats; track p.planSlug) {
              <div class="plan-row">
                <span class="plan-name">{{ p.planName }}</span>
                <span class="plan-count">{{ p.count }}</span>
              </div>
            }
          </div>

          <div class="card">
            <div class="card-header">
              <h3>Inscriptions récentes</h3>
              <a routerLink="/super-admin/restaurants" class="see-all">Voir tout →</a>
            </div>
            @for (r of stats()!.recentSignups; track r.id) {
              <a [routerLink]="['/super-admin/restaurants', r.id]" class="signup-row">
                <div class="signup-info">
                  <div class="signup-name">{{ r.name }}</div>
                  <div class="signup-slug">{{ r.slug }}</div>
                </div>
                <div class="signup-meta">
                  <span class="status-badge status-{{ r.subscriptionStatus }}">{{ r.subscriptionStatus }}</span>
                  <div class="signup-date">{{ r.createdAt | date:'dd/MM/yy' }}</div>
                </div>
              </a>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sa-dashboard { max-width: 1000px; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 900px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5);
      box-shadow: var(--shadow-xs); text-align: center;
      animation: slideUpFade .45s var(--ease-spring) both;
    }
    .kpi-success { border-top: 3px solid var(--success); }
    .kpi-warning { border-top: 3px solid var(--warning); }
    .kpi-danger  { border-top: 3px solid var(--error); }

    .kpi-icon  { font-size: 1.375rem; margin-bottom: var(--space-2); }
    .kpi-value { font-size: 2rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-label { font-size: .75rem; color: var(--text-muted); margin-top: var(--space-1); }

    .bottom-grid { display: grid; grid-template-columns: 280px 1fr; gap: var(--space-4); }
    @media (max-width: 700px) { .bottom-grid { grid-template-columns: 1fr; } }

    .card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5);
      animation: slideUpFade .5s var(--ease-spring) .1s both;
    }
    .card h3 { margin: 0 0 var(--space-4); font-size: .9375rem; font-weight: 600; color: var(--text-primary); font-family: var(--font-body); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-4); }
    .card-header h3 { margin: 0; }
    .see-all { font-size: .8125rem; color: var(--brand); text-decoration: none; font-weight: 500; }
    .see-all:hover { text-decoration: underline; }

    .plan-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) 0; border-bottom: 1px solid var(--border); font-size: .875rem;
      &:last-child { border-bottom: none; }
    }
    .plan-name  { color: var(--text-secondary); }
    .plan-count { font-weight: 700; color: var(--brand); }

    .signup-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-2) var(--space-2); border-bottom: 1px solid var(--border);
      text-decoration: none; color: inherit; border-radius: var(--radius-sm);
      transition: background var(--t-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); }
    }
    .signup-info { min-width: 0; }
    .signup-name { font-size: .875rem; font-weight: 500; color: var(--text-primary); }
    .signup-slug { font-size: .75rem; color: var(--text-muted); }
    .signup-meta { text-align: right; flex-shrink: 0; }
    .signup-date { font-size: .70rem; color: var(--text-muted); margin-top: 3px; }

    .status-badge {
      display: inline-block; padding: .2rem .5rem;
      border-radius: var(--radius-full); font-size: .70rem; font-weight: 600;
    }
    .status-trialing  { background: var(--warning-bg); color: var(--warning); }
    .status-active    { background: var(--success-bg); color: var(--success); }
    .status-canceled, .status-suspended { background: var(--error-bg); color: var(--error); }
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
