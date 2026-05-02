// frontend/src/app/public/category-tabs/category-tabs.component.ts
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import type { Category } from '../../shared/models'

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="cat-tabs" aria-label="Navigation par catégorie" #tabsNav>
      <div class="cat-tabs__inner container">
        @for (cat of categories; track cat.id) {
          <button
            class="cat-tab"
            [class.cat-tab--active]="activeCategoryId === cat.id"
            (click)="select(cat.id)"
            [attr.aria-current]="activeCategoryId === cat.id ? 'true' : null"
          >
            {{ cat.name }}
          </button>
        }
      </div>
    </nav>
  `,
  styles: [`
    .cat-tabs {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 72px; /* hauteur de la filter-section */
      z-index: 30;
      overflow: hidden;
    }

    .cat-tabs__inner {
      display: flex;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
      &::-webkit-scrollbar { display: none; }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-5);
    }

    .cat-tab {
      flex-shrink: 0;
      padding: var(--space-4) var(--space-5);
      border: none;
      border-bottom: 3px solid transparent;
      background: none;
      color: var(--text-secondary);
      font-size: 0.9375rem;
      font-weight: 500;
      font-family: var(--font-body);
      cursor: pointer;
      transition: color 0.2s, border-color 0.2s;
      white-space: nowrap;

      &:hover { color: var(--text-primary); }

      &--active {
        color: var(--color-brand);
        border-bottom-color: var(--color-brand);
        font-weight: 600;
      }
    }
  `],
})
export class CategoryTabsComponent implements OnChanges {
  @Input() categories: Category[] = []
  @Input() activeCategoryId: number | null = null
  @Output() categorySelected = new EventEmitter<number>()

  @ViewChild('tabsNav') tabsNav!: ElementRef<HTMLElement>

  ngOnChanges(): void {
    // Scroll automatique vers l'onglet actif lors du scrollspy
    if (this.activeCategoryId && this.tabsNav) {
      const btn = this.tabsNav.nativeElement.querySelector(
        `[aria-current="true"]`
      ) as HTMLButtonElement | null
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  select(id: number): void {
    this.categorySelected.emit(id)
  }
}
