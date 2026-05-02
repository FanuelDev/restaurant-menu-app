// frontend/src/app/shared/services/menu.service.ts
import { Injectable, inject, signal, computed } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable, tap } from 'rxjs'
import { environment } from '../../../environments/environment'
import type { Category, MenuItem, MenuFilters } from '../models'

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient)

  // ── Signals d'état ────────────────────────────────────────────────────────
  readonly categories = signal<Category[]>([])
  readonly menuItems = signal<MenuItem[]>([])
  readonly filters = signal<MenuFilters>({ badge: 'all', search: '' })
  readonly loading = signal(false)

  /** Plats filtrés selon les filtres actifs */
  readonly filteredItems = computed(() => {
    const items = this.menuItems()
    const { badge, search } = this.filters()

    return items.filter((item) => {
      const matchBadge = badge === 'all' || item.badge === badge
      const matchSearch =
        !search ||
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description ?? '').toLowerCase().includes(search.toLowerCase())
      return matchBadge && matchSearch
    })
  })

  /** Catégories avec leurs plats filtrés (non vides uniquement) */
  readonly categoriesWithItems = computed(() => {
    const filtered = this.filteredItems()
    return this.categories()
      .map((cat) => ({
        ...cat,
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
      Promise.all([
        cats$.toPromise(),
        items$.toPromise(),
      ]).then(([cats, items]) => {
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
    return this.http.patch<{ id: number; isAvailable: boolean }>(
      `${environment.apiUrl}/admin/menu-items/${id}/toggle-availability`,
      {}
    ).pipe(
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
