import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Restaurant, PaginatedResponse } from '../../shared/models'

@Component({
  selector: 'app-sa-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="sa-restaurants">
      <h1>Restaurants</h1>

      <div class="toolbar">
        <input type="text" [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Rechercher..." class="search-input" />
        <select [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">Tous les statuts</option>
          <option value="active">Actifs</option>
          <option value="trial">En essai</option>
          <option value="blocked">Bloqués</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else {
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Slug</th>
                <th>Pays</th>
                <th>Plan</th>
                <th>Statut</th>
                <th>Inscrit le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (r of result()?.data ?? []; track r.id) {
                <tr [class.blocked-row]="r.blockedAt">
                  <td>
                    <a [routerLink]="['/super-admin/restaurants', r.id]" class="restaurant-link">
                      {{ r.name }}
                    </a>
                  </td>
                  <td><code>{{ r.slug }}</code></td>
                  <td>{{ r.country }}</td>
                  <td>{{ r.plan?.name ?? '—' }}</td>
                  <td>
                    <span class="status-badge status-{{ r.blockedAt ? 'blocked' : r.subscriptionStatus }}">
                      {{ r.blockedAt ? 'Bloqué' : statusLabel(r.subscriptionStatus) }}
                    </span>
                  </td>
                  <td>{{ r.createdAt | date:'dd/MM/yy' }}</td>
                  <td>
                    <div class="row-actions">
                      <a [routerLink]="['/super-admin/restaurants', r.id]" class="btn-icon" title="Détails">👁</a>
                      @if (!r.blockedAt) {
                        <button class="btn-icon btn-block" title="Bloquer" (click)="openBlockModal(r)">🔒</button>
                      } @else {
                        <button class="btn-icon btn-unblock" title="Débloquer" (click)="unblock(r)">🔓</button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if ((result()?.meta?.lastPage ?? 1) > 1) {
          <div class="pagination">
            <button [disabled]="currentPage() === 1" (click)="goPage(currentPage() - 1)">← Précédent</button>
            <span>{{ currentPage() }} / {{ result()!.meta.lastPage }}</span>
            <button [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(currentPage() + 1)">Suivant →</button>
          </div>
        }
      }
    </div>

    @if (blockingRestaurant()) {
      <div class="modal-overlay">
        <div class="modal">
          <div class="modal-header">
            <h3>Bloquer {{ blockingRestaurant()!.name }} ?</h3>
            <button (click)="blockingRestaurant.set(null)" class="close-btn">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Motif *</label>
              <textarea [(ngModel)]="blockReason" rows="3" placeholder="Expliquez la raison du blocage..."></textarea>
            </div>
            @if (actionError()) { <div class="error-msg">{{ actionError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="blockingRestaurant.set(null)">Annuler</button>
            <button class="btn-danger" (click)="confirmBlock()" [disabled]="actionLoading() || !blockReason.trim()">
              {{ actionLoading() ? 'Blocage...' : 'Bloquer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .sa-restaurants { max-width: 1100px; }

    .toolbar {
      display: flex; gap: var(--space-3); margin-bottom: var(--space-5);
    }
    .search-input { flex: 1; }

    .table-wrap {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow-x: auto;
      animation: slideUpFade .4s var(--ease-spring) both;
    }
    table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    th {
      padding: var(--space-3) var(--space-4);
      text-align: left; font-size: .70rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em;
      border-bottom: 1.5px solid var(--border); white-space: nowrap;
    }
    td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.blocked-row { background: var(--error-bg); }
    tr:hover td { background: var(--gray-50); }

    .restaurant-link { color: var(--text-primary); text-decoration: none; font-weight: 600; }
    .restaurant-link:hover { color: var(--brand); }
    code { background: var(--gray-100); padding: .15rem .4rem; border-radius: var(--radius-xs); font-size: .78rem; }

    .status-badge { display: inline-flex; align-items: center; padding: .2rem .55rem; border-radius: var(--radius-full); font-size: .70rem; font-weight: 700; }
    .status-trialing  { background: var(--warning-bg); color: var(--warning); }
    .status-active    { background: var(--success-bg); color: var(--success); }
    .status-blocked, .status-canceled, .status-suspended { background: var(--error-bg); color: var(--error); }

    .row-actions { display: flex; gap: var(--space-1); }
    .btn-block:hover   { background: var(--error-bg) !important; color: var(--error) !important; }
    .btn-unblock:hover { background: var(--success-bg) !important; color: var(--success) !important; }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: var(--space-4); padding: var(--space-4);
      border-top: 1px solid var(--border);
    }
    .pagination span { font-size: .875rem; color: var(--text-muted); }

    .error-msg { background: var(--error-bg); color: var(--error); padding: var(--space-3); border-radius: var(--radius-md); font-size: .875rem; border: 1px solid var(--error-border); }
  `],
})
export class SaRestaurantsComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly result = signal<PaginatedResponse<Restaurant> | null>(null)
  readonly loading = signal(true)
  readonly currentPage = signal(1)
  readonly blockingRestaurant = signal<Restaurant | null>(null)
  readonly actionLoading = signal(false)
  readonly actionError = signal<string | null>(null)

  search = ''
  statusFilter = ''
  blockReason = ''

  private searchTimeout: ReturnType<typeof setTimeout> | null = null

  ngOnInit(): void { this.load() }

  load(): void {
    this.loading.set(true)
    this.saService.getRestaurants({
      page: this.currentPage(),
      perPage: 20,
      search: this.search || undefined,
      status: (this.statusFilter as 'active' | 'blocked' | 'trial') || undefined,
    }).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  onSearch(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout)
    this.searchTimeout = setTimeout(() => { this.currentPage.set(1); this.load() }, 350)
  }

  goPage(page: number): void { this.currentPage.set(page); this.load() }

  statusLabel(s: string): string {
    const map: Record<string, string> = { trialing: 'Essai', active: 'Actif', canceled: 'Annulé', suspended: 'Suspendu', past_due: 'En retard' }
    return map[s] ?? s
  }

  openBlockModal(r: Restaurant): void {
    this.blockingRestaurant.set(r)
    this.blockReason = ''
    this.actionError.set(null)
  }

  confirmBlock(): void {
    const r = this.blockingRestaurant()
    if (!r) return
    this.actionLoading.set(true)
    this.saService.blockRestaurant(r.id, this.blockReason).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.blockingRestaurant.set(null)
        this.load()
      },
      error: (err) => {
        this.actionLoading.set(false)
        this.actionError.set(err.error?.message ?? 'Erreur')
      },
    })
  }

  unblock(r: Restaurant): void {
    this.saService.unblockRestaurant(r.id).subscribe({ next: () => this.load() })
  }
}
