// frontend/src/app/app.component.ts
import { Component, inject, computed } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { CommonModule } from '@angular/common'
import { LangSwitcherComponent } from './shared/components/lang-switcher/lang-switcher.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, LangSwitcherComponent],
  templateUrl: './app.component.html',
  styles: [`
    :host { display: block; }
    .global-lang {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 50;
    }
  `],
})
export class AppComponent {
  private readonly router = inject(Router)

  // Hide the global lang switcher on admin/super-admin pages — each layout embeds its own
  readonly showGlobalLang = computed(() => {
    const url = this.router.url
    return !url.startsWith('/admin') && !url.startsWith('/super-admin')
  })
}
