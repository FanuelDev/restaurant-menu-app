// frontend/src/app/shared/services/restaurant.service.ts
import { Injectable, inject, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Restaurant } from '../models'

@Injectable({ providedIn: 'root' })
export class RestaurantService {
  private readonly http = inject(HttpClient)

  // Signal partagé — le composant public et l'admin lisent la même référence
  readonly restaurant = signal<Restaurant | null>(null)

  loadPublic(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${environment.apiUrl}/public/restaurant`).pipe(
      tap((r) => {
        this.restaurant.set(r)
        this.applyBrandColor(r.brandColor)
        this.applyRestaurantMeta(r)
      })
    )
  }

  loadAdmin(): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${environment.apiUrl}/admin/restaurant`).pipe(
      tap((r) => this.restaurant.set(r))
    )
  }

  update(data: Partial<Restaurant>): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${environment.apiUrl}/admin/restaurant`, data).pipe(
      tap((r) => {
        this.restaurant.set(r)
        this.applyBrandColor(r.brandColor)
      })
    )
  }

  uploadLogo(file: File): Observable<{ logoUrl: string }> {
    const form = new FormData()
    form.append('logo', file)
    return this.http.post<{ logoUrl: string }>(
      `${environment.apiUrl}/admin/restaurant/logo`,
      form
    ).pipe(
      tap(({ logoUrl }) => {
        const current = this.restaurant()
        if (current) this.restaurant.set({ ...current, logoUrl })
      })
    )
  }

  uploadCover(file: File): Observable<{ coverImageUrl: string | null }> {
    const form = new FormData()
    form.append('cover', file)
    return this.http.post<{ coverImageUrl: string | null }>(
      `${environment.apiUrl}/admin/restaurant/cover`,
      form
    ).pipe(
      tap(({ coverImageUrl }) => {
        const current = this.restaurant()
        if (current) this.restaurant.set({ ...current, coverImageUrl })
      })
    )
  }

  deleteCover(): Observable<{ coverImageUrl: null }> {
    return this.http.delete<{ coverImageUrl: null }>(
      `${environment.apiUrl}/admin/restaurant/cover`
    ).pipe(
      tap(() => {
        const current = this.restaurant()
        if (current) this.restaurant.set({ ...current, coverImageUrl: null })
      })
    )
  }

  /**
   * Injecte la couleur de marque comme variable CSS globale.
   * Permet au design system de s'adapter dynamiquement sans rebuild.
   */
  applyBrandColor(hex: string): void {
    document.documentElement.style.setProperty('--color-brand', hex)
    document.documentElement.style.setProperty('--color-brand-dark', this.darken(hex, 15))
    document.documentElement.style.setProperty('--color-brand-light', this.lighten(hex, 40))
    // Teinte pastel pour les arrière-plans légers (hover, chip active bg en transparence)
    document.documentElement.style.setProperty('--color-brand-subtle', hex + '18')
  }

  /**
   * Adapte le titre de la page et le meta theme-color au restaurant.
   * Améliore l'expérience mobile (barre de navigation du navigateur colorée).
   */
  private applyRestaurantMeta(r: Restaurant): void {
    // Titre de page
    document.title = `${r.name} — Menu`

    // theme-color pour mobile (couleur de la barre d'adresse sur Android/iOS)
    let metaTheme = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!metaTheme) {
      metaTheme = document.createElement('meta')
      metaTheme.name = 'theme-color'
      document.head.appendChild(metaTheme)
    }
    metaTheme.content = r.brandColor

    // og:title pour les partages
    let metaOg = document.querySelector<HTMLMetaElement>('meta[property="og:title"]')
    if (!metaOg) {
      metaOg = document.createElement('meta')
      metaOg.setAttribute('property', 'og:title')
      document.head.appendChild(metaOg)
    }
    metaOg.content = `${r.name} — Découvrez notre menu`
  }

  // ── Utilitaires couleur ────────────────────────────────────────────────────
  private darken(hex: string, percent: number): string {
    return this.adjustLightness(hex, -percent)
  }

  private lighten(hex: string, percent: number): string {
    return this.adjustLightness(hex, percent)
  }

  private adjustLightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, Math.max(0, (num >> 16) + amount))
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount))
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount))
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
  }
}
