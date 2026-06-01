import { Injectable, signal } from '@angular/core'

export interface AppToast {
  type: 'success' | 'error'
  message: string
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toast = signal<AppToast | null>(null)
  readonly toast = this._toast.asReadonly()
  private timer: ReturnType<typeof setTimeout> | null = null

  show(message: string, type: 'success' | 'error' = 'success', duration = 3000): void {
    if (this.timer) clearTimeout(this.timer)
    this._toast.set({ type, message })
    this.timer = setTimeout(() => this._toast.set(null), duration)
  }

  dismiss(): void {
    if (this.timer) clearTimeout(this.timer)
    this._toast.set(null)
  }
}
