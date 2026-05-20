// frontend/src/app/public/templates/template-zen.component.ts
// Template 4 — "Obsidian" Dark Luxury
import {
  Component, Input, Output, EventEmitter, signal,
  AfterViewInit, OnDestroy, PLATFORM_ID, inject,
} from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import type { Restaurant, Category, MenuItem, CartItem } from '../../shared/models'

@Component({
  selector: 'app-template-zen',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './template-zen.component.html',
  styles: [`
    :host { display: block; }

    /* ── Root ──────────────────────────────────────────── */
    .obs-root {
      min-height: 100vh;
      background: #080808;
      color: #ede9e3;
      font-family: var(--font-body, 'Inter', sans-serif);
      -webkit-font-smoothing: antialiased;
    }

    /* ── Header ────────────────────────────────────────── */
    .obs-header {
      position: sticky; top: 0; z-index: 100;
      transition: background .4s, border-color .4s, backdrop-filter .4s;
      border-bottom: 1px solid transparent;
    }
    .obs-header-solid {
      background: rgba(8,8,8,.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border-bottom-color: rgba(255,255,255,.07);
    }
    .obs-header-in {
      display: flex; align-items: center; gap: 1.25rem;
      padding: 0 2.5rem; height: 62px;
      max-width: 1440px; margin: 0 auto;
    }
    .obs-brand {
      display: flex; align-items: center; gap: .75rem;
      text-decoration: none; flex-shrink: 0;
    }
    .obs-logo {
      width: 34px; height: 34px; object-fit: cover;
      border-radius: 8px; flex-shrink: 0;
    }
    .obs-brand-name {
      font-size: .9375rem; font-weight: 700;
      color: white; white-space: nowrap;
      letter-spacing: -.01em;
    }
    .obs-cats-nav {
      display: flex; align-items: center; gap: 2px;
      overflow-x: auto; flex: 1; scrollbar-width: none;
    }
    .obs-cats-nav::-webkit-scrollbar { display: none; }
    .obs-cat-btn {
      flex-shrink: 0; padding: .375rem .875rem;
      background: none; border: none; border-radius: 999px;
      font-size: .8125rem; font-weight: 500;
      color: rgba(255,255,255,.38); cursor: pointer;
      transition: color .2s, background .2s;
      white-space: nowrap;
    }
    .obs-cat-btn:hover { color: rgba(255,255,255,.75); }
    .obs-cat-active { color: white !important; background: rgba(255,255,255,.09) !important; }
    .obs-cart-pill {
      flex-shrink: 0; display: flex; align-items: center; gap: .5rem;
      padding: .4375rem .875rem;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 999px; color: white;
      font-size: .8125rem; font-weight: 600;
      cursor: pointer; position: relative;
      transition: background .2s;
    }
    .obs-cart-pill:hover { background: rgba(255,255,255,.12); }
    .obs-cart-count {
      min-width: 18px; height: 18px;
      background: var(--color-brand); border-radius: 999px;
      font-size: .625rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      color: white; padding: 0 4px;
    }
    @media (max-width: 680px) {
      .obs-header-in { padding: 0 1.25rem; gap: .75rem; }
      .obs-brand-name { display: none; }
    }

    /* ── Hero ──────────────────────────────────────────── */
    .obs-hero {
      position: relative; height: 480px;
      display: flex; align-items: flex-end;
      overflow: hidden;
    }
    @media (max-width: 680px) { .obs-hero { height: 340px; } }
    .obs-hero-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      animation: obs-ken 22s ease-in-out infinite alternate;
      will-change: transform;
    }
    @keyframes obs-ken { from { transform: scale(1); } to { transform: scale(1.07); } }
    .obs-hero-fallback {
      background: radial-gradient(ellipse at 30% 60%, #1f0a00 0%, #080808 60%),
                  radial-gradient(ellipse at 80% 20%, #0a001f 0%, transparent 60%);
    }
    .obs-hero-mask {
      position: absolute; inset: 0;
      background: linear-gradient(
        to top,
        #080808 0%,
        rgba(8,8,8,.65) 45%,
        rgba(8,8,8,.15) 100%
      );
    }
    .obs-hero-body {
      position: relative; z-index: 2;
      padding: 3rem 2.5rem;
      max-width: 1440px; margin: 0 auto; width: 100%;
    }
    @media (max-width: 680px) { .obs-hero-body { padding: 2rem 1.25rem; } }
    .obs-hero-eyebrow {
      font-size: .625rem; font-weight: 800;
      letter-spacing: .22em; text-transform: uppercase;
      color: var(--color-brand); margin: 0 0 1rem;
    }
    .obs-hero-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(2.75rem, 7vw, 5rem);
      font-weight: 400; line-height: 1.02;
      color: white; margin: 0 0 .875rem;
      letter-spacing: -.02em;
    }
    .obs-hero-slogan {
      font-size: 1.0625rem; color: rgba(255,255,255,.5);
      font-style: italic; margin: 0 0 1.75rem;
    }
    .obs-hero-accent {
      width: 48px; height: 2px;
      background: var(--color-brand); border-radius: 1px;
    }
    .obs-hero-scroll-hint {
      position: absolute; bottom: 2rem; right: 2.5rem;
      display: flex; flex-direction: column; align-items: center;
      gap: .5rem; z-index: 2;
    }
    @media (max-width: 680px) { .obs-hero-scroll-hint { display: none; } }
    .obs-scroll-line {
      width: 1px; height: 48px;
      background: linear-gradient(to bottom, transparent, rgba(255,255,255,.3));
      animation: obs-scroll-in 2s ease-in-out infinite;
    }
    @keyframes obs-scroll-in {
      0% { transform: scaleY(0); transform-origin: top; opacity: 0; }
      40% { transform: scaleY(1); transform-origin: top; opacity: 1; }
      80% { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
      100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
    }

    /* ── Content ───────────────────────────────────────── */
    .obs-content {
      max-width: 1440px; margin: 0 auto;
      padding: 5rem 2.5rem 8rem;
    }
    @media (max-width: 680px) { .obs-content { padding: 3rem 1.25rem 5rem; } }

    /* ── Loader ────────────────────────────────────────── */
    .obs-loader-wrap {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 1.5rem;
      min-height: 320px;
      color: rgba(255,255,255,.35); font-size: .9375rem;
    }
    .obs-spinner {
      width: 38px; height: 38px;
      border: 2px solid rgba(255,255,255,.08);
      border-top-color: var(--color-brand);
      border-radius: 50%;
      animation: obs-spin .75s linear infinite;
    }
    @keyframes obs-spin { to { transform: rotate(360deg); } }

    /* ── Section ───────────────────────────────────────── */
    .obs-section { margin-bottom: 7rem; }

    .obs-sec-hd {
      display: flex; align-items: flex-start; gap: 1.75rem;
      padding-bottom: 2rem; margin-bottom: 2.5rem;
      position: relative;
    }
    .obs-sec-rule {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 1px;
      background: linear-gradient(to right, rgba(255,255,255,.12) 0%, transparent 70%);
    }
    .obs-sec-num {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 4.5rem; line-height: .9; font-weight: 400;
      color: rgba(255,255,255,.04); flex-shrink: 0;
      user-select: none; letter-spacing: -.03em;
      transition: color .5s;
    }
    .obs-section:hover .obs-sec-num { color: rgba(255,255,255,.07); }
    .obs-sec-text { padding-top: .625rem; }
    .obs-sec-title {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.875rem, 3.5vw, 2.5rem);
      font-weight: 400; color: white;
      margin: 0 0 .375rem; letter-spacing: -.02em;
    }
    .obs-sec-sub {
      font-size: .9375rem; color: rgba(255,255,255,.38);
      font-style: italic; margin: 0;
    }

    /* ── Enter animation ───────────────────────────────── */
    .obs-enter {
      opacity: 0; transform: translateY(28px);
      transition: opacity .75s cubic-bezier(0.16,1,0.3,1),
                  transform .75s cubic-bezier(0.16,1,0.3,1);
    }
    .obs-enter.obs-in { opacity: 1; transform: translateY(0); }
    .obs-enter[data-d="1"] { transition-delay: .07s; }
    .obs-enter[data-d="2"] { transition-delay: .14s; }
    .obs-enter[data-d="3"] { transition-delay: .21s; }
    @media (max-width: 768px) { .obs-enter { opacity: 1; transform: none; transition: none; } }

    /* ── Featured card ─────────────────────────────────── */
    .obs-feat {
      display: grid;
      grid-template-columns: 44% 1fr;
      min-height: 300px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,.07);
      overflow: hidden;
      cursor: pointer;
      background: #111;
      margin-bottom: 1.5rem;
      transition: border-color .35s, transform .35s, box-shadow .35s;
    }
    .obs-feat:hover {
      border-color: rgba(255,255,255,.15);
      transform: translateY(-3px);
      box-shadow: 0 24px 64px rgba(0,0,0,.55);
    }
    @media (max-width: 680px) { .obs-feat { grid-template-columns: 1fr; } }

    .obs-feat-photo {
      position: relative; overflow: hidden;
      background: #1a1a1a;
    }
    .obs-feat-img {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
      transition: transform .6s cubic-bezier(0.16,1,0.3,1);
    }
    .obs-feat:hover .obs-feat-img { transform: scale(1.04); }
    .obs-feat-blank {
      min-height: 240px;
    }
    .obs-feat-photo-grad {
      position: absolute; inset: 0;
      background: linear-gradient(to right, transparent 60%, #111 100%);
      pointer-events: none;
    }
    @media (max-width: 680px) {
      .obs-feat-photo-grad { background: linear-gradient(to top, #111 0%, transparent 60%); }
    }
    .obs-feat-body {
      padding: 2.25rem 2.25rem 2rem;
      display: flex; flex-direction: column;
      justify-content: center; gap: .875rem;
    }
    @media (max-width: 680px) { .obs-feat-body { padding: 1.5rem; } }
    .obs-feat-cat {
      font-size: .625rem; font-weight: 800;
      letter-spacing: .18em; text-transform: uppercase;
      color: var(--color-brand);
    }
    .obs-feat-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: clamp(1.5rem, 2.5vw, 1.875rem);
      font-weight: 400; color: white;
      margin: 0; line-height: 1.18; letter-spacing: -.01em;
    }
    .obs-feat-desc {
      font-size: .9375rem; color: rgba(255,255,255,.45);
      line-height: 1.65; margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .obs-feat-foot {
      display: flex; align-items: center;
      justify-content: space-between; gap: 1rem;
      flex-wrap: wrap; margin-top: .5rem;
    }

    /* ── Grid ──────────────────────────────────────────── */
    .obs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
    }
    @media (max-width: 1100px) { .obs-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 580px)  { .obs-grid { grid-template-columns: 1fr; } }

    /* ── Card ──────────────────────────────────────────── */
    .obs-card {
      background: #111; border-radius: 16px;
      border: 1px solid rgba(255,255,255,.06);
      overflow: hidden; cursor: pointer;
      display: flex; flex-direction: column;
      transition: border-color .3s, transform .3s, box-shadow .3s;
    }
    .obs-card:hover {
      border-color: rgba(255,255,255,.14);
      transform: translateY(-4px);
      box-shadow: 0 20px 56px rgba(0,0,0,.5);
    }
    .obs-card-photo {
      position: relative; overflow: hidden;
      background: #1a1a1a; aspect-ratio: 16/10;
    }
    .obs-card-img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform .55s cubic-bezier(0.16,1,0.3,1);
    }
    .obs-card:hover .obs-card-img { transform: scale(1.06); }
    .obs-card-body {
      padding: 1.25rem; flex: 1;
      display: flex; flex-direction: column; gap: .5rem;
    }
    .obs-card-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.125rem; font-weight: 400;
      color: white; margin: 0; line-height: 1.25;
    }
    .obs-card-desc {
      font-size: .8125rem; color: rgba(255,255,255,.38);
      line-height: 1.55; margin: 0; flex: 1;
      display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .obs-card-foot {
      display: flex; align-items: center;
      justify-content: space-between; gap: .5rem;
      flex-wrap: wrap; margin-top: auto; padding-top: .75rem;
      border-top: 1px solid rgba(255,255,255,.05);
    }
    .obs-card-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.125rem; color: var(--color-brand);
    }

    /* ── Badge ─────────────────────────────────────────── */
    .obs-badge {
      position: absolute; top: 10px; left: 10px;
      padding: 3px 9px; border-radius: 999px;
      font-size: .5625rem; font-weight: 800;
      letter-spacing: .1em; text-transform: uppercase; color: white;
    }
    .obs-badge-sm { font-size: .5625rem; top: 8px; left: 8px; padding: 2px 7px; }
    .obs-badge-inline { position: static; display: inline-flex; }
    .obs-badge-popular    { background: #e67e22; }
    .obs-badge-new        { background: var(--color-brand); }
    .obs-badge-vegetarian { background: #27ae60; }
    .obs-badge-spicy      { background: #c0392b; }

    /* ── Photo blank ───────────────────────────────────── */
    .obs-photo-blank {
      width: 100%; aspect-ratio: 16/10;
      display: flex; align-items: center; justify-content: center;
      font-size: 2.5rem; opacity: .25;
      background: #181818;
    }

    /* ── Prices ────────────────────────────────────────── */
    .obs-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.5rem; font-weight: 400;
      color: var(--color-brand);
    }

    /* ── Cart controls ─────────────────────────────────── */
    .obs-qty-row { display: flex; align-items: center; gap: .5rem; }
    .obs-qty-btn {
      width: 30px; height: 30px; border-radius: 50%;
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.12);
      color: white; font-size: 1rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .obs-qty-btn:hover { background: rgba(255,255,255,.14); }
    .obs-qty-btn-xs { width: 24px; height: 24px; font-size: .875rem; }
    .obs-qty-val { font-size: .9375rem; font-weight: 700; color: white; min-width: 18px; text-align: center; }
    .obs-qty-val-xs { font-size: .8125rem; }
    .obs-add-btn {
      padding: .4375rem 1.125rem;
      border-radius: 999px;
      border: 1px solid var(--color-brand);
      background: transparent; color: var(--color-brand);
      font-size: .8125rem; font-weight: 700;
      cursor: pointer; white-space: nowrap;
      transition: background .2s, color .2s, transform .15s;
    }
    .obs-add-btn:hover { background: var(--color-brand); color: white; }
    .obs-add-ok { background: #27ae60 !important; border-color: #27ae60 !important; color: white !important; }
    .obs-add-xs {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1px solid var(--color-brand);
      background: transparent; color: var(--color-brand);
      font-size: 1.0625rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .2s, color .2s;
    }
    .obs-add-xs:hover { background: var(--color-brand); color: white; }

    /* ── Hours band ────────────────────────────────────── */
    .obs-hours-band {
      background: rgba(255,255,255,.025);
      border-top: 1px solid rgba(255,255,255,.06);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .obs-hours-inner {
      display: flex; justify-content: center; flex-wrap: wrap;
      max-width: 900px; margin: 0 auto;
    }
    .obs-hday {
      display: flex; flex-direction: column; align-items: center;
      padding: 1rem 1.25rem;
      border-right: 1px solid rgba(255,255,255,.05);
      flex: 1; min-width: 80px;
      transition: background .2s;
    }
    .obs-hday:last-child { border-right: none; }
    .obs-hday-lbl {
      font-size: .5625rem; font-weight: 800; color: rgba(255,255,255,.3);
      text-transform: uppercase; letter-spacing: .1em; margin-bottom: 5px;
    }
    .obs-hday-time {
      font-size: .8125rem; color: rgba(255,255,255,.55); font-weight: 500;
      letter-spacing: .01em;
    }
    .obs-hday-today { background: rgba(255,255,255,.04); }
    .obs-hday-today .obs-hday-lbl { color: var(--color-brand); }
    .obs-hday-today .obs-hday-time { color: white; font-weight: 700; }
    .obs-hday-closed .obs-hday-time { color: rgba(255,255,255,.2); font-style: italic; }
    @media (max-width: 600px) {
      .obs-hday { padding: .75rem .625rem; min-width: 56px; }
      .obs-hday-time { font-size: .75rem; }
    }

    /* ── Footer ────────────────────────────────────────── */
    .obs-footer {
      display: flex; flex-direction: column; align-items: center;
      gap: .625rem; padding: 4rem 1.5rem 5rem;
      border-top: 1px solid rgba(255,255,255,.06); text-align: center;
    }
    .obs-foot-logo-wrap { display: flex; align-items: center; gap: .75rem; }
    .obs-foot-logo { width: 36px; height: 36px; object-fit: cover; border-radius: 8px; opacity: .5; }
    .obs-foot-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.25rem; color: rgba(255,255,255,.25);
    }
    .obs-foot-detail { font-size: .8125rem; color: rgba(255,255,255,.18); text-decoration: none; }
    a.obs-foot-detail:hover { color: rgba(255,255,255,.35); }

    /* ── Sheet ─────────────────────────────────────────── */
    .obs-sheet-bd {
      position: fixed; inset: 0; z-index: 200;
      background: rgba(0,0,0,.72);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      animation: obs-bd-in .25s ease;
    }
    @keyframes obs-bd-in { from { opacity: 0; } to { opacity: 1; } }
    .obs-sheet {
      position: fixed; bottom: 0; left: 0; right: 0;
      z-index: 201; background: #151515;
      border-radius: 24px 24px 0 0;
      border-top: 1px solid rgba(255,255,255,.09);
      max-height: 88vh; overflow-y: auto;
      animation: obs-sh-up .38s cubic-bezier(0.16,1,0.3,1);
      scrollbar-width: none;
    }
    .obs-sheet::-webkit-scrollbar { display: none; }
    @keyframes obs-sh-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .obs-sheet-handle {
      width: 36px; height: 4px;
      background: rgba(255,255,255,.14); border-radius: 2px;
      margin: 14px auto 0;
    }
    .obs-sheet-img-wrap { position: relative; height: 230px; overflow: hidden; margin-top: 1rem; }
    .obs-sheet-img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .obs-sheet-img-grad {
      position: absolute; bottom: 0; left: 0; right: 0;
      height: 90px;
      background: linear-gradient(to top, #151515, transparent);
    }
    .obs-sheet-body { padding: 1.5rem 1.5rem 3rem; }
    .obs-sheet-top {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 1rem;
    }
    .obs-sheet-price {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.875rem; color: var(--color-brand);
    }
    .obs-sheet-name {
      font-family: var(--font-display, 'DM Serif Display', serif);
      font-size: 1.75rem; font-weight: 400;
      color: white; margin: 0 0 .875rem; letter-spacing: -.015em;
    }
    .obs-sheet-desc {
      font-size: .9375rem; color: rgba(255,255,255,.5);
      line-height: 1.7; margin: 0 0 2rem;
    }
    .obs-sheet-actions { margin-bottom: .875rem; }
    .obs-sheet-qty {
      display: flex; align-items: center; justify-content: center; gap: 1.75rem;
      padding: 1.25rem;
      background: rgba(255,255,255,.04); border-radius: 14px;
    }
    .obs-qty-lg {
      width: 48px; height: 48px; border-radius: 50%;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.12);
      color: white; font-size: 1.375rem; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .obs-qty-lg:hover { background: rgba(255,255,255,.15); }
    .obs-qty-lg-val { font-size: 1.625rem; font-weight: 700; color: white; min-width: 36px; text-align: center; }
    .obs-sheet-cta {
      width: 100%; padding: 1.0625rem;
      border-radius: 14px; border: none;
      background: var(--color-brand);
      color: white; font-size: 1rem; font-weight: 700;
      cursor: pointer; letter-spacing: -.01em;
      transition: opacity .2s, transform .15s;
    }
    .obs-sheet-cta:hover { opacity: .9; transform: translateY(-1px); }
    .obs-sheet-cancel {
      width: 100%; padding: .875rem;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.1);
      background: transparent;
      color: rgba(255,255,255,.45);
      font-size: .9375rem; cursor: pointer;
      transition: border-color .2s, color .2s;
    }
    .obs-sheet-cancel:hover { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.65); }
  `],
})
export class TemplateZenComponent implements AfterViewInit, OnDestroy {
  @Input() restaurant: Restaurant | null = null
  @Input() categories: Category[] = []
  @Input() cart: CartItem[] = []
  @Input() cartCount = 0
  @Input() hasOrders = false
  @Input() loading = false

  @Output() addToCart    = new EventEmitter<MenuItem>()
  @Output() removeFromCart = new EventEmitter<number>()
  @Output() openCart     = new EventEmitter<void>()

  private readonly platformId = inject(PLATFORM_ID)

  readonly activeCatId = signal<number>(0)
  readonly sheetItem   = signal<MenuItem | null>(null)
  readonly addedId     = signal<number | null>(null)
  readonly scrolled    = signal(false)

  private observers: IntersectionObserver[] = []
  private scrollHandler = () => this.scrolled.set(window.scrollY > 50)

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    window.addEventListener('scroll', this.scrollHandler, { passive: true })
    setTimeout(() => {
      this.setupCatObserver()
      this.setupEnterObserver()
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
            const id = Number((e.target as HTMLElement).id.replace('obs-', ''))
            if (id) this.activeCatId.set(id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
    )
    document.querySelectorAll('[id^="obs-"]').forEach(el => o.observe(el))
    this.observers.push(o)
  }

  private setupEnterObserver(): void {
    const o = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            ;(e.target as HTMLElement).classList.add('obs-in')
            o.unobserve(e.target)
          }
        }
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.obs-enter').forEach(el => o.observe(el))
    this.observers.push(o)
  }

  scrollTo(catId: number): void {
    document.getElementById(`obs-${catId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  openSheet(item: MenuItem): void  { this.sheetItem.set(item) }
  closeSheet(): void                { this.sheetItem.set(null) }

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
