import { Component, signal, computed, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule } from '@jsverse/transloco'
import { AuditService } from '../../shared/services/audit.service'
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
  'restaurant.updated', 'restaurant.logo_uploaded', 'restaurant.blocked', 'restaurant.unblocked',
  'subscription.created', 'subscription.canceled', 'subscription.granted',
  'order.created', 'order.status_updated', 'order.gift_revoked',
  'reservation.created', 'reservation.status_updated',
]

@Component({
  selector: 'app-sa-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="page-container-lg">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ t('saAuditLogs.title') }}</h1>
          <p class="page-subtitle">{{ t('saAuditLogs.subtitle') }}</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="filter-bar">
        <!-- Row 1: selects -->
        <div class="filter-row">
          <div class="select-wrap">
            <select class="form-control" [(ngModel)]="filterAction" (ngModelChange)="applyFilters()">
              <option value="">{{ t('auditLogs.filterAll') }}</option>
              @for (key of actionKeys; track key) {
                <option [value]="key">{{ t('auditLogs.actions.' + key) }}</option>
              }
            </select>
            <span class="select-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </div>

          <div class="select-wrap">
            <select class="form-control" [(ngModel)]="filterResource" (ngModelChange)="applyFilters()">
              <option value="">{{ t('auditLogs.filterTypeAll') }}</option>
              <option value="category">{{ t('auditLogs.filterCategories') }}</option>
              <option value="menu_item">{{ t('auditLogs.filterItems') }}</option>
              <option value="user">{{ t('auditLogs.filterUsers') }}</option>
              <option value="restaurant">{{ t('auditLogs.filterRestaurant') }}</option>
              <option value="order">{{ t('saAuditLogs.filterOrders') }}</option>
              <option value="reservation">{{ t('saAuditLogs.filterReservations') }}</option>
            </select>
            <span class="select-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </div>

          <div class="select-wrap">
            <select class="form-control" [(ngModel)]="filterRole" (ngModelChange)="applyFilters()">
              <option value="">{{ t('saAuditLogs.filterAllRoles') }}</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">{{ t('auditLogs.roleAdmin') }}</option>
              <option value="cashier">{{ t('auditLogs.roleCashier') }}</option>
            </select>
            <span class="select-chevron"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></span>
          </div>
        </div>

        <!-- Row 2: date range -->
        <div class="filter-row">
          <div class="date-range-wrap">
            <div class="date-field">
              <span class="date-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ t('saAuditLogs.dateFrom') }}
              </span>
              <input type="date" class="form-control date-input" [(ngModel)]="filterStartDate"
                [max]="filterEndDate || todayStr"
                (ngModelChange)="applyFilters()" />
            </div>
            <span class="date-sep">→</span>
            <div class="date-field">
              <span class="date-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                {{ t('saAuditLogs.dateTo') }}
              </span>
              <input type="date" class="form-control date-input" [(ngModel)]="filterEndDate"
                [min]="filterStartDate" [max]="todayStr"
                (ngModelChange)="applyFilters()" />
            </div>
            @if (filterStartDate || filterEndDate) {
              <button class="btn-clear-date" type="button" (click)="clearDates()" [title]="t('saAuditLogs.clearDates')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            }
          </div>

          <!-- Active filter summary -->
          @if (hasActiveFilters()) {
            <div class="active-filters">
              @if (filterStartDate || filterEndDate) {
                <span class="filter-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                  {{ filterStartDate || '…' }} → {{ filterEndDate || '…' }}
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- Top pagination (when data loaded) -->
      @if (!loading() && result() && result()!.meta.lastPage > 1) {
        <div class="pagination-row">
          <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === 1" (click)="goPage(1)" [title]="t('saAuditLogs.firstPage')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === 1" (click)="goPage(currentPage() - 1)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            {{ t('common.previous') }}
          </button>
          <div class="page-numbers">
            @for (p of pageNumbers(); track p) {
              @if (p === -1) { <span class="page-ellipsis">…</span> }
              @else { <button class="page-btn" [class.page-btn-active]="p === currentPage()" (click)="goPage(p)">{{ p }}</button> }
            }
          </div>
          <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(currentPage() + 1)">
            {{ t('common.next') }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(result()!.meta.lastPage)" [title]="t('saAuditLogs.lastPage')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
          </button>
          <span class="page-info">{{ t('common.page', { current: currentPage(), total: result()!.meta.lastPage }) }}</span>
        </div>
      }

      <!-- Skeleton -->
      @if (loading()) {
        <div class="log-list">
          @for (i of skeletons; track i) {
            <div class="skeleton-row">
              <div class="sk-dot shimmer"></div>
              <div class="sk-body">
                <div class="sk-line shimmer" style="width:160px;height:14px"></div>
                <div class="sk-line shimmer" style="width:100px;height:11px;margin-top:5px"></div>
              </div>
              <div class="sk-meta">
                <div class="sk-line shimmer" style="width:130px;height:11px"></div>
                <div class="sk-line shimmer" style="width:80px;height:11px;margin-top:4px"></div>
              </div>
            </div>
          }
        </div>

      <!-- Empty -->
      } @else if (filtered().length === 0) {
        <div class="empty-state">
          <div class="empty-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <p class="empty-title">{{ t('auditLogs.empty') }}</p>
          <p class="empty-desc">{{ t('auditLogs.emptyMessage') }}</p>
        </div>

      <!-- Logs -->
      } @else {
        <div class="log-list">
          @for (log of filtered(); track log.id) {
            <div class="log-entry" (click)="toggleDetails(log.id)" [class.is-expanded]="expandedId() === log.id">
              <div class="log-main">

                <span class="action-badge" [style.background]="actionBg(log.action)" [style.color]="actionFg(log.action)">
                  {{ t('auditLogs.actions.' + log.action) || log.action }}
                </span>

                @if (log.restaurant) {
                  <span class="restaurant-pill">
                    <svg width="11" height="11" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 16V8l7-5 7 5v8H2z" stroke-linejoin="round"/></svg>
                    {{ log.restaurant.name }}
                  </span>
                }

                @if (log.resourceName) {
                  <span class="log-resource">{{ log.resourceName }}</span>
                }

                <div class="log-spacer"></div>

                <div class="log-meta">
                  <span class="log-user">{{ log.userEmail }}</span>
                  <span class="role-pill"
                    [class.role-superadmin]="log.userRole === 'super_admin'"
                    [class.role-admin]="log.userRole === 'admin'"
                    [class.role-cashier]="log.userRole === 'cashier'">
                    @if (log.userRole === 'super_admin') { Super Admin }
                    @else if (log.userRole === 'admin') { {{ t('auditLogs.roleAdmin') }} }
                    @else { {{ t('auditLogs.roleCashier') }} }
                  </span>
                  <span class="log-date">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-1px">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}
                  </span>
                </div>

                <span class="expand-icon" [class.rotated]="expandedId() === log.id">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </div>

              @if (expandedId() === log.id && (log.oldValues || log.newValues || log.ipAddress)) {
                <div class="log-details">
                  @if (log.oldValues) {
                    <div class="diff-block diff-old">
                      <div class="diff-label">{{ t('auditLogs.before') }}</div>
                      <pre>{{ log.oldValues | json }}</pre>
                    </div>
                  }
                  @if (log.newValues) {
                    <div class="diff-block diff-new">
                      <div class="diff-label">{{ t('auditLogs.after') }}</div>
                      <pre>{{ log.newValues | json }}</pre>
                    </div>
                  }
                  @if (log.ipAddress) {
                    <div class="log-ip">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="margin-right:4px;vertical-align:-1px">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
                      </svg>
                      {{ t('auditLogs.ip', { ip: log.ipAddress }) }}
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

        <!-- Bottom pagination -->
        @if (result()!.meta.lastPage > 1) {
          <div class="pagination-row">
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === 1" (click)="goPage(1)" [title]="t('saAuditLogs.firstPage')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="11 17 6 12 11 7"/><polyline points="18 17 13 12 18 7"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === 1" (click)="goPage(currentPage() - 1)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              {{ t('common.previous') }}
            </button>
            <div class="page-numbers">
              @for (p of pageNumbers(); track p) {
                @if (p === -1) { <span class="page-ellipsis">…</span> }
                @else { <button class="page-btn" [class.page-btn-active]="p === currentPage()" (click)="goPage(p)">{{ p }}</button> }
              }
            </div>
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(currentPage() + 1)">
              {{ t('common.next') }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            <button class="btn btn-ghost btn-sm" [disabled]="currentPage() === result()!.meta.lastPage" (click)="goPage(result()!.meta.lastPage)" [title]="t('saAuditLogs.lastPage')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
            </button>
            <span class="page-info">{{ t('common.page', { current: currentPage(), total: result()!.meta.lastPage }) }}</span>
          </div>
        }
      }

    </div>
    </ng-container>
  `,
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

    .filter-row {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      flex-wrap: wrap;
    }

    .select-wrap { position: relative; min-width: 185px; flex: 1; max-width: 240px; }
    .select-wrap .form-control { padding-right: var(--space-8); appearance: none; -webkit-appearance: none; cursor: pointer; font-size: .875rem; }
    .select-chevron { position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-muted); display: flex; align-items: center; }

    /* Date range */
    .date-range-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
    }
    .date-field {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .date-label {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: .78rem;
      font-weight: 600;
      color: var(--text-muted);
      white-space: nowrap;
    }
    .date-label svg { color: var(--color-brand); }
    .date-input {
      width: 148px;
      font-size: .875rem;
      cursor: pointer;
    }
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

    .active-filters { display: flex; gap: var(--space-2); align-items: center; margin-left: auto; }
    .filter-chip {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: .73rem; font-weight: 600;
      padding: 3px 10px;
      background: var(--color-brand-light, #fef2f2);
      color: var(--color-brand);
      border: 1px solid var(--color-brand);
      border-radius: var(--radius-full);
    }

    /* Skeleton */
    .skeleton-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-4) var(--space-5); background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); margin-bottom: var(--space-2); }
    .sk-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .sk-body { flex: 1; }
    .sk-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
    .sk-line { border-radius: 6px; }

    /* Log list */
    .log-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .log-entry { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; cursor: pointer; transition: box-shadow var(--t-fast), border-color var(--t-fast); }
    .log-entry:hover { box-shadow: var(--shadow-sm); }
    .log-entry.is-expanded { border-color: var(--primary-200, #c7d2fe); }
    .log-main { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); }
    .log-main:hover { background: var(--gray-50); }

    .action-badge { display: inline-flex; align-items: center; font-size: .75rem; font-weight: 600; padding: .25rem .6rem; border-radius: var(--radius-full); white-space: nowrap; flex-shrink: 0; }
    .restaurant-pill { display: inline-flex; align-items: center; gap: 5px; font-size: .75rem; font-weight: 600; padding: .2rem .55rem; border-radius: var(--radius-full); background: #1c191710; color: #1c1917; white-space: nowrap; flex-shrink: 0; }
    .log-resource { font-size: .8rem; color: var(--text-secondary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px; }
    .log-spacer { flex: 1; }
    .log-meta { display: flex; align-items: center; gap: var(--space-3); flex-shrink: 0; }
    .log-user { font-size: .78rem; color: var(--text-secondary); }

    .role-pill { font-size: .70rem; font-weight: 600; padding: .2rem .5rem; border-radius: var(--radius-full); background: var(--gray-100); color: var(--gray-600); }
    .role-superadmin { background: #1c191715; color: #1c1917; }
    .role-admin      { background: #dbeafe; color: #2563eb; }
    .role-cashier    { background: #dcfce7; color: #16a34a; }

    .log-date { font-size: .75rem; color: var(--text-muted); display: flex; align-items: center; }
    .expand-icon { color: var(--text-muted); display: flex; align-items: center; transition: transform .2s ease; flex-shrink: 0; }
    .expand-icon.rotated { transform: rotate(180deg); }

    /* Details */
    .log-details { padding: var(--space-4) var(--space-5); background: var(--gray-50); border-top: 1px solid var(--border); display: flex; gap: var(--space-5); flex-wrap: wrap; align-items: flex-start; }
    .diff-block { flex: 1; min-width: 180px; }
    .diff-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: var(--space-2); }
    .diff-old { border-left: 3px solid var(--error); padding-left: var(--space-3); }
    .diff-new { border-left: 3px solid var(--success); padding-left: var(--space-3); }
    .log-details pre { font-size: .73rem; white-space: pre-wrap; word-break: break-all; color: var(--text-secondary); margin: 0; font-family: 'SF Mono', 'Monaco', 'Consolas', monospace; }
    .log-ip { font-size: .75rem; color: var(--text-muted); display: flex; align-items: center; align-self: flex-end; margin-left: auto; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--space-16) var(--space-6); text-align: center; }
    .empty-icon-wrap { width: 64px; height: 64px; border-radius: var(--radius-xl); background: var(--gray-100); display: flex; align-items: center; justify-content: center; color: var(--text-muted); margin-bottom: var(--space-4); }
    .empty-title { font-size: 1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 var(--space-2); }
    .empty-desc { font-size: .875rem; color: var(--text-muted); margin: 0; }

    /* Pagination */
    .pagination-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      margin: var(--space-4) 0;
      flex-wrap: wrap;
    }
    .page-numbers { display: flex; align-items: center; gap: 4px; }
    .page-btn {
      min-width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      font-size: .8125rem; font-weight: 500;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
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
    .page-info { font-size: .8rem; color: var(--text-muted); margin-left: var(--space-2); white-space: nowrap; }

    .btn-ghost { background: white; border: 1px solid var(--border); color: var(--text-secondary); display: inline-flex; align-items: center; gap: 5px; }
    .btn-ghost:hover:not(:disabled) { background: var(--gray-50); border-color: var(--gray-300); }
    .btn-ghost:disabled { opacity: .4; cursor: not-allowed; }
    .btn-sm { padding: .375rem var(--space-3); font-size: .8rem; height: 32px; }
  `],
})
export class SaAuditLogsComponent implements OnInit {
  private readonly auditService = inject(AuditService)

  readonly result = signal<PaginatedResponse<AuditLog> | null>(null)
  readonly loading = signal(true)
  readonly currentPage = signal(1)
  readonly expandedId = signal<number | null>(null)

  filterAction = ''
  filterResource = ''
  filterRole = ''
  filterStartDate = ''
  filterEndDate = ''

  readonly skeletons = [1, 2, 3, 4, 5, 6, 7, 8]
  readonly actionKeys = ACTION_KEYS

  readonly todayStr = new Date().toISOString().split('T')[0]

  hasActiveFilters(): boolean {
    return !!(this.filterAction || this.filterResource || this.filterRole || this.filterStartDate || this.filterEndDate)
  }

  /** Client-side role filter (role isn't a server param — avoids extra round-trip) */
  filtered(): AuditLog[] {
    const data = this.result()?.data ?? []
    if (!this.filterRole) return data
    return data.filter((l) => l.userRole === this.filterRole)
  }

  /** Smart page number list: [1, …, cur-1, cur, cur+1, …, last] */
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

  ngOnInit(): void { this.load() }

  private load(): void {
    this.loading.set(true)
    this.expandedId.set(null)
    this.auditService.getAllLogs({
      page: this.currentPage(),
      perPage: 30,
      action: this.filterAction || undefined,
      resourceType: this.filterResource || undefined,
      startDate: this.filterStartDate || undefined,
      endDate: this.filterEndDate || undefined,
    }).subscribe({
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
    // Scroll back to top of the list
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  toggleDetails(id: number): void {
    this.expandedId.update((cur) => (cur === id ? null : id))
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
