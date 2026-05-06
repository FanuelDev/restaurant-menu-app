import { Component, inject } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="sa-shell">

      <aside class="sa-sidebar">
        <!-- Brand -->
        <div class="sa-brand">
          <div class="sa-logo">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round">
              <path d="M9 1l2.5 5.5L17 7.6l-4 3.9 1 5.5L9 14.5l-5 2.5 1-5.5L1 7.6l5.5-1.1z" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="sa-brand-text">
            <span class="sa-brand-title">{{ t('superAdmin.layout.title') }}</span>
            <span class="sa-brand-sub">Plateforme</span>
          </div>
        </div>

        <!-- Nav -->
        <nav class="sa-nav">
          <a routerLink="/super-admin/dashboard" routerLinkActive="active" class="sa-link">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="1.5" y="1.5" width="6" height="6" rx="1.2"/>
              <rect x="10.5" y="1.5" width="6" height="6" rx="1.2"/>
              <rect x="1.5" y="10.5" width="6" height="6" rx="1.2"/>
              <rect x="10.5" y="10.5" width="6" height="6" rx="1.2"/>
            </svg>
            <span>{{ t('superAdmin.layout.nav.dashboard') }}</span>
          </a>
          <a routerLink="/super-admin/restaurants" routerLinkActive="active" class="sa-link">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <path d="M2 16V8l7-5 7 5v8H2z" stroke-linejoin="round"/>
              <rect x="6.5" y="11" width="5" height="5"/>
            </svg>
            <span>{{ t('superAdmin.layout.nav.restaurants') }}</span>
          </a>
          <a routerLink="/super-admin/plans" routerLinkActive="active" class="sa-link">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6">
              <rect x="1.5" y="4.5" width="15" height="10" rx="1.5"/>
              <path d="M1.5 8h15" stroke-linecap="round"/>
              <path d="M4.5 12h2.5" stroke-linecap="round"/>
            </svg>
            <span>{{ t('superAdmin.layout.nav.plans') }}</span>
          </a>
        </nav>

        <!-- Footer -->
        <div class="sa-footer">
          <div class="sa-user">
            <div class="sa-avatar">{{ initials() }}</div>
            <div class="sa-user-info">
              <div class="sa-user-name">{{ authService.user()?.fullName }}</div>
            </div>
          </div>
          <button class="sa-logout" (click)="authService.logout()">
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">
              <path d="M7 16H3a1 1 0 01-1-1V3a1 1 0 011-1h4"/>
              <path d="M12 13l4-4-4-4" stroke-linejoin="round"/>
              <path d="M16 9H7"/>
            </svg>
            {{ t('superAdmin.layout.logout') }}
          </button>
        </div>
      </aside>

      <main class="sa-content">
        <router-outlet />
      </main>
    </div>
    </ng-container>
  `,
  styles: [`
    .sa-shell {
      display: flex;
      min-height: 100vh;
      background: var(--gray-50);
    }

    /* Sidebar */
    .sa-sidebar {
      width: 228px; flex-shrink: 0;
      background: white;
      border-right: 1px solid var(--border);
      display: flex; flex-direction: column;
      position: sticky; top: 0; height: 100vh;
    }

    /* Brand */
    .sa-brand {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-4) var(--space-4);
      border-bottom: 1px solid var(--border);
      min-height: 64px;
    }
    .sa-logo {
      width: 36px; height: 36px; flex-shrink: 0;
      background: linear-gradient(135deg, #1C1917 0%, #44403C 100%);
      border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,.2);
    }
    .sa-brand-title { display: block; font-weight: 700; font-size: .9375rem; color: var(--text-primary); line-height: 1.2; }
    .sa-brand-sub   { display: block; font-size: .70rem; color: var(--text-muted); }

    /* Nav */
    .sa-nav { flex: 1; padding: var(--space-3) var(--space-2); overflow-y: auto; }
    .sa-link {
      display: flex; align-items: center; gap: var(--space-3);
      padding: 9px var(--space-3); color: var(--text-secondary);
      text-decoration: none; font-size: .9rem; font-weight: 500;
      border-radius: var(--radius-md); margin-bottom: 2px;
      transition: background var(--t-fast), color var(--t-fast);
      svg { flex-shrink: 0; }
      &:hover { background: var(--gray-50); color: var(--text-primary); }
      &.active {
        background: var(--gray-100);
        color: var(--gray-800);
        font-weight: 600;
      }
    }

    /* Footer */
    .sa-footer {
      border-top: 1px solid var(--border);
      padding: var(--space-3) var(--space-3);
      display: flex; flex-direction: column; gap: var(--space-2);
    }
    .sa-user { display: flex; align-items: center; gap: var(--space-3); min-width: 0; }
    .sa-avatar {
      width: 34px; height: 34px; flex-shrink: 0;
      background: var(--gray-100); border: 2px solid var(--gray-200);
      border-radius: 50%; color: var(--gray-600); font-weight: 700; font-size: .8rem;
      display: flex; align-items: center; justify-content: center;
    }
    .sa-user-info { min-width: 0; }
    .sa-user-name { font-size: .8125rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sa-user-role { font-size: .70rem; color: var(--text-muted); }

    .sa-logout {
      display: flex; align-items: center; gap: var(--space-2);
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 7px var(--space-3); cursor: pointer; color: var(--text-muted); font-size: .8125rem;
      transition: all var(--t-fast);
      &:hover { background: var(--error-bg); border-color: var(--error-border); color: var(--error); }
    }

    /* Content */
    .sa-content {
      flex: 1; overflow-y: auto;
      padding: var(--space-8);
    }
  `],
})
export class SuperAdminLayoutComponent {
  readonly authService = inject(AuthService)

  initials(): string {
    const name = this.authService.user()?.fullName || 'SA'
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  }
}
