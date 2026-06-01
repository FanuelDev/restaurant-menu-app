import { Component, inject, signal, computed, OnInit, DestroyRef } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslocoModule } from '@jsverse/transloco'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { filter } from 'rxjs'
import { AuthService } from '../../shared/services/auth.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { NotificationService } from '../../shared/services/notification.service'
import { ThemeToggleComponent } from '../../shared/components/theme-toggle/theme-toggle.component'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, TranslocoModule, ThemeToggleComponent],
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
      background: var(--surface-1);
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

    /* Locked button — same look as sb-link but rendered as <button> */
    .sb-link-btn {
      width: 100%; text-align: left; cursor: pointer;
      background: none; border: none; font-family: inherit;
    }

    /* Upgrade toast */
    .upgrade-toast {
      position: fixed; top: 20px; right: 20px; z-index: 9999;
      max-width: 360px; width: calc(100vw - 40px);
      background: var(--surface-1); border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      box-shadow: 0 12px 40px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
      display: flex; align-items: flex-start; gap: 12px;
      padding: 16px; animation: toastIn .22s ease;
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .ut-icon { font-size: 1.25rem; flex-shrink: 0; margin-top: 1px; }
    .ut-body { flex: 1; min-width: 0; }
    .ut-title {
      font-weight: 700; font-size: .9375rem; color: var(--text-primary);
      margin: 0 0 4px;
    }
    .ut-msg {
      margin: 0 0 10px; font-size: .8125rem; color: var(--text-secondary); line-height: 1.5;
    }
    .ut-cta {
      background: #7c3aed; color: white; border: none; border-radius: var(--radius-md);
      padding: 6px 12px; font-size: .8125rem; font-weight: 600; cursor: pointer;
      transition: opacity var(--t-fast);
    }
    .ut-cta:hover { opacity: .88; }
    .ut-close {
      background: none; border: none; cursor: pointer; padding: 2px; flex-shrink: 0;
      color: var(--text-muted); border-radius: var(--radius-sm);
      display: flex; align-items: center;
    }
    .ut-close:hover { background: var(--gray-100); color: var(--text-secondary); }

    /* Success / error toast */
    .app-toast {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; align-items: center; gap: 10px;
      padding: 12px 16px; border-radius: var(--radius-lg);
      box-shadow: 0 8px 32px rgba(0,0,0,.12), 0 2px 8px rgba(0,0,0,.06);
      font-size: .875rem; font-weight: 500; max-width: 360px;
      animation: toastIn .22s ease;
    }
    .app-toast-success {
      background: #166534; color: #fff;
    }
    .app-toast-error {
      background: var(--error); color: #fff;
    }
    .app-toast-icon { font-size: 1rem; flex-shrink: 0; }
    .app-toast-msg { flex: 1; }
    .app-toast-close {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,.7); padding: 2px; flex-shrink: 0;
      display: flex; align-items: center; border-radius: var(--radius-sm);
    }
    .app-toast-close:hover { color: #fff; }

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

    /* Theme toggle row */
    .sb-theme-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 4px var(--space-1);
    }
    .sb-theme-label {
      font-size: .75rem; color: var(--text-muted); font-weight: 500; letter-spacing: .02em;
    }
    .sb-theme-mini {
      display: flex; justify-content: center;
    }

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
export class AdminLayoutComponent implements OnInit {
  private readonly authService       = inject(AuthService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly router            = inject(Router)
  private readonly destroyRef        = inject(DestroyRef)
  readonly notify                    = inject(NotificationService)

  readonly user       = this.authService.user
  readonly collapsed  = signal(false)
  readonly isAdmin    = computed(() => this.authService.user()?.role === 'admin')

  // Feature flags — lus depuis le JSON features du plan
  // Compat rétroactive (supprimable après migration 023) :
  //  • 'orders_and_reservations' → ancienne clé unique (avant migration 022)
  //  • 'api_access' === true     → signal exclusif Enterprise : toutes les features
  //                                Enterprise sont accordées si la DB est partiellement migrée
  readonly hasOrders = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['orders'] === true || f['orders_and_reservations'] === true
  })
  readonly hasReservations = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['reservations'] === true || f['orders_and_reservations'] === true || f['api_access'] === true
  })
  readonly hasStats = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['stats'] === true
  })
  readonly hasFinance = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['financial_management'] === true || f['api_access'] === true
  })
  readonly hasMarketing = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['marketing'] === true || f['api_access'] === true
  })
  readonly hasApi = computed(() => {
    const f = (this.authService.restaurant()?.plan?.features ?? {}) as Record<string, boolean>
    return f['api_access'] === true
  })

  // ── Upgrade toast ─────────────────────────────────────────────────────────
  readonly toast = signal<{ label: string; plan: string } | null>(null)
  private toastTimer: ReturnType<typeof setTimeout> | null = null

  showUpgradeToast(label: string, plan: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toast.set({ label, plan })
    this.toastTimer = setTimeout(() => this.toast.set(null), 5000)
  }

  dismissToast(): void {
    if (this.toastTimer) clearTimeout(this.toastTimer)
    this.toast.set(null)
  }

  goToPlans(): void {
    this.dismissToast()
    this.router.navigate(['/admin/subscription'])
  }
  // ──────────────────────────────────────────────────────────────────────────

  readonly userInitials = computed(() => {
    const name = this.user()?.fullName || this.user()?.email || '?'
    return name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()
  })

  readonly roleLabel = computed(() => {
    const r = this.user()?.role
    return r === 'admin' ? 'Propriétaire' : r === 'cashier' ? 'Caissier' : r ?? ''
  })

  ngOnInit(): void {
    // Chargement initial des features du plan
    this.refreshPlan()

    // Recharge les features à chaque navigation intra-admin (sans F5 nécessaire).
    // Permet au restaurant de voir immédiatement un changement de plan fait par le SA.
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.refreshPlan())
  }

  private refreshPlan(): void {
    this.restaurantService.loadAdmin().subscribe({
      next: (r) => this.authService.updateRestaurant(r),
      error: () => { /* silently ignore — stale data from localStorage still works */ },
    })
  }

  toggleCollapsed(): void { this.collapsed.update((v) => !v) }
  logout(): void { this.authService.logout() }
}
