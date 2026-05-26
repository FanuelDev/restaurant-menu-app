import { Component, Input, inject } from '@angular/core'
import { ThemeService } from '../../services/theme.service'

/**
 * Styled sun/moon theme toggle.
 * - Full mode  : ☀ ─── pill ─── ☽  (used when sidebar is expanded)
 * - Mini mode  : single icon button (used when sidebar is collapsed)
 */
@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    @if (mini) {
      <!-- Collapsed sidebar: icon-only button -->
      <button
        class="tt-mini"
        (click)="ts.toggle()"
        [title]="ts.isDark() ? 'Mode clair' : 'Mode sombre'"
        [attr.aria-label]="ts.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'"
        type="button"
      >
        @if (ts.isDark()) {
          <!-- Moon — currently dark, click → light -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        } @else {
          <!-- Sun — currently light, click → dark -->
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
          </svg>
        }
      </button>
    } @else {
      <!-- Expanded sidebar: ☀ pill ☽ -->
      <div class="tt-row" [attr.aria-label]="ts.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'">
        <!-- Sun -->
        <svg class="tt-icon tt-sun" [class.tt-active]="!ts.isDark()"
             width="15" height="15" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4"/>
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
        </svg>

        <!-- Pill toggle -->
        <label class="tt-label" [title]="ts.isDark() ? 'Passer en mode clair' : 'Passer en mode sombre'">
          <input
            class="sr-only"
            type="checkbox"
            [checked]="ts.isDark()"
            (change)="ts.toggle()"
          >
          <span class="tt-track" [class.tt-on]="ts.isDark()">
            <span class="tt-thumb"></span>
          </span>
        </label>

        <!-- Moon -->
        <svg class="tt-icon tt-moon" [class.tt-active]="ts.isDark()"
             width="13" height="13" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </div>
    }
  `,
  styles: [`
    /* ── Mini (icon-only) ─────────────────────────── */
    .tt-mini {
      display: flex; align-items: center; justify-content: center;
      width: 34px; height: 34px;
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      cursor: pointer;
      transition: background var(--t-fast), color var(--t-fast), border-color var(--t-fast);
    }
    .tt-mini:hover {
      background: var(--gray-50);
      color: var(--text-primary);
      border-color: var(--gray-300);
    }

    /* ── Full (sun · pill · moon) ─────────────────── */
    .tt-row {
      display: flex; align-items: center; gap: 8px;
    }

    /* Icons */
    .tt-icon {
      flex-shrink: 0;
      color: var(--text-muted);
      transition: color 300ms ease, opacity 300ms ease;
      opacity: .5;
    }
    .tt-icon.tt-active { opacity: 1; }
    .tt-sun.tt-active  { color: #F59E0B; }
    .tt-moon.tt-active { color: #818CF8; }

    /* Label wraps the hidden checkbox */
    .tt-label { display: block; cursor: pointer; line-height: 0; }

    /* Track */
    .tt-track {
      display: block; position: relative;
      width: 38px; height: 21px;
      background: var(--gray-300);
      border-radius: 999px;
      transition: background 280ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tt-track.tt-on { background: #4F46E5; }

    /* Thumb */
    .tt-thumb {
      position: absolute; top: 2.5px; left: 2.5px;
      width: 16px; height: 16px;
      background: white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,.25);
      transition: transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .tt-track.tt-on .tt-thumb { transform: translateX(17px); }
  `]
})
export class ThemeToggleComponent {
  /** When true, renders a compact icon-only button instead of the full pill. */
  @Input() mini = false

  readonly ts = inject(ThemeService)
}
