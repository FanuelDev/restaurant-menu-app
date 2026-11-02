import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router, NavigationEnd } from '@angular/router'
import { filter } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private readonly http = inject(HttpClient)
  private readonly router = inject(Router)
  private readonly sessionId = this.initSessionId()
  private previousUrl = ''

  constructor() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const nav = e as NavigationEnd
        this.send(nav.urlAfterRedirects, this.previousUrl || document.referrer || null)
        this.previousUrl = nav.urlAfterRedirects
      })
  }

  private initSessionId(): string {
    try {
      let id = sessionStorage.getItem('_sv_sid')
      if (!id) {
        id = crypto.randomUUID()
        sessionStorage.setItem('_sv_sid', id)
      }
      return id
    } catch {
      return crypto.randomUUID()
    }
  }

  private send(path: string, referrer: string | null): void {
    const slug = this.extractMenuSlug(path)
    this.http
      .post('/api/track', {
        sessionId: this.sessionId,
        path,
        referrer: referrer || null,
        restaurantSlug: slug,
      })
      .subscribe({ error: () => {} })
  }

  private extractMenuSlug(path: string): string | null {
    const m = path.match(/^\/m\/([^/?#]+)/)
    return m ? m[1] : null
  }
}
