import { Component, inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  template: `
    <button
      class="lang-btn"
      (click)="toggle()"
      [title]="activeLang() === 'fr' ? 'Switch to English' : 'Passer en Français'"
      type="button"
    >
      <span class="lang-flag">{{ activeLang() === 'fr' ? '🇫🇷' : '🇬🇧' }}</span>
      <span class="lang-code">{{ activeLang() === 'fr' ? 'FR' : 'EN' }}</span>
    </button>
  `,
  styles: [`
    .lang-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 10px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      color: var(--text-secondary);
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      line-height: 1;
    }
    .lang-btn:hover {
      background: var(--surface-2);
      border-color: var(--brand);
      color: var(--brand);
    }
    .lang-flag { font-size: 1rem; line-height: 1; }
    .lang-code { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; }
  `],
})
export class LangSwitcherComponent {
  private readonly transloco = inject(TranslocoService)

  activeLang() {
    return this.transloco.getActiveLang()
  }

  toggle(): void {
    const next = this.activeLang() === 'fr' ? 'en' : 'fr'
    this.transloco.setActiveLang(next)
    localStorage.setItem('lang', next)
  }
}
