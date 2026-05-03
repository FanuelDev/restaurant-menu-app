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

const ACTION_COLORS: Record<string, string> = {
  created: '#27ae60',
  updated: '#3498db',
  deleted: '#e74c3c',
  toggled: '#f39c12',
  canceled: '#e74c3c',
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="audit-page">
      <h1>Journal d'audit</h1>

      <div class="filters">
        <select [(ngModel)]="filterAction" (ngModelChange)="applyFilters()">
          <option value="">Toutes les actions</option>
          @for (entry of actionEntries; track entry.key) {
            <option [value]="entry.key">{{ entry.label }}</option>
          }
        </select>
        <select [(ngModel)]="filterResource" (ngModelChange)="applyFilters()">
          <option value="">Tous les types</option>
          <option value="category">Catégories</option>
          <option value="menu_item">Plats</option>
          <option value="user">Utilisateurs</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else if (result()?.data?.length === 0) {
        <div class="empty">Aucune entrée dans le journal.</div>
      } @else {
        <div class="log-list">
          @for (log of result()!.data; track log.id) {
            <div class="log-entry" (click)="toggleDetails(log.id)">
              <div class="log-main">
                <span class="action-dot" [style.background]="actionColor(log.action)"></span>
                <div class="log-info">
                  <div class="log-action">{{ actionLabel(log.action) }}</div>
                  @if (log.resourceName) {
                    <div class="log-resource">{{ log.resourceName }}</div>
                  }
                </div>
                <div class="log-meta">
                  <span class="log-user">{{ log.userEmail }}</span>
                  <span class="log-role badge-{{ log.userRole }}">{{ log.userRole }}</span>
                  <span class="log-date">{{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
              @if (expandedId() === log.id && (log.oldValues || log.newValues)) {
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
                    <div class="log-ip">IP : {{ log.ipAddress }}</div>
                  }
                </div>
              }
            </div>
          }
        </div>

        @if (result()!.meta.lastPage > 1) {
          <div class="pagination">
            <button [disabled]="currentPage() === 1" (click)="goPage(currentPage() - 1)">← Précédent</button>
            <span>Page {{ currentPage() }} / {{ result()!.meta.lastPage }}</span>
            <button [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(currentPage() + 1)">Suivant →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .audit-page { max-width: 960px; }

    .filters { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); flex-wrap: wrap; }

    .log-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .log-entry {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden; cursor: pointer;
      animation: slideUpFade .35s var(--ease-spring) both;
      transition: box-shadow var(--t-fast);
      &:hover { box-shadow: var(--shadow-sm); }
    }

    .log-main {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      &:hover { background: var(--gray-50); }
    }

    .action-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .log-info { flex: 1; min-width: 0; }
    .log-action   { font-weight: 600; color: var(--text-primary); font-size: .875rem; }
    .log-resource { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }

    .log-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
    .log-user { font-size: .78rem; color: var(--text-secondary); }
    .log-role {
      font-size: .70rem; padding: .15rem .4rem; border-radius: var(--radius-full);
      background: var(--gray-100); color: var(--gray-600);
    }
    .badge-admin   { background: var(--info-bg);    color: var(--info);    }
    .badge-cashier { background: var(--success-bg); color: var(--success); }
    .log-date { font-size: .70rem; color: var(--text-muted); }

    .log-details {
      padding: var(--space-4) var(--space-4);
      background: var(--gray-50); border-top: 1px solid var(--border);
      display: flex; gap: var(--space-4); flex-wrap: wrap;
    }
    .diff-block { flex: 1; min-width: 200px; }
    .diff-label { font-size: .70rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: var(--space-2); }
    .diff-old { border-left: 3px solid var(--error);   padding-left: var(--space-3); }
    .diff-new { border-left: 3px solid var(--success); padding-left: var(--space-3); }
    .log-details pre { font-size: .75rem; white-space: pre-wrap; word-break: break-all; color: var(--text-secondary); margin: 0; font-family: 'SF Mono', 'Monaco', monospace; }
    .log-ip { font-size: .75rem; color: var(--text-muted); align-self: flex-end; }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: var(--space-4); margin-top: var(--space-5);
    }
    .pagination span { font-size: .875rem; color: var(--text-muted); }
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

  actionColor(action: string): string {
    const suffix = action.split('.')[1] ?? ''
    return ACTION_COLORS[suffix] ?? '#888'
  }
}
