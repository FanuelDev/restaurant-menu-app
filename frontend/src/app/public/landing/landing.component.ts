import { Component, signal, computed, AfterViewInit, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { take } from 'rxjs/operators'
import { SubscriptionService } from '../../shared/services/subscription.service'
import type { Plan, BillingCycle } from '../../shared/models'

interface Feature { icon: string; color: string; badge?: string }

const FEATURES: Feature[] = [
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`, color: '#C0392B' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`, color: '#2563EB' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, color: '#16A34A' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`, color: '#D97706' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`, color: '#8E44AD' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`, color: '#0891B2' },
  { icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`, color: '#7C3AED', badge: 'Enterprise' },
]

const STEPS = ['01', '02', '03']

const TESTIMONIALS = [
  { name: 'Aminata Koné',   initial: 'A', color: '#E67E22', restaurant: 'Le Bistrot Lagune — Abidjan' },
  { name: 'Oumar Diallo',   initial: 'O', color: '#27AE60', restaurant: 'Chez Oumar — Dakar' },
  { name: 'Ibrahim Traoré', initial: 'I', color: '#8E44AD', restaurant: 'Saveurs du Sahel — Ouagadougou' },
]

const FAQ_INDICES = [0, 1, 2, 3, 4]

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
    <!-- ── Nav ─────────────────────────────────────────────── -->
    <nav class="lp-nav" [class.lp-nav-scrolled]="scrolled()">
      <div class="lp-nav-inner">
        <a routerLink="/" class="lp-nav-logo">
          <div class="lp-logo-icon">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="lp-logo-name">SaeMenus</span>
        </a>

        <div class="lp-nav-links">
          <a href="#features" class="lp-nav-link" (click)="scrollTo($event, 'features')">{{ t('public.landing.navFeatures') }}</a>
          <a href="#how" class="lp-nav-link" (click)="scrollTo($event, 'how')">{{ t('public.landing.navHow') }}</a>
          <a href="#download" class="lp-nav-link" (click)="scrollTo($event, 'download')">{{ t('public.landing.navDownload') }}</a>
          <a href="#pricing" class="lp-nav-link" (click)="scrollTo($event, 'pricing')">{{ t('public.landing.navPricing') }}</a>
        </div>

        <div class="lp-nav-ctas">
          <a routerLink="/login" class="lp-nav-login">{{ t('public.landing.navLogin') }}</a>
          <a routerLink="/register" class="lp-nav-cta">
            {{ t('public.landing.navRegister') }}
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4" stroke-linejoin="round"/></svg>
          </a>
        </div>

        <button class="lp-mobile-menu" (click)="mobileOpen.set(!mobileOpen())" [attr.aria-expanded]="mobileOpen()">
          @if (!mobileOpen()) {
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          } @else {
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          }
        </button>
      </div>

      @if (mobileOpen()) {
        <div class="lp-mobile-drawer">
          <a href="#features" class="lp-mobile-link" (click)="scrollTo($event, 'features'); mobileOpen.set(false)">{{ t('public.landing.navFeatures') }}</a>
          <a href="#how" class="lp-mobile-link" (click)="scrollTo($event, 'how'); mobileOpen.set(false)">{{ t('public.landing.navHow') }}</a>
          <a href="#download" class="lp-mobile-link" (click)="scrollTo($event, 'download'); mobileOpen.set(false)">{{ t('public.landing.navDownload') }}</a>
          <a href="#pricing" class="lp-mobile-link" (click)="scrollTo($event, 'pricing'); mobileOpen.set(false)">{{ t('public.landing.navPricing') }}</a>
          <div class="lp-mobile-sep"></div>
          <a routerLink="/login" class="lp-mobile-link">{{ t('public.landing.navLogin') }}</a>
          <a routerLink="/register" class="lp-mobile-cta">{{ t('public.landing.navMobileCta') }}</a>
        </div>
      }
    </nav>

    <!-- ── Hero ─────────────────────────────────────────────── -->
    <section class="lp-hero">
      <div class="hero-blobs" aria-hidden="true">
        <div class="hero-blob-1"></div>
        <div class="hero-blob-2"></div>
        <div class="hero-blob-3"></div>
      </div>

      <div class="lp-container hero-layout">
        <div class="hero-copy">
          <div class="hero-badge">
            <span class="hero-badge-dot"></span>
            {{ t('public.landing.heroBadge') }}
          </div>

          <h1 class="hero-h1">
            {{ t('public.landing.heroH1Line1') }}<br>
            <em class="hero-accent">{{ t('public.landing.heroH1Accent') }}</em>
          </h1>

          <p class="hero-desc">{{ t('public.landing.heroDesc') }}</p>

          <div class="hero-ctas">
            <a routerLink="/register" class="btn-hero-primary">
              {{ t('public.landing.heroPrimaryBtn') }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how" class="btn-hero-ghost" (click)="scrollTo($event, 'how')">
              <span class="btn-play">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9"/></svg>
              </span>
              {{ t('public.landing.heroSecondaryBtn') }}
            </a>
          </div>

          <div class="hero-proof">
            <div class="proof-avs">
              <span class="proof-av" style="background:#E67E22">A</span>
              <span class="proof-av" style="background:#27AE60">O</span>
              <span class="proof-av" style="background:#8E44AD">I</span>
              <span class="proof-av" style="background:#2563EB">M</span>
            </div>
            <div>
              <div class="proof-stars">★★★★★</div>
              <div class="proof-label">{{ t('public.landing.heroProofLabel') }}</div>
            </div>
          </div>
        </div>

        <div class="hero-visual" aria-hidden="true">
          <div class="mock-glow"></div>

          <!-- Browser mockup — admin dashboard -->
          <div class="mock-browser">
            <div class="mock-chrome">
              <div class="mock-dots">
                <span class="mock-dot" style="background:#FF5F57"></span>
                <span class="mock-dot" style="background:#FEBC2E"></span>
                <span class="mock-dot" style="background:#28C840"></span>
              </div>
              <div class="mock-url">saemenus.com/admin/dashboard</div>
            </div>
            <div class="mock-body">
              <div class="mock-sidebar">
                <div class="mock-logo-sq"></div>
                <div class="mock-nav-items">
                  <div class="mock-nav-item mock-nav-active"></div>
                  <div class="mock-nav-item"></div>
                  <div class="mock-nav-item"></div>
                  <div class="mock-nav-item"></div>
                  <div class="mock-nav-item"></div>
                </div>
              </div>
              <div class="mock-main">
                <div class="mock-toprow">
                  <div class="mock-greeting">
                    <div class="mock-line mock-line-lg"></div>
                    <div class="mock-line mock-line-sm" style="width:55%"></div>
                  </div>
                  <div class="mock-avatar-sm"></div>
                </div>
                <div class="mock-kpis">
                  <div class="mock-kpi" style="--kc:#FFF0F0;--kb:#C0392B">
                    <div class="mock-kpi-top"></div>
                    <div class="mock-kpi-val" style="color:#C0392B"></div>
                    <div class="mock-kpi-lbl"></div>
                  </div>
                  <div class="mock-kpi" style="--kc:#EFF6FF;--kb:#2563EB">
                    <div class="mock-kpi-top"></div>
                    <div class="mock-kpi-val" style="color:#2563EB"></div>
                    <div class="mock-kpi-lbl"></div>
                  </div>
                  <div class="mock-kpi" style="--kc:#F0FDF4;--kb:#16A34A">
                    <div class="mock-kpi-top"></div>
                    <div class="mock-kpi-val" style="color:#16A34A"></div>
                    <div class="mock-kpi-lbl"></div>
                  </div>
                  <div class="mock-kpi" style="--kc:#FFFBEB;--kb:#D97706">
                    <div class="mock-kpi-top"></div>
                    <div class="mock-kpi-val" style="color:#D97706"></div>
                    <div class="mock-kpi-lbl"></div>
                  </div>
                </div>
                <div class="mock-section-title"></div>
                <div class="mock-item-list">
                  @for (i of [1,2,3,4]; track i) {
                    <div class="mock-item-row">
                      <div class="mock-item-img" [style.background]="itemColors[i-1]"></div>
                      <div class="mock-item-info">
                        <div class="mock-line" [style.width]="itemWidths[i-1]"></div>
                        <div class="mock-line mock-line-xs" style="width:50%"></div>
                      </div>
                      <div class="mock-item-price"></div>
                      <div class="mock-item-dot" [class.mock-dot-green]="i !== 3"></div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>

          <!-- Phone mockup — customer menu -->
          <div class="mock-phone">
            <div class="mock-phone-notch"></div>
            <div class="mock-phone-hero" style="background: linear-gradient(145deg, #B03020, #4A0A06)">
              <div class="mock-ph-logo"></div>
              <div class="mock-ph-name"></div>
              <div class="mock-ph-sub"></div>
            </div>
            <div class="mock-phone-body">
              <div class="mock-ph-cats">
                <div class="mock-ph-cat mock-ph-cat-active"></div>
                <div class="mock-ph-cat"></div>
                <div class="mock-ph-cat"></div>
              </div>
              @for (i of [1,2]; track i) {
                <div class="mock-ph-card">
                  <div class="mock-ph-card-img" [style.background]="phoneCardColors[i-1]"></div>
                  <div class="mock-ph-card-body">
                    <div class="mock-line" style="width:80%"></div>
                    <div class="mock-line mock-line-xs" style="width:55%"></div>
                    <div class="mock-ph-price"></div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Trusted bar ──────────────────────────────────────── -->
    <div class="lp-trusted">
      <div class="lp-container">
        <span class="trusted-label">{{ t('public.landing.trustedLabel') }}</span>
        <div class="trusted-logos">
          @for (name of trustedNames; track name) {
            <span class="trusted-name">{{ name }}</span>
          }
        </div>
      </div>
    </div>

    <!-- ── Features ─────────────────────────────────────────── -->
    <section class="lp-section lp-features" id="features">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">{{ t('public.landing.featuresTag') }}</div>
          <h2 class="section-h2">{{ t('public.landing.featuresH2') }}</h2>
          <p class="section-sub">{{ t('public.landing.featuresSub') }}</p>
        </div>
        <div class="features-grid">
          @for (f of features; track f.color; let i = $index) {
            <div class="feat-card reveal" [attr.data-delay]="i % 3">
              <div class="feat-icon" [style.background]="f.color + '18'" [style.color]="f.color" [innerHTML]="f.icon"></div>
              <h3 class="feat-title">{{ t('public.landing.feat' + i + 'title') }}</h3>
              @if (f.badge) {
                <span class="feat-badge">{{ f.badge }}</span>
              }
              <p class="feat-desc">{{ t('public.landing.feat' + i + 'desc') }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Product showcase ─────────────────────────────────── -->
    <section class="lp-showcase">
      <div class="lp-container showcase-layout">
        <div class="showcase-copy reveal">
          <div class="section-tag">{{ t('public.landing.showcaseTag') }}</div>
          <h2 class="section-h2">{{ t('public.landing.showcaseH2') }}</h2>
          <p class="section-sub" style="max-width:420px">{{ t('public.landing.showcaseSub') }}</p>
          <ul class="showcase-list">
            @for (i of [1,2,3,4]; track i) {
              <li>
                <span class="showcase-check">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                {{ t('public.landing.showcaseList' + i) }}
              </li>
            }
          </ul>
          <a routerLink="/register" class="btn-showcase">
            {{ t('public.landing.showcaseTryBtn') }}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <div class="showcase-visual reveal" data-delay="1">
          <div class="showcase-screen">
            <div class="mock-chrome mock-chrome-sm">
              <div class="mock-dots">
                <span class="mock-dot" style="background:#FF5F57"></span>
                <span class="mock-dot" style="background:#FEBC2E"></span>
                <span class="mock-dot" style="background:#28C840"></span>
              </div>
              <div class="mock-url">saemenus.com/admin/menu-items</div>
            </div>
            <div class="sc-content">
              <div class="sc-filter-row">
                <div class="sc-tag sc-tag-active">Tous</div>
                <div class="sc-tag">Entrées</div>
                <div class="sc-tag">Plats</div>
                <div class="sc-tag">Desserts</div>
              </div>
              <div class="sc-grid">
                @for (c of cardData; track c.color) {
                  <div class="sc-card">
                    <div class="sc-card-img" [style.background]="c.color"></div>
                    <div class="sc-card-body">
                      <div class="mock-line" style="width:85%"></div>
                      <div class="mock-line mock-line-xs" style="width:60%"></div>
                      <div class="sc-card-footer">
                        <div class="sc-price"></div>
                        <div class="sc-toggle-sm" [class.sc-toggle-on]="c.on"></div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── How it works ─────────────────────────────────────── -->
    <section class="lp-section lp-how" id="how">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">{{ t('public.landing.howTag') }}</div>
          <h2 class="section-h2">{{ t('public.landing.howH2') }}</h2>
          <p class="section-sub">{{ t('public.landing.howSub') }}</p>
        </div>

        <div class="steps-layout">
          <div class="steps-connector" aria-hidden="true"></div>
          @for (num of steps; track num; let i = $index) {
            <div class="step-card reveal" [attr.data-delay]="i">
              <div class="step-num">{{ num }}</div>
              <h3 class="step-title">{{ t('public.landing.step' + i + 'title') }}</h3>
              <p class="step-desc">{{ t('public.landing.step' + i + 'desc') }}</p>
              <div class="step-badge">{{ t('public.landing.step' + i + 'highlight') }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Stats ────────────────────────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-container stats-grid">
        <div class="stat-item reveal">
          <div class="stat-val">1 200+</div>
          <div class="stat-label">{{ t('public.landing.stat1label') }}</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="1">
          <div class="stat-val">14</div>
          <div class="stat-label">{{ t('public.landing.stat2label') }}</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="2">
          <div class="stat-val">5 min</div>
          <div class="stat-label">{{ t('public.landing.stat3label') }}</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="3">
          <div class="stat-val">4.9 ★</div>
          <div class="stat-label">{{ t('public.landing.stat4label') }}</div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ─────────────────────────────────────── -->
    <section class="lp-section lp-testimonials">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">{{ t('public.landing.testiTag') }}</div>
          <h2 class="section-h2">{{ t('public.landing.testiH2') }}</h2>
        </div>
        <div class="testimonials-grid">
          @for (testi of testimonials; track testi.name; let i = $index) {
            <div class="testi-card reveal" [attr.data-delay]="i">
              <div class="testi-quote-mark">"</div>
              <p class="testi-text">{{ t('public.landing.testi' + i + 'quote') }}</p>
              <div class="testi-author">
                <div class="testi-av" [style.background]="testi.color">{{ testi.initial }}</div>
                <div>
                  <div class="testi-name">{{ testi.name }}</div>
                  <div class="testi-role">{{ t('public.landing.testi' + i + 'role') }} · {{ testi.restaurant }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Download Apps ────────────────────────────────────── -->
    <section class="lp-download" id="download">
      <div class="dl-blobs" aria-hidden="true">
        <div class="dl-blob-1"></div>
        <div class="dl-blob-2"></div>
      </div>
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag dl-tag">{{ t('public.landing.downloadTag') }}</div>
          <h2 class="section-h2 dl-h2">{{ t('public.landing.downloadH2') }}</h2>
          <p class="section-sub dl-sub">{{ t('public.landing.downloadSub') }}</p>
        </div>

        <div class="dl-grid">

          <!-- ── Mobile card ─────────────────────────────── -->
          <div class="dl-card reveal">
            <div class="dl-card-top">
              <div class="dl-card-icon dl-icon-mobile">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
              </div>
              <span class="dl-badge dl-badge-soon">{{ t('public.landing.downloadSoonLabel') }}</span>
            </div>
            <h3 class="dl-card-title">{{ t('public.landing.downloadMobileTitle') }}</h3>
            <p class="dl-card-desc">{{ t('public.landing.downloadMobileDesc') }}</p>

            <div class="dl-visual dl-visual-mobile" aria-hidden="true">
              <div class="dl-phone">
                <div class="dl-phone-notch"></div>
                <div class="dl-phone-screen">
                  <div class="dl-phone-header">
                    <div class="dl-ph-logo"></div>
                    <div class="dl-ph-name"></div>
                  </div>
                  <div class="dl-phone-content">
                    <div class="dl-ph-row">
                      <div class="dl-ph-chip dl-ph-chip-on"></div>
                      <div class="dl-ph-chip"></div>
                      <div class="dl-ph-chip"></div>
                    </div>
                    <div class="dl-ph-card">
                      <div class="dl-ph-card-img" style="background:linear-gradient(135deg,#C0392B,#6b1a12)"></div>
                      <div class="dl-ph-card-info"><div class="dl-ph-line"></div><div class="dl-ph-line" style="width:60%;opacity:.5"></div></div>
                    </div>
                    <div class="dl-ph-card">
                      <div class="dl-ph-card-img" style="background:linear-gradient(135deg,#D97706,#7c4200)"></div>
                      <div class="dl-ph-card-info"><div class="dl-ph-line"></div><div class="dl-ph-line" style="width:75%;opacity:.5"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="dl-store-btns">
              <a href="#" class="dl-store-btn dl-store-disabled" tabindex="-1" aria-disabled="true">
                <svg width="18" height="18" viewBox="0 0 814 1000" fill="currentColor"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 71 0 130.5 46.4 174.9 46.4 42.7 0 109.2-49.5 188.2-49.5 30.2 0 130.3 2.6 198 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
                <div class="dl-store-text">
                  <span class="dl-store-label">{{ t('public.landing.downloadOnThe') }}</span>
                  <span class="dl-store-name">App Store</span>
                </div>
              </a>
              <a href="#" class="dl-store-btn dl-store-disabled" tabindex="-1" aria-disabled="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.76c.3.17.64.24.99.2l12.6-12.6-2.61-2.62L3.18 23.76zm17.12-9.44c.42-.25.7-.7.7-1.32s-.28-1.07-.7-1.32l-2.79-1.6-3.06 3.06 3.06 3.06 2.79-1.88zM2.13.3C1.7.56 1.44 1.04 1.44 1.66v20.68c0 .62.26 1.1.69 1.36l.08.04L13.77 12 2.21.26.13.3zm11.34 11.01L2.13.3l10.75 10.76L14.27.26 13.47 11.31z"/></svg>
                <div class="dl-store-text">
                  <span class="dl-store-label">{{ t('public.landing.downloadGetOn') }}</span>
                  <span class="dl-store-name">Google Play</span>
                </div>
              </a>
            </div>
            <p class="dl-coming-soon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ t('public.landing.downloadMobileSoon') }}
            </p>
          </div>

          <!-- ── Desktop card ────────────────────────────── -->
          <div class="dl-card dl-card-featured reveal" data-delay="1">
            <div class="dl-card-top">
              <div class="dl-card-icon dl-icon-desktop">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              </div>
              <span class="dl-badge dl-badge-ready">{{ t('public.landing.downloadReadyLabel') }}</span>
            </div>
            <h3 class="dl-card-title">{{ t('public.landing.downloadDesktopTitle') }}</h3>
            <p class="dl-card-desc">{{ t('public.landing.downloadDesktopDesc') }}</p>

            <div class="dl-visual dl-visual-desktop" aria-hidden="true">
              <div class="dl-laptop">
                <div class="dl-laptop-screen">
                  <div class="dl-ls-bar">
                    <div class="dl-ls-logo"></div>
                    <div class="dl-ls-title"></div>
                    <div class="dl-ls-controls">
                      <span class="dl-ls-dot"></span>
                      <span class="dl-ls-dot"></span>
                      <span class="dl-ls-dot dl-ls-close"></span>
                    </div>
                  </div>
                  <div class="dl-ls-body">
                    <div class="dl-ls-sidebar">
                      <div class="dl-ls-sq"></div>
                      <div class="dl-ls-nav-item dl-ls-nav-active"></div>
                      <div class="dl-ls-nav-item"></div>
                      <div class="dl-ls-nav-item"></div>
                      <div class="dl-ls-nav-item"></div>
                    </div>
                    <div class="dl-ls-main">
                      <div class="dl-ls-kpis">
                        <div class="dl-ls-kpi" style="--kc:#C0392B"></div>
                        <div class="dl-ls-kpi" style="--kc:#2563EB"></div>
                        <div class="dl-ls-kpi" style="--kc:#16A34A"></div>
                      </div>
                      <div class="dl-ls-line"></div>
                      <div class="dl-ls-line" style="width:65%"></div>
                      <div class="dl-ls-line" style="width:80%"></div>
                    </div>
                  </div>
                </div>
                <div class="dl-laptop-base">
                  <div class="dl-laptop-foot"></div>
                </div>
              </div>
            </div>

            <a href="/downloads/SaeMenus-Setup-1.0.0.exe" class="dl-win-btn" download>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              {{ t('public.landing.downloadDesktopBtn') }}
            </a>
            <p class="dl-meta">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              {{ t('public.landing.downloadDesktopMeta') }}
            </p>
          </div>

        </div>
      </div>
    </section>

    <!-- ── Pricing ──────────────────────────────────────────── -->
    <section class="lp-section lp-pricing" id="pricing">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">{{ t('public.landing.pricingTag') }}</div>
          <h2 class="section-h2">{{ t('public.landing.pricingH2') }}</h2>
          <p class="section-sub">{{ t('public.landing.pricingSub') }}</p>
        </div>

        <div class="pricing-toggle reveal">
          <button [class.ptog-active]="cycle() === 'monthly'" (click)="cycle.set('monthly')">{{ t('public.pricing.monthly') }}</button>
          <button [class.ptog-active]="cycle() === 'yearly'" (click)="cycle.set('yearly')">
            {{ t('public.pricing.yearly') }}
            @if (bestSavingPct() > 0) {
              <span class="ptog-save">−{{ bestSavingPct() }}%</span>
            }
          </button>
        </div>

        @if (plansLoading()) {
          <div class="pricing-grid">
            @for (_ of [1,2,3]; track $index) {
              <div class="price-card" style="opacity:.5">
                <div class="skeleton" style="height:20px;width:55%;margin-bottom:16px;border-radius:6px;background:var(--gray-200)"></div>
                <div class="skeleton" style="height:40px;width:40%;margin-bottom:16px;border-radius:6px;background:var(--gray-200)"></div>
                <div class="skeleton" style="height:14px;width:80%;margin-bottom:8px;border-radius:4px;background:var(--gray-200)"></div>
                <div class="skeleton" style="height:14px;width:65%;margin-bottom:24px;border-radius:4px;background:var(--gray-200)"></div>
                @for (_ of [1,2,3]; track $index) {
                  <div class="skeleton" style="height:12px;width:85%;margin-bottom:12px;border-radius:4px;background:var(--gray-200)"></div>
                }
                <div class="skeleton" style="height:44px;border-radius:99px;margin-top:24px;background:var(--gray-200)"></div>
              </div>
            }
          </div>
        } @else {
          <div class="pricing-grid" [style.--plan-cols]="plans().length">
            @for (plan of plans(); track plan.id; let i = $index) {
              <div class="price-card price-card-appear" [class.price-card-featured]="isFeatured(i)" [style.animation-delay]="(i * 100) + 'ms'">
                @if (isFeatured(i)) { <div class="price-badge">{{ t('public.landing.planFeatured') }}</div> }
                <div class="price-name">{{ plan.name }}</div>
                <div class="price-amount">
                  @if (plan.priceMonthlyCents === 0) {
                    <span class="price-val">{{ t('public.pricing.free') }}</span>
                  } @else {
                    <span class="price-val">{{ formatPrice(plan, cycle()) }}</span>
                    <span class="price-period">{{ cycle() === 'monthly' ? t('public.pricing.perMonth') : t('public.pricing.perYear') }}</span>
                  }
                </div>
                <p class="price-desc">{{ plan.description }}</p>
                <ul class="price-features">
                  @for (f of enabledFeatures(plan); track f) {
                    <li>
                      <span class="price-check" [class.price-check-featured]="isFeatured(i)">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      {{ f }}
                    </li>
                  }
                </ul>
                <a routerLink="/register" class="price-cta" [class.price-cta-featured]="isFeatured(i)">
                  {{ plan.priceMonthlyCents === 0 ? t('public.landing.planCTAfree') : t('public.landing.planCTApaid') }}
                </a>
              </div>
            }
          </div>
        }

        <p class="pricing-note reveal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {{ t('public.landing.pricingNote') }}
        </p>
      </div>
    </section>

    <!-- ── FAQ ──────────────────────────────────────────────── -->
    <section class="lp-section lp-faq">
      <div class="lp-container faq-layout">
        <div class="faq-left reveal">
          <div class="section-tag">{{ t('public.landing.faqTag') }}</div>
          <h2 class="section-h2" style="font-size:2rem">{{ t('public.landing.faqH2') }}</h2>
          <p class="section-sub" style="max-width:280px">{{ t('public.landing.faqSub') }}</p>
          <a href="mailto:hello@saemenus.com" class="faq-contact">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            hello&#64;saemenus.com
          </a>
        </div>
        <div class="faq-list reveal" data-delay="1">
          @for (i of faqIndices; track i) {
            <div class="faq-item" [class.faq-open]="openFaq() === i">
              <button class="faq-q" (click)="toggleFaq(i)">
                {{ t('public.landing.faq' + i + 'q') }}
                <span class="faq-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              @if (openFaq() === i) {
                <div class="faq-a">{{ t('public.landing.faq' + i + 'a') }}</div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Final CTA ─────────────────────────────────────────── -->
    <section class="lp-cta">
      <div class="lp-cta-bg" aria-hidden="true">
        <div class="cta-blob-1"></div>
        <div class="cta-blob-2"></div>
      </div>
      <div class="lp-container lp-cta-inner reveal">
        <div class="cta-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {{ t('public.landing.ctaBadge') }}
        </div>
        <h2 class="cta-h2">{{ t('public.landing.ctaH2Line1') }}<br>{{ t('public.landing.ctaH2Line2') }}</h2>
        <p class="cta-sub">{{ t('public.landing.ctaSub') }}</p>
        <div class="cta-btns">
          <a routerLink="/register" class="btn-cta-primary">
            {{ t('public.landing.ctaPrimaryBtn') }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a routerLink="/pricing" class="btn-cta-ghost">{{ t('public.landing.ctaGhostBtn') }}</a>
        </div>
      </div>
    </section>

    <!-- ── Footer ────────────────────────────────────────────── -->
    <footer class="lp-footer">
      <div class="lp-container footer-inner">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="lp-logo-icon">
              <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
                <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
                <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              </svg>
            </div>
            <span>SaeMenus</span>
          </div>
          <p class="footer-tagline">{{ t('public.landing.footerTagline') }}</p>
          <div class="footer-countries">CI · SN · ML · CM · BF · TG · BJ · GH</div>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">{{ t('public.landing.footerColProduct') }}</div>
          <a href="#features" class="footer-link" (click)="scrollTo($event, 'features')">{{ t('public.landing.footerLinkFeatures') }}</a>
          <a href="#pricing" class="footer-link" (click)="scrollTo($event, 'pricing')">{{ t('public.landing.footerLinkPricing') }}</a>
          <a href="#how" class="footer-link" (click)="scrollTo($event, 'how')">{{ t('public.landing.footerLinkHow') }}</a>
          <a routerLink="/pricing" class="footer-link">{{ t('public.landing.footerLinkDetailed') }}</a>
          <a routerLink="/guide" class="footer-link">{{ t('public.landing.footerLinkGuide') }}</a>
          <a href="#download" class="footer-link" (click)="scrollTo($event, 'download')">{{ t('public.landing.navDownload') }}</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">{{ t('public.landing.footerColAccount') }}</div>
          <a routerLink="/login" class="footer-link">{{ t('public.landing.footerLinkLogin') }}</a>
          <a routerLink="/register" class="footer-link">{{ t('public.landing.footerLinkRegister') }}</a>
          <a routerLink="/forgot-password" class="footer-link">{{ t('public.landing.footerLinkForgot') }}</a>
          <a routerLink="/faq" class="footer-link">{{ t('public.landing.footerLinkFaq') }}</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">{{ t('public.landing.footerColContact') }}</div>
          <a href="mailto:hello@saemenus.com" class="footer-link">hello&#64;saemenus.com</a>
          <a href="mailto:support@saemenus.com" class="footer-link">support&#64;saemenus.com</a>
          <div class="footer-col-title" style="margin-top:var(--space-4)">{{ t('public.landing.footerLinkLegal') }}</div>
          <a href="#" class="footer-link">{{ t('public.landing.footerLinkTos') }}</a>
          <a routerLink="/privacy" class="footer-link">{{ t('public.landing.footerLinkPrivacy') }}</a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="lp-container footer-bottom-inner">
          <span>{{ t('public.landing.footerCopy') }}</span>
          <span>{{ t('public.landing.footerMadeWith') }}</span>
        </div>
      </div>
    </footer>
    </ng-container>
  `,
  styles: [`
    /* ── Globals ────────────────────────────────────────── */
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }

    .lp-container { max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6); }

    .lp-section { padding: 120px 0; }
    @media (max-width: 768px) { .lp-section { padding: 80px 0; } }

    /* Reveal scroll animation */
    .reveal {
      opacity: 0;
      transform: translateY(24px) scale(0.985);
      transition: opacity .7s cubic-bezier(0.22,1,0.36,1), transform .7s cubic-bezier(0.22,1,0.36,1);
    }
    .reveal.visible { opacity: 1; transform: translateY(0) scale(1); }
    .reveal[data-delay="1"] { transition-delay: .08s; }
    .reveal[data-delay="2"] { transition-delay: .16s; }
    .reveal[data-delay="3"] { transition-delay: .24s; }
    .reveal[data-delay="4"] { transition-delay: .32s; }
    .reveal[data-delay="5"] { transition-delay: .40s; }
    @media (max-width: 768px) {
      .reveal { opacity: 1; transform: none; transition: none; }
    }

    /* Section headers */
    .section-head { text-align: center; margin-bottom: 72px; }
    .section-tag {
      display: inline-block; font-size: .75rem; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase;
      color: var(--brand); background: var(--brand-subtle);
      padding: var(--space-1) var(--space-3); border-radius: var(--radius-full);
      margin-bottom: var(--space-5);
      animation: fadeScaleIn .5s cubic-bezier(0.22,1,0.36,1) both;
    }
    @keyframes fadeScaleIn { from{opacity:0;transform:scale(.85)} to{opacity:1;transform:scale(1)} }
    .section-h2 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 2.75rem);
      color: var(--text-primary); margin: 0 0 var(--space-4); line-height: 1.15;
    }
    .section-sub { font-size: 1.0625rem; color: var(--text-secondary); margin: 0 auto; max-width: 560px; line-height: 1.7; }

    /* Mock lines (fake text) */
    .mock-line { height: 8px; background: var(--gray-150); border-radius: 4px; width: 100%; }
    .mock-line-lg { height: 12px; }
    .mock-line-sm { height: 8px; margin-top: 6px; }
    .mock-line-xs { height: 6px; margin-top: 5px; background: var(--gray-100); }

    /* ── Nav ────────────────────────────────────────────── */
    .lp-nav {
      position: fixed; top: 0; left: 0; right: 0; z-index: 100;
      background: rgba(255,255,255,.85); backdrop-filter: blur(12px);
      border-bottom: 1px solid transparent;
      transition: border-color .3s, box-shadow .3s;
    }
    .lp-nav-scrolled { border-bottom-color: var(--border); box-shadow: var(--shadow-sm); }
    .lp-nav-inner {
      max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6);
      height: 66px; display: flex; align-items: center; gap: var(--space-8);
    }
    .lp-nav-logo {
      display: flex; align-items: center; gap: var(--space-3);
      text-decoration: none; flex-shrink: 0;
    }
    .lp-logo-icon {
      width: 34px; height: 34px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 2px 8px rgba(192,57,43,.35);
    }
    .lp-logo-name { font-weight: 700; font-size: 1.0625rem; color: var(--text-primary); }

    .lp-nav-links { display: flex; gap: var(--space-1); flex: 1; }
    @media (max-width: 768px) { .lp-nav-links { display: none; } }
    .lp-nav-link {
      padding: var(--space-2) var(--space-3); font-size: .9375rem; color: var(--text-secondary);
      text-decoration: none; border-radius: var(--radius-md); font-weight: 500;
      transition: color var(--t-fast), background var(--t-fast);
      &:hover { color: var(--text-primary); background: var(--gray-50); }
    }
    .lp-nav-ctas { display: flex; align-items: center; gap: var(--space-3); margin-left: auto; }
    @media (max-width: 640px) { .lp-nav-ctas { display: none; } }
    .lp-nav-login {
      font-size: .9375rem; color: var(--text-secondary); text-decoration: none; font-weight: 500;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      transition: color var(--t-fast);
      &:hover { color: var(--text-primary); }
    }
    .lp-nav-cta {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-5); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 600;
      transition: background var(--t-fast), transform var(--t-fast), box-shadow var(--t-fast);
      box-shadow: 0 2px 10px rgba(192,57,43,.3);
      &:hover { background: var(--brand-dark); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(192,57,43,.4); }
    }
    .lp-mobile-menu {
      display: none; background: none; border: none; cursor: pointer;
      color: var(--text-primary); padding: var(--space-1); margin-left: auto;
    }
    @media (max-width: 640px) { .lp-mobile-menu { display: flex; } }
    .lp-mobile-drawer {
      padding: var(--space-4) var(--space-6) var(--space-5);
      border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: 2px;
      background: white;
    }
    .lp-mobile-link {
      padding: var(--space-3) var(--space-2); font-size: 1rem; color: var(--text-secondary);
      text-decoration: none; font-weight: 500; border-radius: var(--radius-md);
      &:hover { background: var(--gray-50); color: var(--text-primary); }
    }
    .lp-mobile-sep { height: 1px; background: var(--border); margin: var(--space-2) 0; }
    .lp-mobile-cta {
      display: block; text-align: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-3); border-radius: var(--radius-lg);
      font-weight: 700; font-size: .9375rem; margin-top: var(--space-2);
    }

    /* ── Hero ───────────────────────────────────────────── */
    .lp-hero {
      min-height: 100vh; display: flex; align-items: center;
      padding: 120px 0 80px; position: relative; overflow: hidden;
      background: white;
    }
    .hero-blobs { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
    .hero-blob-1 {
      position: absolute; width: 600px; height: 600px; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.07) 0%, transparent 70%);
      top: -100px; right: -100px;
    }
    .hero-blob-2 {
      position: absolute; width: 400px; height: 400px; border-radius: 50%;
      background: radial-gradient(circle, rgba(37,99,235,.05) 0%, transparent 70%);
      bottom: 50px; right: 300px;
    }
    .hero-blob-3 {
      position: absolute; width: 300px; height: 300px; border-radius: 50%;
      background: radial-gradient(circle, rgba(22,163,74,.05) 0%, transparent 70%);
      bottom: -50px; left: -50px;
    }
    .hero-layout {
      display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
    }
    @media (max-width: 1024px) { .hero-layout { grid-template-columns: 1fr; gap: 48px; } }

    /* Hero copy — staggered element animations */
    .hero-copy { }
    .hero-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: var(--brand-subtle); color: var(--brand);
      border: 1px solid rgba(192,57,43,.15); border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-4); font-size: .8125rem; font-weight: 600;
      margin-bottom: var(--space-5);
      animation: slideUpFade .65s cubic-bezier(0.22,1,0.36,1) .05s both;
    }
    .hero-badge-dot {
      width: 7px; height: 7px; background: var(--brand); border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.4)} }
    .hero-h1 {
      font-family: var(--font-display);
      font-size: clamp(2.6rem, 5vw, 4.25rem);
      color: var(--text-primary); margin: 0 0 var(--space-6); line-height: 1.1;
      letter-spacing: -.02em;
      animation: slideUpFade .7s cubic-bezier(0.22,1,0.36,1) .15s both;
    }
    .hero-accent { font-style: italic; color: var(--brand); }
    .hero-desc {
      font-size: 1.125rem; color: var(--text-secondary); line-height: 1.8;
      margin: 0 0 var(--space-9); max-width: 480px;
      animation: slideUpFade .65s cubic-bezier(0.22,1,0.36,1) .25s both;
    }
    .hero-ctas {
      display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap;
      margin-bottom: var(--space-10);
      animation: slideUpFade .65s cubic-bezier(0.22,1,0.36,1) .35s both;
    }
    .btn-hero-primary {
      display: inline-flex; align-items: center; gap: var(--space-3);
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-4) var(--space-8); border-radius: var(--radius-full);
      font-size: 1rem; font-weight: 700; letter-spacing: -.01em;
      box-shadow: 0 4px 20px rgba(192,57,43,.4);
      transition: all .25s cubic-bezier(0.22,1,0.36,1);
      &:hover { background: var(--brand-dark); transform: translateY(-2px); box-shadow: 0 8px 28px rgba(192,57,43,.45); }
    }
    .btn-hero-ghost {
      display: inline-flex; align-items: center; gap: var(--space-3);
      color: var(--text-primary); text-decoration: none;
      font-size: .9375rem; font-weight: 500;
      padding: var(--space-4) var(--space-2);
      transition: gap .25s cubic-bezier(0.22,1,0.36,1);
      &:hover { gap: var(--space-4); }
    }
    .btn-play {
      width: 40px; height: 40px; border-radius: 50%;
      background: var(--gray-100); display: inline-flex; align-items: center; justify-content: center;
      color: var(--text-primary); flex-shrink: 0;
      transition: background var(--t-fast), transform var(--t-fast);
    }
    .btn-hero-ghost:hover .btn-play { background: var(--gray-200); transform: scale(1.08); }
    .hero-proof {
      display: flex; align-items: center; gap: var(--space-4);
      animation: slideUpFade .6s cubic-bezier(0.22,1,0.36,1) .45s both;
    }
    .proof-avs { display: flex; }
    .proof-av {
      width: 34px; height: 34px; border-radius: 50%; color: white;
      font-size: .75rem; font-weight: 700; display: flex; align-items: center; justify-content: center;
      border: 2px solid white; margin-right: -8px; flex-shrink: 0;
    }
    .proof-av:last-child { margin-right: var(--space-3); }
    .proof-stars { color: #F59E0B; font-size: .9375rem; letter-spacing: .05em; }
    .proof-label { font-size: .8125rem; color: var(--text-muted); margin-top: 1px; }

    /* Hero visual */
    .hero-visual {
      position: relative;
      animation: slideRightFade .85s cubic-bezier(0.22,1,0.36,1) .1s both;
    }
    @media (max-width: 1024px) { .hero-visual { order: -1; } }
    .mock-glow {
      position: absolute; inset: -40px;
      background: radial-gradient(ellipse at 60% 40%, rgba(192,57,43,.12) 0%, transparent 65%);
      pointer-events: none;
    }

    /* Browser mockup */
    .mock-browser {
      background: white; border-radius: var(--radius-xl);
      box-shadow: 0 24px 64px rgba(0,0,0,.12), 0 0 0 1px rgba(0,0,0,.06);
      overflow: hidden; position: relative; z-index: 1;
    }
    .mock-chrome {
      background: var(--gray-100); padding: 10px 14px;
      display: flex; align-items: center; gap: var(--space-3);
      border-bottom: 1px solid var(--border);
    }
    .mock-chrome-sm { padding: 8px 12px; }
    .mock-dots { display: flex; gap: 5px; }
    .mock-dot { width: 11px; height: 11px; border-radius: 50%; }
    .mock-url {
      flex: 1; background: white; border-radius: var(--radius-sm);
      padding: 3px 10px; font-size: 10px; color: var(--text-muted);
      border: 1px solid var(--border); font-family: var(--font-body);
    }
    .mock-body { display: flex; height: 280px; }
    .mock-sidebar {
      width: 52px; background: white; border-right: 1px solid var(--border);
      padding: var(--space-3) var(--space-2); flex-shrink: 0;
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
    }
    .mock-logo-sq { width: 28px; height: 28px; background: var(--brand); border-radius: var(--radius-sm); }
    .mock-nav-items { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); width: 100%; }
    .mock-nav-item { height: 28px; border-radius: var(--radius-sm); background: var(--gray-100); }
    .mock-nav-active { background: var(--brand-subtle) !important; }
    .mock-main { flex: 1; padding: var(--space-4); overflow: hidden; }
    .mock-toprow { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-3); }
    .mock-greeting { flex: 1; margin-right: var(--space-3); }
    .mock-avatar-sm { width: 28px; height: 28px; border-radius: 50%; background: var(--brand-light); border: 1.5px solid var(--brand-mid); flex-shrink: 0; }
    .mock-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: var(--space-3); }
    .mock-kpi { background: var(--kc, #f5f5f5); border-radius: var(--radius-sm); padding: 6px; }
    .mock-kpi-top { height: 3px; background: var(--kb, #ccc); border-radius: 2px; margin-bottom: 5px; }
    .mock-kpi-val { height: 14px; background: currentColor; border-radius: 3px; opacity: .2; width: 55%; margin-bottom: 4px; }
    .mock-kpi-lbl { height: 6px; background: var(--gray-150); border-radius: 3px; width: 80%; }
    .mock-section-title { height: 8px; background: var(--gray-150); border-radius: 4px; width: 30%; margin-bottom: var(--space-2); }
    .mock-item-list { display: flex; flex-direction: column; gap: 6px; }
    .mock-item-row {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: var(--radius-sm); background: var(--gray-50);
    }
    .mock-item-img { width: 28px; height: 28px; border-radius: var(--radius-sm); flex-shrink: 0; }
    .mock-item-info { flex: 1; }
    .mock-item-price { width: 50px; height: 8px; background: var(--gray-200); border-radius: 3px; }
    .mock-item-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gray-200); flex-shrink: 0; }
    .mock-dot-green { background: var(--success) !important; }

    /* Phone mockup */
    .mock-phone {
      position: absolute; bottom: -20px; right: -36px; z-index: 2;
      width: 140px; background: white;
      border-radius: 22px; overflow: hidden;
      box-shadow: 0 16px 40px rgba(0,0,0,.16), 0 0 0 1px rgba(0,0,0,.07);
      animation: float 5s cubic-bezier(0.45,0.05,0.55,0.95) infinite;
    }
    @media (max-width: 1024px) { .mock-phone { display: none; } }
    .mock-phone-notch {
      height: 20px; background: var(--gray-900);
      display: flex; align-items: center; justify-content: center;
    }
    .mock-phone-hero { padding: var(--space-3) var(--space-3) var(--space-4); }
    .mock-ph-logo { width: 28px; height: 28px; background: rgba(255,255,255,.25); border-radius: var(--radius-sm); margin-bottom: var(--space-2); }
    .mock-ph-name { height: 8px; background: rgba(255,255,255,.7); border-radius: 3px; width: 75%; margin-bottom: 5px; }
    .mock-ph-sub  { height: 5px; background: rgba(255,255,255,.4); border-radius: 3px; width: 55%; }
    .mock-phone-body { padding: var(--space-2); }
    .mock-ph-cats { display: flex; gap: 4px; margin-bottom: var(--space-2); }
    .mock-ph-cat { height: 16px; border-radius: var(--radius-full); flex: 1; background: var(--gray-100); }
    .mock-ph-cat-active { background: var(--brand); }
    .mock-ph-card { background: var(--gray-50); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 5px; }
    .mock-ph-card-img { height: 50px; }
    .mock-ph-card-body { padding: 6px; }
    .mock-ph-price { height: 8px; background: var(--brand); border-radius: 3px; width: 45%; margin-top: 5px; opacity: .6; }

    /* ── Trusted ────────────────────────────────────────── */
    .lp-trusted {
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      background: var(--gray-50); padding: var(--space-6) 0;
    }
    .lp-trusted .lp-container { display: flex; align-items: center; gap: var(--space-6); flex-wrap: wrap; }
    .trusted-label { font-size: .8125rem; color: var(--text-muted); font-weight: 500; white-space: nowrap; flex-shrink: 0; }
    .trusted-logos { display: flex; gap: var(--space-6); flex-wrap: wrap; align-items: center; }
    .trusted-name { font-size: .9375rem; font-weight: 700; color: var(--gray-400); letter-spacing: -.01em; }

    /* ── Features ───────────────────────────────────────── */
    .lp-features { background: white; }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
    @media (max-width: 900px)  { .features-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 560px)  { .features-grid { grid-template-columns: 1fr; } }
    .feat-card {
      padding: var(--space-8); border-radius: var(--radius-xl);
      border: 1px solid var(--border); background: white;
      transition: box-shadow .35s cubic-bezier(0.22,1,0.36,1), transform .35s cubic-bezier(0.22,1,0.36,1);
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-5px); }
    }
    .feat-icon {
      width: 48px; height: 48px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-5);
    }
    .feat-title { font-size: 1.0625rem; font-weight: 700; margin: 0 0 var(--space-3); color: var(--text-primary); }
    .feat-badge { display: inline-block; font-size: 0.625rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; background: linear-gradient(135deg, #7C3AED, #5B21B6); color: white; padding: 2px 8px; border-radius: 999px; margin-top: 4px; margin-bottom: var(--space-3); }
    .feat-desc  { font-size: .9375rem; color: var(--text-secondary); line-height: 1.7; margin: 0; }

    /* ── Showcase ───────────────────────────────────────── */
    .lp-showcase { background: var(--gray-50); padding: 120px 0; overflow: hidden; }
    @media (max-width: 768px) { .lp-showcase { padding: 80px 0; } }
    .showcase-layout {
      display: grid; grid-template-columns: 1fr 1fr; gap: 96px; align-items: center;
    }
    @media (max-width: 900px) { .showcase-layout { grid-template-columns: 1fr; gap: 56px; } }
    .showcase-list { list-style: none; padding: 0; margin: 0 0 var(--space-10); display: flex; flex-direction: column; gap: var(--space-4); }
    .showcase-list li { display: flex; align-items: center; gap: var(--space-3); font-size: .9375rem; color: var(--text-secondary); line-height: 1.5; }
    .showcase-check {
      width: 22px; height: 22px; border-radius: 50%; background: var(--brand);
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .btn-showcase {
      display: inline-flex; align-items: center; gap: var(--space-3);
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-4) var(--space-7); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 700; letter-spacing: -.01em;
      transition: all .25s cubic-bezier(0.22,1,0.36,1);
      &:hover { background: var(--brand-dark); transform: translateY(-2px); box-shadow: 0 6px 24px rgba(192,57,43,.35); }
    }
    .showcase-screen {
      background: white; border-radius: var(--radius-xl);
      box-shadow: 0 20px 56px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.05);
      overflow: hidden;
    }
    .sc-content { padding: var(--space-4); }
    .sc-filter-row { display: flex; gap: var(--space-2); margin-bottom: var(--space-4); }
    .sc-tag {
      padding: 5px 12px; border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 600; border: 1px solid var(--border); color: var(--text-muted);
    }
    .sc-tag-active { background: var(--brand); color: white; border-color: var(--brand); }
    .sc-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-3); }
    .sc-card { border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }
    .sc-card-img { height: 72px; }
    .sc-card-body { padding: var(--space-3); }
    .sc-card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: var(--space-2); }
    .sc-price { height: 8px; background: var(--brand); opacity: .5; border-radius: 3px; width: 45%; }
    .sc-toggle-sm {
      width: 28px; height: 15px; border-radius: var(--radius-full);
      background: var(--gray-200);
    }
    .sc-toggle-on { background: var(--success) !important; }

    /* ── How it works ───────────────────────────────────── */
    .lp-how { background: white; }
    .steps-layout { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-6); position: relative; }
    @media (max-width: 768px) { .steps-layout { grid-template-columns: 1fr; } }
    .steps-connector {
      position: absolute; top: 48px; left: calc(16.67% + 24px); right: calc(16.67% + 24px);
      height: 1px; border-top: 2px dashed var(--border); z-index: 0;
    }
    @media (max-width: 768px) { .steps-connector { display: none; } }
    .step-card { text-align: center; padding: var(--space-8) var(--space-6); position: relative; z-index: 1; }
    .step-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--brand); color: white;
      font-family: var(--font-display); font-size: 1.25rem; font-weight: 400;
      margin: 0 auto var(--space-6); box-shadow: 0 4px 14px rgba(192,57,43,.35);
    }
    .step-title { font-size: 1.125rem; font-weight: 700; margin: 0 0 var(--space-4); }
    .step-desc  { font-size: .9375rem; color: var(--text-secondary); line-height: 1.7; margin: 0 0 var(--space-5); }
    .step-badge {
      display: inline-block; background: var(--success-bg); color: var(--success);
      border: 1px solid var(--success-border);
      padding: var(--space-1) var(--space-3); border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 700;
    }

    /* ── Stats ──────────────────────────────────────────── */
    .lp-stats {
      background: var(--brand); padding: 88px 0;
    }
    .stats-grid {
      display: grid; grid-template-columns: 1fr auto 1fr auto 1fr auto 1fr;
      gap: var(--space-6); align-items: center;
    }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr 1fr; gap: var(--space-8); }
      .stat-div { display: none; }
    }
    .stat-item { text-align: center; }
    .stat-val  { font-family: var(--font-display); font-size: clamp(2rem, 3.5vw, 3rem); color: white; line-height: 1.1; }
    .stat-label { font-size: .875rem; color: rgba(255,255,255,.65); margin-top: var(--space-2); font-weight: 500; }
    .stat-div  { width: 1px; height: 48px; background: rgba(255,255,255,.2); }

    /* ── Testimonials ───────────────────────────────────── */
    .lp-testimonials { background: var(--gray-50); }
    .testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-5); }
    @media (max-width: 900px) { .testimonials-grid { grid-template-columns: 1fr; } }
    .testi-card {
      background: white; border-radius: var(--radius-xl);
      padding: var(--space-8); border: 1px solid var(--border);
      position: relative; overflow: hidden;
      transition: box-shadow .35s cubic-bezier(0.22,1,0.36,1), transform .35s cubic-bezier(0.22,1,0.36,1);
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-5px); }
    }
    .testi-quote-mark {
      position: absolute; top: var(--space-4); right: var(--space-6);
      font-family: var(--font-display); font-size: 5rem; line-height: 1;
      color: var(--brand); opacity: .08; pointer-events: none; user-select: none;
    }
    .testi-text { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 var(--space-7); font-style: italic; position: relative; }
    .testi-author { display: flex; align-items: center; gap: var(--space-3); }
    .testi-av {
      width: 42px; height: 42px; border-radius: 50%; color: white;
      font-weight: 700; font-size: .9rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .testi-name { font-weight: 700; font-size: .9375rem; }
    .testi-role { font-size: .8125rem; color: var(--text-muted); margin-top: 1px; }

    /* ── Pricing ────────────────────────────────────────── */
    .lp-pricing { background: white; }
    .pricing-toggle {
      display: inline-flex; background: var(--gray-100);
      border-radius: var(--radius-lg); padding: 3px; gap: 2px;
      margin: 0 auto var(--space-10); display: flex; justify-content: center; width: fit-content;
    }
    .pricing-toggle button {
      padding: var(--space-2) var(--space-5); border: none; border-radius: var(--radius-md);
      background: transparent; cursor: pointer; font-size: .9rem; font-weight: 600;
      color: var(--text-muted); transition: all var(--t-fast);
      display: flex; align-items: center; gap: var(--space-2);
    }
    .ptog-active { background: white !important; color: var(--text-primary) !important; box-shadow: var(--shadow-sm) !important; }
    .ptog-save {
      background: var(--success-bg); color: var(--success); font-size: .7rem;
      padding: 2px 6px; border-radius: var(--radius-full); font-weight: 700;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(min(var(--plan-cols, 3), 3), 1fr);
      gap: var(--space-5); margin-bottom: var(--space-6);
    }
    @media (max-width: 860px) { .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto var(--space-6); } }

    @keyframes priceCardIn {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: none; }
    }
    .price-card-appear {
      animation: priceCardIn .55s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .price-card {
      background: white; border: 2px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-8) var(--space-8);
      position: relative;
      transition: box-shadow .35s cubic-bezier(0.22,1,0.36,1), transform .35s cubic-bezier(0.22,1,0.36,1);
      &:hover { box-shadow: var(--shadow-lg); transform: translateY(-6px); }
    }
    .price-card-featured {
      border-color: var(--brand) !important;
      box-shadow: 0 0 0 4px var(--brand-subtle), var(--shadow-lg);
      background: white;
    }
    .price-badge {
      position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
      background: var(--brand); color: white;
      padding: var(--space-1) var(--space-4); border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 700; white-space: nowrap;
    }
    .price-name { font-size: 1.0625rem; font-weight: 700; margin-bottom: var(--space-4); color: var(--text-primary); }
    .price-amount { margin-bottom: var(--space-4); display: flex; align-items: baseline; gap: 4px; }
    .price-val  { font-family: var(--font-display); font-size: 2.5rem; color: var(--text-primary); line-height: 1; }
    .price-period { font-size: .9rem; color: var(--text-muted); }
    .price-desc { font-size: .875rem; color: var(--text-muted); margin: 0 0 var(--space-6); line-height: 1.6; padding-bottom: var(--space-6); border-bottom: 1px solid var(--border); }
    .price-features { list-style: none; padding: 0; margin: 0 0 var(--space-8); display: flex; flex-direction: column; gap: var(--space-4); }
    .price-features li { display: flex; align-items: flex-start; gap: var(--space-3); font-size: .9375rem; color: var(--text-secondary); line-height: 1.5; }
    .price-check {
      width: 20px; height: 20px; border-radius: 50%; background: var(--success-bg); color: var(--success);
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
    }
    .price-check-featured { background: var(--brand-subtle) !important; color: var(--brand) !important; }
    .price-cta {
      display: block; text-align: center; text-decoration: none;
      padding: var(--space-4) var(--space-6); border-radius: var(--radius-full);
      font-weight: 700; font-size: .9375rem; letter-spacing: -.01em;
      border: 2px solid var(--border); color: var(--text-primary);
      transition: all .25s cubic-bezier(0.22,1,0.36,1);
      &:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
    }
    .price-cta-featured {
      background: var(--brand) !important; color: white !important;
      border-color: var(--brand) !important;
      box-shadow: 0 4px 16px rgba(192,57,43,.35);
      &:hover { background: var(--brand-dark) !important; transform: translateY(-2px); box-shadow: 0 8px 24px rgba(192,57,43,.4) !important; }
    }
    .pricing-note {
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-align: center;
    }

    /* ── FAQ ────────────────────────────────────────────── */
    .lp-faq { background: var(--gray-50); }
    .faq-layout { display: grid; grid-template-columns: 280px 1fr; gap: 80px; align-items: start; }
    @media (max-width: 768px) { .faq-layout { grid-template-columns: 1fr; gap: 40px; } }
    .faq-contact {
      display: inline-flex; align-items: center; gap: var(--space-2);
      color: var(--brand); text-decoration: none; font-size: .9375rem; font-weight: 600;
      margin-top: var(--space-5);
      &:hover { text-decoration: underline; }
    }
    .faq-list { display: flex; flex-direction: column; gap: var(--space-2); }
    .faq-item {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      overflow: hidden;
      transition: box-shadow .3s cubic-bezier(0.22,1,0.36,1), border-color .2s;
    }
    .faq-item.faq-open { box-shadow: 0 4px 24px rgba(0,0,0,.07); border-color: var(--gray-200); }
    .faq-q {
      width: 100%; padding: var(--space-5) var(--space-6); background: none; border: none;
      text-align: left; font-size: .9375rem; font-weight: 600; color: var(--text-primary);
      cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: var(--space-4);
      font-family: var(--font-body);
      transition: color var(--t-fast);
    }
    .faq-open .faq-q { color: var(--brand); }
    .faq-chevron { color: var(--text-muted); flex-shrink: 0; transition: transform .35s cubic-bezier(0.22,1,0.36,1), color .2s; }
    .faq-open .faq-chevron { transform: rotate(180deg); color: var(--brand); }
    .faq-a {
      padding: 0 var(--space-6) var(--space-6);
      font-size: .9375rem; color: var(--text-secondary); line-height: 1.75;
      animation: slideDownFade .3s cubic-bezier(0.22,1,0.36,1) both;
    }

    /* ── Final CTA ──────────────────────────────────────── */
    .lp-cta {
      background: var(--gray-900); padding: 128px 0;
      position: relative; overflow: hidden; text-align: center;
    }
    .lp-cta-bg { position: absolute; inset: 0; pointer-events: none; }
    .cta-blob-1 {
      position: absolute; width: 500px; height: 500px; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.35) 0%, transparent 65%);
      top: -200px; right: -100px;
    }
    .cta-blob-2 {
      position: absolute; width: 400px; height: 400px; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.2) 0%, transparent 65%);
      bottom: -100px; left: -100px;
    }
    .lp-cta-inner { position: relative; z-index: 1; }
    .cta-badge {
      display: inline-flex; align-items: center; gap: var(--space-2);
      background: rgba(192,57,43,.2); color: rgba(255,255,255,.85);
      border: 1px solid rgba(192,57,43,.3); border-radius: var(--radius-full);
      padding: var(--space-2) var(--space-4); font-size: .8125rem; font-weight: 600;
      margin-bottom: var(--space-6);
    }
    .cta-h2 {
      font-family: var(--font-display);
      font-size: clamp(2rem, 4vw, 3rem); color: white;
      margin: 0 0 var(--space-4); line-height: 1.2;
    }
    .cta-sub { font-size: 1rem; color: rgba(255,255,255,.55); margin: 0 0 var(--space-10); }
    .cta-btns { display: flex; justify-content: center; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
    .btn-cta-primary {
      display: inline-flex; align-items: center; gap: var(--space-3);
      background: white; color: var(--brand); text-decoration: none;
      padding: var(--space-5) var(--space-10); border-radius: var(--radius-full);
      font-size: 1rem; font-weight: 800; letter-spacing: -.01em;
      box-shadow: 0 4px 24px rgba(0,0,0,.3);
      transition: all .25s cubic-bezier(0.22,1,0.36,1);
      &:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,0,0,.4); }
    }
    .btn-cta-ghost {
      color: rgba(255,255,255,.7); text-decoration: none; font-size: .9375rem; font-weight: 500;
      padding: var(--space-5) var(--space-7); border-radius: var(--radius-full);
      border: 1px solid rgba(255,255,255,.2);
      transition: all var(--t-fast);
      &:hover { color: white; border-color: rgba(255,255,255,.4); background: rgba(255,255,255,.07); }
    }

    /* ── Footer ─────────────────────────────────────────── */
    .lp-footer { background: var(--gray-900); border-top: 1px solid rgba(255,255,255,.06); }
    .footer-inner {
      display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px;
      padding: 64px var(--space-6) 48px;
    }
    @media (max-width: 900px) { .footer-inner { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 560px) { .footer-inner { grid-template-columns: 1fr; } }
    .footer-logo {
      display: flex; align-items: center; gap: var(--space-3);
      margin-bottom: var(--space-4); color: white;
      font-weight: 700; font-size: 1.0625rem; text-decoration: none;
    }
    .footer-tagline { font-size: .9375rem; color: rgba(255,255,255,.45); line-height: 1.6; margin: 0 0 var(--space-3); }
    .footer-countries { font-size: .8125rem; color: rgba(255,255,255,.3); letter-spacing: .05em; }
    .footer-col { display: flex; flex-direction: column; gap: var(--space-3); }
    .footer-col-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: rgba(255,255,255,.4); margin-bottom: var(--space-1); }
    .footer-link {
      font-size: .9375rem; color: rgba(255,255,255,.55); text-decoration: none;
      transition: color var(--t-fast);
      &:hover { color: rgba(255,255,255,.9); }
    }
    .footer-bottom {
      border-top: 1px solid rgba(255,255,255,.06);
      padding: var(--space-5) var(--space-6);
    }
    .footer-bottom-inner {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);
      max-width: 1180px; margin: 0 auto;
      font-size: .8125rem; color: rgba(255,255,255,.3);
    }

    /* ── Download section ──────────────────────────────── */
    .lp-download {
      padding: 120px 0;
      background: #0d0a0a;
      position: relative;
      overflow: hidden;
    }
    @media (max-width: 768px) { .lp-download { padding: 80px 0; } }
    .dl-blobs { position: absolute; inset: 0; pointer-events: none; }
    .dl-blob-1 {
      position: absolute; width: 700px; height: 700px; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.1) 0%, transparent 65%);
      top: -200px; right: -150px;
    }
    .dl-blob-2 {
      position: absolute; width: 500px; height: 500px; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.06) 0%, transparent 65%);
      bottom: -150px; left: -100px;
    }
    .dl-tag { background: rgba(192,57,43,.2); color: #f87171; border: 1px solid rgba(192,57,43,.3); }
    .dl-h2 { color: #f1f5f9; }
    .dl-sub { color: rgba(241,245,249,.55); }
    .dl-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 28px;
    }
    @media (max-width: 768px) { .dl-grid { grid-template-columns: 1fr; } }

    /* Card */
    .dl-card {
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 20px;
      padding: 36px;
      display: flex; flex-direction: column; gap: 0;
      position: relative;
      backdrop-filter: blur(8px);
      transition: border-color .25s, box-shadow .25s;
    }
    .dl-card:hover { border-color: rgba(255,255,255,.14); box-shadow: 0 8px 40px rgba(0,0,0,.3); }
    .dl-card-featured {
      background: rgba(192,57,43,.1);
      border-color: rgba(192,57,43,.3);
    }
    .dl-card-featured:hover { border-color: rgba(192,57,43,.5); box-shadow: 0 8px 40px rgba(192,57,43,.15); }

    .dl-card-top {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px;
    }
    .dl-card-icon {
      width: 44px; height: 44px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
    }
    .dl-icon-mobile { background: rgba(37,99,235,.15); color: #60a5fa; }
    .dl-icon-desktop { background: rgba(192,57,43,.2); color: #f87171; }

    .dl-badge {
      font-size: .72rem; font-weight: 700; letter-spacing: .07em; text-transform: uppercase;
      padding: 4px 12px; border-radius: 99px;
    }
    .dl-badge-soon { background: rgba(251,191,36,.12); color: #fbbf24; border: 1px solid rgba(251,191,36,.25); }
    .dl-badge-ready { background: rgba(22,163,74,.15); color: #4ade80; border: 1px solid rgba(22,163,74,.3); }

    .dl-card-title {
      font-family: var(--font-display); font-size: 1.5rem; color: #f1f5f9;
      margin: 0 0 10px; line-height: 1.2;
    }
    .dl-card-desc {
      font-size: .9375rem; color: rgba(241,245,249,.55); line-height: 1.65;
      margin: 0 0 28px;
    }

    /* Phone visual */
    .dl-visual { display: flex; justify-content: center; margin-bottom: 28px; }
    .dl-phone {
      width: 140px; height: 240px;
      background: #1a1a2e; border-radius: 22px;
      border: 2px solid rgba(255,255,255,.12);
      position: relative; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06);
    }
    .dl-phone-notch {
      width: 40px; height: 8px; background: #0d0a0a; border-radius: 0 0 8px 8px;
      margin: 0 auto; position: relative; z-index: 2;
    }
    .dl-phone-screen { padding: 8px; }
    .dl-phone-header {
      background: linear-gradient(135deg, #C0392B, #6b1a12);
      border-radius: 10px; padding: 8px; margin-bottom: 6px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .dl-ph-logo { width: 18px; height: 18px; background: rgba(255,255,255,.3); border-radius: 5px; }
    .dl-ph-name { width: 55px; height: 5px; background: rgba(255,255,255,.5); border-radius: 3px; margin-top: 2px; }
    .dl-phone-content { display: flex; flex-direction: column; gap: 6px; }
    .dl-ph-row { display: flex; gap: 4px; }
    .dl-ph-chip { height: 16px; flex: 1; background: rgba(255,255,255,.07); border-radius: 8px; }
    .dl-ph-chip-on { background: rgba(192,57,43,.35); }
    .dl-ph-card {
      background: rgba(255,255,255,.05); border-radius: 8px; overflow: hidden;
      display: flex; align-items: center; gap: 6px; padding: 4px;
    }
    .dl-ph-card-img { width: 32px; height: 32px; border-radius: 6px; flex-shrink: 0; }
    .dl-ph-card-info { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .dl-ph-line { height: 5px; background: rgba(255,255,255,.2); border-radius: 3px; }

    /* Laptop visual */
    .dl-laptop { display: flex; flex-direction: column; align-items: center; }
    .dl-laptop-screen {
      width: 240px; height: 150px;
      background: #111827; border-radius: 10px 10px 0 0;
      border: 2px solid rgba(255,255,255,.12);
      border-bottom: none; overflow: hidden;
      box-shadow: 0 -8px 40px rgba(0,0,0,.4);
    }
    .dl-ls-bar {
      background: #0a0a0a; height: 24px; border-bottom: 1px solid rgba(255,255,255,.06);
      display: flex; align-items: center; padding: 0 8px; gap: 6px;
    }
    .dl-ls-logo { width: 14px; height: 14px; background: #C0392B; border-radius: 3px; }
    .dl-ls-title { flex: 1; height: 5px; background: rgba(255,255,255,.12); border-radius: 3px; }
    .dl-ls-controls { display: flex; gap: 4px; }
    .dl-ls-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,.15); }
    .dl-ls-close { background: rgba(192,57,43,.6); }
    .dl-ls-body { display: flex; height: calc(100% - 24px); }
    .dl-ls-sidebar {
      width: 40px; background: rgba(255,255,255,.03); border-right: 1px solid rgba(255,255,255,.06);
      padding: 8px 6px; display: flex; flex-direction: column; gap: 5px;
    }
    .dl-ls-sq { width: 20px; height: 20px; background: #C0392B; border-radius: 5px; margin-bottom: 6px; }
    .dl-ls-nav-item { height: 8px; background: rgba(255,255,255,.08); border-radius: 4px; }
    .dl-ls-nav-active { background: rgba(192,57,43,.4); }
    .dl-ls-main { flex: 1; padding: 8px; display: flex; flex-direction: column; gap: 5px; }
    .dl-ls-kpis { display: flex; gap: 4px; }
    .dl-ls-kpi {
      flex: 1; height: 24px; border-radius: 5px;
      background: color-mix(in srgb, var(--kc) 15%, transparent);
      border: 1px solid color-mix(in srgb, var(--kc) 30%, transparent);
    }
    .dl-ls-line { height: 6px; background: rgba(255,255,255,.07); border-radius: 3px; width: 100%; }
    .dl-laptop-base {
      width: 260px; height: 10px; background: #1a1a2e;
      border-radius: 0 0 4px 4px;
      border: 2px solid rgba(255,255,255,.1); border-top: none;
      display: flex; justify-content: center; align-items: flex-end;
    }
    .dl-laptop-foot { width: 80px; height: 4px; background: rgba(255,255,255,.08); border-radius: 0 0 4px 4px; }

    /* Store buttons */
    .dl-store-btns { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .dl-store-btn {
      display: inline-flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,.07); color: rgba(241,245,249,.8);
      border: 1px solid rgba(255,255,255,.12); border-radius: 12px;
      padding: 11px 18px; text-decoration: none; font-size: .875rem;
      transition: background .2s, border-color .2s;
      flex: 1; min-width: 130px;
    }
    .dl-store-btn:hover { background: rgba(255,255,255,.11); border-color: rgba(255,255,255,.2); color: white; }
    .dl-store-disabled { opacity: .45; pointer-events: none; cursor: not-allowed; }
    .dl-store-text { display: flex; flex-direction: column; }
    .dl-store-label { font-size: .7rem; color: rgba(255,255,255,.5); line-height: 1; }
    .dl-store-name { font-size: .9rem; font-weight: 600; line-height: 1.3; }

    .dl-coming-soon {
      display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: rgba(251,191,36,.6);
      margin: 0;
    }

    /* Windows download button */
    .dl-win-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 10px;
      background: var(--brand); color: white; text-decoration: none;
      padding: 14px 28px; border-radius: var(--radius-full);
      font-size: 1rem; font-weight: 700; letter-spacing: -.01em;
      box-shadow: 0 4px 24px rgba(192,57,43,.4);
      transition: background .2s, transform .2s, box-shadow .2s;
      margin-bottom: 14px;
    }
    .dl-win-btn:hover { background: var(--brand-dark); transform: translateY(-2px); box-shadow: 0 8px 32px rgba(192,57,43,.5); }
    .dl-meta {
      display: flex; align-items: center; gap: 6px;
      font-size: .8125rem; color: rgba(241,245,249,.4); margin: 0;
    }
  `],
})
export class LandingComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly platformId        = inject(PLATFORM_ID)
  private readonly subscriptionSvc   = inject(SubscriptionService)
  private readonly transloco         = inject(TranslocoService)

  readonly features     = FEATURES
  readonly steps        = STEPS
  readonly testimonials = TESTIMONIALS
  readonly faqIndices   = FAQ_INDICES

  readonly plans        = signal<Plan[]>([])
  readonly plansLoading = signal(true)

  readonly scrolled   = signal(false)
  readonly mobileOpen = signal(false)
  readonly cycle      = signal<BillingCycle>('monthly')
  readonly openFaq    = signal<number | null>(null)

  /** Index of the featured (highlighted) plan — middle by position */
  readonly featuredIndex = computed(() => Math.floor(this.plans().length / 2))

  /** Best yearly saving % across paid plans — shown in the toggle pill */
  readonly bestSavingPct = computed(() => {
    const paid = this.plans().filter(p => p.priceMonthlyCents > 0)
    if (!paid.length) return 0
    return Math.max(...paid.map(p => {
      if (!p.priceMonthlyCents || !p.priceYearlyCents) return 0
      return Math.max(0, Math.round((1 - p.priceYearlyCents / (p.priceMonthlyCents * 12)) * 100))
    }))
  })

  readonly trustedNames = ['Le Bistrot Lagune', 'Chez Maman Abidjan', 'Le Doyen Dakar', 'Saveurs du Sahel', 'Kiosque Yaoundé', 'Les Délices Bamako']

  readonly itemColors   = ['#FF8C69', '#7CB9E8', '#B8E4A8', '#FFD580']
  readonly itemWidths   = ['72%', '58%', '85%', '64%']
  readonly phoneCardColors = ['linear-gradient(135deg,#FF6B4A,#C0392B)', 'linear-gradient(135deg,#4A9AF6,#2563EB)']
  readonly cardData = [
    { color: 'linear-gradient(135deg,#FF8C69,#E67E22)', on: true },
    { color: 'linear-gradient(135deg,#7CB9E8,#2563EB)', on: true },
    { color: 'linear-gradient(135deg,#B8E4A8,#16A34A)', on: false },
    { color: 'linear-gradient(135deg,#FFD580,#D97706)', on: true },
    { color: 'linear-gradient(135deg,#DDA0DD,#8E44AD)', on: true },
    { color: 'linear-gradient(135deg,#87CEEB,#0891B2)', on: true },
  ]

  private observer?: IntersectionObserver
  private readonly onScroll = () => this.scrolled.set(window.scrollY > 20)

  ngOnInit(): void {
    this.subscriptionSvc.getPublicPlans().subscribe({
      next: (plans) => { this.plans.set(plans); this.plansLoading.set(false) },
      error: () => this.plansLoading.set(false),
    })
  }

  isFeatured(index: number): boolean {
    return index === this.featuredIndex()
  }

  private readonly FEATURE_DEFS: Array<{
    key: string
    label: (p: Plan) => string
    value: (p: Plan) => boolean
  }> = [
    { key: 'qr',        label: () => 'Menu digital & QR code',                                                           value: () => true },
    { key: 'cats',      label: (p) => p.maxCategories === -1 ? 'Catégories illimitées' : `${p.maxCategories} catégories de menu`, value: () => true },
    { key: 'items',     label: (p) => p.maxMenuItems   === -1 ? 'Plats illimités'      : `${p.maxMenuItems} plats maximum`,       value: () => true },
    { key: 'users',     label: (p) => p.maxUsers === -1 ? 'Caissiers illimités' : p.maxUsers <= 1 ? '1 utilisateur' : `${p.maxUsers} caissiers`, value: () => true },
    { key: 'templates', label: () => '5 templates visuels',                                                               value: () => true },
    { key: 'orders',    label: () => 'Commandes & réservations en ligne',                                                  value: (p) => !!(p.features?.['orders_and_reservations']) || p.slug === 'pro' || p.slug === 'enterprise' },
    { key: 'stats',     label: () => 'Statistiques avancées',                                                              value: (p) => !!(p.features?.['stats']) || p.slug === 'pro' || p.slug === 'enterprise' },
    { key: 'support',   label: (p) => p.slug === 'enterprise' ? 'Support 24/7 & SLA garanti' : 'Support prioritaire',    value: (p) => !!(p.features?.['priority_support']) || p.slug === 'pro' || p.slug === 'enterprise' },
    { key: 'api',       label: () => 'API dédiée',                                                                        value: (p) => !!(p.features?.['api_access']) || p.slug === 'enterprise' },
    { key: 'gift',      label: () => 'QR codes cadeaux',                                                                  value: (p) => !!(p.features?.['gift_qr']) || p.slug === 'enterprise' },
    { key: 'finance',   label: () => 'Gestion financière complète',                                                       value: (p) => !!(p.features?.['financial_management']) || !!(p.features?.['api_access']) || p.slug === 'enterprise' },
  ]

  enabledFeatures(plan: Plan): string[] {
    return this.FEATURE_DEFS
      .filter(def => def.value(plan))
      .map(def => def.label(plan))
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return

    window.addEventListener('scroll', this.onScroll, { passive: true })

    // Transloco loads translations asynchronously via HTTP.
    // *transloco="let t" renders its content only AFTER translations arrive,
    // which is AFTER ngAfterViewInit. We wait for the translation to be ready
    // before querying .reveal elements, then give Angular one extra tick to
    // flush the DOM updates.
    this.transloco.selectTranslation().pipe(take(1)).subscribe(() => {
      setTimeout(() => this.setupRevealObserver(), 0)
    })
  }

  private setupRevealObserver(): void {
    this.observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => this.observer!.observe(el))
  }

  ngOnDestroy(): void {
    if (!isPlatformBrowser(this.platformId)) return
    window.removeEventListener('scroll', this.onScroll)
    this.observer?.disconnect()
  }

  scrollTo(e: Event, id: string): void {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  toggleFaq(i: number): void {
    this.openFaq.update((cur) => cur === i ? null : i)
  }

  formatPrice(plan: Plan, cycle: BillingCycle): string {
    const cents = cycle === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
  }
}
