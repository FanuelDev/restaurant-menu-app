// frontend/src/app/admin/menu-items/menu-items.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MenuService } from '../../shared/services/menu.service'
import type { Category, MenuItem, MenuItemBadge } from '../../shared/models'

const BADGES: { value: MenuItemBadge; label: string }[] = [
  { value: null, label: 'Aucun' },
  { value: 'new', label: 'Nouveau' },
  { value: 'popular', label: 'Populaire' },
  { value: 'vegetarian', label: 'Végétarien' },
  { value: 'spicy', label: 'Épicé' },
]

@Component({
  selector: 'app-menu-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">Plats du menu</h1>
          <p class="page-subtitle">{{ menuItems().length }} plat(s) au total</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">➕ Nouveau plat</button>
      </header>

      <!-- Filtre par catégorie -->
      <div class="filter-bar">
        <button
          class="filter-tab"
          [class.active]="!activeCategoryId()"
          (click)="activeCategoryId.set(null)"
        >Tous</button>
        @for (cat of categories(); track cat.id) {
          <button
            class="filter-tab"
            [class.active]="activeCategoryId() === cat.id"
            (click)="activeCategoryId.set(cat.id)"
          >{{ cat.name }}</button>
        }
      </div>

      <!-- Grille des plats -->
      <div class="items-grid">
        @for (item of filteredByCategory(); track item.id) {
          <div class="item-card" [class.item-card--unavailable]="!item.isAvailable">
            <div class="item-card__image-wrap">
              @if (item.imageUrl) {
                <img [src]="item.imageUrl" [alt]="item.name" class="item-card__image" loading="lazy" />
              } @else {
                <div class="item-card__image-placeholder" aria-hidden="true">🍽️</div>
              }
              @if (item.badge) {
                <span class="badge badge--{{ item.badge }}">{{ getBadgeLabel(item.badge) }}</span>
              }
            </div>

            <div class="item-card__body">
              <div class="item-card__top">
                <span class="item-card__name">{{ item.name }}</span>
                <span class="item-card__price">{{ formatPrice(item.priceInCents) }}</span>
              </div>
              @if (item.description) {
                <p class="item-card__desc">{{ item.description }}</p>
              }
              <div class="item-card__cat">{{ getCategoryName(item.categoryId) }}</div>
            </div>

            <div class="item-card__footer">
              <label class="toggle" [attr.aria-label]="'Disponibilité de ' + item.name">
                <input type="checkbox" [checked]="item.isAvailable" (change)="toggleAvailability(item)" />
                <span class="toggle__slider"></span>
              </label>
              <span class="item-card__status">{{ item.isAvailable ? 'Disponible' : 'Indisponible' }}</span>

              <div class="item-card__actions">
                <button class="btn-icon" (click)="openForm(item)" [attr.aria-label]="'Modifier ' + item.name">✏️</button>
                <button class="btn-icon btn-icon--danger" (click)="confirmDelete(item)" [attr.aria-label]="'Supprimer ' + item.name">🗑️</button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>Aucun plat dans cette catégorie.</p>
          </div>
        }
      </div>
    </div>

    <!-- Modal formulaire plat -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()" role="dialog" aria-modal="true">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2 class="modal__title">{{ editTarget() ? 'Modifier le plat' : 'Nouveau plat' }}</h2>
            <button class="modal__close" (click)="closeForm()" aria-label="Fermer">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal__body" enctype="multipart/form-data">
            <!-- Image -->
            <div class="form-group">
              <label class="form-label">Image du plat</label>
              <div class="image-upload-zone" (click)="fileInput.click()" role="button" tabindex="0" (keydown.enter)="fileInput.click()">
                @if (imagePreview()) {
                  <img [src]="imagePreview()" alt="Aperçu" class="image-preview" />
                } @else if (editTarget()?.imageUrl) {
                  <img [src]="editTarget()!.imageUrl" alt="Image actuelle" class="image-preview" />
                } @else {
                  <div class="image-upload-placeholder">
                    <span aria-hidden="true">📷</span>
                    <span>Cliquer pour uploader une image</span>
                    <small>JPEG, PNG, WebP · max 5 Mo</small>
                  </div>
                }
              </div>
              <input #fileInput type="file" accept="image/*" class="file-input-hidden" (change)="onFileChange($event)" aria-label="Sélectionner une image" />
            </div>

            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label" for="item-name">Nom *</label>
                <input id="item-name" type="text" class="form-control" formControlName="name" placeholder="Ex : Tartare de thon" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <span class="form-error" role="alert">Le nom est obligatoire.</span>
                }
              </div>

              <div class="form-group flex-1">
                <label class="form-label" for="item-price">Prix (en €) *</label>
                <input id="item-price" type="number" step="0.01" min="0" class="form-control" formControlName="priceEuros" placeholder="12.50" />
                @if (form.get('priceEuros')?.invalid && form.get('priceEuros')?.touched) {
                  <span class="form-error" role="alert">Prix invalide.</span>
                }
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="item-desc">Description</label>
              <textarea id="item-desc" class="form-control" formControlName="description" rows="3" placeholder="Description du plat…"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label" for="item-cat">Catégorie *</label>
                <select id="item-cat" class="form-control" formControlName="categoryId">
                  <option value="">— Choisir —</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
                  <span class="form-error" role="alert">Catégorie obligatoire.</span>
                }
              </div>

              <div class="form-group flex-1">
                <label class="form-label" for="item-badge">Badge</label>
                <select id="item-badge" class="form-control" formControlName="badge">
                  @for (b of badgeOptions; track b.value) {
                    <option [value]="b.value ?? ''">{{ b.label }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label toggle-label">
                Disponible à la commande
                <label class="toggle">
                  <input type="checkbox" formControlName="isAvailable" />
                  <span class="toggle__slider"></span>
                </label>
              </label>
            </div>

            @if (formError()) {
              <div class="alert-error" role="alert">{{ formError() }}</div>
            }

            <div class="modal__footer">
              <button type="button" class="btn btn-outline" (click)="closeForm()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? 'Enregistrement…' : (editTarget() ? 'Modifier' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1100px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-5); }
    .page-title { font-family: var(--font-display); font-size: 2rem; margin: 0 0 var(--space-1); }
    .page-subtitle { color: var(--text-muted); margin: 0; }

    .filter-bar { display: flex; gap: var(--space-2); flex-wrap: wrap; margin-bottom: var(--space-5); }
    .filter-tab {
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: var(--surface-1);
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-secondary);
      transition: all 0.2s;
      &:hover, &.active { background: var(--color-brand); color: white; border-color: var(--color-brand); }
    }

    .items-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-4);
    }

    .item-card {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      overflow: hidden;
      transition: box-shadow 0.2s;
      &:hover { box-shadow: var(--shadow-md); }
      &--unavailable { opacity: 0.65; }

      &__image-wrap {
        position: relative;
        height: 160px;
        background: var(--surface-2);
        overflow: hidden;
      }
      &__image { width: 100%; height: 100%; object-fit: cover; }
      &__image-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: 3rem;
        color: var(--text-muted);
      }
      &__body { padding: var(--space-4); }
      &__top { display: flex; justify-content: space-between; align-items: baseline; gap: var(--space-2); margin-bottom: var(--space-1); }
      &__name { font-weight: 600; color: var(--text-primary); }
      &__price { font-weight: 700; color: var(--color-brand); white-space: nowrap; }
      &__desc { font-size: 0.8125rem; color: var(--text-muted); margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      &__cat { font-size: 0.75rem; color: var(--text-muted); margin-top: var(--space-2); }
      &__footer {
        padding: var(--space-3) var(--space-4);
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }
      &__status { font-size: 0.8125rem; color: var(--text-muted); flex: 1; }
      &__actions { display: flex; gap: var(--space-2); }
    }

    .badge {
      position: absolute;
      top: var(--space-2);
      left: var(--space-2);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      &--new { background: #3b82f6; color: white; }
      &--popular { background: #f59e0b; color: white; }
      &--vegetarian { background: #22c55e; color: white; }
      &--spicy { background: #ef4444; color: white; }
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
      flex-shrink: 0;

      input { opacity: 0; width: 0; height: 0; }

      &__slider {
        position: absolute; cursor: pointer; inset: 0;
        background: var(--border); border-radius: 24px; transition: 0.2s;
        &::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: 0.2s; }
      }

      input:checked + &__slider { background: var(--color-brand); }
      input:checked + &__slider::before { transform: translateX(20px); }
    }

    .empty-state { grid-column: 1 / -1; text-align: center; padding: var(--space-12); color: var(--text-muted); }

    .btn-icon {
      background: none; border: 1px solid var(--border); border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-2); cursor: pointer; font-size: 0.9rem;
      &:hover { background: var(--surface-2); }
      &--danger:hover { background: #fef2f2; border-color: #fca5a5; }
    }

    /* Modal */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); overflow-y: auto; }
    .modal {
      background: var(--surface-1);
      border-radius: var(--radius-xl);
      width: 100%; max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: var(--shadow-xl);

      &__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface-1); z-index: 1; }
      &__title { font-size: 1.25rem; font-weight: 700; margin: 0; }
      &__close { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: var(--text-muted); }
      &__body { padding: var(--space-6); }
      &__footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }
    }

    .form-row { display: flex; gap: var(--space-4); }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }
    .form-group { margin-bottom: var(--space-4); }
    .form-label { display: block; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: 1rem; background: var(--surface-1);
      color: var(--text-primary); box-sizing: border-box; font-family: var(--font-body);
      &:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    }
    .form-error { color: var(--color-error); font-size: 0.8125rem; display: block; margin-top: var(--space-1); }
    .alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: var(--space-3); border-radius: var(--radius-md); font-size: 0.875rem; }
    .toggle-label { display: flex; justify-content: space-between; align-items: center; }

    .image-upload-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      min-height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.2s;
      &:hover { border-color: var(--color-brand); }
    }
    .image-preview { width: 100%; max-height: 220px; object-fit: cover; display: block; }
    .image-upload-placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); color: var(--text-muted); font-size: 0.9rem; span:first-child { font-size: 2rem; } }
    .file-input-hidden { display: none; }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0.625rem 1.25rem; border-radius: var(--radius-md);
      font-weight: 500; font-size: 0.9375rem; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
      &-primary { background: var(--color-brand); color: white; border-color: var(--color-brand); &:hover:not(:disabled) { background: var(--color-brand-dark); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
      &-outline { border-color: var(--border); color: var(--text-secondary); background: var(--surface-1); &:hover { border-color: var(--color-brand); color: var(--color-brand); } }
    }
  `],
})
export class MenuItemsComponent implements OnInit {
  private readonly menuService = inject(MenuService)
  private readonly fb = inject(FormBuilder)

  readonly badgeOptions = BADGES
  readonly categories = this.menuService.categories
  readonly menuItems = this.menuService.menuItems
  readonly showForm = signal(false)
  readonly editTarget = signal<MenuItem | null>(null)
  readonly saving = signal(false)
  readonly formError = signal<string | null>(null)
  readonly activeCategoryId = signal<number | null>(null)
  readonly imagePreview = signal<string | null>(null)

  private selectedFile: File | null = null

  readonly filteredByCategory = computed(() => {
    const catId = this.activeCategoryId()
    const items = this.menuItems()
    return catId ? items.filter((i) => i.categoryId === catId) : items
  })

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    priceEuros: [0, [Validators.required, Validators.min(0)]],
    categoryId: ['', [Validators.required]],
    badge: [''],
    isAvailable: [true],
  })

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
    this.menuService.loadAdminItems().subscribe()
  }

  getBadgeLabel(badge: MenuItemBadge): string {
    return BADGES.find((b) => b.value === badge)?.label ?? ''
  }

  getCategoryName(catId: number): string {
    return this.categories().find((c) => c.id === catId)?.name ?? ''
  }

  formatPrice(cents: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  }

  openForm(item?: MenuItem): void {
    this.editTarget.set(item ?? null)
    this.formError.set(null)
    this.imagePreview.set(null)
    this.selectedFile = null

    if (item) {
      this.form.patchValue({
        name: item.name,
        description: item.description ?? '',
        priceEuros: item.priceInCents / 100,
        categoryId: String(item.categoryId),
        badge: item.badge ?? '',
        isAvailable: item.isAvailable,
      })
    } else {
      this.form.reset({ name: '', description: '', priceEuros: 0, categoryId: '', badge: '', isAvailable: true })
    }
    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
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
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.saving.set(true)
    this.formError.set(null)

    const v = this.form.value
    const formData = new FormData()
    formData.append('name', v.name ?? '')
    formData.append('description', v.description ?? '')
    formData.append('priceInCents', String(Math.round((v.priceEuros ?? 0) * 100)))
    formData.append('categoryId', String(v.categoryId))
    formData.append('badge', v.badge ?? '')
    formData.append('isAvailable', String(v.isAvailable))
    if (this.selectedFile) {
      formData.append('image', this.selectedFile)
    }

    const target = this.editTarget()
    const req$ = target
      ? this.menuService.updateMenuItem(target.id, formData)
      : this.menuService.createMenuItem(formData)

    req$.subscribe({
      next: () => {
        this.saving.set(false)
        this.closeForm()
      },
      error: (err) => {
        this.saving.set(false)
        this.formError.set(err?.error?.message ?? 'Une erreur est survenue.')
      },
    })
  }

  toggleAvailability(item: MenuItem): void {
    this.menuService.toggleAvailability(item.id).subscribe()
  }

  confirmDelete(item: MenuItem): void {
    if (confirm(`Supprimer le plat "${item.name}" ?`)) {
      this.menuService.deleteMenuItem(item.id).subscribe()
    }
  }
}
