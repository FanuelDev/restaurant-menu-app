import { Component, inject, signal, computed } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslocoModule],
  templateUrl: './admin-layout.component.html',
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
  readonly hasOrders  = computed(() => {
    const plan = this.authService.restaurant()?.plan
    return plan?.slug === 'pro' || plan?.slug === 'enterprise' || !!plan?.features?.['orders_and_reservations']
  })
  readonly hasApi     = computed(() => this.planSlug() === 'enterprise')
  readonly hasFinance = computed(() => {
    const plan = this.authService.restaurant()?.plan
    return plan?.slug === 'enterprise' || !!plan?.features?.['financial_management']
  })

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
