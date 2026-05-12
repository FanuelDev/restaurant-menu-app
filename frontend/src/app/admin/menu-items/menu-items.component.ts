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
  template: `
    <ng-container *transloco="let t">
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('menuItems.title') }}</h1>
          <p class="page-subtitle">{{ t('menuItems.subtitle', { count: menuItems().length }) }}</p>
        </div>
        <button
          class="btn btn-primary"
          (click)="openForm()"
          [disabled]="atLimit()"
          [title]="atLimit() ? t('menuItems.limitReached') : ''"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true">
            <line x1="7" y1="1" x2="7" y2="13"/><line x1="1" y1="7" x2="13" y2="7"/>
          </svg>
          {{ t('menuItems.newItem') }}
        </button>
      </header>

      @if (usage()) {
        <div class="usage-section">
          <app-plan-limit-bar
            [label]="t('menuItems.usageLabel')"
            [current]="usage()!.current"
            [max]="usage()!.max"
          />
        </div>
      }

      <div class="filter-bar">
        <button
          class="filter-tab"
          [class.active]="!activeCategoryId()"
          (click)="activeCategoryId.set(null)"
        >{{ t('menuItems.filterAll') }}</button>
        @for (cat of categories(); track cat.id) {
          <button
            class="filter-tab"
            [class.active]="activeCategoryId() === cat.id"
            (click)="activeCategoryId.set(cat.id)"
          >{{ cat.name }}</button>
        }
      </div>

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
                <span class="badge badge--{{ item.badge }}">{{ t(getBadgeKey(item.badge)) }}</span>
              }
              @if (hasTranslations(item)) {
                <span class="tl-dot" [title]="t('common.translationsAvailable')">🌐</span>
              }
            </div>

            <div class="item-card__body">
              <div class="item-card__top">
                <span class="item-card__name">{{ item.name }}</span>
                <span class="item-card__price">{{ formatPrice(item.price) }}</span>
              </div>
              @if (item.description) {
                <p class="item-card__desc">{{ item.description }}</p>
              }
              <div class="item-card__cat">{{ getCategoryName(item.categoryId) }}</div>
            </div>

            <div class="item-card__footer">
              <label class="toggle" [attr.aria-label]="t('menuItems.availability', { name: item.name })">
                <input type="checkbox" [checked]="item.isAvailable" (change)="toggleAvailability(item)" />
                <span class="toggle-slider"></span>
              </label>
              <span class="item-card__status">{{ item.isAvailable ? t('menuItems.statusAvailable') : t('menuItems.statusUnavailable') }}</span>

              <div class="item-card__actions">
                <button class="btn-icon" (click)="openForm(item)" [attr.aria-label]="t('menuItems.editAria', { name: item.name })">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon btn-icon--danger" (click)="confirmDelete(item)" [attr.aria-label]="t('menuItems.deleteAria', { name: item.name })">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        } @empty {
          <div class="empty-state">
            <p>{{ t('menuItems.empty') }}</p>
          </div>
        }
      </div>
    </div>

    @if (showForm()) {
      <div class="modal-overlay" (click)="closeForm()" role="dialog" aria-modal="true">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal__header">
            <h2 class="modal__title">{{ editTarget() ? t('menuItems.modalTitleEdit') : t('menuItems.modalTitleNew') }}</h2>
            <button class="modal__close" (click)="closeForm()" [attr.aria-label]="t('common.cancel')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="modal__body" enctype="multipart/form-data">

            <!-- Image -->
            <div class="form-group">
              <label class="form-label">{{ t('menuItems.imageLabel') }}</label>
              <div class="image-upload-zone" (click)="fileInput.click()" role="button" tabindex="0" (keydown.enter)="fileInput.click()">
                @if (imagePreview()) {
                  <img [src]="imagePreview()" alt="Aperçu" class="image-preview" />
                } @else if (editTarget()?.imageUrl) {
                  <img [src]="editTarget()!.imageUrl" alt="Image actuelle" class="image-preview" />
                } @else {
                  <div class="image-upload-placeholder">
                    <span aria-hidden="true">📷</span>
                    <span>{{ t('menuItems.imageClick') }}</span>
                    <small>{{ t('menuItems.imageHint') }}</small>
                  </div>
                }
              </div>
              <input #fileInput type="file" accept="image/*" class="file-input-hidden" (change)="onFileChange($event)" [attr.aria-label]="t('menuItems.imageLabel')" />
            </div>

            <!-- Nom + Prix -->
            <div class="form-row">
              <div class="form-group flex-2">
                <label class="form-label" for="item-name">{{ t('menuItems.fieldName') }} *</label>
                <input id="item-name" type="text" class="form-control" formControlName="name" [placeholder]="t('menuItems.fieldNamePlaceholder')" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <span class="form-error" role="alert">{{ t('menuItems.fieldNameRequired') }}</span>
                }
              </div>
              <div class="form-group flex-1">
                <label class="form-label" for="item-price">{{ t('menuItems.fieldPrice') }} *</label>
                <input id="item-price" type="number" step="0.01" min="0" class="form-control" formControlName="priceEuros" [placeholder]="t('menuItems.fieldPricePlaceholder')" />
                @if (form.get('priceEuros')?.invalid && form.get('priceEuros')?.touched) {
                  <span class="form-error" role="alert">{{ t('menuItems.fieldPriceInvalid') }}</span>
                }
              </div>
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label" for="item-desc">{{ t('menuItems.fieldDescription') }}</label>
              <textarea id="item-desc" class="form-control" formControlName="description" rows="3" [placeholder]="t('menuItems.fieldDescriptionPlaceholder')"></textarea>
            </div>

            <!-- Catégorie + Badge -->
            <div class="form-row">
              <div class="form-group flex-1">
                <label class="form-label" for="item-cat">{{ t('menuItems.fieldCategory') }} *</label>
                <select id="item-cat" class="form-control" formControlName="categoryId">
                  <option value="">{{ t('menuItems.fieldCategoryPlaceholder') }}</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
                </select>
                @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
                  <span class="form-error" role="alert">{{ t('menuItems.fieldCategoryRequired') }}</span>
                }
              </div>
              <div class="form-group flex-1">
                <label class="form-label" for="item-badge">{{ t('menuItems.fieldBadge') }}</label>
                <select id="item-badge" class="form-control" formControlName="badge">
                  <option value="">{{ t('menuItems.badgeNone') }}</option>
                  <option value="new">{{ t('menuItems.badgeNew') }}</option>
                  <option value="popular">{{ t('menuItems.badgePopular') }}</option>
                  <option value="vegetarian">{{ t('menuItems.badgeVegetarian') }}</option>
                  <option value="spicy">{{ t('menuItems.badgeSpicy') }}</option>
                </select>
              </div>
            </div>

            <!-- Disponibilité -->
            <div class="form-group">
              <label class="form-label toggle-label">
                {{ t('menuItems.fieldAvailable') }}
                <label class="toggle">
                  <input type="checkbox" formControlName="isAvailable" />
                  <span class="toggle-slider"></span>
                </label>
              </label>
            </div>

            <!-- Section traductions -->
            <div class="tl-section">
              <button type="button" class="tl-toggle" (click)="showTranslations.set(!showTranslations())">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                {{ t('common.translations') }}
                @if (translationCount() > 0) {
                  <span class="tl-badge">{{ translationCount() }}</span>
                }
                <svg class="tl-chevron" [class.tl-chevron-open]="showTranslations()" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              @if (showTranslations()) {
                <div class="tl-body">
                  <p class="tl-hint">{{ t('common.translationsHint') }}</p>

                  <!-- Anglais -->
                  <div class="tl-lang-block">
                    <div class="tl-lang-label"><span class="tl-flag">🇬🇧</span> {{ t('common.langEn') }}</div>
                    <div class="tl-fields">
                      <input class="form-control" formControlName="nameEn" placeholder="Name in English" />
                      <textarea class="form-control" formControlName="descEn" rows="2" placeholder="Description in English"></textarea>
                    </div>
                  </div>

                  <!-- Allemand -->
                  <div class="tl-lang-block">
                    <div class="tl-lang-label"><span class="tl-flag">🇩🇪</span> {{ t('common.langDe') }}</div>
                    <div class="tl-fields">
                      <input class="form-control" formControlName="nameDe" placeholder="Name auf Deutsch" />
                      <textarea class="form-control" formControlName="descDe" rows="2" placeholder="Beschreibung auf Deutsch"></textarea>
                    </div>
                  </div>

                  <!-- Chinois -->
                  <div class="tl-lang-block">
                    <div class="tl-lang-label"><span class="tl-flag">🇨🇳</span> {{ t('common.langZh') }}</div>
                    <div class="tl-fields">
                      <input class="form-control" formControlName="nameZh" placeholder="中文名称" />
                      <textarea class="form-control" formControlName="descZh" rows="2" placeholder="中文描述"></textarea>
                    </div>
                  </div>
                </div>
              }
            </div>

            @if (formError()) {
              <div class="alert-error" role="alert">{{ formError() }}</div>
            }

            <div class="modal__footer">
              <button type="button" class="btn btn-outline" (click)="closeForm()">{{ t('common.cancel') }}</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving()">
                {{ saving() ? t('common.saving') : (editTarget() ? t('menuItems.submitEdit') : t('menuItems.submitCreate')) }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
    </ng-container>
  `,
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
