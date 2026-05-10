// frontend/src/app/shared/services/menu.service.ts
import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'
import { toSignal } from '@angular/core/rxjs-interop'
import { TranslocoService } from '@jsverse/transloco'
import { environment } from '../../../environments/environment'
import type { Category, MenuItem, MenuFilters } from '../models'

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient)
  private readonly transloco = inject(TranslocoService)

  // ── Langue active (réactive) ──────────────────────────────────────────────
  /** Signal mis à jour à chaque changement de langue Transloco. */
  readonly currentLang = toSignal(this.transloco.langChanges$, {
    initialValue: this.transloco.getActiveLang(),
  })

  // ── Signals d'état ────────────────────────────────────────────────────────
  readonly categories = signal<Category[]>([])
  readonly menuItems = signal<MenuItem[]>([])
  readonly filters = signal<MenuFilters>({ badge: 'all', search: '' })
  readonly loading = signal(false)

  // ── Résolution de traduction ──────────────────────────────────────────────
  /**
   * Renvoie le nom traduit d'un élément selon la langue active.
   * Repli automatique vers le nom original si aucune traduction n'existe.
   */
  resolveName(item: { name: string; nameTranslations?: Record<string, string> }): string {
    const lang = this.currentLang()
    return item.nameTranslations?.[lang] || item.name
  }

  resolveDescription(
    item: { description: string | null; descriptionTranslations?: Record<string, string> }
  ): string | null {
    const lang = this.currentLang()
    return item.descriptionTranslations?.[lang] || item.description
  }

  // ── Plats filtrés + traduits ──────────────────────────────────────────────
  /**
   * Plats filtrés selon les filtres actifs, avec name/description déjà
   * résolus dans la langue courante. Réactif : se recalcule automatiquement
   * lorsque la langue ou les filtres changent, sans appel réseau.
   */
  readonly filteredItems = computed(() => {
    const lang = this.currentLang()
    const { badge, search } = this.filters()

    // Appliquer la traduction sur chaque plat (remplace name/description)
    const translated = this.menuItems().map((item) => ({
      ...item,
      name: item.nameTranslations?.[lang] || item.name,
      description: item.descriptionTranslations?.[lang] || item.description,
    }))

    return translated.filter((item) => {
      const matchBadge = badge === 'all' || item.badge === badge
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? '').toLowerCase().includes(search.toLowerCase())
      return matchBadge && matchSearch
    })
  })

  /** Catégories avec leurs plats filtrés/traduits (non vides uniquement). */
  readonly categoriesWithItems = computed(() => {
    const lang = this.currentLang()
    const filtered = this.filteredItems()

    return this.categories()
      .map((cat) => ({
        ...cat,
        name: cat.nameTranslations?.[lang] || cat.name,
        description: cat.descriptionTranslations?.[lang] || cat.description,
        menuItems: filtered.filter((i) => i.categoryId === cat.id),
      }))
      .filter((cat) => cat.menuItems.length > 0)
  })

  // ── API publique ──────────────────────────────────────────────────────────
  loadPublicMenu(): Observable<[Category[], MenuItem[]]> {
    this.loading.set(true)
    const cats$ = this.http.get<Category[]>(`${environment.apiUrl}/public/categories`)
    const items$ = this.http.get<MenuItem[]>(`${environment.apiUrl}/public/menu-items`)

    return new Observable((observer) => {
      Promise.all([cats$.toPromise(), items$.toPromise()]).then(([cats, items]) => {
        this.categories.set(cats ?? [])
        this.menuItems.set(items ?? [])
        this.loading.set(false)
        observer.next([cats ?? [], items ?? []])
        observer.complete()
      }).catch((err) => {
        this.loading.set(false)
        observer.error(err)
      })
    })
  }

  // ── API admin ─────────────────────────────────────────────────────────────
  loadAdminCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/admin/categories`).pipe(
      tap((cats) => this.categories.set(cats))
    )
  }

  loadAdminItems(categoryId?: number): Observable<MenuItem[]> {
    const params = categoryId ? `?categoryId=${categoryId}` : ''
    return this.http.get<MenuItem[]>(`${environment.apiUrl}/admin/menu-items${params}`).pipe(
      tap((items) => this.menuItems.set(items))
    )
  }

  createCategory(data: Partial<Category>): Observable<Category> {
    return this.http.post<Category>(`${environment.apiUrl}/admin/categories`, data).pipe(
      tap(() => this.loadAdminCategories().subscribe())
    )
  }

  updateCategory(id: number, data: Partial<Category>): Observable<Category> {
    return this.http.put<Category>(`${environment.apiUrl}/admin/categories/${id}`, data).pipe(
      tap(() => this.loadAdminCategories().subscribe())
    )
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/categories/${id}`).pipe(
      tap(() => this.loadAdminCategories().subscribe())
    )
  }

  reorderCategories(items: { id: number; sortOrder: number }[]): Observable<void> {
    return this.http.patch<void>(`${environment.apiUrl}/admin/categories/reorder`, { items })
  }

  createMenuItem(formData: FormData): Observable<MenuItem> {
    return this.http.post<MenuItem>(`${environment.apiUrl}/admin/menu-items`, formData).pipe(
      tap(() => this.loadAdminItems().subscribe())
    )
  }

  updateMenuItem(id: number, formData: FormData): Observable<MenuItem> {
    return this.http.put<MenuItem>(`${environment.apiUrl}/admin/menu-items/${id}`, formData).pipe(
      tap(() => this.loadAdminItems().subscribe())
    )
  }

  deleteMenuItem(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/admin/menu-items/${id}`).pipe(
      tap(() => this.loadAdminItems().subscribe())
    )
  }

  toggleAvailability(id: number): Observable<{ id: number; isAvailable: boolean }> {
    return this.http
      .patch<{ id: number; isAvailable: boolean }>(
        `${environment.apiUrl}/admin/menu-items/${id}/toggle-availability`,
        {}
      )
      .pipe(
        tap(({ isAvailable }) => {
          this.menuItems.update((items) =>
            items.map((i) => (i.id === id ? { ...i, isAvailable } : i))
          )
        })
      )
  }

  setFilter(partial: Partial<MenuFilters>): void {
    this.filters.update((f) => ({ ...f, ...partial }))
  }
}
