// frontend/src/app/admin/layout/admin-layout.component.ts
import { Component, inject, signal } from '@angular/core'
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="admin-shell">
      <!-- Sidebar -->
      <aside class="sidebar" [class.sidebar--collapsed]="collapsed()">
        <div class="sidebar__header">
          @if (!collapsed()) {
            <span class="sidebar__title">Menu Admin</span>
          }
          <button
            class="sidebar__toggle"
            (click)="collapsed.update(v => !v)"
            [attr.aria-label]="collapsed() ? 'Ouvrir le menu' : 'Réduire le menu'"
          >
            {{ collapsed() ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar__nav" aria-label="Navigation principale">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="active"
            class="sidebar__link"
            [title]="collapsed() ? 'Tableau de bord' : ''"
          >
            <span class="sidebar__icon" aria-hidden="true">📊</span>
            @if (!collapsed()) { <span>Tableau de bord</span> }
          </a>
          <a
            routerLink="/admin/categories"
            routerLinkActive="active"
            class="sidebar__link"
            [title]="collapsed() ? 'Catégories' : ''"
          >
            <span class="sidebar__icon" aria-hidden="true">🗂️</span>
            @if (!collapsed()) { <span>Catégories</span> }
          </a>
          <a
            routerLink="/admin/menu-items"
            routerLinkActive="active"
            class="sidebar__link"
            [title]="collapsed() ? 'Plats' : ''"
          >
            <span class="sidebar__icon" aria-hidden="true">🍽️</span>
            @if (!collapsed()) { <span>Plats</span> }
          </a>
          <a
            routerLink="/admin/restaurant"
            routerLinkActive="active"
            class="sidebar__link"
            [title]="collapsed() ? 'Restaurant' : ''"
          >
            <span class="sidebar__icon" aria-hidden="true">🏪</span>
            @if (!collapsed()) { <span>Restaurant</span> }
          </a>
          <a
            routerLink="/"
            target="_blank"
            class="sidebar__link"
            [title]="collapsed() ? 'Voir la vitrine' : ''"
          >
            <span class="sidebar__icon" aria-hidden="true">👁️</span>
            @if (!collapsed()) { <span>Voir la vitrine</span> }
          </a>
        </nav>

        <div class="sidebar__footer">
          <div class="sidebar__user">
            @if (!collapsed()) {
              <div>
                <div class="sidebar__user-name">{{ user()?.fullName || user()?.email }}</div>
                <div class="sidebar__user-role">{{ user()?.role }}</div>
              </div>
            }
          </div>
          <button
            class="sidebar__logout"
            (click)="logout()"
            [title]="collapsed() ? 'Déconnexion' : ''"
            aria-label="Se déconnecter"
          >
            <span aria-hidden="true">🚪</span>
            @if (!collapsed()) { <span>Déconnexion</span> }
          </button>
        </div>
      </aside>

      <!-- Contenu principal -->
      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
      background: var(--surface-2);
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      width: 240px;
      min-width: 240px;
      background: var(--surface-1);
      border-right: 1px solid var(--border);
      transition: width 0.25s ease, min-width 0.25s ease;
      overflow: hidden;

      &--collapsed {
        width: 64px;
        min-width: 64px;
      }

      &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-4) var(--space-4) var(--space-3);
        border-bottom: 1px solid var(--border);
        min-height: 60px;
      }

      &__title {
        font-weight: 700;
        color: var(--color-brand);
        font-size: 1.1rem;
        white-space: nowrap;
        overflow: hidden;
      }

      &__toggle {
        background: none;
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        cursor: pointer;
        padding: var(--space-1) var(--space-2);
        color: var(--text-muted);
        font-size: 0.875rem;
        flex-shrink: 0;
        &:hover { background: var(--surface-2); }
      }

      &__nav {
        flex: 1;
        padding: var(--space-3) 0;
        overflow-y: auto;
      }

      &__link {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        color: var(--text-secondary);
        text-decoration: none;
        font-size: 0.9375rem;
        font-weight: 500;
        transition: background 0.15s, color 0.15s;
        white-space: nowrap;

        &:hover { background: var(--surface-2); color: var(--text-primary); }
        &.active { background: color-mix(in srgb, var(--color-brand) 10%, transparent); color: var(--color-brand); }
      }

      &__icon { font-size: 1.2rem; flex-shrink: 0; }

      &__footer {
        border-top: 1px solid var(--border);
        padding: var(--space-3) var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      &__user {
        overflow: hidden;
        &-name { font-weight: 600; font-size: 0.875rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        &-role { font-size: 0.75rem; color: var(--text-muted); text-transform: capitalize; }
      }

      &__logout {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        background: none;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        color: var(--text-secondary);
        font-size: 0.875rem;
        white-space: nowrap;
        transition: all 0.2s;
        &:hover { background: #fef2f2; border-color: #fca5a5; color: #dc2626; }
      }
    }

    .admin-main {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-6);
    }
  `],
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService)

  readonly user = this.authService.user
  readonly collapsed = signal(false)

  logout(): void {
    this.authService.logout()
  }
}
