// frontend/src/app/admin/categories/categories.component.ts
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { MenuService } from '../../shared/services/menu.service'
import type { Category } from '../../shared/models'

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">Catégories</h1>
          <p class="page-subtitle">Organisez votre menu par sections</p>
        </div>
        <button class="btn btn-primary" (click)="openForm()">
          ➕ Nouvelle catégorie
        </button>
      </header>

      <!-- Liste des catégories -->
      <div class="categories-list">
        @for (cat of categories(); track cat.id) {
          <div class="category-row" [class.category-row--hidden]="!cat.isVisible">
            <!-- Drag handle -->
            <div class="drag-handle" aria-hidden="true" title="Réordonner">⠿</div>

            <div class="category-info">
              <span class="category-name">{{ cat.name }}</span>
              @if (cat.description) {
                <span class="category-desc">{{ cat.description }}</span>
              }
            </div>

            <div class="category-meta">
              <span class="badge-count">{{ cat.menuItemsCount ?? 0 }} plat(s)</span>
              <label class="toggle" [attr.aria-label]="'Visibilité de ' + cat.name">
                <input
                  type="checkbox"
                  [checked]="cat.isVisible"
                  (change)="toggleVisibility(cat)"
                />
                <span class="toggle__slider"></span>
              </label>
            </div>

            <div class="category-actions">
              <button class="btn-icon" (click)="openForm(cat)" [attr.aria-label]="'Modifier ' + cat.name" title="Modifier">✏️</button>
              <button class="btn-icon btn-icon--danger" (click)="confirmDelete(cat)" [attr.aria-label]="'Supprimer ' + cat.name" title="Supprimer">🗑️</button>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>Aucune catégorie pour l'instant.</p>
            <button class="btn btn-primary" (click)="openForm()">Créer la première catégorie</button>
          </div>
        }
      </div>
    </div>

    <!-- Modal formulaire -->
    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()" role="dialog" aria-modal="true" [attr.aria-label]="editTarget() ? 'Modifier la catégorie' : 'Nouvelle catégorie'">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2 class="modal__title">{{ editTarget() ? 'Modifier' : 'Nouvelle' }} catégorie</h2>
            <button class="modal__close" (click)="closeForm()" aria-label="Fermer">✕</button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal__body">
            <div class="form-group">
              <label class="form-label" for="cat-name">Nom *</label>
              <input id="cat-name" type="text" class="form-control" formControlName="name" placeholder="Ex : Entrées" />
              @if (form.get('name')?.invalid && form.get('name')?.touched) {
                <span class="form-error" role="alert">Le nom est obligatoire.</span>
              }
            </div>

            <div class="form-group">
              <label class="form-label" for="cat-desc">Description</label>
              <input id="cat-desc" type="text" class="form-control" formControlName="description" placeholder="Description courte (optionnel)" />
            </div>

            <div class="form-group">
              <label class="form-label toggle-label">
                Visible sur la vitrine
                <label class="toggle">
                  <input type="checkbox" formControlName="isVisible" />
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
    .page-container { max-width: 800px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-6); }
    .page-title { font-family: var(--font-display); font-size: 2rem; margin: 0 0 var(--space-1); }
    .page-subtitle { color: var(--text-muted); margin: 0; }

    .categories-list {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      overflow: hidden;
    }

    .category-row {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-4) var(--space-5);
      border-bottom: 1px solid var(--border);
      transition: background 0.15s;

      &:last-child { border-bottom: none; }
      &:hover { background: var(--surface-2); }
      &--hidden { opacity: 0.55; }
    }

    .drag-handle {
      cursor: grab;
      color: var(--text-muted);
      font-size: 1.25rem;
      user-select: none;
      &:active { cursor: grabbing; }
    }

    .category-info { flex: 1; min-width: 0; }
    .category-name { font-weight: 600; display: block; }
    .category-desc { font-size: 0.875rem; color: var(--text-muted); display: block; }

    .category-meta { display: flex; align-items: center; gap: var(--space-3); }
    .badge-count { font-size: 0.8125rem; color: var(--text-muted); white-space: nowrap; }

    .category-actions { display: flex; gap: var(--space-2); }

    .toggle {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;

      input { opacity: 0; width: 0; height: 0; }

      &__slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background: var(--border);
        border-radius: 24px;
        transition: 0.2s;

        &::before {
          content: '';
          position: absolute;
          width: 18px; height: 18px;
          left: 3px; bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.2s;
        }
      }

      input:checked + &__slider { background: var(--color-brand); }
      input:checked + &__slider::before { transform: translateX(20px); }
    }

    .toggle-label { display: flex; justify-content: space-between; align-items: center; }

    .btn-icon {
      background: none;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: var(--space-1) var(--space-2);
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.15s;
      &:hover { background: var(--surface-2); }
      &--danger:hover { background: #fef2f2; border-color: #fca5a5; }
    }

    .empty-state {
      padding: var(--space-12) var(--space-6);
      text-align: center;
      color: var(--text-muted);
      p { margin-bottom: var(--space-4); }
    }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 100;
      padding: var(--space-4);
    }

    .modal {
      background: var(--surface-1);
      border-radius: var(--radius-xl);
      width: 100%; max-width: 480px;
      box-shadow: var(--shadow-xl);

      &__header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border); }
      &__title { font-size: 1.25rem; font-weight: 700; margin: 0; }
      &__close { background: none; border: none; cursor: pointer; font-size: 1.25rem; color: var(--text-muted); &:hover { color: var(--text-primary); } }
      &__body { padding: var(--space-6); }
      &__footer { display: flex; justify-content: flex-end; gap: var(--space-3); margin-top: var(--space-6); }
    }

    .form-group { margin-bottom: var(--space-5); }
    .form-label { display: block; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: 1rem; background: var(--surface-1);
      color: var(--text-primary); box-sizing: border-box;
      &:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    }
    .form-error { color: var(--color-error); font-size: 0.8125rem; display: block; margin-top: var(--space-1); }
    .alert-error { background: #fef2f2; border: 1px solid #fca5a5; color: #dc2626; padding: var(--space-3); border-radius: var(--radius-md); font-size: 0.875rem; margin-bottom: var(--space-4); }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0.625rem 1.25rem; border-radius: var(--radius-md);
      font-weight: 500; font-size: 0.9375rem; cursor: pointer; border: 1px solid transparent;
      transition: all 0.2s;
      &-primary { background: var(--color-brand); color: white; border-color: var(--color-brand); &:hover:not(:disabled) { background: var(--color-brand-dark); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
      &-outline { border-color: var(--border); color: var(--text-secondary); background: var(--surface-1); &:hover { border-color: var(--color-brand); color: var(--color-brand); } }
    }
  `],
})
export class CategoriesComponent implements OnInit {
  private readonly menuService = inject(MenuService)
  private readonly fb = inject(FormBuilder)

  readonly categories = this.menuService.categories
  readonly showForm = signal(false)
  readonly editTarget = signal<Category | null>(null)
  readonly saving = signal(false)
  readonly formError = signal<string | null>(null)

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    description: [''],
    isVisible: [true],
  })

  ngOnInit(): void {
    this.menuService.loadAdminCategories().subscribe()
  }

  openForm(category?: Category): void {
    this.editTarget.set(category ?? null)
    this.formError.set(null)
    if (category) {
      this.form.patchValue({
        name: category.name,
        description: category.description ?? '',
        isVisible: category.isVisible,
      })
    } else {
      this.form.reset({ name: '', description: '', isVisible: true })
    }
    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.editTarget.set(null)
    this.form.reset()
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.saving.set(true)
    this.formError.set(null)

    const data = this.form.value as Partial<Category>
    const target = this.editTarget()

    const req$ = target
      ? this.menuService.updateCategory(target.id, data)
      : this.menuService.createCategory(data)

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

  toggleVisibility(cat: Category): void {
    this.menuService.updateCategory(cat.id, { isVisible: !cat.isVisible }).subscribe()
  }

  confirmDelete(cat: Category): void {
    if (confirm(`Supprimer la catégorie "${cat.name}" et tous ses plats ?`)) {
      this.menuService.deleteCategory(cat.id).subscribe()
    }
  }
}
