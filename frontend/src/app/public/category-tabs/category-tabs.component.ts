// frontend/src/app/public/category-tabs/category-tabs.component.ts
import { Component, Input, Output, EventEmitter, OnChanges, ElementRef, ViewChild, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslocoModule } from '@jsverse/transloco'
import type { Category } from '../../shared/models'

@Component({
  selector: 'app-category-tabs',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-tabs.component.html',
  styles: [`
    .cat-tabs {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      position: sticky;
      top: 72px;
      z-index: 30;
      overflow: hidden;
    }
    .cat-tabs-inner {
      display: flex;
      gap: 0;
      overflow-x: auto;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    .cat-tabs-inner::-webkit-scrollbar { display: none; }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-5); }

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
    }
    .cat-tab:hover { color: var(--text-primary); }
    .cat-tab-active {
      color: var(--color-brand);
      border-bottom-color: var(--color-brand);
      font-weight: 600;
    }
  `],
})
export class CategoryTabsComponent implements OnChanges {
  @Input() categories: Category[] = []
  @Input() activeCategoryId: number | null = null
  @Output() categorySelected = new EventEmitter<number>()
  @ViewChild('tabsNav') tabsNav!: ElementRef<HTMLElement>

  ngOnChanges(): void {
    if (this.activeCategoryId && this.tabsNav) {
      const btn = this.tabsNav.nativeElement.querySelector('[aria-current="true"]') as HTMLButtonElement | null
      btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }

  select(id: number): void {
    this.categorySelected.emit(id)
  }
}
