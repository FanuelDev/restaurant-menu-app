import { Component, signal, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'

interface FaqItem {
  qKey: string
  category: string
}

const FAQS: FaqItem[] = [
  { category: 'general', qKey: '0' },
  { category: 'general', qKey: '1' },
  { category: 'general', qKey: '2' },
  { category: 'account', qKey: '3' },
  { category: 'account', qKey: '4' },
  { category: 'account', qKey: '5' },
  { category: 'account', qKey: '6' },
  { category: 'menu', qKey: '7' },
  { category: 'menu', qKey: '8' },
  { category: 'menu', qKey: '9' },
  { category: 'menu', qKey: '10' },
  { category: 'orders', qKey: '11' },
  { category: 'orders', qKey: '12' },
  { category: 'orders', qKey: '13' },
  { category: 'tech', qKey: '14' },
  { category: 'tech', qKey: '15' },
  { category: 'tech', qKey: '16' },
]

const CATEGORY_KEYS = ['all', 'general', 'account', 'menu', 'orders', 'tech']

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './faq.component.html',
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }
    .fq-container { max-width: 860px; margin: 0 auto; padding: 0 var(--space-6); }

    /* Nav */
    .fq-nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .fq-nav-inner {
      max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6);
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .fq-logo { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; }
    .fq-logo-icon {
      width: 32px; height: 32px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .fq-logo-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .fq-nav-right { display: flex; align-items: center; gap: var(--space-3); }
    .fq-nav-login { font-size: .9rem; color: var(--text-secondary); text-decoration: none; font-weight: 500; }
    .fq-nav-cta {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .875rem; font-weight: 600;
    }
    @media (max-width: 480px) { .fq-nav-right { display: none; } }

    /* Hero */
    .fq-hero {
      background: linear-gradient(160deg, var(--gray-50) 0%, white 100%);
      padding: 56px 0 48px; border-bottom: 1px solid var(--border);
    }
    .fq-back { margin-bottom: var(--space-5); }
    .fq-back-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-decoration: none; font-weight: 500;
      &:hover { color: var(--brand); }
    }
    .fq-hero-tag {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .fq-hero-h1 {
      font-family: var(--font-display); font-size: clamp(1.75rem, 4vw, 2.75rem);
      margin: 0 0 var(--space-3); line-height: 1.15;
    }
    .fq-hero-sub { font-size: 1.0625rem; color: var(--text-secondary); margin: 0; line-height: 1.7; }
    .fq-inline-link { color: var(--brand); text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }

    /* Filter bar */
    .fq-filter-bar {
      background: white; position: sticky; top: 64px; z-index: 50;
      border-bottom: 1px solid var(--border); padding: var(--space-3) 0;
    }
    .fq-filter-scroll {
      display: flex; gap: var(--space-2); overflow-x: auto;
      scrollbar-width: none; -ms-overflow-style: none;
      &::-webkit-scrollbar { display: none; }
    }
    .fq-filter-btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      white-space: nowrap; padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-full); border: 1px solid var(--border);
      background: white; font-size: .875rem; font-weight: 500;
      color: var(--text-secondary); cursor: pointer; transition: all .2s;
      &:hover { border-color: var(--brand); color: var(--brand); }
    }
    .fq-filter-active {
      background: var(--brand) !important; color: white !important; border-color: var(--brand) !important;
    }
    .fq-filter-count {
      background: rgba(255,255,255,.25); color: inherit;
      font-size: .7rem; font-weight: 700; padding: 1px 6px; border-radius: 999px;
    }
    .fq-filter-active .fq-filter-count { background: rgba(255,255,255,.3); }

    /* Body */
    .fq-body { padding: 48px 0 80px; }
    .fq-group { margin-bottom: var(--space-10); }
    .fq-group-title {
      font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted); margin-bottom: var(--space-4);
      padding-bottom: var(--space-3); border-bottom: 1px solid var(--border);
    }

    /* FAQ items */
    .fq-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .fq-item {
      border: 1px solid var(--border); border-radius: var(--radius-xl);
      overflow: hidden; background: white;
      transition: border-color .2s, box-shadow .2s;
    }
    .fq-item-open { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    .fq-question {
      width: 100%; display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6); gap: var(--space-4);
      background: none; border: none; cursor: pointer; text-align: left;
      font-size: .9375rem; font-weight: 600; color: var(--text-primary); line-height: 1.5;
    }
    .fq-chevron {
      flex-shrink: 0; color: var(--text-muted);
      transition: transform .25s cubic-bezier(0.22,1,0.36,1);
    }
    .fq-chevron-open { transform: rotate(180deg); color: var(--brand); }
    .fq-answer {
      padding: 0 var(--space-6) var(--space-5);
      animation: fadeIn .2s ease both;
    }
    .fq-answer p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    /* CTA section */
    .fq-cta-section { padding: 0 0 80px; }
    .fq-cta-box {
      background: linear-gradient(135deg, var(--gray-50) 0%, white 100%);
      border: 1px solid var(--border); border-radius: var(--radius-2xl);
      padding: var(--space-8) var(--space-8);
      display: flex; align-items: center; gap: var(--space-6); flex-wrap: wrap;
    }
    .fq-cta-icon {
      width: 56px; height: 56px; background: var(--brand-subtle); color: var(--brand);
      border-radius: var(--radius-xl); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .fq-cta-title { font-size: 1.0625rem; font-weight: 700; margin-bottom: 4px; }
    .fq-cta-sub { font-size: .875rem; color: var(--text-muted); }
    .fq-cta-actions { display: flex; gap: var(--space-3); margin-left: auto; flex-wrap: wrap; }
    .fq-cta-btn-primary {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-3) var(--space-6); border-radius: var(--radius-full);
      font-size: .9rem; font-weight: 700;
    }
    .fq-cta-btn-ghost {
      display: inline-flex; align-items: center;
      border: 1px solid var(--border); color: var(--text-secondary); text-decoration: none;
      padding: var(--space-3) var(--space-6); border-radius: var(--radius-full);
      font-size: .9rem; font-weight: 600;
      &:hover { border-color: var(--brand); color: var(--brand); }
    }

    /* Footer */
    .fq-footer { background: var(--gray-50); border-top: 1px solid var(--border); padding: var(--space-6) 0; }
    .fq-footer-inner { max-width: 1100px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .fq-footer-inner span { font-size: .875rem; color: var(--text-muted); }
    .fq-footer-links { display: flex; gap: var(--space-5); }
    .fq-footer-link { font-size: .875rem; color: var(--text-muted); text-decoration: none; &:hover { color: var(--brand); } }
  `],
})
export class FaqComponent {
  readonly categoryKeys = CATEGORY_KEYS
  readonly activeCategory = signal('all')
  readonly openItems = signal<Set<string>>(new Set())

  capitalize(s: string): string {
    if (!s) return s
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  visibleCategories(): string[] {
    const cat = this.activeCategory()
    if (cat === 'all') return CATEGORY_KEYS.filter(c => c !== 'all')
    return [cat]
  }

  itemsByCategory(cat: string): FaqItem[] {
    return FAQS.filter(f => f.category === cat)
  }

  countByCategory(cat: string): number {
    return FAQS.filter(f => f.category === cat).length
  }

  isOpen(key: string): boolean {
    return this.openItems().has(key)
  }

  toggle(key: string): void {
    const next = new Set(this.openItems())
    if (next.has(key)) next.delete(key)
    else next.add(key)
    this.openItems.set(next)
  }
}
