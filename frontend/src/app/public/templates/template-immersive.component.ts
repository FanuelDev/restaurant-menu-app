import {
  Component, Input, Output, EventEmitter, signal, computed,
  AfterViewInit, OnDestroy, PLATFORM_ID, inject, ElementRef, ViewChild
} from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import type { Restaurant, Category, MenuItem, CartItem } from '../../shared/models'

interface FlatDish { item: MenuItem; catName: string; catIdx: number; dishIdx: number; total: number }

@Component({
  selector: 'app-template-immersive',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="imm-root">

    <!-- Progress bar -->
    <div class="imm-progress-bar" [style.width.%]="progressPct()"></div>

    <!-- Top bar -->
    <div class="imm-topbar">
      <button class="imm-menu-btn" (click)="drawerOpen.set(!drawerOpen())" type="button" aria-label="Catégories">
        <span class="imm-menu-line"></span>
        <span class="imm-menu-line" style="width:60%"></span>
        <span class="imm-menu-line" style="width:80%"></span>
      </button>
      <span class="imm-topbar-name">{{ restaurant?.name }}</span>
      @if (hasOrders) {
        <button class="imm-cart-btn" (click)="openCart.emit()" type="button">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          @if (cartCount > 0) {
            <span class="imm-cart-badge">{{ cartCount }}</span>
          }
        </button>
      }
    </div>

    <!-- Main swipe track -->
    @if (loading) {
      <div class="imm-loading">
        <div class="imm-spinner"></div>
        <p>Chargement du menu…</p>
      </div>
    } @else if (flatDishes().length === 0) {
      <div class="imm-empty">
        <span>🍽️</span>
        <p>Aucun plat disponible</p>
      </div>
    } @else {
      <div class="imm-track" #track (scroll)="onScroll()" (touchstart)="onTouchStart($event)" (touchend)="onTouchEnd($event)">
        @for (fd of flatDishes(); track fd.item.id) {
          <div class="imm-slide">
            <!-- Background photo -->
            <div class="imm-bg" [style.background-image]="fd.item.imageUrl ? 'url(' + fd.item.imageUrl + ')' : 'none'"
                 [class.imm-bg-placeholder]="!fd.item.imageUrl">
              @if (!fd.item.imageUrl) {
                <div class="imm-bg-emoji">🍽️</div>
              }
            </div>

            <!-- Gradient overlay -->
            <div class="imm-gradient"></div>

            <!-- Position indicator -->
            <div class="imm-position">{{ fd.dishIdx + 1 }} / {{ fd.total }}</div>

            <!-- Bottom overlay -->
            <div class="imm-overlay">
              <div class="imm-category-chip">{{ fd.catName }}</div>
              @if (fd.item.badge) {
                <span class="imm-badge imm-badge-{{ fd.item.badge }}">{{ fd.item.badge }}</span>
              }
              <h2 class="imm-dish-name">{{ fd.item.name }}</h2>
              @if (fd.item.description) {
                <p class="imm-dish-desc">{{ fd.item.description }}</p>
              }
              <div class="imm-overlay-foot">
                <span class="imm-price">{{ fmt(fd.item) }}</span>
                @if (hasOrders) {
                  <div class="imm-qty-row">
                    @if (qty(fd.item.id) > 0) {
                      <button class="imm-qty-btn" (click)="removeFromCart.emit(fd.item.id)" type="button">−</button>
                      <span class="imm-qty-val">{{ qty(fd.item.id) }}</span>
                    }
                    <button
                      class="imm-add-btn"
                      [class.imm-add-success]="addedId() === fd.item.id"
                      (click)="onAdd(fd.item)"
                      type="button"
                    >
                      @if (addedId() === fd.item.id) { ✓ } @else { + Ajouter }
                    </button>
                  </div>
                }
              </div>
            </div>

            <!-- Swipe hint (first slide only) -->
            @if (fd.dishIdx === 0 && fd.catIdx === 0 && showHint()) {
              <div class="imm-swipe-hint">
                <div class="imm-hint-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                </div>
                <span>Swipez pour explorer</span>
              </div>
            }
          </div>
        }
      </div>

      <!-- Navigation arrows (desktop) -->
      <button class="imm-nav imm-nav-up" (click)="navigate(-1)" type="button" aria-label="Précédent"
              [style.opacity]="currentIdx() === 0 ? '0.3' : '1'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 15l-6-6-6 6"/></svg>
      </button>
      <button class="imm-nav imm-nav-down" (click)="navigate(1)" type="button" aria-label="Suivant"
              [style.opacity]="currentIdx() === flatDishes().length - 1 ? '0.3' : '1'">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
      </button>
    }

    <!-- Category drawer backdrop -->
    @if (drawerOpen()) {
      <div class="imm-drawer-backdrop" (click)="drawerOpen.set(false)"></div>
      <aside class="imm-drawer">
        <div class="imm-drawer-header">
          <div class="imm-drawer-logo">
            @if (restaurant?.logoUrl) {
              <img [src]="restaurant!.logoUrl" alt="Logo" class="imm-drawer-logo-img" />
            } @else {
              <span class="imm-drawer-logo-placeholder">🍽️</span>
            }
          </div>
          <div>
            <div class="imm-drawer-rname">{{ restaurant?.name }}</div>
            <div class="imm-drawer-sub">Menu complet</div>
          </div>
          <button class="imm-drawer-close" (click)="drawerOpen.set(false)" type="button">✕</button>
        </div>
        <nav class="imm-drawer-nav">
          @for (cat of categories; track cat.id; let i = $index) {
            <button
              class="imm-drawer-item"
              [class.imm-drawer-active]="isActiveCat(cat.id)"
              (click)="jumpToCategory(cat.id)"
              type="button"
              [style.animation-delay]="(i * 0.04) + 's'"
            >
              @if (cat.menuItems?.[0]?.imageUrl) {
                <img [src]="cat.menuItems![0].imageUrl!" alt="{{ cat.name }}" class="imm-drawer-thumb" />
              } @else {
                <div class="imm-drawer-thumb-blank">🍽️</div>
              }
              <div class="imm-drawer-item-info">
                <span class="imm-drawer-cat-name">{{ cat.name }}</span>
                <span class="imm-drawer-cat-count">{{ cat.menuItems?.length ?? 0 }} plat{{ (cat.menuItems?.length ?? 0) > 1 ? 's' : '' }}</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          }
        </nav>

        @if (hoursEntries().length) {
          <div class="imm-drawer-hours">
            <div class="imm-dh-title">HORAIRES</div>
            @for (e of hoursEntries(); track e.day) {
              <div class="imm-dh-row" [class.imm-dh-today]="e.isToday" [class.imm-dh-closed]="e.closed">
                <span class="imm-dh-day">{{ e.label }}</span>
                <span class="imm-dh-time">{{ e.closed ? 'Fermé' : e.open + '–' + e.close }}</span>
              </div>
            }
          </div>
        }
      </aside>
    }

  </div>
  `,
  styles: [`
    :host { display: block; }

    /* ─── Root ──────────────────────────────────────── */
    .imm-root {
      position: fixed; inset: 0;
      background: #0a0a0a;
      z-index: 10;
      overflow: hidden;
    }

    /* ─── Progress bar ──────────────────────────────── */
    .imm-progress-bar {
      position: absolute;
      top: 0; left: 0;
      height: 2px;
      background: linear-gradient(to right, var(--color-brand-dark, var(--color-brand)), var(--color-brand));
      z-index: 30;
      transition: width .45s cubic-bezier(0.16,1,0.3,1);
      box-shadow: 0 0 10px var(--color-brand);
    }

    /* ─── Top bar ───────────────────────────────────── */
    .imm-topbar {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 56px;
      display: flex; align-items: center;
      padding: 0 1rem;
      gap: 1rem;
      z-index: 25;
      background: linear-gradient(to bottom, rgba(0,0,0,.5) 0%, transparent 100%);
    }
    .imm-menu-btn {
      display: flex; flex-direction: column; gap: 4px;
      padding: .5rem; background: none; border: none;
      cursor: pointer;
    }
    .imm-menu-line {
      display: block; height: 2px; width: 22px;
      background: white; border-radius: 2px;
      transition: opacity .2s;
    }
    .imm-topbar-name {
      flex: 1;
      font-size: .9375rem; font-weight: 700;
      color: white;
      text-align: center;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .imm-cart-btn {
      position: relative;
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 50%;
      color: white; cursor: pointer;
      backdrop-filter: blur(8px);
      transition: background .2s;
    }
    .imm-cart-btn:hover { background: rgba(255,255,255,.25); }
    .imm-cart-badge {
      position: absolute; top: -4px; right: -4px;
      width: 18px; height: 18px;
      background: var(--color-brand);
      border-radius: 50%;
      font-size: .6875rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      color: white; border: 2px solid #0a0a0a;
    }

    /* ─── Loading / Empty ───────────────────────────── */
    .imm-loading, .imm-empty {
      position: absolute; inset: 0;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 1rem; color: rgba(255,255,255,.6);
      font-size: 1rem;
    }
    .imm-empty span { font-size: 3rem; }
    .imm-spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(255,255,255,.15);
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: imm-spin .8s linear infinite;
    }
    @keyframes imm-spin { to { transform: rotate(360deg); } }

    /* ─── Scroll track ──────────────────────────────── */
    .imm-track {
      position: absolute; inset: 0;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: none;
    }
    .imm-track::-webkit-scrollbar { display: none; }

    /* ─── Slide ─────────────────────────────────────── */
    .imm-slide {
      position: relative;
      height: 100vh;
      scroll-snap-align: start;
      overflow: hidden;
    }

    /* ─── Background photo ──────────────────────────── */
    .imm-bg {
      position: absolute; inset: 0;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      animation: imm-breathe 6s ease-in-out infinite alternate;
    }
    @keyframes imm-breathe { from { transform: scale(1); } to { transform: scale(1.05); } }
    .imm-bg-placeholder { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
    .imm-bg-emoji {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 6rem; opacity: .3;
    }

    /* ─── Gradient overlay ──────────────────────────── */
    .imm-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(
        to bottom,
        rgba(0,0,0,.35) 0%,
        transparent 30%,
        rgba(0,0,0,.1) 50%,
        rgba(0,0,0,.75) 75%,
        rgba(0,0,0,.92) 100%
      );
    }

    /* ─── Position indicator ────────────────────────── */
    .imm-position {
      position: absolute;
      top: 68px; right: 1.25rem;
      font-size: .75rem; font-weight: 600;
      color: rgba(255,255,255,.6);
      letter-spacing: .06em;
    }

    /* ─── Bottom overlay ────────────────────────────── */
    .imm-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 2rem 1.5rem 2.5rem;
      display: flex; flex-direction: column; gap: .625rem;
      animation: imm-slide-up .5s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes imm-slide-up { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    .imm-category-chip {
      display: inline-flex;
      width: fit-content;
      padding: .25rem .875rem;
      border-radius: 999px;
      background: var(--color-brand);
      color: white;
      font-size: .6875rem; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
    }
    .imm-badge {
      display: inline-flex; width: fit-content;
      padding: 2px 10px; border-radius: 999px;
      font-size: .6875rem; font-weight: 700;
      letter-spacing: .06em; text-transform: uppercase;
      color: white;
    }
    .imm-badge-popular   { background: #e67e22; }
    .imm-badge-new       { background: #2980b9; }
    .imm-badge-vegetarian { background: #27ae60; }
    .imm-badge-spicy     { background: #c0392b; }

    .imm-dish-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.875rem, 5.5vw, 2.75rem);
      font-weight: 400;
      color: white;
      margin: 0;
      line-height: 1.12;
      letter-spacing: -.02em;
      text-shadow: 0 2px 20px rgba(0,0,0,.4);
    }
    .imm-dish-desc {
      font-size: .9375rem;
      color: rgba(255,255,255,.68);
      margin: 0;
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .imm-overlay-foot {
      display: flex; align-items: center;
      justify-content: space-between;
      gap: 1rem; margin-top: .375rem;
      flex-wrap: wrap;
    }
    .imm-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.75rem; font-weight: 400;
      color: white;
      text-shadow: 0 2px 12px rgba(0,0,0,.5);
    }
    .imm-qty-row { display: flex; align-items: center; gap: .5rem; }
    .imm-qty-btn {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.4);
      background: rgba(255,255,255,.1);
      color: white; font-size: 1.125rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      transition: background .15s;
    }
    .imm-qty-btn:hover { background: rgba(255,255,255,.22); }
    .imm-qty-val { font-size: 1rem; font-weight: 700; color: white; min-width: 22px; text-align: center; }
    .imm-add-btn {
      padding: .6875rem 1.625rem;
      border-radius: 999px; border: none;
      background: var(--color-brand);
      color: white; font-size: .9375rem; font-weight: 700;
      cursor: pointer; letter-spacing: -.01em;
      transition: opacity .15s, transform .2s cubic-bezier(0.34,1.56,0.64,1), background .25s;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0,0,0,.35);
    }
    .imm-add-btn:hover { opacity: .9; transform: translateY(-2px) scale(1.02); }
    .imm-add-success {
      background: #27ae60 !important;
      animation: imm-pop .35s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes imm-pop { from { transform: scale(.85); } to { transform: scale(1); } }

    /* ─── Swipe hint ────────────────────────────────── */
    .imm-swipe-hint {
      position: absolute;
      bottom: 220px; left: 50%;
      transform: translateX(-50%);
      display: flex; flex-direction: column; align-items: center; gap: .5rem;
      color: rgba(255,255,255,.7);
      font-size: .8125rem; font-weight: 500;
      animation: imm-hint 2s ease-in-out 1s forwards;
      pointer-events: none;
    }
    .imm-hint-icon { animation: imm-bounce 1s ease-in-out infinite; }
    @keyframes imm-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }
    @keyframes imm-hint { 0% { opacity: 0; } 20% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }

    /* ─── Nav arrows (desktop) ──────────────────────── */
    .imm-nav {
      position: absolute; right: 1.5rem;
      width: 40px; height: 40px;
      background: rgba(255,255,255,.15);
      border: 1px solid rgba(255,255,255,.25);
      border-radius: 50%;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      backdrop-filter: blur(8px);
      z-index: 20;
      transition: background .2s, opacity .2s;
    }
    .imm-nav:hover { background: rgba(255,255,255,.25); }
    .imm-nav-up { bottom: calc(50% + 30px); }
    .imm-nav-down { bottom: calc(50% - 70px); }
    @media (max-width: 768px) { .imm-nav { display: none; } }

    /* ─── Drawer ────────────────────────────────────── */
    .imm-drawer-backdrop {
      position: absolute; inset: 0; z-index: 40;
      background: rgba(0,0,0,.5);
      backdrop-filter: blur(4px);
    }
    .imm-drawer {
      position: absolute;
      top: 0; left: 0; bottom: 0;
      width: min(320px, 85vw);
      background: rgba(10,10,10,.92);
      backdrop-filter: blur(20px);
      z-index: 41;
      display: flex; flex-direction: column;
      animation: imm-drawer-in .3s cubic-bezier(0.22,1,0.36,1);
      border-right: 1px solid rgba(255,255,255,.08);
    }
    @keyframes imm-drawer-in { from { transform: translateX(-100%); } to { transform: translateX(0); } }

    .imm-drawer-header {
      display: flex; align-items: center; gap: .875rem;
      padding: 1.5rem 1.25rem;
      border-bottom: 1px solid rgba(255,255,255,.08);
    }
    .imm-drawer-logo-img {
      width: 44px; height: 44px; object-fit: cover;
      border-radius: 10px; flex-shrink: 0;
    }
    .imm-drawer-logo-placeholder {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.08); border-radius: 10px;
      font-size: 1.5rem; flex-shrink: 0;
    }
    .imm-drawer-rname { font-size: .9375rem; font-weight: 700; color: white; }
    .imm-drawer-sub   { font-size: .8125rem; color: rgba(255,255,255,.45); margin-top: 2px; }
    .imm-drawer-close {
      margin-left: auto;
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,.08); border: none;
      color: rgba(255,255,255,.6); font-size: .875rem;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .imm-drawer-close:hover { background: rgba(255,255,255,.15); }

    .imm-drawer-nav { flex: 1; overflow-y: auto; padding: .75rem 0; }
    .imm-drawer-nav::-webkit-scrollbar { display: none; }

    .imm-drawer-item {
      width: 100%;
      display: flex; align-items: center; gap: .875rem;
      padding: .75rem 1.25rem;
      background: none; border: none;
      cursor: pointer;
      text-align: left;
      transition: background .15s;
      animation: imm-item-in .3s ease both;
    }
    @keyframes imm-item-in { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
    .imm-drawer-item:hover { background: rgba(255,255,255,.06); }
    .imm-drawer-active { background: rgba(255,255,255,.08) !important; }
    .imm-drawer-active .imm-drawer-cat-name { color: var(--color-brand) !important; }

    .imm-drawer-thumb {
      width: 44px; height: 44px;
      object-fit: cover; border-radius: 8px;
      flex-shrink: 0;
    }
    .imm-drawer-thumb-blank {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: rgba(255,255,255,.06); border-radius: 8px;
      font-size: 1.25rem; flex-shrink: 0;
    }
    .imm-drawer-item-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
    .imm-drawer-cat-name { font-size: .9375rem; font-weight: 600; color: rgba(255,255,255,.85); }
    .imm-drawer-cat-count { font-size: .8125rem; color: rgba(255,255,255,.4); }
    .imm-drawer-item svg { color: rgba(255,255,255,.3); flex-shrink: 0; }

    /* ── Drawer hours ────────────────────────────────── */
    .imm-drawer-hours {
      padding: .875rem 1.25rem 1.75rem;
      border-top: 1px solid rgba(255,255,255,.07);
      flex-shrink: 0;
    }
    .imm-dh-title {
      font-size: .5rem; font-weight: 800; color: rgba(255,255,255,.28);
      letter-spacing: .15em; text-transform: uppercase; margin-bottom: .625rem;
    }
    .imm-dh-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: .28rem .5rem; border-radius: 6px;
      transition: background .15s;
    }
    .imm-dh-day {
      font-size: .6875rem; font-weight: 700; color: rgba(255,255,255,.38);
      letter-spacing: .05em;
    }
    .imm-dh-time { font-size: .6875rem; color: rgba(255,255,255,.52); }
    .imm-dh-today { background: rgba(255,255,255,.05); }
    .imm-dh-today .imm-dh-day { color: var(--color-brand); }
    .imm-dh-today .imm-dh-time { color: white; font-weight: 700; }
    .imm-dh-closed .imm-dh-time { color: rgba(255,255,255,.2); font-style: italic; }
  `],
})
export class TemplateImmersiveComponent implements AfterViewInit, OnDestroy {
  @Input() restaurant: Restaurant | null = null
  @Input() categories: Category[] = []
  @Input() cart: CartItem[] = []
  @Input() cartCount = 0
  @Input() hasOrders = false
  @Input() loading = false

  @Output() addToCart = new EventEmitter<MenuItem>()
  @Output() removeFromCart = new EventEmitter<number>()
  @Output() openCart = new EventEmitter<void>()
  @Output() openReservation = new EventEmitter<void>()

  @ViewChild('track') trackRef?: ElementRef<HTMLDivElement>

  readonly drawerOpen = signal(false)
  readonly currentIdx = signal(0)
  readonly addedId = signal<number | null>(null)
  readonly showHint = signal(true)

  private readonly platformId = inject(PLATFORM_ID)
  private touchStartY = 0
  private scrollTimer?: ReturnType<typeof setTimeout>

  readonly flatDishes = computed<FlatDish[]>(() => {
    const result: FlatDish[] = []
    this.categories.forEach((cat, catIdx) => {
      const items = cat.menuItems ?? []
      items.forEach((item, dishIdx) => {
        result.push({ item, catName: cat.name, catIdx, dishIdx, total: items.length })
      })
    })
    return result
  })

  readonly progressPct = computed(() => {
    const total = this.flatDishes().length
    if (total <= 1) return 100
    return Math.round((this.currentIdx() / (total - 1)) * 100)
  })

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    setTimeout(() => this.showHint.set(false), 4000)
  }

  ngOnDestroy(): void {
    if (this.scrollTimer) clearTimeout(this.scrollTimer)
  }

  onScroll(): void {
    const el = this.trackRef?.nativeElement
    if (!el) return
    if (this.scrollTimer) clearTimeout(this.scrollTimer)
    this.scrollTimer = setTimeout(() => {
      const idx = Math.round(el.scrollTop / el.clientHeight)
      this.currentIdx.set(Math.max(0, Math.min(idx, this.flatDishes().length - 1)))
    }, 80)
  }

  onTouchStart(e: TouchEvent): void {
    this.touchStartY = e.touches[0].clientY
  }

  onTouchEnd(e: TouchEvent): void {
    const diff = this.touchStartY - e.changedTouches[0].clientY
    if (Math.abs(diff) > 40) {
      this.navigate(diff > 0 ? 1 : -1)
    }
  }

  navigate(dir: 1 | -1): void {
    const next = Math.max(0, Math.min(this.currentIdx() + dir, this.flatDishes().length - 1))
    this.currentIdx.set(next)
    const el = this.trackRef?.nativeElement
    if (el) el.scrollTo({ top: next * el.clientHeight, behavior: 'smooth' })
  }

  jumpToCategory(catId: number): void {
    const idx = this.flatDishes().findIndex((fd) => {
      const cat = this.categories.find((c) => c.id === catId)
      return fd.catName === cat?.name && fd.dishIdx === 0
    })
    if (idx >= 0) {
      this.currentIdx.set(idx)
      const el = this.trackRef?.nativeElement
      if (el) el.scrollTo({ top: idx * el.clientHeight, behavior: 'smooth' })
    }
    this.drawerOpen.set(false)
  }

  isActiveCat(catId: number): boolean {
    const fd = this.flatDishes()[this.currentIdx()]
    const cat = this.categories.find((c) => c.id === catId)
    return fd?.catName === cat?.name
  }

  onAdd(item: MenuItem): void {
    this.addToCart.emit(item)
    this.addedId.set(item.id)
    setTimeout(() => this.addedId.set(null), 1200)
  }

  qty(id: number): number {
    return this.cart.find((ci) => ci.menuItem.id === id)?.quantity ?? 0
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
