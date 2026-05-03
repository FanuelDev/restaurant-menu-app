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
        <button class="btn btn-primary" (click)="openForm()">➕ Nouvelle catégorie</button>
      </header>

      <div class="categories-list">
        @for (cat of categories(); track cat.id) {
          <div class="category-row" [class.category-row-hidden]="!cat.isVisible">
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
                <input type="checkbox" [checked]="cat.isVisible" (change)="toggleVisibility(cat)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <div class="category-actions">
              <button class="btn-icon" (click)="openForm(cat)" [attr.aria-label]="'Modifier ' + cat.name">✏️</button>
              <button class="btn-icon btn-icon-danger" (click)="confirmDelete(cat)" [attr.aria-label]="'Supprimer ' + cat.name">🗑️</button>
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

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()" role="dialog" aria-modal="true">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ editTarget() ? 'Modifier' : 'Nouvelle' }} catégorie</h2>
            <button class="modal-close" (click)="closeForm()" aria-label="Fermer">✕</button>
          </div>
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal-body">
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
                  <span class="toggle-slider"></span>
                </label>
              </label>
            </div>
            @if (formError()) {
              <div class="alert-error" role="alert">{{ formError() }}</div>
            }
            <div class="modal-footer">
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

    .categories-list {
      background: white; border-radius: var(--radius-lg);
      border: 1px solid var(--border); overflow: hidden;
      box-shadow: var(--shadow-xs);
    }
    .category-row {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-4) var(--space-5); border-bottom: 1px solid var(--border);
      transition: background var(--t-fast);
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); }
    }
    .category-row-hidden { opacity: .5; }

    .drag-handle {
      cursor: grab; color: var(--gray-300); font-size: 1.125rem;
      user-select: none; line-height: 1;
      &:active { cursor: grabbing; }
    }
    .category-info { flex: 1; min-width: 0; }
    .category-name { font-weight: 600; display: block; font-size: .9375rem; color: var(--text-primary); }
    .category-desc { font-size: .8125rem; color: var(--text-muted); display: block; margin-top: 2px; }

    .category-meta { display: flex; align-items: center; gap: var(--space-3); }
    .badge-count {
      font-size: .75rem; color: var(--text-muted);
      background: var(--gray-100); padding: .2rem .55rem;
      border-radius: var(--radius-full); white-space: nowrap;
    }
    .category-actions { display: flex; gap: var(--space-2); }
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
    name: ['', [Validators.required]],
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
      this.form.patchValue({ name: category.name, description: category.description ?? '', isVisible: category.isVisible })
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
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.saving.set(true)
    this.formError.set(null)
    const data = this.form.value as Partial<Category>
    const target = this.editTarget()
    const req$ = target ? this.menuService.updateCategory(target.id, data) : this.menuService.createCategory(data)
    req$.subscribe({
      next: () => { this.saving.set(false); this.closeForm() },
      error: (err) => { this.saving.set(false); this.formError.set(err?.error?.message ?? 'Une erreur est survenue.') },
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
