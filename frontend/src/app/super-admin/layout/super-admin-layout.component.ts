import { Component, inject } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-super-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, TranslocoModule],
  templateUrl: './super-admin-layout.component.html',
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
