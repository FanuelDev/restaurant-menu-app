import { Injectable, signal, effect, inject } from '@angular/core'
import { DOCUMENT } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT)

  readonly isDark = signal<boolean>(
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark'
  )

  constructor() {
    // Apply theme on startup
    this.applyTheme(this.isDark())

    // Keep DOM + localStorage in sync whenever the signal changes
    effect(() => {
      const dark = this.isDark()
      this.applyTheme(dark)
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    })
  }

  toggle(): void {
    this.isDark.update((v) => !v)
  }

  private applyTheme(dark: boolean): void {
    if (dark) {
      this.doc.documentElement.setAttribute('data-theme', 'dark')
    } else {
      this.doc.documentElement.removeAttribute('data-theme')
    }
  }
}
