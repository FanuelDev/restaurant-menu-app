// frontend/src/app/public/templates/template-bento.component.ts
// Template 5 — "Lumière" Bento Grid
import {
  Component, Input, Output, EventEmitter, signal,
  AfterViewInit, OnDestroy, PLATFORM_ID, inject,
} from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import type { Restaurant, Category, MenuItem, CartItem } from '../../shared/models'

@Component({
  selector: 'app-template-bento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-bento.component.html',
  styles: [`
    :host { display: block; }

    /* ── Root ───────────────────────────────────────────── */
    .lum-root {
      min-height: 100vh;
      background: #faf9f5;
      font-family: var(--font-body, 'Inter', sans-serif);
      -webkit-font-smoothing: antialiased;
      color: #1a1814;
    }

    /* ── Hero ───────────────────────────────────────────── */
    .lum-hero {
      position: relative;
      padding: 3.5rem 2.5rem 2.5rem;
      overflow: hidden;
      background: #1a1814;
    }
    @media (max-width: 680px) { .lum-hero { padding: 2.5rem 1.25rem 2rem; } }
    .lum-hero-mesh {
      position: absolute; inset: 0;
      background:
        radial-gradient(ellipse at 15% 50%, var(--color-brand-subtle, rgba(192,57,43,.12)) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 20%, rgba(255,255,255,.04) 0%, transparent 50%);
      animation: lum-mesh 12s ease-in-out infinite alternate;
    }
    @keyframes lum-mesh {
      0%   { opacity: .7; transform: scale(1); }
      100% { opacity: 1; transform: scale(1.04); }
    }
    .lum-hero-cover {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      opacity: .18;
      animation: lum-ken 20s ease-in-out infinite alternate;
    }
    @keyframes lum-ken { from { transform: scale(1); } to { transform: scale(1.06); } }
    .lum-hero-cover-mask {
      position: absolute; inset: 0;
      background: linear-gradient(to right, #1a1814 30%, transparent 70%);
    }
    .lum-hero-inner {
      position: relative; z-index: 2;
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1.5rem; max-width: 1440px; margin: 0 auto;
    }
    .lum-hero-logo-row { display: flex; align-items: center; gap: 1.25rem; }
    .lum-hero-logo {
      width: 56px; height: 56px; object-fit: cover;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.1);
      flex-shrink: 0;
    }
    @media (max-width: 480px) { .lum-hero-logo { width: 44px; height: 44px; border-radius: 10px; } }
    .lum-hero-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.75rem, 5vw, 3rem);
      font-weight: 400; color: white;
      margin: 0; letter-spacing: -.02em; line-height: 1.1;
    }
    .lum-hero-slogan {
      font-size: .9375rem; color: rgba(255,255,255,.45);
      font-style: italic; margin: .375rem 0 0;
    }
    .lum-hero-cart {
      display: flex; align-items: center; justify-content: center;
      width: 44px; height: 44px; flex-shrink: 0;
      border-radius: 12px;
      background: rgba(255,255,255,.1);
      border: 1px solid rgba(255,255,255,.15);
      color: white; cursor: pointer; position: relative;
      transition: background .2s;
    }
    .lum-hero-cart:hover { background: rgba(255,255,255,.18); }
    .lum-cart-badge {
      position: absolute; top: -6px; right: -6px;
      min-width: 18px; height: 18px;
      background: var(--color-brand); border-radius: 999px;
      font-size: .625rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      color: white; padding: 0 4px;
      border: 2px solid #1a1814;
    }

    /* ── Nav ────────────────────────────────────────────── */
    .lum-nav-wrap {
      position: sticky; top: 0; z-index: 90;
      background: #faf9f5;
      border-bottom: 1px solid rgba(26,24,20,.08);
      transition: box-shadow .3s;
    }
    .lum-nav-pinned { box-shadow: 0 4px 24px rgba(26,24,20,.08); }
    .lum-nav {
      display: flex; align-items: center; gap: .375rem;
      padding: .875rem 2.5rem;
      overflow-x: auto; scrollbar-width: none;
      max-width: 1440px; margin: 0 auto;
    }
    .lum-nav::-webkit-scrollbar { display: none; }
    @media (max-width: 680px) { .lum-nav { padding: .75rem 1.25rem; } }
    .lum-tab {
      flex-shrink: 0;
      padding: .4375rem 1.0625rem;
      background: none; border: 1.5px solid rgba(26,24,20,.1);
      border-radius: 999px; font-size: .8125rem; font-weight: 600;
      color: rgba(26,24,20,.5); cursor: pointer;
      transition: all .2s cubic-bezier(0.34,1.56,0.64,1);
      white-space: nowrap;
    }
    .lum-tab:hover { border-color: rgba(26,24,20,.25); color: rgba(26,24,20,.75); }
    .lum-tab-active {
      background: var(--color-brand) !important;
      border-color: var(--color-brand) !important;
      color: white !important;
      transform: scale(1.04);
    }

    /* ── Content ────────────────────────────────────────── */
    .lum-content {
      max-width: 1440px; margin: 0 auto;
      padding: 4rem 2.5rem 6rem;
    }
    @media (max-width: 680px) { .lum-content { padding: 2.5rem 1.25rem 4rem; } }

    /* ── Loading ────────────────────────────────────────── */
    .lum-loading {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1.25rem; min-height: 300px;
      color: rgba(26,24,20,.35); font-size: .9375rem;
    }
    .lum-spinner {
      width: 36px; height: 36px;
      border: 2px solid rgba(26,24,20,.1);
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: lum-spin .75s linear infinite;
    }
    @keyframes lum-spin { to { transform: rotate(360deg); } }

    /* ── Section ────────────────────────────────────────── */
    .lum-section { margin-bottom: 5.5rem; }

    .lum-sec-hd {
      display: flex; align-items: baseline; gap: 1rem;
      margin-bottom: 2rem;
    }
    .lum-sec-label {
      font-size: .625rem; font-weight: 800;
      letter-spacing: .18em; text-transform: uppercase;
      color: var(--color-brand); flex-shrink: 0;
    }
    .lum-sec-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.625rem, 3vw, 2.25rem);
      font-weight: 400; color: #1a1814;
      margin: 0; letter-spacing: -.02em;
    }
    .lum-sec-desc {
      font-size: .9rem; color: rgba(26,24,20,.45);
      font-style: italic; margin: 0; flex: 1; text-align: right;
    }
    @media (max-width: 580px) { .lum-sec-desc { display: none; } }

    /* ── Appear animation ───────────────────────────────── */
    .lum-appear {
      opacity: 0; transform: translateY(22px);
      transition: opacity .65s cubic-bezier(0.16,1,0.3,1),
                  transform .65s cubic-bezier(0.16,1,0.3,1);
    }
    .lum-appear.lum-in { opacity: 1; transform: translateY(0); }
    .lum-appear[data-d="1"] { transition-delay: .07s; }
    .lum-appear[data-d="2"] { transition-delay: .14s; }
    @media (max-width: 768px) { .lum-appear { opacity: 1; transform: none; transition: none; } }

    /* ── Bento Grid ─────────────────────────────────────── */
    .lum-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.125rem;
    }
    @media (max-width: 1100px) { .lum-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 580px)  { .lum-grid { grid-template-columns: 1fr; } }

    /* ── Cell ───────────────────────────────────────────── */
    .lum-cell {
      background: white;
      border-radius: 20px;
      border: 1px solid rgba(26,24,20,.07);
      overflow: hidden; cursor: pointer;
      display: flex; flex-direction: column;
      transition: transform .3s cubic-bezier(0.16,1,0.3,1),
                  box-shadow .3s cubic-bezier(0.16,1,0.3,1);
      box-shadow: 0 2px 10px rgba(26,24,20,.05);
    }
    .lum-cell:hover {
      transform: translateY(-5px);
      box-shadow: 0 16px 48px rgba(26,24,20,.12);
    }

    /* Hero cell */
    .lum-cell-hero {
      grid-column: span 2;
      display: grid;
      grid-template-columns: 52% 1fr;
    }
    @media (max-width: 1100px) { .lum-cell-hero { grid-column: span 2; } }
    @media (max-width: 580px)  { .lum-cell-hero { grid-column: span 1; grid-template-columns: 1fr; } }

    /* Image wrapper */
    .lum-cell-img-wrap {
      position: relative; overflow: hidden;
      background: var(--color-brand-subtle, #fef2f0);
      height: 240px;
    }
    .lum-cell-img-sm { height: 190px; }
    .lum-cell-hero .lum-cell-img-wrap { height: 100%; }
    @media (max-width: 580px) { .lum-cell-hero .lum-cell-img-wrap { height: 220px; } }

    .lum-cell-img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform .55s cubic-bezier(0.16,1,0.3,1);
    }
    .lum-cell:hover .lum-cell-img { transform: scale(1.05); }

    .lum-cell-blank {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      font-size: 3rem; opacity: .3;
    }
    .lum-cell-blank-sm { font-size: 2rem; }

    /* Badge */
    .lum-badge {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 9px; border-radius: 999px;
      font-size: .5625rem; font-weight: 800;
      letter-spacing: .08em; text-transform: uppercase; color: white;
    }
    .lum-badge-inline { position: static; display: inline-flex; }
    .lum-badge-popular    { background: #e67e22; }
    .lum-badge-new        { background: var(--color-brand); }
    .lum-badge-vegetarian { background: #27ae60; }
    .lum-badge-spicy      { background: #c0392b; }

    /* Cell body */
    .lum-cell-body {
      padding: 1.5rem;
      display: flex; flex-direction: column;
      justify-content: space-between; gap: .75rem; flex: 1;
    }
    .lum-cell-body-sm { padding: 1.125rem; gap: .5rem; }

    .lum-cell-top { flex: 1; }
    .lum-cell-name {
      font-size: .9375rem; font-weight: 700;
      color: #1a1814; margin: 0; line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .lum-cell-name-lg {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.375rem; font-weight: 400;
      letter-spacing: -.01em; line-height: 1.2;
    }
    .lum-cell-desc {
      font-size: .875rem; color: rgba(26,24,20,.45);
      line-height: 1.6; margin: .5rem 0 0;
      display: -webkit-box;
      -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .lum-cell-foot {
      display: flex; align-items: center;
      justify-content: space-between; gap: .75rem;
      flex-wrap: wrap;
    }
    .lum-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.375rem; font-weight: 400;
      color: var(--color-brand);
    }
    .lum-sm-price {
      font-size: .9375rem; font-weight: 700;
      color: var(--color-brand);
    }

    /* Cart controls */
    .lum-qty-row { display: flex; align-items: center; gap: .4375rem; }
    .lum-qty-btn {
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid var(--color-brand);
      background: white; color: var(--color-brand);
      font-size: 1.0625rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .lum-qty-btn:hover { background: var(--color-brand); color: white; }
    .lum-qty-btn-xs { width: 24px; height: 24px; font-size: .875rem; }
    .lum-qty-val { font-size: .9375rem; font-weight: 700; color: #1a1814; min-width: 18px; text-align: center; }
    .lum-qty-val-xs { font-size: .8125rem; }
    .lum-add-btn {
      padding: .4375rem 1rem;
      border-radius: 999px;
      border: none; background: var(--color-brand);
      color: white; font-size: .8125rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      transition: opacity .2s, transform .15s;
    }
    .lum-add-btn:hover { opacity: .88; transform: translateY(-1px); }
    .lum-added { background: #27ae60 !important; animation: lum-pop .3s cubic-bezier(0.34,1.56,0.64,1); }
    @keyframes lum-pop { from { transform: scale(.88); } to { transform: scale(1); } }
    .lum-add-xs {
      width: 28px; height: 28px; border-radius: 50%;
      border: none; background: var(--color-brand);
      color: white; font-size: 1.0625rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity .15s, transform .15s;
    }
    .lum-add-xs:hover { opacity: .85; transform: scale(1.1); }

    /* ── Hours band ─────────────────────────────────────── */
    .lum-hours-band {
      background: white;
      border-bottom: 1px solid rgba(26,24,20,.08);
      box-shadow: 0 1px 0 rgba(26,24,20,.04);
    }
    .lum-hours-inner {
      display: flex; justify-content: center; flex-wrap: wrap;
      max-width: 900px; margin: 0 auto;
    }
    .lum-hday {
      display: flex; flex-direction: column; align-items: center;
      padding: .875rem 1.125rem;
      border-right: 1px solid rgba(26,24,20,.07);
      flex: 1; min-width: 72px;
      transition: background .15s;
    }
    .lum-hday:last-child { border-right: none; }
    .lum-hday-lbl {
      font-size: .5rem; font-weight: 800; color: rgba(26,24,20,.32);
      text-transform: uppercase; letter-spacing: .12em; margin-bottom: 4px;
    }
    .lum-hday-time {
      font-size: .8125rem; color: rgba(26,24,20,.6); font-weight: 500;
      letter-spacing: .01em;
    }
    .lum-hday-today { background: color-mix(in srgb, var(--color-brand) 6%, transparent); }
    .lum-hday-today .lum-hday-lbl { color: var(--color-brand); }
    .lum-hday-today .lum-hday-time { color: #1a1814; font-weight: 700; }
    .lum-hday-closed .lum-hday-time { color: rgba(26,24,20,.25); font-style: italic; }
    @media (max-width: 600px) {
      .lum-hday { padding: .625rem .5rem; min-width: 52px; }
      .lum-hday-time { font-size: .75rem; }
    }

    /* ── Footer ─────────────────────────────────────────── */
    .lum-footer {
      display: flex; flex-wrap: wrap; align-items: center;
      gap: 1rem; padding: 2.5rem 2.5rem;
      border-top: 1px solid rgba(26,24,20,.08);
      max-width: 1440px; margin: 0 auto;
    }
    @media (max-width: 680px) { .lum-footer { padding: 2rem 1.25rem; } }
    .lum-foot-logo { width: 36px; height: 36px; border-radius: 9px; object-fit: cover; }
    .lum-foot-name { font-weight: 700; font-size: .9375rem; color: #1a1814; }
    .lum-foot-info { font-size: .875rem; color: rgba(26,24,20,.45); text-decoration: none; }
    a.lum-foot-info:hover { color: var(--color-brand); }

    /* ── Modal ──────────────────────────────────────────── */
    .lum-modal-bd {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(26,24,20,.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 1.5rem;
      animation: lum-bd-in .2s ease;
    }
    @keyframes lum-bd-in { from { opacity: 0; } to { opacity: 1; } }
    @media (max-width: 600px) {
      .lum-modal-bd { align-items: flex-end; padding: 0; }
    }
    .lum-modal {
      background: white;
      border-radius: 24px;
      width: 100%; max-width: 480px;
      max-height: 88vh; overflow-y: auto;
      position: relative; scrollbar-width: none;
      animation: lum-modal-in .3s cubic-bezier(0.16,1,0.3,1);
      box-shadow: 0 40px 80px rgba(26,24,20,.25);
    }
    .lum-modal::-webkit-scrollbar { display: none; }
    @keyframes lum-modal-in {
      from { transform: scale(.95) translateY(12px); opacity: 0; }
      to   { transform: scale(1)  translateY(0);    opacity: 1; }
    }
    @media (max-width: 600px) {
      .lum-modal { border-radius: 24px 24px 0 0; max-width: none; }
    }
    .lum-modal-close {
      position: absolute; top: 1rem; right: 1rem; z-index: 2;
      width: 32px; height: 32px; border-radius: 50%;
      background: rgba(26,24,20,.07); border: none;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: #1a1814;
      transition: background .15s;
    }
    .lum-modal-close:hover { background: rgba(26,24,20,.12); }
    .lum-modal-img-wrap { height: 220px; overflow: hidden; border-radius: 24px 24px 0 0; }
    .lum-modal-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lum-modal-body { padding: 1.5rem 1.5rem 2rem; }
    .lum-modal-body-no-img { padding-top: 3.5rem; }
    .lum-modal-meta {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: .875rem;
    }
    .lum-modal-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.625rem; color: var(--color-brand);
    }
    .lum-modal-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; font-weight: 400;
      color: #1a1814; margin: 0 0 .75rem; letter-spacing: -.015em;
    }
    .lum-modal-desc {
      font-size: .9375rem; color: rgba(26,24,20,.55);
      line-height: 1.7; margin: 0 0 1.75rem;
    }
    .lum-modal-actions {}
    .lum-modal-qty-row {
      display: flex; align-items: center; justify-content: center; gap: 1.5rem;
      padding: 1rem;
      background: #faf9f5; border-radius: 14px;
    }
    .lum-qty-lg {
      width: 44px; height: 44px; border-radius: 50%;
      border: 1.5px solid var(--color-brand);
      background: white; color: var(--color-brand);
      font-size: 1.25rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .lum-qty-lg:hover { background: var(--color-brand); color: white; }
    .lum-qty-lg-val { font-size: 1.5rem; font-weight: 700; color: #1a1814; min-width: 32px; text-align: center; }
    .lum-modal-cta {
      width: 100%; padding: 1rem;
      border-radius: 14px; border: none;
      background: var(--color-brand); color: white;
      font-size: .9375rem; font-weight: 700;
      cursor: pointer; letter-spacing: -.01em;
      transition: opacity .2s, transform .15s;
    }
    .lum-modal-cta:hover { opacity: .9; transform: translateY(-1px); }
  `],
})
export class TemplateBentoComponent implements AfterViewInit, OnDestroy {
  @Input() restaurant: Restaurant | null = null
  @Input() categories: Category[] = []
  @Input() cart: CartItem[] = []
  @Input() cartCount = 0
  @Input() hasOrders = false
  @Input() loading = false

  @Output() addToCart      = new EventEmitter<MenuItem>()
  @Output() removeFromCart = new EventEmitter<number>()
  @Output() openCart       = new EventEmitter<void>()

  private readonly platformId = inject(PLATFORM_ID)

  readonly activeCatId = signal<number>(0)
  readonly modalItem   = signal<MenuItem | null>(null)
  readonly addedId     = signal<number | null>(null)
  readonly navPinned   = signal(false)

  private observers: IntersectionObserver[] = []
  private scrollHandler = () => {
    const nav = document.querySelector('.lum-nav-wrap')
    if (nav) this.navPinned.set(window.scrollY > (nav as HTMLElement).offsetTop - 1)
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    window.addEventListener('scroll', this.scrollHandler, { passive: true })
    setTimeout(() => {
      this.setupCatObserver()
      this.setupAppearObserver()
    }, 120)
  }

  ngOnDestroy(): void {
    this.observers.forEach(o => o.disconnect())
    window.removeEventListener('scroll', this.scrollHandler)
  }

  private setupCatObserver(): void {
    const o = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const id = Number((e.target as HTMLElement).id.replace('lum-', ''))
            if (id) this.activeCatId.set(id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    document.querySelectorAll('[id^="lum-"]').forEach(el => o.observe(el))
    this.observers.push(o)
  }

  private setupAppearObserver(): void {
    const o = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('lum-in')
            o.unobserve(e.target)
          }
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -30px 0px' }
    )
    document.querySelectorAll('.lum-appear').forEach(el => o.observe(el))
    this.observers.push(o)
  }

  scrollTo(catId: number): void {
    document.getElementById(`lum-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  openModal(item: MenuItem): void  { this.modalItem.set(item) }
  closeModal(): void               { this.modalItem.set(null) }

  onAdd(item: MenuItem): void {
    this.addToCart.emit(item)
    this.addedId.set(item.id)
    setTimeout(() => this.addedId.set(null), 1400)
  }

  qty(id: number): number {
    return this.cart.find(c => c.menuItem.id === id)?.quantity ?? 0
  }

  fmt(item: MenuItem): string {
    if (item.priceFormatted) return item.priceFormatted
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency', currency: this.restaurant?.currency ?? 'EUR', minimumFractionDigits: 0,
      }).format(item.price)
    } catch { return `${item.price}` }
  }

  pad(n: number): string { return n.toString().padStart(2, '0') }

  badgeLabel(badge: string): string {
    const m: Record<string, string> = {
      popular: 'Populaire', new: 'Nouveau',
      vegetarian: 'Végétarien', spicy: 'Épicé',
    }
    return m[badge] ?? badge
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
