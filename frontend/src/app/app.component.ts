// frontend/src/app/app.component.ts
import { Component, inject, computed, signal, OnInit, OnDestroy } from '@angular/core'
import { Router, RouterOutlet, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router'
import { CommonModule } from '@angular/common'
import { Subscription } from 'rxjs'
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

    /* ── Page loader ── */
    .page-loader {
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      height: 3px;
      background: linear-gradient(90deg, #C0392B 0%, #E74C3C 40%, #FF8C69 70%, #C0392B 100%);
      background-size: 200% 100%;
      animation: loaderSlide 1.2s ease-in-out infinite;
      box-shadow: 0 0 10px rgba(192,57,43,.6), 0 0 4px rgba(192,57,43,.4);
    }
    .page-loader-dot {
      position: absolute; right: 0; top: -3px;
      width: 9px; height: 9px; border-radius: 50%;
      background: #E74C3C;
      box-shadow: 0 0 8px rgba(231,76,60,.8);
    }
    @keyframes loaderSlide {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class AppComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router)
  private routerSub?: Subscription

  readonly loading = signal(false)

  readonly showGlobalLang = computed(() => {
    const url = this.router.url
    return !url.startsWith('/admin') && !url.startsWith('/super-admin')
      && !url.startsWith('/pricing') && (url !== '/')
  })

  ngOnInit(): void {
    this.routerSub = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart)  this.loading.set(true)
      if (event instanceof NavigationEnd
       || event instanceof NavigationCancel
       || event instanceof NavigationError)  this.loading.set(false)
    })
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe()
  }
}
