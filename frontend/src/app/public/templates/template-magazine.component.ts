import { Component, Input, Output, EventEmitter, signal, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import type { Restaurant, Category, MenuItem, CartItem } from '../../shared/models'

@Component({
  selector: 'app-template-magazine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-magazine.component.html',
  styles: [`
    :host { display: block; }

    /* ─── Wrap ─────────────────────────────────────── */
    .mag-wrap {
      min-height: 100vh;
      background: #f8f6f2;
      font-family: var(--font-body, 'Inter', sans-serif);
      -webkit-font-smoothing: antialiased;
      color: #1a1612;
    }

    /* ─── Header ────────────────────────────────────── */
    .mag-header {
      display: grid;
      grid-template-columns: 42% 1fr;
      min-height: 380px;
      overflow: hidden;
      background: white;
      box-shadow: 0 1px 0 rgba(26,22,18,.08);
    }
    @media (max-width: 700px) {
      .mag-header { grid-template-columns: 1fr; min-height: auto; }
    }

    .mag-header-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3.5rem 3rem;
      gap: 1rem;
      background: white;
      position: relative;
    }
    .mag-header-info::after {
      content: '';
      position: absolute; top: 0; right: 0; bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, transparent, var(--color-brand) 30%, var(--color-brand) 70%, transparent);
    }
    @media (max-width: 700px) { .mag-header-info::after { display: none; } }
    .mag-logo {
      width: 58px; height: 58px;
      object-fit: cover;
      border-radius: 14px;
      box-shadow: 0 6px 20px rgba(0,0,0,.12);
    }
    .mag-issue {
      font-size: .5875rem;
      font-weight: 800;
      letter-spacing: .2em;
      text-transform: uppercase;
      color: var(--color-brand);
    }
    .mag-restaurant-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(2rem, 4vw, 3.5rem);
      font-weight: 400;
      line-height: 1.06;
      color: #1a1612;
      margin: 0;
      letter-spacing: -.02em;
    }
    .mag-slogan {
      font-size: .9375rem;
      color: rgba(26,22,18,.45);
      font-style: italic;
      margin: 0;
    }

    .mag-cover-wrap {
      position: relative;
      overflow: hidden;
    }
    .mag-cover-img {
      width: 100%; height: 100%;
      object-fit: cover;
      animation: mag-ken-static 16s ease-in-out infinite alternate;
      will-change: transform;
    }
    @keyframes mag-ken-static { from { transform: scale(1); } to { transform: scale(1.07); } }
    .mag-cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to right, white 0%, rgba(255,255,255,.15) 35%, transparent 60%);
    }
    .mag-cover-placeholder { background: var(--color-brand-subtle, #fef2f0); }
    .mag-cover-pattern {
      width: 100%; height: 100%;
      background-image: repeating-linear-gradient(
        45deg,
        var(--color-brand) 0, var(--color-brand) 1px,
        transparent 0, transparent 50%
      );
      background-size: 14px 14px;
      opacity: .06;
    }

    /* ─── Body layout ───────────────────────────────── */
    .mag-body {
      display: grid;
      grid-template-columns: 160px 1fr;
      max-width: 1340px;
      margin: 0 auto;
      min-height: calc(100vh - 380px);
    }
    @media (max-width: 900px) {
      .mag-body { grid-template-columns: 1fr; }
    }

    /* ─── Sidebar ───────────────────────────────────── */
    .mag-sidebar {
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      padding: 3rem 0 3rem 1.75rem;
      border-right: 1px solid rgba(26,22,18,.07);
      background: #f8f6f2;
      display: flex;
      flex-direction: column;
      gap: .125rem;
      scrollbar-width: none;
    }
    .mag-sidebar::-webkit-scrollbar { display: none; }
    @media (max-width: 900px) { .mag-sidebar { display: none; } }

    .mag-sidebar-label {
      font-size: .5375rem;
      font-weight: 800;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: rgba(26,22,18,.3);
      margin-bottom: 1.25rem;
      padding-left: .25rem;
    }
    .mag-idx-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: .5625rem .5rem .5625rem .375rem;
      background: none;
      border: none;
      border-left: 2px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: border-color .25s, background .25s;
      border-radius: 0 8px 8px 0;
    }
    .mag-idx-btn:hover { background: white; }
    .mag-idx-active { border-left-color: var(--color-brand) !important; background: white !important; }
    .mag-idx-num {
      font-size: .5625rem;
      font-weight: 800;
      letter-spacing: .12em;
      color: var(--color-brand);
    }
    .mag-idx-name {
      font-size: .75rem;
      font-weight: 500;
      color: rgba(26,22,18,.5);
      line-height: 1.35;
    }
    .mag-idx-active .mag-idx-name { color: #1a1612; font-weight: 700; }

    /* ─── Main content ──────────────────────────────── */
    .mag-main { padding: 3.5rem 3rem; }
    @media (max-width: 700px) { .mag-main { padding: 2rem 1.25rem; } }

    /* ─── Skeleton ──────────────────────────────────── */
    .mag-skeleton-wrap { display: flex; flex-direction: column; gap: 2.5rem; }
    .mag-skeleton-hero {
      height: 280px; border-radius: 20px;
      background: linear-gradient(90deg, #ede9e3 25%, #e3dfd8 50%, #ede9e3 75%);
      background-size: 400% 100%;
      animation: mag-shimmer 1.4s infinite;
    }
    .mag-skeleton-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1.125rem; }
    .mag-skeleton-card {
      height: 210px; border-radius: 16px;
      background: linear-gradient(90deg, #ede9e3 25%, #e3dfd8 50%, #ede9e3 75%);
      background-size: 400% 100%;
      animation: mag-shimmer 1.4s infinite;
    }
    @keyframes mag-shimmer { to { background-position: -400% 0; } }

    /* ─── Section ───────────────────────────────────── */
    .mag-section { margin-bottom: 6rem; }

    .mag-section-head {
      margin-bottom: 2.25rem;
      padding-bottom: 1.5rem;
      position: relative;
    }
    .mag-section-head::after {
      content: '';
      position: absolute; bottom: 0; left: 0;
      height: 1px;
      background: linear-gradient(to right, var(--color-brand) 48px, rgba(26,22,18,.08) 48px);
      width: 100%;
    }
    .mag-chapter {
      font-size: .5625rem;
      font-weight: 800;
      letter-spacing: .22em;
      text-transform: uppercase;
      color: var(--color-brand);
      display: block;
      margin-bottom: .625rem;
    }
    .mag-section-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.875rem, 3.5vw, 2.75rem);
      font-weight: 400;
      color: #1a1612;
      margin: 0 0 .5rem;
      line-height: 1.1;
      letter-spacing: -.02em;
    }
    .mag-section-quote {
      font-style: italic;
      font-size: .9375rem;
      color: rgba(26,22,18,.42);
      margin: .375rem 0 0;
    }
    .mag-section-rule { display: none; }

    /* ─── Reveal animation ──────────────────────────── */
    .mag-reveal {
      opacity: 0;
      transform: translateY(22px);
      transition: opacity .7s cubic-bezier(0.16,1,0.3,1), transform .7s cubic-bezier(0.16,1,0.3,1);
    }
    .mag-reveal.mag-visible { opacity: 1; transform: translateY(0); }
    .mag-reveal[data-delay="1"] { transition-delay: .08s; }
    .mag-reveal[data-delay="2"] { transition-delay: .16s; }
    @media (max-width: 768px) { .mag-reveal { opacity: 1; transform: none; transition: none; } }

    /* ─── Hero card ─────────────────────────────────── */
    .mag-hero-card {
      display: grid;
      grid-template-columns: 44% 1fr;
      min-height: 300px;
      border-radius: 22px;
      overflow: hidden;
      background: white;
      border: 1px solid rgba(26,22,18,.07);
      box-shadow: 0 2px 16px rgba(26,22,18,.06);
      cursor: pointer;
      transition: box-shadow .35s cubic-bezier(0.16,1,0.3,1),
                  transform .35s cubic-bezier(0.16,1,0.3,1),
                  border-color .35s;
      margin-bottom: 1.5rem;
    }
    .mag-hero-card:hover {
      box-shadow: 0 16px 48px rgba(26,22,18,.13);
      transform: translateY(-4px);
      border-color: rgba(26,22,18,.12);
    }
    @media (max-width: 700px) { .mag-hero-card { grid-template-columns: 1fr; } }

    .mag-hero-photo-wrap {
      position: relative;
      overflow: hidden;
      background: var(--color-brand-subtle, #fef2f0);
    }
    .mag-hero-photo {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
    }
    .mag-ken-burns { animation: mag-ken-burns 12s ease-in-out infinite alternate; }
    @keyframes mag-ken-burns {
      from { transform: scale(1); }
      to   { transform: scale(1.07) translateX(-1.5%); }
    }
    .mag-hero-photo-blank {
      display: flex; align-items: center; justify-content: center;
      height: 100%; min-height: 200px;
      font-size: 3rem; background: var(--color-brand-subtle, #fef2f0);
    }

    .mag-hero-body {
      position: relative;
      padding: 2.5rem 2.25rem;
      display: flex; flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .mag-dish-num-bg {
      position: absolute;
      top: -16px; right: -8px;
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 9rem; font-weight: 700;
      color: #1a1612; opacity: .03;
      line-height: 1; pointer-events: none; user-select: none;
    }
    .mag-hero-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.375rem, 2.5vw, 1.875rem);
      font-weight: 400;
      color: #1a1612;
      margin: 0 0 .75rem;
      line-height: 1.18;
      position: relative; letter-spacing: -.01em;
    }
    .mag-hero-desc {
      font-size: .9375rem;
      color: rgba(26,22,18,.5);
      line-height: 1.68; margin: 0 0 1.5rem; flex: 1;
    }
    .mag-hero-foot {
      display: flex; align-items: center;
      justify-content: space-between; gap: 1rem; flex-wrap: wrap;
    }
    .mag-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; font-weight: 400;
      color: var(--color-brand);
    }

    /* ─── Badge ─────────────────────────────────────── */
    .mag-badge {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 9px; border-radius: 999px;
      font-size: .5625rem; font-weight: 800;
      letter-spacing: .1em; text-transform: uppercase; color: white;
    }
    .mag-badge-popular    { background: #e67e22; }
    .mag-badge-new        { background: var(--color-brand); }
    .mag-badge-vegetarian { background: #27ae60; }
    .mag-badge-spicy      { background: #c0392b; }

    /* ─── Cart controls ─────────────────────────────── */
    .mag-qty { display: flex; align-items: center; gap: .5rem; }
    .mag-qty-btn {
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid var(--color-brand);
      background: white; color: var(--color-brand);
      font-size: 1.125rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .mag-qty-btn:hover { background: var(--color-brand); color: white; }
    .mag-qty-val { font-weight: 700; font-size: 1rem; min-width: 20px; text-align: center; color: #1a1612; }
    .mag-add-btn {
      padding: .4375rem 1.125rem;
      background: var(--color-brand); color: white;
      border: none; border-radius: 999px;
      font-size: .8125rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      transition: opacity .15s, transform .15s;
    }
    .mag-add-btn:hover { opacity: .88; transform: translateY(-1px); }

    /* ─── Grid ──────────────────────────────────────── */
    .mag-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.125rem;
    }
    @media (max-width: 900px) { .mag-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .mag-grid { grid-template-columns: 1fr; } }

    .mag-card {
      background: white; border-radius: 18px;
      border: 1px solid rgba(26,22,18,.07);
      overflow: hidden;
      box-shadow: 0 1px 8px rgba(26,22,18,.05);
      cursor: pointer;
      transition: box-shadow .3s cubic-bezier(0.16,1,0.3,1),
                  transform .3s cubic-bezier(0.16,1,0.3,1),
                  border-color .3s;
      display: flex; flex-direction: column;
    }
    .mag-card:hover {
      box-shadow: 0 12px 36px rgba(26,22,18,.12);
      transform: translateY(-4px);
      border-color: rgba(26,22,18,.12);
    }

    .mag-card-photo-wrap {
      position: relative; height: 178px;
      overflow: hidden;
      background: var(--color-brand-subtle, #fef2f0);
    }
    .mag-card-num-bg {
      position: absolute; bottom: 4px; right: 8px;
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 3.5rem; font-weight: 700;
      color: white; opacity: .18; line-height: 1;
      pointer-events: none; user-select: none;
    }
    .mag-card-photo {
      width: 100%; height: 100%; object-fit: cover;
      transition: transform .6s cubic-bezier(0.16,1,0.3,1);
    }
    .mag-card:hover .mag-card-photo { transform: scale(1.06); }
    .mag-card-photo-blank {
      display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 2.5rem; opacity: .35;
    }
    .mag-card-badge {
      position: absolute; top: 8px; left: 8px;
      padding: 2px 7px; border-radius: 999px;
      font-size: .5625rem; font-weight: 800;
      letter-spacing: .08em; text-transform: uppercase; color: white;
    }

    .mag-card-body {
      padding: 1.125rem 1.25rem; flex: 1;
      display: flex; flex-direction: column; justify-content: space-between;
      gap: .5rem;
    }
    .mag-card-name {
      font-size: .9375rem; font-weight: 700;
      color: #1a1612; margin: 0; line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .mag-card-foot { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .mag-card-price { font-weight: 700; font-size: .9375rem; color: var(--color-brand); }
    .mag-qty-sm { display: flex; align-items: center; gap: 4px; }
    .mag-qty-btn-sm {
      width: 24px; height: 24px; border-radius: 50%;
      border: 1.5px solid var(--color-brand); background: white;
      color: var(--color-brand); font-size: .875rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .mag-qty-btn-sm:hover { background: var(--color-brand); color: white; }
    .mag-qty-val-sm { font-size: .875rem; font-weight: 700; min-width: 16px; text-align: center; color: #1a1612; }
    .mag-add-btn-sm {
      width: 28px; height: 28px; border-radius: 50%;
      background: var(--color-brand); color: white;
      border: none; font-size: 1.125rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity .15s, transform .15s;
    }
    .mag-add-btn-sm:hover { opacity: .85; transform: scale(1.1); }

    /* ─── Footer ────────────────────────────────────── */
    .mag-footer {
      display: flex; align-items: center; gap: 1rem;
      padding: 2.5rem 0;
      border-top: 1px solid rgba(26,22,18,.08);
      margin-top: 2rem; flex-wrap: wrap;
    }
    .mag-foot-logo { width: 38px; height: 38px; border-radius: 9px; object-fit: cover; }
    .mag-foot-name { font-weight: 700; font-size: .9375rem; color: #1a1612; }
    .mag-foot-info { font-size: .875rem; color: rgba(26,22,18,.45); text-decoration: none; }
    a.mag-foot-info:hover { color: var(--color-brand); }

    /* ─── Modal ─────────────────────────────────────── */
    .mag-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(26,22,18,.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      z-index: 500;
      display: flex; align-items: flex-end; justify-content: center;
      animation: mag-fade-in .22s ease;
    }
    @keyframes mag-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @media (min-width: 600px) { .mag-modal-backdrop { align-items: center; } }
    .mag-modal {
      background: white; border-radius: 24px 24px 0 0;
      width: 100%; max-width: 520px;
      max-height: 86vh; overflow-y: auto;
      position: relative; scrollbar-width: none;
      animation: mag-slide-up .32s cubic-bezier(0.16,1,0.3,1);
      box-shadow: 0 -4px 48px rgba(26,22,18,.15);
    }
    .mag-modal::-webkit-scrollbar { display: none; }
    @keyframes mag-slide-up {
      from { transform: translateY(50px) scale(.98); opacity: 0; }
      to   { transform: translateY(0) scale(1); opacity: 1; }
    }
    @media (min-width: 600px) {
      .mag-modal { border-radius: 24px; box-shadow: 0 24px 80px rgba(26,22,18,.2); }
    }
    .mag-modal-close {
      position: absolute; top: 1rem; right: 1rem; z-index: 1;
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: rgba(26,22,18,.07);
      cursor: pointer; font-size: .875rem;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .mag-modal-close:hover { background: rgba(26,22,18,.13); }
    .mag-modal-photo {
      width: 100%; height: 230px; object-fit: cover;
      display: block; border-radius: 24px 24px 0 0;
    }
    .mag-modal-body { padding: 1.625rem; }
    .mag-modal-badge { position: static; display: inline-flex; margin-bottom: .875rem; }
    .mag-modal-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; font-weight: 400;
      color: #1a1612; margin: 0 0 .75rem; letter-spacing: -.015em;
    }
    .mag-modal-desc { font-size: .9375rem; color: rgba(26,22,18,.5); line-height: 1.68; margin: 0 0 1.5rem; }
    .mag-modal-foot {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding-top: 1.125rem;
      border-top: 1px solid rgba(26,22,18,.08);
    }
    .mag-modal-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; color: var(--color-brand);
    }

    /* ── Sidebar hours ─────────────────────────────────── */
    .mag-sidebar-hours {
      margin-top: auto; padding: .875rem .5rem 1.25rem;
      border-top: 1px solid rgba(26,22,18,.08);
    }
    .mag-sh-header {
      font-size: .5rem; font-weight: 800; color: rgba(26,22,18,.3);
      letter-spacing: .14em; text-transform: uppercase;
      padding: 0 .25rem; margin-bottom: .5rem;
    }
    .mag-sh-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: .225rem .3rem; border-radius: 4px;
      transition: background .15s;
    }
    .mag-sh-day {
      font-size: .5625rem; font-weight: 700; color: rgba(26,22,18,.38);
      letter-spacing: .06em; text-transform: uppercase;
    }
    .mag-sh-time { font-size: .5625rem; color: rgba(26,22,18,.48); }
    .mag-sh-today { background: color-mix(in srgb, var(--color-brand) 8%, transparent); }
    .mag-sh-today .mag-sh-day { color: var(--color-brand); }
    .mag-sh-today .mag-sh-time { color: var(--color-brand); font-weight: 700; }
    .mag-sh-closed .mag-sh-time { color: rgba(26,22,18,.22); font-style: italic; }
  `],
})
export class TemplateMagazineComponent implements AfterViewInit, OnDestroy {
  @Input() restaurant: Restaurant | null = null
  @Input() categories: Category[] = []
  @Input() cart: CartItem[] = []
  @Input() hasOrders = false
  @Input() loading = false

  @Output() addToCart = new EventEmitter<MenuItem>()
  @Output() removeFromCart = new EventEmitter<number>()
  @Output() openCart = new EventEmitter<void>()

  readonly activeCatId = signal<number | null>(null)
  readonly selectedDish = signal<MenuItem | null>(null)

  private readonly platformId = inject(PLATFORM_ID)
  private observer?: IntersectionObserver
  private revealObserver?: IntersectionObserver

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    setTimeout(() => {
      this.setupCategoryObserver()
      this.setupRevealObserver()
    }, 300)
  }

  ngOnDestroy(): void {
    this.observer?.disconnect()
    this.revealObserver?.disconnect()
  }

  private setupCategoryObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) {
          const id = Number(visible.target.id.replace('mag-', ''))
          if (!isNaN(id)) this.activeCatId.set(id)
        }
      },
      { threshold: 0.2, rootMargin: '-80px 0px -60% 0px' }
    )
    document.querySelectorAll('.mag-section').forEach((el) => this.observer!.observe(el))
  }

  private setupRevealObserver(): void {
    this.revealObserver = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('mag-visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.mag-reveal').forEach((el) => this.revealObserver!.observe(el))
  }

  scrollTo(catId: number): void {
    document.getElementById(`mag-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    this.activeCatId.set(catId)
  }

  openDish(item: MenuItem): void {
    this.selectedDish.set(item)
  }

  qty(id: number): number {
    return this.cart.find((ci) => ci.menuItem.id === id)?.quantity ?? 0
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0')
  }

  fmt(item: MenuItem): string {
    if (item.priceFormatted) return item.priceFormatted
    const currency = this.restaurant?.currency ?? 'EUR'
    try {
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(item.price)
    } catch {
      return `${item.price} ${currency}`
    }
  }

  private readonly _dayOrder = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  private readonly _dayShort: Record<string,string> = {
    monday:'LUN', tuesday:'MAR', wednesday:'MER', thursday:'JEU',
    friday:'VEN', saturday:'SAM', sunday:'DIM',
  }

  hoursEntries(): { day: string; label: string; open: string; close: string; closed: boolean; isToday: boolean }[] {
    const hours = this.restaurant?.openingHours
    if (!hours) return []
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    return this._dayOrder.map((day, i) => {
      const h = hours[day]
      return { day, label: this._dayShort[day], open: h?.open ?? '', close: h?.close ?? '', closed: h?.closed ?? !h, isToday: i === todayIdx }
    })
  }
}
