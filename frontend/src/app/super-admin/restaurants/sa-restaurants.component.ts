import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Restaurant, PaginatedResponse } from '../../shared/models'

@Component({
  selector: 'app-sa-restaurants',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  templateUrl: './sa-restaurants.component.html',
  styles: [`
    .sa-restaurants { max-width: 1100px; }

    .page-header { margin-bottom: var(--space-6); }
    .page-title  { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-sub    { color: var(--text-muted); font-size: .9rem; margin: 0; }

    /* Toolbar */
    .toolbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); }

    .search-wrap { flex: 1; position: relative; }
    .search-icon { position: absolute; left: 11px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
    .search-input {
      width: 100%; padding: 9px 12px 9px 34px;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      font-size: .875rem; color: var(--text-primary); background: white;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(176,48,32,.1); }
      &::placeholder { color: var(--text-muted); }
    }

    .filter-wrap { position: relative; }
    .filter-select {
      appearance: none;
      padding: 9px 32px 9px 12px;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      font-size: .875rem; color: var(--text-primary); background: white;
      cursor: pointer; min-width: 160px;
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(176,48,32,.1); }
    }
    .select-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

    /* Skeleton */
    .table-skeleton { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .skeleton-row {
      height: 56px; border-bottom: 1px solid var(--border);
      background: linear-gradient(90deg, var(--gray-50) 25%, var(--gray-100) 50%, var(--gray-50) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
      &:last-child { border-bottom: none; }
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Table */
    .table-wrap { background: white; border: 1px solid var(--border); border-radius: var(--radius-lg); overflow-x: auto; animation: slideUpFade .4s var(--ease-spring) both; }
    table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    th {
      padding: var(--space-3) var(--space-4);
      text-align: left; font-size: .70rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: .06em;
      border-bottom: 1px solid var(--border); white-space: nowrap; background: var(--gray-50);
    }
    td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr.row-blocked { background: #FFF5F5; }
    tr:hover td { background: var(--gray-50); }

    .col-muted { color: var(--text-secondary); font-size: .8125rem; }

    .restaurant-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      color: var(--text-primary); text-decoration: none; font-weight: 600;
      &:hover { color: var(--brand); }
    }
    .rest-avatar {
      width: 28px; height: 28px; border-radius: var(--radius-sm); flex-shrink: 0;
      background: var(--gray-100); color: var(--gray-600);
      font-size: .75rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }

    code { background: var(--gray-100); color: var(--gray-700); padding: .15rem .4rem; border-radius: var(--radius-xs); font-size: .78rem; }

    .status-badge { display: inline-flex; align-items: center; padding: .25rem .6rem; border-radius: var(--radius-full); font-size: .70rem; font-weight: 700; }
    .status-trialing  { background: var(--warning-bg); color: var(--warning); }
    .status-active    { background: var(--success-bg); color: var(--success); }
    .status-blocked, .status-canceled, .status-suspended { background: var(--error-bg); color: var(--error); }

    .row-actions { display: flex; gap: var(--space-1); justify-content: flex-end; }
    .action-btn {
      width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      background: white; color: var(--text-muted); cursor: pointer;
      text-decoration: none; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }
    .action-danger:hover  { background: var(--error-bg) !important; color: var(--error) !important; border-color: var(--error-border, #FCA5A5) !important; }
    .action-success:hover { background: var(--success-bg) !important; color: var(--success) !important; border-color: #86EFAC !important; }

    .empty-row {
      text-align: center; padding: var(--space-12) !important;
      color: var(--text-muted); font-size: .875rem;
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
    }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-3); padding: var(--space-4); border-top: 1px solid var(--border); }
    .page-btn {
      display: inline-flex; align-items: center; gap: var(--space-1);
      padding: 7px var(--space-3); border: 1px solid var(--border); border-radius: var(--radius-md);
      background: white; color: var(--text-secondary); font-size: .8125rem; cursor: pointer;
      transition: all var(--t-fast);
      &:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); }
      &:disabled { opacity: .4; cursor: default; }
    }
    .page-info { font-size: .875rem; color: var(--text-muted); min-width: 60px; text-align: center; }

    /* Modal */
    .req { color: var(--error); }
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
      next: () => { this.actionLoading.set(false); this.blockingRestaurant.set(null); this.load() },
      error: (err) => { this.actionLoading.set(false); this.actionError.set(err.error?.message ?? 'Erreur') },
    })
  }

  unblock(r: Restaurant): void {
    this.saService.unblockRestaurant(r.id).subscribe({ next: () => this.load() })
  }
}
