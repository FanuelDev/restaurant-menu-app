import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Restaurant, AuditLog } from '../../shared/models'

@Component({
  selector: 'app-sa-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="detail-page">
      <div class="page-header">
        <a routerLink="/super-admin/restaurants" class="back-link">← Retour</a>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
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
                  {{ restaurant()!.blockedAt ? 'Bloqué' : restaurant()!.subscriptionStatus }}
                </span>
              </div>
              <div class="info-grid">
                <div class="info-row"><span class="label">Pays</span><span>{{ restaurant()!.country }}</span></div>
                <div class="info-row"><span class="label">Devise</span><span>{{ restaurant()!.currency }}</span></div>
                <div class="info-row"><span class="label">Plan</span><span>{{ restaurant()!.plan?.name ?? '—' }}</span></div>
                <div class="info-row"><span class="label">Inscription</span><span>{{ restaurant()!.createdAt | date:'dd/MM/yyyy' }}</span></div>
                @if (restaurant()!.trialEndsAt) {
                  <div class="info-row"><span class="label">Fin d'essai</span><span>{{ restaurant()!.trialEndsAt | date:'dd/MM/yyyy' }}</span></div>
                }
                @if (restaurant()!.phone) {
                  <div class="info-row"><span class="label">Téléphone</span><span>{{ restaurant()!.phone }}</span></div>
                }
                @if (restaurant()!.address) {
                  <div class="info-row"><span class="label">Adresse</span><span>{{ restaurant()!.address }}</span></div>
                }
              </div>

              @if (restaurant()!.blockedAt) {
                <div class="blocked-notice">
                  <div class="blocked-title">🔒 Compte bloqué le {{ restaurant()!.blockedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  @if (restaurant()!.blockedReason) {
                    <div class="blocked-reason">Motif : {{ restaurant()!.blockedReason }}</div>
                  }
                  <button class="btn-success" (click)="unblock()" [disabled]="actionLoading()">
                    {{ actionLoading() ? 'Déblocage...' : '🔓 Débloquer ce compte' }}
                  </button>
                </div>
              } @else {
                <button class="btn-danger-outline" (click)="showBlockForm.set(true)">🔒 Bloquer ce compte</button>
              }

              @if (showBlockForm()) {
                <div class="block-form">
                  <div class="form-group">
                    <label>Motif du blocage *</label>
                    <textarea [(ngModel)]="blockReason" rows="3" placeholder="Expliquez la raison..."></textarea>
                  </div>
                  @if (actionError()) { <div class="error-msg">{{ actionError() }}</div> }
                  <div class="block-form-actions">
                    <button class="btn-outline" (click)="showBlockForm.set(false)">Annuler</button>
                    <button class="btn-danger" (click)="block()" [disabled]="actionLoading() || !blockReason.trim()">
                      {{ actionLoading() ? 'Blocage...' : 'Confirmer le blocage' }}
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="side-col">
            <div class="logs-card">
              <h3>Activité récente</h3>
              @if (logs().length === 0) {
                <div class="no-logs">Aucune activité enregistrée.</div>
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
  `],
})
export class SaRestaurantDetailComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)
  private readonly route = inject(ActivatedRoute)

  readonly restaurant = signal<Restaurant | null>(null)
  readonly logs = signal<AuditLog[]>([])
  readonly loading = signal(true)
  readonly showBlockForm = signal(false)
  readonly actionLoading = signal(false)
  readonly actionError = signal<string | null>(null)

  blockReason = ''

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id'])
    this.saService.getRestaurant(id).subscribe({
      next: (r) => { this.restaurant.set(r.restaurant); this.logs.set(r.recentLogs); this.loading.set(false) },
      error: () => this.loading.set(false),
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
