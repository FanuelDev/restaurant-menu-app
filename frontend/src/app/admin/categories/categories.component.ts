// frontend/src/app/admin/categories/categories.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { MenuService } from '../../shared/services/menu.service'
import { SubscriptionService } from '../../shared/services/subscription.service'
import { PlanLimitBarComponent } from '../../shared/components/plan-limit-bar/plan-limit-bar.component'
import type { Category, ResourceUsage } from '../../shared/models'

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PlanLimitBarComponent, TranslocoModule],
  templateUrl: './categories.component.html',
  styles: [`
    .page-container { max-width: 800px; }
    .usage-section { margin-bottom: var(--space-5); }

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
    .category-info { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: var(--space-2); flex-wrap: wrap; }
    .category-name { font-weight: 600; font-size: .9375rem; color: var(--text-primary); }
    .category-desc { font-size: .8125rem; color: var(--text-muted); }
    .tl-indicator { font-size: .8rem; opacity: .6; }
    .category-meta { display: flex; align-items: center; gap: var(--space-3); }
    .badge-count {
      font-size: .75rem; color: var(--text-muted);
      background: var(--gray-100); padding: .2rem .55rem;
      border-radius: var(--radius-full); white-space: nowrap;
    }
    .category-actions { display: flex; gap: var(--space-2); }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0.625rem 1.25rem; border-radius: var(--radius-md);
      font-weight: 500; font-size: 0.9375rem; cursor: pointer;
      border: 1px solid transparent; transition: all .2s;
    }
    .btn-primary { background: var(--color-brand); color: white; border-color: var(--color-brand); }
    .btn-primary:hover:not(:disabled) { background: var(--color-brand-dark); }
    .btn-primary:disabled { opacity: .6; cursor: not-allowed; }
    .btn-outline { border-color: var(--border); color: var(--text-secondary); background: var(--surface-1); }
    .btn-outline:hover { border-color: var(--color-brand); color: var(--color-brand); }
    .btn-icon {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      color: var(--text-muted); cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }
    .btn-icon-danger:hover { background: var(--error-bg) !important; color: var(--error) !important; border-color: var(--error-border) !important; }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 100; padding: var(--space-4); overflow-y: auto; }
    .modal { background: var(--surface-1); border-radius: var(--radius-xl); width: 100%; max-width: 520px; box-shadow: var(--shadow-xl); max-height: 90vh; overflow-y: auto; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-5) var(--space-6); border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--surface-1); z-index: 1; }
    .modal-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .modal-close {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      color: var(--text-muted); cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); }
    }
    .modal-body { padding: var(--space-6); }
    .modal-footer { display: flex; justify-content: flex-end; gap: var(--space-3); padding-top: var(--space-4); border-top: 1px solid var(--border); margin-top: var(--space-4); }

    .form-group { margin-bottom: var(--space-4); }
    .form-label { display: block; font-weight: 500; font-size: .875rem; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-control {
      width: 100%; padding: .75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: 1rem; background: var(--surface-1);
      color: var(--text-primary); box-sizing: border-box;
      &:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    }
    .form-error { color: var(--error); font-size: .8125rem; display: block; margin-top: var(--space-1); }
    .alert-error { background: var(--error-bg); border: 1px solid var(--error-border); color: var(--error); padding: var(--space-3); border-radius: var(--radius-md); font-size: .875rem; margin-bottom: var(--space-4); }

    .toggle { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; }
    .toggle input { opacity: 0; width: 0; height: 0; }
    .toggle-slider {
      position: absolute; cursor: pointer; inset: 0;
      background: var(--border); border-radius: 24px; transition: .2s;
    }
    .toggle-slider::before {
      content: ''; position: absolute; width: 18px; height: 18px;
      left: 3px; bottom: 3px; background: white; border-radius: 50%; transition: .2s;
    }
    input:checked + .toggle-slider { background: var(--color-brand); }
    input:checked + .toggle-slider::before { transform: translateX(20px); }
    .toggle-label { display: flex; justify-content: space-between; align-items: center; }

    .empty-state { text-align: center; padding: var(--space-12); color: var(--text-muted); }

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
export class CategoriesComponent implements OnInit {
  private readonly menuService = inject(MenuService)
  private readonly subscriptionService = inject(SubscriptionService)
  private readonly fb = inject(FormBuilder)
  private readonly transloco = inject(TranslocoService)

  readonly categories = this.menuService.categories
  readonly showForm = signal(false)
  readonly showTranslations = signal(false)
  readonly editTarget = signal<Category | null>(null)
  readonly saving = signal(false)
  readonly formError = signal<string | null>(null)
  readonly usage = signal<ResourceUsage | null>(null)

  readonly atLimit = computed(() => {
    const u = this.usage()
    return u !== null && u.max !== -1 && u.current >= u.max
  })

  /** Nombre de champs de traduction remplis (pour le badge sur le bouton). */
  readonly translationCount = computed(() => {
    const v = this.form.value
    return [v.nameEn, v.descEn, v.nameDe, v.descDe, v.nameZh, v.descZh].filter(
      (s) => s && s.trim()
    ).length
  })

  form = this.fb.group({
    name: ['', [Validators.required]],
    description: [''],
    isVisible: [true],
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
    this.loadUsage()
  }

  private loadUsage(): void {
    this.subscriptionService.getUsage().subscribe({
      next: (u) => this.usage.set(u.categories),
    })
  }

  hasTranslations(cat: Category): boolean {
    return (
      Object.keys(cat.nameTranslations ?? {}).length > 0 ||
      Object.keys(cat.descriptionTranslations ?? {}).length > 0
    )
  }

  openForm(category?: Category): void {
    this.editTarget.set(category ?? null)
    this.formError.set(null)
    const nt = category?.nameTranslations ?? {}
    const dt = category?.descriptionTranslations ?? {}
    this.form.patchValue({
      name: category?.name ?? '',
      description: category?.description ?? '',
      isVisible: category?.isVisible ?? true,
      nameEn: nt['en'] ?? '',
      descEn: dt['en'] ?? '',
      nameDe: nt['de'] ?? '',
      descDe: dt['de'] ?? '',
      nameZh: nt['zh'] ?? '',
      descZh: dt['zh'] ?? '',
    })
    // Auto-ouvrir la section si des traductions existent déjà
    this.showTranslations.set(category ? this.hasTranslations(category) : false)
    this.showForm.set(true)
  }

  closeForm(): void {
    this.showForm.set(false)
    this.showTranslations.set(false)
    this.editTarget.set(null)
    this.form.reset()
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.saving.set(true)
    this.formError.set(null)

    const v = this.form.value

    // Assembler les objets de traduction (ignorer les champs vides)
    const nameTranslations: Record<string, string> = {}
    if (v.nameEn?.trim()) nameTranslations['en'] = v.nameEn.trim()
    if (v.nameDe?.trim()) nameTranslations['de'] = v.nameDe.trim()
    if (v.nameZh?.trim()) nameTranslations['zh'] = v.nameZh.trim()

    const descriptionTranslations: Record<string, string> = {}
    if (v.descEn?.trim()) descriptionTranslations['en'] = v.descEn.trim()
    if (v.descDe?.trim()) descriptionTranslations['de'] = v.descDe.trim()
    if (v.descZh?.trim()) descriptionTranslations['zh'] = v.descZh.trim()

    const data: Partial<Category> = {
      name: v.name ?? '',
      description: v.description ?? '',
      isVisible: v.isVisible ?? true,
      nameTranslations,
      descriptionTranslations,
    }

    const target = this.editTarget()
    const req$ = target
      ? this.menuService.updateCategory(target.id, data)
      : this.menuService.createCategory(data)

    req$.subscribe({
      next: () => { this.saving.set(false); this.closeForm(); this.loadUsage() },
      error: (err) => {
        this.saving.set(false)
        if (err?.status === 402) {
          this.formError.set(err?.error?.message ?? this.transloco.translate('categories.limitMessage'))
        } else {
          this.formError.set(err?.error?.message ?? this.transloco.translate('categories.errorGeneric'))
        }
      },
    })
  }

  toggleVisibility(cat: Category): void {
    this.menuService.updateCategory(cat.id, { isVisible: !cat.isVisible }).subscribe()
  }

  confirmDelete(cat: Category): void {
    if (confirm(this.transloco.translate('categories.deleteConfirm', { name: cat.name }))) {
      this.menuService.deleteCategory(cat.id).subscribe({
        next: () => this.loadUsage(),
      })
    }
  }
}
