// frontend/src/app/admin/menu-items/menu-items.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { MenuService } from '../../shared/services/menu.service'
import { SubscriptionService } from '../../shared/services/subscription.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { PlanLimitBarComponent } from '../../shared/components/plan-limit-bar/plan-limit-bar.component'
import type { Category, MenuItem, MenuItemBadge, ResourceUsage } from '../../shared/models'

const BADGE_KEYS: Record<string, string> = {
  new: 'menuItems.badgeNew',
  popular: 'menuItems.badgePopular',
  vegetarian: 'menuItems.badgeVegetarian',
  spicy: 'menuItems.badgeSpicy',
}

@Component({
  selector: 'app-menu-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PlanLimitBarComponent, TranslocoModule],
  templateUrl: './menu-items.component.html',
  styles: [`
    .page-container { max-width: 1100px; }
    .usage-section { margin-bottom: var(--space-5); }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-8); }
    .page-title { font-family: var(--font-display); font-size: 1.875rem; margin: 0 0 var(--space-1); color: var(--text-primary); line-height: 1.15; }
    .page-subtitle { color: var(--text-muted); margin: 0; font-size: .9375rem; }

    .filter-bar { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-5); }
    .filter-tab {
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      border: 1px solid var(--border); background: var(--surface-1);
      cursor: pointer; font-size: 0.875rem; font-weight: 500;
      color: var(--text-secondary); transition: all 0.2s;
    }
    .filter-tab:hover, .filter-tab.active { background: var(--color-brand); color: white; border-color: var(--color-brand); }

    .items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4); }

    .item-card {
      background: var(--surface-1); border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden; transition: box-shadow 0.2s;
    }
    .item-card:hover { box-shadow: var(--shadow-md); }
    .item-card--unavailable { opacity: 0.65; }

    .item-card__image-wrap { position: relative; height: 160px; background: var(--surface-2); overflow: hidden; }
    .item-card__image { width: 100%; height: 100%; object-fit: cover; }
    .item-card__image-placeholder {
      display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 3rem; color: var(--text-muted);
    }
    .item-card__body { padding: var(--space-4); }
    .item-card__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-2); margin-bottom: var(--space-1); }
    .item-card__name { font-weight: 600; color: var(--text-primary); }
    .item-card__price { font-weight: 700; color: var(--color-brand); white-space: nowrap; }
    .item-card__desc { font-size: 0.8125rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .item-card__cat { font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-2); }
    .item-card__footer {
      padding: var(--space-3) var(--space-4); border-top: 1px solid var(--border);
      display: flex; align-items: center; gap: var(--space-3);
    }
    .item-card__status { font-size: 0.8125rem; color: var(--text-muted); flex: 1; }
    .item-card__actions { display: flex; gap: var(--space-2); }

    .badge {
      position: absolute; top: var(--space-2); left: var(--space-2);
      padding: 2px 8px; border-radius: var(--radius-full);
      font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .badge--new        { background: #3b82f6; color: white; }
    .badge--popular    { background: #f59e0b; color: white; }
    .badge--vegetarian { background: #22c55e; color: white; }
    .badge--spicy      { background: #ef4444; color: white; }

    .tl-dot { position: absolute; top: var(--space-2); right: var(--space-2); font-size: .85rem; opacity: .8; }

    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; inset: 0;
      background: var(--border); border-radius: 24px; transition: 0.2s;
    }
    .toggle-slider::before {
      content: ''; position: absolute; width: 18px; height: 18px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s;
    }
    input:checked + .toggle-slider { background: var(--color-brand); }
    input:checked + .toggle-slider::before { transform: translateX(20px); }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--text-muted); }

    .btn-icon {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      color: var(--text-muted); cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }
    .btn-icon--danger:hover { background: var(--error-bg) !important; color: var(--error) !important; border-color: var(--error-border) !important; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); overflow-y: auto; }
    .modal {
      background: var(--surface-1); border-radius: var(--radius-xl);
      width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto;
      box-shadow: var(--shadow-xl);
    }
    .modal__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface-1); z-index: 1; }
    .modal__title { font-size: 1.25rem; font-weight: 700; margin: 0; }
    .modal__close {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      color: var(--text-muted); cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); }
    }
    .modal__body { padding: var(--space-6); }
    .modal__footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }

    .form-row { display: flex; gap: var(--space-4); }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .form-group { margin-bottom: var(--space-4); }
    .form-label { display: block; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: 1rem; background: var(--surface-1);
      color: var(--text-primary); box-sizing: border-box; font-family: var(--font-body);
    }
    .form-control:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .form-error { color: var(--color-error); font-size: 0.8125rem; display: block; margin-top: var(--space-1); }
    .alert-error { background: var(--error-bg); border: 1px solid var(--error-border); color: var(--error); padding: var(--space-3); border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: var(--space-4); }
    .toggle-label { display: flex; justify-content: space-between; align-items: center; }

    .image-upload-zone {
      border: 2px dashed var(--border); border-radius: var(--radius-lg); overflow: hidden;
      cursor: pointer; min-height: 140px; display: flex; align-items: center; justify-content: center;
      transition: border-color 0.2s;
    }
    .image-upload-zone:hover { border-color: var(--color-brand); }
    .image-preview { width: 100%; max-height: 220px; object-fit: cover; display: block; }
    .image-upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); color: var(--text-muted); font-size: 0.9rem; }
    .image-upload-placeholder span:first-child { font-size: 2rem; }
    .file-input-hidden { display: none; }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0.625rem 1.25rem; border-radius: var(--radius-md);
      font-weight: 500; font-size: 0.9375rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
    }
    .btn-primary { background: var(--color-brand); color: white; border-color: var(--color-brand); }
    .btn-primary:hover:not(:disabled) { background: var(--color-brand-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-outline { border-color: var(--border); color: var(--text-secondary); background: var(--surface-1); }
    .btn-outline:hover { border-color: var(--color-brand); color: var(--color-brand); }

    /* ── Section traductions ── */
    .tl-section { margin-bottom: var(--space-4); border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
    .tl-toggle {
      width: 100%; display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: var(--gray-50); border: none; cursor: pointer;
      font-size: .875rem; font-weight: 500; color: var(--text-secondary);
      text-align: left; transition: background var(--t-fast);
      &:hover { background: var(--gray-100); }
    }
    .tl-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 18px; height: 18px; padding: 0 5px;
      background: var(--color-brand); color: white;
      border-radius: var(--radius-full); font-size: .7rem; font-weight: 700;
    }
    .tl-chevron { margin-left: auto; transition: transform .2s; }
    .tl-chevron-open { transform: rotate(180deg); }
    .tl-body { padding: var(--space-4); border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: var(--space-4); }
    .tl-hint { margin: 0 0 var(--space-2); font-size: .8125rem; color: var(--text-muted); font-style: italic; }
    .tl-lang-block { display: flex; flex-direction: column; gap: var(--space-2); }
    .tl-lang-label { display: flex; align-items: center; gap: var(--space-2); font-size: .8125rem; font-weight: 600; color: var(--text-secondary); }
    .tl-flag { font-size: 1rem; }
    .tl-fields { display: flex; flex-direction: column; gap: var(--space-2); }
  `],
})
export class MenuItemsComponent implements OnInit {
  private readonly menuService = inject(MenuService)
  private readonly subscriptionService = inject(SubscriptionService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly fb = inject(FormBuilder)
  private readonly transloco = inject(TranslocoService)

  readonly categories = this.menuService.categories
  readonly menuItems = this.menuService.menuItems
  readonly showForm = signal(false)
  readonly showTranslations = signal(false)
  readonly editTarget = signal<MenuItem | null>(null)
  readonly saving = signal(false)
  readonly formError = signal<string | null>(null)
  readonly activeCategoryId = signal<number | null>(null)
  readonly imagePreview = signal<string | null>(null)
  readonly usage = signal<ResourceUsage | null>(null)

  readonly atLimit = computed(() => {
    const u = this.usage()
    return u !== null && u.max !== -1 && u.current >= u.max
  })

  private selectedFile: File | null = null

  readonly filteredByCategory = computed(() => {
    const catId = this.activeCategoryId()
    const items = this.menuItems()
    return catId ? items.filter((i) => i.categoryId === catId) : items
  })

  /** Nombre de champs de traduction remplis. */
  readonly translationCount = computed(() => {
    const v = this.form.value
    return [v.nameEn, v.descEn, v.nameDe, v.descDe, v.nameZh, v.descZh].filter(
      (s) => s && s.trim()
    ).length
  })

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    priceEuros: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    badge: [''],
    isAvailable: [true],
    // Traductions
    nameEn: [''],
    descEn: [''],
    nameDe: [''],
    descDe: [''],
    nameZh: [''],
    descZh: [''],
  })

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
    this.menuService.loadAdminItems().subscribe()
    this.loadUsage()
  }

  private loadUsage(): void {
    this.subscriptionService.getUsage().subscribe({
      next: (u) => this.usage.set(u.menuItems),
    })
  }

  getBadgeKey(badge: MenuItemBadge): string {
    return BADGE_KEYS[badge as string] ?? 'menuItems.badgeNone'
  }

  getCategoryName(catId: number): string {
    return this.categories().find((c) => c.id === catId)?.name ?? ''
  }

  formatPrice(amount: number): string {
    const currency = this.restaurantService.restaurant()?.currency ?? 'XOF'
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount)
    } catch {
      return `${amount} ${currency}`
    }
  }

  hasTranslations(item: MenuItem): boolean {
    return (
      Object.keys(item.nameTranslations ?? {}).length > 0 ||
      Object.keys(item.descriptionTranslations ?? {}).length > 0
    )
  }

  openForm(item?: MenuItem): void {
    this.editTarget.set(item ?? null)
    this.formError.set(null)
    this.imagePreview.set(null)
    this.selectedFile = null

    const nt = item?.nameTranslations ?? {}
    const dt = item?.descriptionTranslations ?? {}

    this.form.patchValue({
      name: item?.name ?? '',
      description: item?.description ?? '',
      priceEuros: item ? item.price : 0,
      categoryId: item ? String(item.categoryId) : '',
      badge: item?.badge ?? '',
      isAvailable: item?.isAvailable ?? true,
      nameEn: nt['en'] ?? '',
      descEn: dt['en'] ?? '',
      nameDe: nt['de'] ?? '',
      descDe: dt['de'] ?? '',
      nameZh: nt['zh'] ?? '',
      descZh: dt['zh'] ?? '',
    })

    // Auto-ouvrir si des traductions existent déjà
    this.showTranslations.set(item ? this.hasTranslations(item) : false)
    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.showTranslations.set(false)
    this.editTarget.set(null)
    this.imagePreview.set(null)
    this.selectedFile = null
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    this.selectedFile = file
    const reader = new FileReader()
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.saving.set(true)
    this.formError.set(null)

    const v = this.form.value

    // Assembler les traductions
    const nameTranslations: Record<string, string> = {}
    if (v.nameEn?.trim()) nameTranslations['en'] = v.nameEn.trim()
    if (v.nameDe?.trim()) nameTranslations['de'] = v.nameDe.trim()
    if (v.nameZh?.trim()) nameTranslations['zh'] = v.nameZh.trim()

    const descriptionTranslations: Record<string, string> = {}
    if (v.descEn?.trim()) descriptionTranslations['en'] = v.descEn.trim()
    if (v.descDe?.trim()) descriptionTranslations['de'] = v.descDe.trim()
    if (v.descZh?.trim()) descriptionTranslations['zh'] = v.descZh.trim()

    const formData = new FormData()
    formData.append('name', v.name ?? '')
    formData.append('description', v.description ?? '')
    formData.append('price', String(v.priceEuros ?? 0))
    formData.append('categoryId', String(v.categoryId))
    formData.append('badge', v.badge ?? '')
    formData.append('isAvailable', String(v.isAvailable))
    // Traductions sérialisées en JSON pour le FormData
    formData.append('nameTranslations', JSON.stringify(nameTranslations))
    formData.append('descriptionTranslations', JSON.stringify(descriptionTranslations))
    if (this.selectedFile) {
      formData.append('image', this.selectedFile)
    }

    const target = this.editTarget()
    const req$ = target
      ? this.menuService.updateMenuItem(target.id, formData)
      : this.menuService.createMenuItem(formData)

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadUsage() },
      error: (err) => {
        this.saving.set(false)
        if (err?.status === 402) {
          this.formError.set(err?.error?.message ?? this.transloco.translate('menuItems.limitMessage'))
        } else {
          this.formError.set(err?.error?.message ?? this.transloco.translate('menuItems.errorGeneric'))
        }
      },
    })
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleAvailability(item.id).subscribe()
  }

  confirmDelete(item: MenuItem): void {
    if (confirm(this.transloco.translate('menuItems.deleteConfirm', { name: item.name }))) {
      this.menuService.deleteMenuItem(item.id).subscribe({
        next: () => this.loadUsage(),
      })
    }
  }
}
