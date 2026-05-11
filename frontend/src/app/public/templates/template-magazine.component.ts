import { Component, Input, Output, EventEmitter, signal, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import type { Restaurant, Category, MenuItem, CartItem } from '../../shared/models'

@Component({
  selector: 'app-template-magazine',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div class="mag-wrap">

    <!-- ── HEADER ─────────────────────────────────────────── -->
    <header class="mag-header">
      <div class="mag-header-info">
        @if (restaurant?.logoUrl) {
          <img [src]="restaurant!.logoUrl" alt="Logo" class="mag-logo" />
        }
        <div class="mag-header-text">
          <div class="mag-issue">Édition digitale</div>
          <h1 class="mag-restaurant-name">{{ restaurant?.name }}</h1>
          @if (restaurant?.slogan) {
            <p class="mag-slogan">{{ restaurant!.slogan }}</p>
          }
        </div>
      </div>
      @if (restaurant?.coverImageUrl) {
        <div class="mag-cover-wrap">
          <img [src]="restaurant!.coverImageUrl!" alt="Cover" class="mag-cover-img" />
          <div class="mag-cover-overlay"></div>
        </div>
      } @else {
        <div class="mag-cover-wrap mag-cover-placeholder">
          <div class="mag-cover-pattern"></div>
        </div>
      }
    </header>

    <!-- ── BODY ──────────────────────────────────────────── -->
    <div class="mag-body">

      <!-- Sidebar index -->
      <nav class="mag-sidebar" aria-label="Sommaire">
        <div class="mag-sidebar-label">SOMMAIRE</div>
        @for (cat of categories; track cat.id; let i = $index) {
          <button
            class="mag-idx-btn"
            [class.mag-idx-active]="activeCatId() === cat.id"
            (click)="scrollTo(cat.id)"
            type="button"
          >
            <span class="mag-idx-num">{{ pad(i + 1) }}</span>
            <span class="mag-idx-name">{{ cat.name }}</span>
          </button>
        }
      </nav>

      <!-- Main content -->
      <main class="mag-main">

        @if (loading) {
          <div class="mag-skeleton-wrap">
            @for (i of [1,2,3]; track i) {
              <div class="mag-skeleton-hero"></div>
              <div class="mag-skeleton-grid">
                <div class="mag-skeleton-card"></div>
                <div class="mag-skeleton-card"></div>
                <div class="mag-skeleton-card"></div>
              </div>
            }
          </div>
        } @else {
          @for (cat of categories; track cat.id; let catIdx = $index) {
            @if (cat.menuItems && cat.menuItems.length > 0) {
              <section [id]="'mag-' + cat.id" class="mag-section">

                <!-- Section head -->
                <div class="mag-section-head">
                  <span class="mag-chapter">Chapitre {{ pad(catIdx + 1) }}</span>
                  <h2 class="mag-section-title">{{ cat.name }}</h2>
                  @if (cat.description) {
                    <p class="mag-section-quote">"{{ cat.description }}"</p>
                  }
                  <div class="mag-section-rule"></div>
                </div>

                <!-- Hero card (first dish) -->
                <article class="mag-hero-card mag-reveal" (click)="openDish(cat.menuItems![0])">
                  <div class="mag-hero-photo-wrap">
                    @if (cat.menuItems![0].imageUrl) {
                      <img [src]="cat.menuItems![0].imageUrl" alt="{{ cat.menuItems![0].name }}" class="mag-hero-photo mag-ken-burns" />
                    } @else {
                      <div class="mag-hero-photo-blank">🍽️</div>
                    }
                    @if (cat.menuItems![0].badge) {
                      <span class="mag-badge mag-badge-{{ cat.menuItems![0].badge }}">{{ cat.menuItems![0].badge }}</span>
                    }
                  </div>
                  <div class="mag-hero-body">
                    <div class="mag-dish-num-bg">01</div>
                    <h3 class="mag-hero-title">{{ cat.menuItems![0].name }}</h3>
                    @if (cat.menuItems![0].description) {
                      <p class="mag-hero-desc">{{ cat.menuItems![0].description }}</p>
                    }
                    <div class="mag-hero-foot">
                      <span class="mag-price">{{ fmt(cat.menuItems![0]) }}</span>
                      @if (hasOrders) {
                        <div class="mag-qty" (click)="$event.stopPropagation()">
                          @if (qty(cat.menuItems![0].id) > 0) {
                            <button class="mag-qty-btn" (click)="removeFromCart.emit(cat.menuItems![0].id)" type="button">−</button>
                            <span class="mag-qty-val">{{ qty(cat.menuItems![0].id) }}</span>
                          }
                          <button class="mag-add-btn" (click)="addToCart.emit(cat.menuItems![0])" type="button">
                            {{ qty(cat.menuItems![0].id) > 0 ? '+' : '+ Ajouter' }}
                          </button>
                        </div>
                      }
                    </div>
                  </div>
                </article>

                <!-- Grid (remaining dishes) -->
                @if (cat.menuItems!.length > 1) {
                  <div class="mag-grid">
                    @for (item of cat.menuItems!.slice(1); track item.id; let idx = $index) {
                      <article class="mag-card mag-reveal" [attr.data-delay]="idx % 3" (click)="openDish(item)">
                        <div class="mag-card-photo-wrap">
                          <div class="mag-card-num-bg">{{ pad(idx + 2) }}</div>
                          @if (item.imageUrl) {
                            <img [src]="item.imageUrl" alt="{{ item.name }}" class="mag-card-photo" />
                          } @else {
                            <div class="mag-card-photo-blank">🍽️</div>
                          }
                          @if (item.badge) {
                            <span class="mag-card-badge mag-badge-{{ item.badge }}">{{ item.badge }}</span>
                          }
                        </div>
                        <div class="mag-card-body">
                          <h4 class="mag-card-name">{{ item.name }}</h4>
                          <div class="mag-card-foot">
                            <span class="mag-card-price">{{ fmt(item) }}</span>
                            @if (hasOrders) {
                              <div class="mag-qty-sm" (click)="$event.stopPropagation()">
                                @if (qty(item.id) > 0) {
                                  <button class="mag-qty-btn-sm" (click)="removeFromCart.emit(item.id)" type="button">−</button>
                                  <span class="mag-qty-val-sm">{{ qty(item.id) }}</span>
                                }
                                <button class="mag-add-btn-sm" (click)="addToCart.emit(item)" type="button">+</button>
                              </div>
                            }
                          </div>
                        </div>
                      </article>
                    }
                  </div>
                }

              </section>
            }
          }
        }

        <!-- Footer -->
        <footer class="mag-footer">
          @if (restaurant?.logoUrl) {
            <img [src]="restaurant!.logoUrl" alt="Logo" class="mag-foot-logo" />
          }
          <span class="mag-foot-name">{{ restaurant?.name }}</span>
          @if (restaurant?.address) { <span class="mag-foot-info">{{ restaurant!.address }}</span> }
          @if (restaurant?.phone) { <a [href]="'tel:' + restaurant!.phone" class="mag-foot-info">{{ restaurant!.phone }}</a> }
        </footer>

      </main>
    </div><!-- /.mag-body -->

    <!-- ── DISH MODAL ───────────────────────────────────── -->
    @if (selectedDish()) {
      <div class="mag-modal-backdrop" (click)="selectedDish.set(null)">
        <div class="mag-modal" (click)="$event.stopPropagation()">
          <button class="mag-modal-close" (click)="selectedDish.set(null)" type="button">✕</button>
          @if (selectedDish()!.imageUrl) {
            <img [src]="selectedDish()!.imageUrl!" alt="{{ selectedDish()!.name }}" class="mag-modal-photo" />
          }
          <div class="mag-modal-body">
            @if (selectedDish()!.badge) {
              <span class="mag-badge mag-badge-{{ selectedDish()!.badge }} mag-modal-badge">{{ selectedDish()!.badge }}</span>
            }
            <h3 class="mag-modal-title">{{ selectedDish()!.name }}</h3>
            @if (selectedDish()!.description) {
              <p class="mag-modal-desc">{{ selectedDish()!.description }}</p>
            }
            <div class="mag-modal-foot">
              <span class="mag-modal-price">{{ fmt(selectedDish()!) }}</span>
              @if (hasOrders) {
                <div class="mag-qty" (click)="$event.stopPropagation()">
                  @if (qty(selectedDish()!.id) > 0) {
                    <button class="mag-qty-btn" (click)="removeFromCart.emit(selectedDish()!.id)" type="button">−</button>
                    <span class="mag-qty-val">{{ qty(selectedDish()!.id) }}</span>
                  }
                  <button class="mag-add-btn" (click)="addToCart.emit(selectedDish()!); selectedDish.set(null)" type="button">
                    {{ qty(selectedDish()!.id) > 0 ? '+ Encore' : '+ Ajouter au panier' }}
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }

  </div>
  `,
  styles: [`
    :host { display: block; }

    /* ─── Wrap ─────────────────────────────────────── */
    .mag-wrap {
      min-height: 100vh;
      background: #faf9f7;
      font-family: var(--font-body, 'Inter', sans-serif);
    }

    /* ─── Header ────────────────────────────────────── */
    .mag-header {
      display: grid;
      grid-template-columns: 42% 1fr;
      min-height: 340px;
      overflow: hidden;
      background: white;
      border-bottom: 3px solid var(--color-brand);
    }
    @media (max-width: 700px) {
      .mag-header { grid-template-columns: 1fr; min-height: auto; }
    }

    .mag-header-info {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 3rem 2.5rem;
      gap: 1rem;
      background: white;
    }
    .mag-logo {
      width: 64px; height: 64px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,.1);
    }
    .mag-issue {
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--color-brand);
    }
    .mag-restaurant-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(2rem, 4vw, 3.25rem);
      font-weight: 400;
      line-height: 1.1;
      color: var(--text-primary, #111);
      margin: 0;
    }
    .mag-slogan {
      font-size: .9375rem;
      color: var(--text-muted, #888);
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
      animation: mag-ken-static 12s ease-in-out infinite alternate;
    }
    @keyframes mag-ken-static { from { transform: scale(1); } to { transform: scale(1.06); } }
    .mag-cover-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to right, white 0%, transparent 30%);
    }
    .mag-cover-placeholder {
      background: var(--color-brand-subtle, #fef2f0);
    }
    .mag-cover-pattern {
      width: 100%; height: 100%;
      background-image: repeating-linear-gradient(
        45deg,
        var(--color-brand) 0, var(--color-brand) 1px,
        transparent 0, transparent 50%
      );
      background-size: 12px 12px;
      opacity: .08;
    }

    /* ─── Body layout ───────────────────────────────── */
    .mag-body {
      display: grid;
      grid-template-columns: 150px 1fr;
      max-width: 1280px;
      margin: 0 auto;
      min-height: calc(100vh - 340px);
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
      padding: 2.5rem 0 2.5rem 1.5rem;
      border-right: 1px solid var(--border, #e5e7eb);
      background: #faf9f7;
      display: flex;
      flex-direction: column;
      gap: .25rem;
    }
    @media (max-width: 900px) { .mag-sidebar { display: none; } }

    .mag-sidebar-label {
      font-size: .6rem;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--text-muted, #aaa);
      margin-bottom: 1rem;
      padding-left: .25rem;
    }
    .mag-idx-btn {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      padding: .5rem .5rem .5rem .25rem;
      background: none;
      border: none;
      border-left: 2px solid transparent;
      cursor: pointer;
      text-align: left;
      transition: border-color .2s, background .2s;
      border-radius: 0 6px 6px 0;
    }
    .mag-idx-btn:hover { background: white; }
    .mag-idx-active { border-left-color: var(--color-brand) !important; background: white !important; }
    .mag-idx-num {
      font-size: .625rem;
      font-weight: 700;
      letter-spacing: .08em;
      color: var(--color-brand);
    }
    .mag-idx-name {
      font-size: .75rem;
      font-weight: 500;
      color: var(--text-secondary, #555);
      line-height: 1.3;
    }
    .mag-idx-active .mag-idx-name { color: var(--text-primary, #111); font-weight: 600; }

    /* ─── Main content ──────────────────────────────── */
    .mag-main { padding: 3rem 2.5rem; }
    @media (max-width: 700px) { .mag-main { padding: 2rem 1rem; } }

    /* ─── Skeleton ──────────────────────────────────── */
    .mag-skeleton-wrap { display: flex; flex-direction: column; gap: 2rem; }
    .mag-skeleton-hero {
      height: 260px;
      border-radius: 16px;
      background: linear-gradient(90deg, #f0eeec 25%, #e8e6e3 50%, #f0eeec 75%);
      background-size: 400% 100%;
      animation: mag-shimmer 1.4s infinite;
    }
    .mag-skeleton-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; }
    .mag-skeleton-card {
      height: 200px;
      border-radius: 12px;
      background: linear-gradient(90deg, #f0eeec 25%, #e8e6e3 50%, #f0eeec 75%);
      background-size: 400% 100%;
      animation: mag-shimmer 1.4s infinite;
    }
    @keyframes mag-shimmer { to { background-position: -400% 0; } }

    /* ─── Section ───────────────────────────────────── */
    .mag-section { margin-bottom: 5rem; }

    .mag-section-head { margin-bottom: 2rem; }
    .mag-chapter {
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--color-brand);
      display: block;
      margin-bottom: .5rem;
    }
    .mag-section-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      font-weight: 400;
      color: var(--text-primary, #111);
      margin: 0 0 .5rem;
      line-height: 1.15;
    }
    .mag-section-quote {
      font-style: italic;
      font-size: .9375rem;
      color: var(--text-muted, #888);
      margin: .25rem 0 0;
    }
    .mag-section-rule {
      height: 2px;
      background: linear-gradient(to right, var(--color-brand) 60px, transparent);
      margin-top: 1.25rem;
    }

    /* ─── Reveal animation ──────────────────────────── */
    .mag-reveal {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity .6s cubic-bezier(0.22,1,0.36,1), transform .6s cubic-bezier(0.22,1,0.36,1);
    }
    .mag-reveal.mag-visible { opacity: 1; transform: translateY(0); }
    .mag-reveal[data-delay="1"] { transition-delay: .08s; }
    .mag-reveal[data-delay="2"] { transition-delay: .16s; }
    @media (max-width: 768px) { .mag-reveal { opacity: 1; transform: none; transition: none; } }

    /* ─── Hero card ─────────────────────────────────── */
    .mag-hero-card {
      display: grid;
      grid-template-columns: 42% 1fr;
      min-height: 280px;
      border-radius: 20px;
      overflow: hidden;
      background: white;
      box-shadow: 0 4px 24px rgba(0,0,0,.07);
      cursor: pointer;
      transition: box-shadow .3s, transform .3s;
      margin-bottom: 2rem;
    }
    .mag-hero-card:hover { box-shadow: 0 12px 40px rgba(0,0,0,.12); transform: translateY(-3px); }
    @media (max-width: 700px) { .mag-hero-card { grid-template-columns: 1fr; } }

    .mag-hero-photo-wrap {
      position: relative;
      overflow: hidden;
      background: var(--color-brand-subtle, #fef2f0);
    }
    .mag-hero-photo {
      width: 100%; height: 100%;
      object-fit: cover;
      display: block;
    }
    .mag-ken-burns { animation: mag-ken-burns 10s ease-in-out infinite alternate; }
    @keyframes mag-ken-burns {
      from { transform: scale(1) translateX(0); }
      to   { transform: scale(1.08) translateX(-2%); }
    }
    .mag-hero-photo-blank {
      display: flex; align-items: center; justify-content: center;
      height: 100%; min-height: 200px;
      font-size: 3rem;
      background: var(--color-brand-subtle, #fef2f0);
    }

    .mag-hero-body {
      position: relative;
      padding: 2.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .mag-dish-num-bg {
      position: absolute;
      top: -10px; right: -10px;
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 8rem;
      font-weight: 700;
      color: var(--text-primary, #111);
      opacity: .04;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }
    .mag-hero-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.625rem;
      font-weight: 400;
      color: var(--text-primary, #111);
      margin: 0 0 .75rem;
      line-height: 1.2;
      position: relative;
    }
    .mag-hero-desc {
      font-size: .9375rem;
      color: var(--text-secondary, #555);
      line-height: 1.65;
      margin: 0 0 1.5rem;
      flex: 1;
    }
    .mag-hero-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .mag-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem;
      font-weight: 400;
      color: var(--color-brand);
    }

    /* ─── Badge ─────────────────────────────────────── */
    .mag-badge {
      position: absolute;
      top: 12px; left: 12px;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .06em;
      text-transform: uppercase;
      color: white;
    }
    .mag-badge-popular  { background: #e67e22; }
    .mag-badge-new      { background: #2980b9; }
    .mag-badge-vegetarian { background: #27ae60; }
    .mag-badge-spicy    { background: #c0392b; }

    /* ─── Cart controls ─────────────────────────────── */
    .mag-qty {
      display: flex; align-items: center; gap: .5rem;
    }
    .mag-qty-btn {
      width: 30px; height: 30px; border-radius: 50%;
      border: 1.5px solid var(--color-brand);
      background: white; color: var(--color-brand);
      font-size: 1.125rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .mag-qty-btn:hover { background: var(--color-brand); color: white; }
    .mag-qty-val { font-weight: 700; font-size: 1rem; min-width: 20px; text-align: center; color: var(--text-primary); }
    .mag-add-btn {
      padding: .5rem 1.25rem;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: 999px;
      font-size: .875rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity .15s, transform .15s;
      white-space: nowrap;
    }
    .mag-add-btn:hover { opacity: .88; transform: translateY(-1px); }

    /* ─── Grid ──────────────────────────────────────── */
    .mag-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    @media (max-width: 900px) { .mag-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 480px) { .mag-grid { grid-template-columns: 1fr; } }

    .mag-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,.06);
      cursor: pointer;
      transition: box-shadow .25s, transform .25s;
      display: flex; flex-direction: column;
    }
    .mag-card:hover { box-shadow: 0 8px 28px rgba(0,0,0,.12); transform: translateY(-4px); }

    .mag-card-photo-wrap {
      position: relative;
      height: 170px;
      overflow: hidden;
      background: var(--color-brand-subtle, #fef2f0);
    }
    .mag-card-num-bg {
      position: absolute;
      bottom: 4px; right: 8px;
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 3.5rem;
      font-weight: 700;
      color: white;
      opacity: .2;
      line-height: 1;
      pointer-events: none;
      user-select: none;
    }
    .mag-card-photo {
      width: 100%; height: 100%;
      object-fit: cover;
      transition: transform .6s ease;
    }
    .mag-card:hover .mag-card-photo { transform: scale(1.05); }
    .mag-card-photo-blank {
      display: flex; align-items: center; justify-content: center;
      height: 100%; font-size: 2.5rem;
    }
    .mag-card-badge {
      position: absolute; top: 8px; left: 8px;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: .625rem; font-weight: 700;
      letter-spacing: .06em; text-transform: uppercase;
      color: white;
    }

    .mag-card-body {
      padding: 1rem 1.125rem;
      flex: 1;
      display: flex; flex-direction: column; justify-content: space-between;
      gap: .5rem;
    }
    .mag-card-name {
      font-size: .9375rem;
      font-weight: 600;
      color: var(--text-primary, #111);
      margin: 0;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .mag-card-foot {
      display: flex; align-items: center; justify-content: space-between; gap: .5rem;
    }
    .mag-card-price {
      font-weight: 700;
      font-size: .9375rem;
      color: var(--color-brand);
    }
    .mag-qty-sm { display: flex; align-items: center; gap: 4px; }
    .mag-qty-btn-sm {
      width: 24px; height: 24px; border-radius: 50%;
      border: 1.5px solid var(--color-brand); background: white;
      color: var(--color-brand); font-size: .875rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s, color .15s;
    }
    .mag-qty-btn-sm:hover { background: var(--color-brand); color: white; }
    .mag-qty-val-sm { font-size: .875rem; font-weight: 700; min-width: 16px; text-align: center; color: var(--text-primary); }
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
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 2.5rem 0;
      border-top: 1px solid var(--border, #e5e7eb);
      margin-top: 2rem;
      flex-wrap: wrap;
    }
    .mag-foot-logo { width: 40px; height: 40px; border-radius: 8px; object-fit: cover; }
    .mag-foot-name { font-weight: 700; font-size: .9375rem; color: var(--text-primary); }
    .mag-foot-info { font-size: .875rem; color: var(--text-muted); text-decoration: none; }
    a.mag-foot-info:hover { color: var(--color-brand); }

    /* ─── Modal ─────────────────────────────────────── */
    .mag-modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 500;
      display: flex; align-items: flex-end; justify-content: center;
      animation: mag-fade-in .2s ease;
    }
    @keyframes mag-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @media (min-width: 600px) {
      .mag-modal-backdrop { align-items: center; }
    }
    .mag-modal {
      background: white;
      border-radius: 24px 24px 0 0;
      width: 100%;
      max-width: 540px;
      max-height: 85vh;
      overflow-y: auto;
      position: relative;
      animation: mag-slide-up .3s cubic-bezier(0.22,1,0.36,1);
    }
    @keyframes mag-slide-up { from { transform: translateY(60px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @media (min-width: 600px) {
      .mag-modal { border-radius: 24px; }
    }
    .mag-modal-close {
      position: absolute; top: 1rem; right: 1rem;
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: rgba(0,0,0,.07);
      cursor: pointer; font-size: .875rem;
      display: flex; align-items: center; justify-content: center;
      z-index: 1;
    }
    .mag-modal-photo {
      width: 100%; height: 220px;
      object-fit: cover;
      display: block;
      border-radius: 24px 24px 0 0;
    }
    .mag-modal-body { padding: 1.5rem; }
    .mag-modal-badge { position: static; display: inline-flex; margin-bottom: .75rem; }
    .mag-modal-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; font-weight: 400;
      color: var(--text-primary); margin: 0 0 .75rem;
    }
    .mag-modal-desc { font-size: .9375rem; color: var(--text-secondary); line-height: 1.65; margin: 0 0 1.5rem; }
    .mag-modal-foot {
      display: flex; align-items: center; justify-content: space-between;
      gap: 1rem; padding-top: 1rem;
      border-top: 1px solid var(--border, #e5e7eb);
    }
    .mag-modal-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; color: var(--color-brand);
    }
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
}
