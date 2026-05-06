// frontend/src/app/app.component.ts
import { Component } from '@angular/core'
import { RouterOutlet } from '@angular/router'
import { LangSwitcherComponent } from './shared/components/lang-switcher/lang-switcher.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LangSwitcherComponent],
  template: `
    <router-outlet />
    <app-lang-switcher class="global-lang" />
  `,
  styles: [`
    :host { display: block; }
    .global-lang {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 10001;
    }
  `],
})
export class AppComponent {}
