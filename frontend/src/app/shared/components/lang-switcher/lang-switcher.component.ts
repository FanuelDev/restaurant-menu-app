import { Component, inject } from '@angular/core'
import { TranslocoService } from '@jsverse/transloco'
import { toSignal } from '@angular/core/rxjs-interop'

@Component({
  selector: 'app-lang-switcher',
  standalone: true,
  templateUrl: './lang-switcher.component.html',
  styles: [`
    .lang-pill {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      padding: 4px 8px;
      background: rgba(255,255,255,0.92);
      border: 1px solid rgba(0,0,0,0.12);
      border-radius: 999px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      backdrop-filter: blur(4px);
    }
    .lang-opt {
      background: none;
      border: none;
      padding: 0 4px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: rgba(0,0,0,0.35);
      cursor: pointer;
      line-height: 1;
      transition: color 0.15s;
    }
    .lang-opt:hover { color: rgba(0,0,0,0.7); }
    .lang-opt-active { color: #111 !important; }
    .lang-sep { font-size: 0.6rem; color: rgba(0,0,0,0.2); line-height: 1; user-select: none; }
  `],
})
export class LangSwitcherComponent {
  private readonly transloco = inject(TranslocoService)
  readonly activeLang = toSignal(this.transloco.langChanges$, { initialValue: this.transloco.getActiveLang() })

  set(lang: string): void {
    this.transloco.setActiveLang(lang)
    localStorage.setItem('lang', lang)
  }
}
