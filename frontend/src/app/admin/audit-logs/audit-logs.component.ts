import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { AuditService, AuditLogFilters } from '../../shared/services/audit.service'
import type { AuditLog, PaginatedResponse } from '../../shared/models'

const ACTION_LABELS: Record<string, string> = {
  'category.created': 'Catégorie créée',
  'category.updated': 'Catégorie modifiée',
  'category.deleted': 'Catégorie supprimée',
  'menu_item.created': 'Plat ajouté',
  'menu_item.updated': 'Plat modifié',
  'menu_item.deleted': 'Plat supprimé',
  'menu_item.toggled': 'Disponibilité modifiée',
  'user.created': 'Caissier ajouté',
  'user.updated': 'Caissier modifié',
  'user.deleted': 'Caissier supprimé',
  'restaurant.updated': 'Restaurant modifié',
  'restaurant.logo_uploaded': 'Logo mis à jour',
  'subscription.created': 'Abonnement initié',
  'subscription.canceled': 'Abonnement annulé',
}

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  created:  { bg: '#dcfce7', color: '#16a34a' },
  updated:  { bg: '#dbeafe', color: '#2563eb' },
  deleted:  { bg: '#fee2e2', color: '#dc2626' },
  toggled:  { bg: '#fef9c3', color: '#ca8a04' },
  canceled: { bg: '#fee2e2', color: '#dc2626' },
  uploaded: { bg: '#f3e8ff', color: '#9333ea' },
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container-lg">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Journal d'audit</h1>
          <p class="page-subtitle">Historique de toutes les actions effectuées sur votre compte</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-row">
        <div class="select-wrap">
          <select class="form-control" [(ngModel)]="filterAction" (ngModelChange)="applyFilters()">
            <option value="">Toutes les actions</option>
            @for (entry of actionEntries; track entry.key) {
              <option [value]="entry.key">{{ entry.label }}</option>
            }
          </select>
          <span class="select-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>
        <div class="select-wrap">
          <select class="form-control" [(ngModel)]="filterResource" (ngModelChange)="applyFilters()">
            <option value="">Tous les types</option>
            <option value="category">Catégories</option>
            <option value="menu_item">Plats</option>
            <option value="user">Utilisateurs</option>
            <option value="restaurant">Restaurant</option>
          </select>
          <span class="select-chevron">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
        </div>
      </div>

      <!-- Skeleton loader -->
      @if (loading()) {
        <div class="log-list">
          @for (i of skeletons; track i) {
            <div class="skeleton-row">
              <div class="sk-dot shimmer"></div>
              <div class="sk-body">
                <div class="sk-line shimmer" style="width:140px;height:14px"></div>
                <div class="sk-line shimmer" style="width:90px;height:11px;margin-top:5px"></div>
              </div>
              <div class="sk-meta">
                <div class="sk-line shimmer" style="width:120px;height:11px"></div>
                <div class="sk-line shimmer" style="width:60px;height:11px;margin-top:4px"></div>
              </div>
            </div>
          }
        </div>

      <!-- Empty state -->
      } @else if (result()?.data?.length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <p class="empty-title">Aucune entrée</p>
          <p class="empty-desc">Le journal est vide pour les filtres sélectionnés.</p>
        </div>

      <!-- Log list -->
      } @else {
        <div class="log-list">
          @for (log of result()!.data; track log.id) {
            <div class="log-entry" (click)="toggleDetails(log.id)" [class.is-expanded]="expandedId() === log.id">
              <div class="log-main">
                <span class="action-badge" [style.background]="actionBg(log.action)" [style.color]="actionFg(log.action)">
                  {{ actionLabel(log.action) }}
                </span>
                @if (log.resourceName) {
                  <span class="log-resource">{{ log.resourceName }}</span>
                }
                <div class="log-spacer"></div>
                <div class="log-meta">
                  <span class="log-user">{{ log.userEmail }}</span>
                  <span class="role-pill" [class.role-admin]="log.userRole === 'admin'" [class.role-cashier]="log.userRole === 'cashier'">
                    {{ log.userRole === 'admin' ? 'Admin' : 'Caissier' }}
                  </span>
                  <span class="log-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>
                <span class="expand-icon" [class.rotated]="expandedId() === log.id">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </span>
              </div>

              @if (expandedId() === log.id && (log.oldValues || log.newValues || log.ipAddress)) {
                <div class="log-details">
                  @if (log.oldValues) {
                    <div class="diff-block diff-old">
                      <div class="diff-label">Avant</div>
                      <pre>{{ log.oldValues | json }}</pre>
                    </div>
                  }
                  @if (log.newValues) {
                    <div class="diff-block diff-new">
                      <div class="diff-label">Après</div>
                      <pre>{{ log.newValues | json }}</pre>
                    </div>
                  }
                  @if (log.ipAddress) {
                    <div class="log-ip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:-1px">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      IP : {{ log.ipAddress }}
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (result()!.meta.lastPage > 1) {
          <div class="pagination-row">
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === 1" (click)="goPage(currentPage() - 1)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Précédent
            </button>
            <span class="page-info">Page {{ currentPage() }} sur {{ result()!.meta.lastPage }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(currentPage() + 1)">
              Suivant
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .filters-row {
      display: flex;
      gap: var(--space-3);
      margin-bottom: var(--space-6);
      flex-wrap: wrap;
    }

    .select-wrap {
      position: relative;
      min-width: 200px;
    }
    .select-wrap .form-control {
      padding-right: var(--space-10);
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
    }
    .select-chevron {
      position: absolute;
      right: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
      color: var(--text-muted);
      display: flex;
      align-items: center;
    }

    /* Skeleton */
    .skeleton-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4) var(--space-5);
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      margin-bottom: var(--space-2);
    }
    .sk-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .sk-body { flex: 1; }
    .sk-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .sk-line { border-radius: 6px; }

    /* Log list */
    .log-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .log-entry {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow var(--t-fast), border-color var(--t-fast);
    }
    .log-entry:hover { box-shadow: var(--shadow-sm); }
    .log-entry.is-expanded { border-color: var(--primary-200, #c7d2fe); }

    .log-main {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
    }
    .log-main:hover { background: var(--gray-50); }

    .action-badge {
      display: inline-flex;
      align-items: center;
      font-size: .75rem;
      font-weight: 600;
      padding: .25rem .6rem;
      border-radius: var(--radius-full);
      white-space: nowrap;
      flex-shrink: 0;
    }

    .log-resource {
      font-size: .8rem;
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    .log-spacer { flex: 1; }

    .log-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
    }

    .log-user {
      font-size: .78rem;
      color: var(--text-secondary);
    }

    .role-pill {
      font-size: .70rem;
      font-weight: 600;
      padding: .2rem .5rem;
      border-radius: var(--radius-full);
      background: var(--gray-100);
      color: var(--gray-600);
    }
    .role-admin   { background: #dbeafe; color: #2563eb; }
    .role-cashier { background: #dcfce7; color: #16a34a; }

    .log-date {
      font-size: .75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
    }

    .expand-icon {
      color: var(--text-muted);
      display: flex;
      align-items: center;
      transition: transform .2s ease;
      flex-shrink: 0;
    }
    .expand-icon.rotated { transform: rotate(180deg); }

    /* Details panel */
    .log-details {
      padding: var(--space-4) var(--space-5);
      background: var(--gray-50);
      border-top: 1px solid var(--border);
      display: flex;
      gap: var(--space-5);
      flex-wrap: wrap;
      align-items: flex-start;
    }
    .diff-block { flex: 1; min-width: 180px; }
    .diff-label {
      font-size: .68rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: var(--text-muted);
      margin-bottom: var(--space-2);
    }
    .diff-old { border-left: 3px solid var(--error);   padding-left: var(--space-3); }
    .diff-new { border-left: 3px solid var(--success); padding-left: var(--space-3); }
    .log-details pre {
      font-size: .73rem;
      white-space: pre-wrap;
      word-break: break-all;
      color: var(--text-secondary);
      margin: 0;
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
    }
    .log-ip {
      font-size: .75rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      align-self: flex-end;
      margin-left: auto;
    }

    /* Empty state */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--space-16) var(--space-6);
      text-align: center;
    }
    .empty-icon-wrap {
      width: 64px;
      height: 64px;
      border-radius: var(--radius-xl);
      background: var(--gray-100);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-muted);
      margin-bottom: var(--space-4);
    }
    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
    }
    .empty-desc {
      font-size: .875rem;
      color: var(--text-muted);
      margin: 0;
    }

    /* Pagination */
    .pagination-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .page-info {
      font-size: .875rem;
      color: var(--text-muted);
    }
    .btn-ghost {
      background: white;
      border: 1px solid var(--border);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
    }
    .btn-ghost:hover:not(:disabled) {
      background: var(--gray-50);
      border-color: var(--gray-300);
    }
    .btn-ghost:disabled {
      opacity: .4;
      cursor: not-allowed;
    }
    .btn-sm {
      padding: .375rem var(--space-4);
      font-size: .8rem;
    }
  `],
})
export class AuditLogsComponent implements OnInit {
  private readonly auditService = inject(AuditService)

  readonly result = signal<PaginatedResponse<AuditLog> | null>(null)
  readonly loading = signal(true)
  readonly currentPage = signal(1)
  readonly expandedId = signal<number | null>(null)

  filterAction = ''
  filterResource = ''

  readonly skeletons = [1, 2, 3, 4, 5, 6]
  readonly actionEntries = Object.entries(ACTION_LABELS).map(([key, label]) => ({ key, label }))

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    const filters: AuditLogFilters = {
      page: this.currentPage(),
      perPage: 30,
      action: this.filterAction || undefined,
      resourceType: this.filterResource || undefined,
    }
    this.auditService.getLogs(filters).subscribe({
      next: (r) => { this.result.set(r); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  applyFilters(): void {
    this.currentPage.set(1)
    this.load()
  }

  goPage(page: number): void {
    this.currentPage.set(page)
    this.load()
  }

  toggleDetails(id: number): void {
    this.expandedId.update((cur) => cur === id ? null : id)
  }

  actionLabel(action: string): string {
    return ACTION_LABELS[action] ?? action
  }

  actionBg(action: string): string {
    const suffix = action.split('.')[1] ?? ''
    return ACTION_COLORS[suffix]?.bg ?? '#f3f4f6'
  }

  actionFg(action: string): string {
    const suffix = action.split('.')[1] ?? ''
    return ACTION_COLORS[suffix]?.color ?? '#6b7280'
  }
}
