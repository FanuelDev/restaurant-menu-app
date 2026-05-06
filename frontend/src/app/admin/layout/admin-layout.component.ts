import { Component, inject, signal, computed } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="shell">

      <!-- Sidebar -->
      <aside class="sidebar" [class.sidebar-mini]="collapsed()">

        <!-- Brand -->
        <div class="sb-brand" [class.sb-brand-mini]="collapsed()">
          @if (!collapsed()) {
            <div class="sb-logo">
              <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
                <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span class="sb-brand-name">MenuApp</span>
          }
          <button class="sb-toggle" [class.sb-toggle-center]="collapsed()" (click)="toggleCollapsed()" [attr.aria-label]="collapsed() ? t('nav.openMenu') : t('nav.collapseMenu')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              @if (collapsed()) {
                <path d="M6 2l6 6-6 6"/>
              } @else {
                <path d="M10 2L4 8l6 6"/>
              }
            </svg>
          </button>
        </div>

        <!-- Nav -->
        <nav class="sb-nav" aria-label="Navigation principale">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.dashboard') : ''">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="1.5" y="1.5" width="6" height="6" rx="1.2"/>
              <rect x="10.5" y="1.5" width="6" height="6" rx="1.2"/>
              <rect x="1.5" y="10.5" width="6" height="6" rx="1.2"/>
              <rect x="10.5" y="10.5" width="6" height="6" rx="1.2"/>
            </svg>
            @if (!collapsed()) { <span>{{ t('nav.dashboard') }}</span> }
          </a>

          <a routerLink="/admin/categories" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.categories') : ''">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M2 2.5h5.5l8 8-5.5 5.5-8-8V2.5z" stroke-linejoin="round"/>
              <circle cx="5.5" cy="5.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
            @if (!collapsed()) { <span>{{ t('nav.categories') }}</span> }
          </a>

          <a routerLink="/admin/menu-items" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.menuItems') : ''">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M4 1v4a2 2 0 002 2v9"/>
              <path d="M6 1v4M8 1v4"/>
              <path d="M13 1c0 0 2 1.2 2 5.5h-4C11 2.2 13 1 13 1z"/>
              <path d="M13 6.5V17"/>
            </svg>
            @if (!collapsed()) { <span>{{ t('nav.menuItems') }}</span> }
          </a>

          @if (isAdmin()) {
            <div class="sb-divider" [class.sr-only]="collapsed()"></div>

            <a routerLink="/admin/restaurant" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.restaurant') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M2 16V8l7-5 7 5v8H2z" stroke-linejoin="round"/>
                <rect x="6.5" y="11" width="5" height="5"/>
              </svg>
              @if (!collapsed()) { <span>{{ t('nav.restaurant') }}</span> }
            </a>

            <a routerLink="/admin/team" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.team') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                <circle cx="7" cy="5.5" r="2.8"/>
                <path d="M1.5 16c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" stroke-linecap="round"/>
                <circle cx="13.5" cy="5.5" r="2.2" opacity=".65"/>
                <path d="M17 16c0-2.4-1.8-4.3-4-4.3" stroke-linecap="round" opacity=".65"/>
              </svg>
              @if (!collapsed()) { <span>{{ t('nav.team') }}</span> }
            </a>

            <a routerLink="/admin/subscription" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.subscription') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                <rect x="1.5" y="4.5" width="15" height="10" rx="1.5"/>
                <path d="M1.5 8h15" stroke-linecap="round"/>
                <path d="M4.5 12h2.5" stroke-linecap="round"/>
              </svg>
              @if (!collapsed()) { <span>{{ t('nav.subscription') }}</span> }
            </a>

            <a routerLink="/admin/audit-logs" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.auditLogs') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
                <path d="M11.5 2.5H14a1.5 1.5 0 011.5 1.5v12A1.5 1.5 0 0114 17.5H4A1.5 1.5 0 012.5 16V4A1.5 1.5 0 014 2.5h2.5" stroke-linejoin="round"/>
                <rect x="6.5" y="1.5" width="5" height="3" rx=".8"/>
                <path d="M6 9h6M6 12.5h4" stroke-linecap="round"/>
              </svg>
              @if (!collapsed()) { <span>{{ t('nav.auditLogs') }}</span> }
            </a>

            <a
              routerLink="/admin/stats"
              routerLinkActive="active"
              class="sb-link"
              [class.sb-link-locked]="!hasStats()"
              [title]="collapsed() ? t('nav.stats') : (!hasStats() ? t('nav.statsLocked') : '')"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1.5 13.5 6.5 8.5 10 12 16.5 4.5"/>
              </svg>
              @if (!collapsed()) {
                <span>{{ t('nav.stats') }}</span>
                @if (!hasStats()) { <span class="sb-lock">Pro</span> }
              }
            </a>

            <a routerLink="/admin/orders" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.orders') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L4 5H2l2 10h12L18 5h-2l-2-3z" /><path d="M6 8v4M12 8v4" /></svg>
              @if (!collapsed()) { <span>{{ t('nav.orders') }}</span> }
            </a>

            <a routerLink="/admin/reservations" routerLinkActive="active" class="sb-link" [title]="collapsed() ? t('nav.reservations') : ''">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2" y="3" width="14" height="13" rx="1.5"/><line x1="6" y1="1" x2="6" y2="5"/><line x1="12" y1="1" x2="12" y2="5"/><line x1="2" y1="8" x2="16" y2="8"/></svg>
              @if (!collapsed()) { <span>{{ t('nav.reservations') }}</span> }
            </a>

            <a
              routerLink="/admin/api"
              routerLinkActive="active"
              class="sb-link"
              [class.sb-link-locked]="!hasApi()"
              [title]="collapsed() ? t('nav.api') : (!hasApi() ? t('nav.apiLocked') : '')"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="5 6 1.5 9 5 12"/>
                <polyline points="13 6 16.5 9 13 12"/>
                <line x1="10" y1="4" x2="8" y2="14"/>
              </svg>
              @if (!collapsed()) {
                <span>{{ t('nav.api') }}</span>
                @if (!hasApi()) { <span class="sb-lock">Enterprise</span> }
              }
            </a>
          }
        </nav>

        <!-- Lien vitrine -->
        <div class="sb-vitrine">
          <a routerLink="/menu" target="_blank" class="sb-link sb-link-ghost" [title]="collapsed() ? t('nav.viewStorefront') : ''">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M1 9s3.5-7 8-7 8 7 8 7-3.5 7-8 7-8-7-8-7z"/>
              <circle cx="9" cy="9" r="2.5"/>
            </svg>
            @if (!collapsed()) { <span>{{ t('nav.viewStorefront') }}</span> }
          </a>
        </div>

        <!-- Footer utilisateur -->
        <div class="sb-footer">
          <div class="sb-user" [class.sb-user-mini]="collapsed()">
            <div class="sb-avatar">{{ userInitials() }}</div>
            @if (!collapsed()) {
              <div class="sb-user-info">
                <div class="sb-user-name">{{ user()?.fullName || user()?.email }}</div>
                <div class="sb-user-role">
                  @if (user()?.role === 'admin') { {{ t('nav.owner') }} }
                  @else if (user()?.role === 'cashier') { {{ t('nav.cashier') }} }
                  @else { {{ user()?.role ?? '' }} }
                </div>
              </div>
            }
          </div>
          <button class="sb-logout" (click)="logout()" [title]="collapsed() ? t('nav.logout') : ''" [attr.aria-label]="t('nav.logout')">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4"/>
              <path d="M12 13l4-4-4-4" stroke-linejoin="round"/>
              <path d="M16 9H7"/>
            </svg>
            @if (!collapsed()) { <span>{{ t('nav.logout') }}</span> }
          </button>
        </div>

      </aside>

      <!-- Contenu principal -->
      <main class="main-content">
        <router-outlet />
      </main>

    </div>
    </ng-container>
  `,
  styles: [`
    /* ── Shell ──────────────────────────────────── */
    .shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--gray-50);
    }

    /* ── Sidebar ────────────────────────────────── */
    .sidebar {
      display: flex; flex-direction: column;
      width: 236px; min-width: 236px;
      background: white;
      border-right: 1px solid var(--border);
      transition: width var(--t-normal), min-width var(--t-normal);
      overflow: hidden;
      z-index: 10;
    }
    .sidebar-mini {
      width: 64px !important;
      min-width: 64px !important;
    }

    /* Brand */
    .sb-brand {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4);
      min-height: 64px; border-bottom: 1px solid var(--border);
    }
    .sb-brand-mini {
      justify-content: center;
      padding: var(--space-3);
    }
    .sb-logo {
      width: 36px; height: 36px; flex-shrink: 0;
      background: var(--brand);
      border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(192,57,43,.25);
    }
    .sb-brand-name {
      flex: 1; font-weight: 700; font-size: 1rem; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; letter-spacing: -.01em;
    }
    .sb-toggle {
      background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: 5px; color: var(--gray-400); cursor: pointer; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--t-fast); margin-left: auto;
      &:hover { background: var(--gray-50); color: var(--text-secondary); }
    }
    .sb-toggle-center { margin-left: 0; width: 38px; height: 38px; border-radius: var(--radius-md); }

    /* Nav links */
    .sb-nav {
      flex: 1; padding: var(--space-3) var(--space-2); overflow-y: auto;
    }
    .sb-link {
      display: flex; align-items: center; gap: var(--space-3);
      padding: 9px var(--space-3); color: var(--text-secondary);
      text-decoration: none; font-size: .9rem; font-weight: 500;
      border-radius: var(--radius-md); white-space: nowrap;
      transition: background var(--t-fast), color var(--t-fast);
      margin-bottom: 2px;
      svg { flex-shrink: 0; }

      &:hover { background: var(--gray-50); color: var(--text-primary); }
      &.active {
        background: var(--brand-subtle);
        color: var(--brand);
        svg { color: var(--brand); }
      }
    }
    .sidebar-mini .sb-link { justify-content: center; padding: 9px; }
    .sb-link-ghost {
      color: var(--text-muted);
      font-size: .85rem;
    }
    .sb-link-locked {
      opacity: .55;
    }
    .sb-lock {
      margin-left: auto;
      font-size: .65rem; font-weight: 700; letter-spacing: .03em;
      padding: 1px 5px; border-radius: var(--radius-full);
      background: var(--gray-100); color: var(--text-muted);
      line-height: 1.6;
    }

    .sb-divider {
      height: 1px; background: var(--border);
      margin: var(--space-2) var(--space-2) var(--space-3);
    }

    /* Vitrine */
    .sb-vitrine {
      padding: 0 var(--space-2) var(--space-2);
      border-top: 1px solid var(--border);
      padding-top: var(--space-2);
    }

    /* Footer / user */
    .sb-footer {
      border-top: 1px solid var(--border);
      padding: var(--space-3) var(--space-3);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .sb-user {
      display: flex; align-items: center; gap: var(--space-3); min-width: 0;
    }
    .sb-user-mini { justify-content: center; }
    .sb-avatar {
      width: 34px; height: 34px; flex-shrink: 0;
      background: var(--brand-light);
      border: 2px solid var(--brand-mid);
      border-radius: 50%; color: var(--brand);
      font-size: .8125rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .sb-user-info { min-width: 0; }
    .sb-user-name {
      font-size: .8125rem; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .sb-user-role { font-size: .70rem; color: var(--text-muted); text-transform: capitalize; }

    .sb-logout {
      display: flex; align-items: center; gap: var(--space-2);
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 7px var(--space-3); cursor: pointer; color: var(--text-muted);
      font-size: .8125rem; white-space: nowrap; transition: all var(--t-fast);
      &:hover { background: var(--error-bg); border-color: var(--error-border); color: var(--error); }
    }
    .sidebar-mini .sb-logout { justify-content: center; padding: 7px; }

    /* ── Main content ───────────────────────────── */
    .main-content {
      flex: 1; overflow-y: auto;
      padding: var(--space-8) var(--space-8);
    }
    @media (max-width: 1024px) {
      .main-content { padding: var(--space-5) var(--space-5); }
    }
  `],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService)

  readonly user       = this.authService.user
  readonly collapsed  = signal(false)
  readonly isAdmin    = computed(() => this.authService.user()?.role === 'admin')
  readonly planSlug   = computed(() => this.authService.restaurant()?.plan?.slug ?? null)
  readonly hasStats   = computed(() => this.planSlug() === 'pro' || this.planSlug() === 'enterprise')
  readonly hasApi     = computed(() => this.planSlug() === 'enterprise')

  readonly userInitials = computed(() => {
    const name = this.user()?.fullName || this.user()?.email || '?'
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  })

  readonly roleLabel = computed(() => {
    const r = this.user()?.role
    return r === 'admin' ? 'Propriétaire' : r === 'cashier' ? 'Caissier' : r ?? ''
  })

  toggleCollapsed(): void { this.collapsed.update((v) => !v) }
  logout(): void { this.authService.logout() }
}
