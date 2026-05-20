import { Component, signal, computed, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule } from '@jsverse/transloco'
import { AuditService, AuditLogFilters } from '../../shared/services/audit.service'
import type { AuditLog, PaginatedResponse } from '../../shared/models'

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  created:        { bg: '#dcfce7', color: '#16a34a' },
  updated:        { bg: '#dbeafe', color: '#2563eb' },
  status_updated: { bg: '#dbeafe', color: '#2563eb' },
  deleted:        { bg: '#fee2e2', color: '#dc2626' },
  toggled:        { bg: '#fef9c3', color: '#ca8a04' },
  canceled:       { bg: '#fee2e2', color: '#dc2626' },
  uploaded:       { bg: '#f3e8ff', color: '#9333ea' },
  blocked:        { bg: '#fee2e2', color: '#dc2626' },
  unblocked:      { bg: '#dcfce7', color: '#16a34a' },
  granted:        { bg: '#dcfce7', color: '#16a34a' },
  gift_revoked:   { bg: '#fee2e2', color: '#dc2626' },
  reordered:      { bg: '#fef9c3', color: '#ca8a04' },
  logo_uploaded:  { bg: '#f3e8ff', color: '#9333ea' },
}

const ACTION_KEYS = [
  'category.created', 'category.updated', 'category.deleted', 'category.reordered',
  'menu_item.created', 'menu_item.updated', 'menu_item.deleted', 'menu_item.toggled',
  'user.created', 'user.updated', 'user.deleted',
  'restaurant.updated', 'restaurant.logo_uploaded',
  'subscription.created', 'subscription.canceled', 'subscription.granted',
  'restaurant.blocked', 'restaurant.unblocked',
  'order.created', 'order.status_updated', 'order.gift_revoked',
  'reservation.created', 'reservation.status_updated',
]

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './audit-logs.component.html',
  styles: [`
    /* Filter bar */
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      margin-bottom: var(--space-5);
      padding: var(--space-4) var(--space-5);
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .filters-row {
      display: flex;
      gap: var(--space-3);
      flex-wrap: wrap;
      align-items: center;
    }

    .select-wrap {
      position: relative;
      min-width: 185px;
      flex: 1;
      max-width: 260px;
    }
    .select-wrap .form-control {
      padding-right: var(--space-8);
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      font-size: .875rem;
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

    /* Date range */
    .date-range-wrap { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
    .date-field { display: flex; align-items: center; gap: var(--space-2); }
    .date-label { display: flex; align-items: center; gap: 5px; font-size: .78rem; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
    .date-label svg { color: var(--color-brand); }
    .date-input { width: 148px; font-size: .875rem; cursor: pointer; }
    .date-sep { font-size: .8rem; color: var(--text-muted); font-weight: 600; }
    .btn-clear-date {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      border: 1px solid var(--border);
      background: white; color: var(--text-muted); cursor: pointer;
      transition: background .15s, color .15s, border-color .15s;
      flex-shrink: 0;
    }
    .btn-clear-date:hover { background: #fef2f2; border-color: #fecaca; color: #dc2626; }

    /* Page numbers */
    .pagination-row {
      display: flex; align-items: center; justify-content: center;
      gap: var(--space-2); margin: var(--space-4) 0; flex-wrap: wrap;
    }
    .page-numbers { display: flex; align-items: center; gap: 4px; }
    .page-btn {
      min-width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      font-size: .8125rem; font-weight: 500;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      background: white; color: var(--text-secondary);
      cursor: pointer; padding: 0 var(--space-2);
      transition: background .15s, border-color .15s, color .15s;
    }
    .page-btn:hover { background: var(--gray-50); border-color: var(--gray-300); }
    .page-btn-active {
      background: var(--color-brand) !important;
      border-color: var(--color-brand) !important;
      color: white !important;
      font-weight: 700;
    }
    .page-ellipsis { font-size: .875rem; color: var(--text-muted); padding: 0 4px; line-height: 32px; }

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

    .page-info {
      font-size: .8rem;
      color: var(--text-muted);
      margin-left: var(--space-2);
      white-space: nowrap;
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
      padding: .375rem var(--space-3);
      font-size: .8rem;
      height: 32px;
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
  filterStartDate = ''
  filterEndDate = ''

  readonly skeletons = [1, 2, 3, 4, 5, 6]
  readonly actionKeys = ACTION_KEYS
  readonly todayStr = new Date().toISOString().split('T')[0]

  hasActiveFilters(): boolean {
    return !!(this.filterAction || this.filterResource || this.filterStartDate || this.filterEndDate)
  }

  readonly pageNumbers = computed((): number[] => {
    const last = this.result()?.meta.lastPage ?? 1
    const cur = this.currentPage()
    if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
    const pages: number[] = [1]
    if (cur > 3) pages.push(-1)
    for (let p = Math.max(2, cur - 1); p <= Math.min(last - 1, cur + 1); p++) pages.push(p)
    if (cur < last - 2) pages.push(-1)
    pages.push(last)
    return pages
  })

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.loading.set(true)
    this.expandedId.set(null)
    const filters: AuditLogFilters = {
      page: this.currentPage(),
      perPage: 30,
      action: this.filterAction || undefined,
      resourceType: this.filterResource || undefined,
      startDate: this.filterStartDate || undefined,
      endDate: this.filterEndDate || undefined,
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

  clearDates(): void {
    this.filterStartDate = ''
    this.filterEndDate = ''
    this.applyFilters()
  }

  goPage(page: number): void {
    this.currentPage.set(page)
    this.load()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  toggleDetails(id: number): void {
    this.expandedId.update((cur) => cur === id ? null : id)
  }

  actionBg(action: string): string {
    const suffix = action.split('.').slice(1).join('_')
    return ACTION_COLORS[suffix]?.bg ?? '#f3f4f6'
  }

  actionFg(action: string): string {
    const suffix = action.split('.').slice(1).join('_')
    return ACTION_COLORS[suffix]?.color ?? '#6b7280'
  }
}
