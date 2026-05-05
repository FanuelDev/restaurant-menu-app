import { Component, signal, computed, AfterViewInit, OnDestroy, OnInit, PLATFORM_ID, inject, ChangeDetectionStrategy } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { SubscriptionService } from '../../shared/services/subscription.service'
import type { Plan, BillingCycle } from '../../shared/models'

const FEATURES = [
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
    color: '#C0392B',
    title: 'QR Menu instantané',
    desc: 'Un QR code élégant généré automatiquement. Vos clients scannent, votre menu apparaît en une seconde sur leur téléphone.',
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
    color: '#2563EB',
    title: 'Mises à jour en temps réel',
    desc: 'Modifiez prix, disponibilités et nouveautés depuis votre smartphone. Les changements sont visibles instantanément.',
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    color: '#16A34A',
    title: "Gestion d'équipe",
    desc: "Invitez vos caissiers avec leur propre accès. Chaque rôle dispose des permissions adaptées à ses responsabilités.",
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
    color: '#D97706',
    title: "Journal d'audit complet",
    desc: 'Chaque modification est tracée avec horodatage, utilisateur et détail du changement. Transparence totale.',
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>`,
    color: '#8E44AD',
    title: "Horaires d'ouverture",
    desc: 'Configurez vos horaires jour par jour. Vos clients savent toujours quand vous êtes ouverts avant de se déplacer.',
  },
  {
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
    color: '#0891B2',
    title: 'Interface 100% mobile',
    desc: 'Gérez votre menu depuis votre téléphone, tablette ou ordinateur. Conçu pour fonctionner partout, même hors connexion.',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Créez votre compte',
    desc: 'Inscrivez-vous en 30 secondes. Aucune carte bancaire requise. Votre essai gratuit de 14 jours commence immédiatement.',
    highlight: 'Gratuit & sans engagement',
  },
  {
    num: '02',
    title: 'Configurez votre menu',
    desc: 'Ajoutez vos catégories, plats, photos et prix. Personnalisez les couleurs à votre image. Interface simple et intuitive.',
    highlight: '5 minutes en moyenne',
  },
  {
    num: '03',
    title: 'Partagez votre QR code',
    desc: 'Imprimez votre QR code ou partagez le lien sur vos réseaux. Vos clients accèdent à votre menu depuis leur téléphone.',
    highlight: 'Partage instantané',
  },
]

const TESTIMONIALS = [
  {
    quote: 'Notre menu est toujours à jour même en plein service. Les clients adorent scanner et voir les plats du jour en temps réel. Ça a vraiment changé notre relation client.',
    name: 'Aminata Koné',
    role: 'Propriétaire',
    restaurant: 'Le Bistrot Lagune — Abidjan',
    initial: 'A',
    color: '#E67E22',
  },
  {
    quote: "J'ai remplacé mes menus plastifiés en 20 minutes. La simplicité d'utilisation est bluffante. Je modifie mes prix en direct pendant les heures de pointe.",
    name: 'Oumar Diallo',
    role: 'Gérant',
    restaurant: 'Chez Oumar — Dakar',
    initial: 'O',
    color: '#27AE60',
  },
  {
    quote: "Le journal d'audit et la gestion des rôles sont parfaits pour notre chaîne de 3 restaurants. On sait exactement qui a modifié quoi et quand.",
    name: 'Ibrahim Traoré',
    role: 'Directeur général',
    restaurant: 'Saveurs du Sahel — Ouagadougou',
    initial: 'I',
    color: '#8E44AD',
  },
]


const FAQS = [
  { q: 'Comment fonctionne l\'essai gratuit ?', a: 'Votre essai démarre dès l\'inscription, sans carte bancaire. Pendant 14 jours, vous avez accès à toutes les fonctionnalités Pro. À la fin, vous choisissez le plan qui vous convient.' },
  { q: 'Puis-je modifier mon plan à tout moment ?', a: 'Oui, vous pouvez passer à un plan supérieur ou inférieur à tout moment depuis votre espace de gestion. Les changements prennent effet immédiatement.' },
  { q: 'Comment mes clients accèdent-ils au menu ?', a: 'Chaque restaurant dispose d\'une URL unique et d\'un QR code. Vos clients scannent le QR code ou utilisent le lien, sans téléchargement d\'application requis.' },
  { q: 'Mes données sont-elles sécurisées ?', a: 'Toutes les données sont chiffrées en transit (HTTPS) et au repos. Nous hébergeons en Europe et respectons les bonnes pratiques RGPD. Vos données ne sont jamais partagées.' },
  { q: 'Y a-t-il des frais cachés ?', a: 'Non. Le tarif affiché est tout inclus. Aucun frais par transaction, aucun supplément pour les mises à jour, aucune surprise sur votre facture.' },
]

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
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
          <span class="lp-logo-name">MenuApp</span>
        </a>

        <div class="lp-nav-links">
          <a href="#features" class="lp-nav-link" (click)="scrollTo($event, 'features')">Fonctionnalités</a>
          <a href="#how" class="lp-nav-link" (click)="scrollTo($event, 'how')">Comment ça marche</a>
          <a href="#pricing" class="lp-nav-link" (click)="scrollTo($event, 'pricing')">Tarifs</a>
        </div>

        <div class="lp-nav-ctas">
          <a routerLink="/login" class="lp-nav-login">Se connecter</a>
          <a routerLink="/register" class="lp-nav-cta">
            Essai gratuit
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
          <a href="#features" class="lp-mobile-link" (click)="scrollTo($event, 'features'); mobileOpen.set(false)">Fonctionnalités</a>
          <a href="#how" class="lp-mobile-link" (click)="scrollTo($event, 'how'); mobileOpen.set(false)">Comment ça marche</a>
          <a href="#pricing" class="lp-mobile-link" (click)="scrollTo($event, 'pricing'); mobileOpen.set(false)">Tarifs</a>
          <div class="lp-mobile-sep"></div>
          <a routerLink="/login" class="lp-mobile-link">Se connecter</a>
          <a routerLink="/register" class="lp-mobile-cta">Démarrer l'essai gratuit →</a>
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
            Plus de 1&nbsp;200 restaurants actifs dans 14 pays
          </div>

          <h1 class="hero-h1">
            Votre menu digital,<br>
            <em class="hero-accent">toujours à jour.</em>
          </h1>

          <p class="hero-desc">
            Créez un menu QR élégant pour votre restaurant en 5&nbsp;minutes. Modifiez prix, disponibilités et plats en temps réel depuis n'importe quel appareil.
          </p>

          <div class="hero-ctas">
            <a routerLink="/register" class="btn-hero-primary">
              Créer mon menu gratuitement
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#how" class="btn-hero-ghost" (click)="scrollTo($event, 'how')">
              <span class="btn-play">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="2,1 9,5 2,9"/></svg>
              </span>
              Voir comment ça marche
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
              <div class="proof-label">4.9/5 — Noté excellent par nos clients</div>
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
              <div class="mock-url">menuapp.co/admin/dashboard</div>
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
        <span class="trusted-label">Ils gèrent leur carte avec MenuApp</span>
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
          <div class="section-tag">Fonctionnalités</div>
          <h2 class="section-h2">Tout ce dont votre restaurant a besoin</h2>
          <p class="section-sub">Une plateforme pensée pour les restaurateurs d'Afrique de l'Ouest, simple à prendre en main dès le premier jour.</p>
        </div>
        <div class="features-grid">
          @for (f of features; track f.title; let i = $index) {
            <div class="feat-card reveal" [attr.data-delay]="i % 3">
              <div class="feat-icon" [style.background]="f.color + '18'" [style.color]="f.color" [innerHTML]="f.icon"></div>
              <h3 class="feat-title">{{ f.title }}</h3>
              <p class="feat-desc">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Product showcase ─────────────────────────────────── -->
    <section class="lp-showcase">
      <div class="lp-container showcase-layout">
        <div class="showcase-copy reveal">
          <div class="section-tag">Interface d'administration</div>
          <h2 class="section-h2">Conçue pour aller vite</h2>
          <p class="section-sub" style="max-width:420px">Chaque écran a été pensé pour réduire les clics. Modifiez un plat en 3 secondes, gérez vos catégories par glisser-déposer.</p>
          <ul class="showcase-list">
            <li>
              <span class="showcase-check">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Navigation latérale rétractable
            </li>
            <li>
              <span class="showcase-check">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Tableaux de bord avec KPIs en temps réel
            </li>
            <li>
              <span class="showcase-check">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Upload de photos depuis mobile
            </li>
            <li>
              <span class="showcase-check">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              Bascule de disponibilité en un tap
            </li>
          </ul>
          <a routerLink="/register" class="btn-showcase">
            Essayer gratuitement
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
              <div class="mock-url">menuapp.co/admin/menu-items</div>
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
          <div class="section-tag">Comment ça marche</div>
          <h2 class="section-h2">Prêt en 5 minutes, vraiment</h2>
          <p class="section-sub">Pas besoin d'un développeur, ni d'une formation. Suivez ces 3 étapes et votre menu est en ligne.</p>
        </div>

        <div class="steps-layout">
          <div class="steps-connector" aria-hidden="true"></div>
          @for (step of steps; track step.num; let i = $index) {
            <div class="step-card reveal" [attr.data-delay]="i">
              <div class="step-num">{{ step.num }}</div>
              <h3 class="step-title">{{ step.title }}</h3>
              <p class="step-desc">{{ step.desc }}</p>
              <div class="step-badge">{{ step.highlight }}</div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Stats ────────────────────────────────────────────── -->
    <section class="lp-stats">
      <div class="lp-container stats-grid">
        <div class="stat-item reveal">
          <div class="stat-val" #stat1>1 200+</div>
          <div class="stat-label">Restaurants actifs</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="1">
          <div class="stat-val">14</div>
          <div class="stat-label">Pays en Afrique</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="2">
          <div class="stat-val">5 min</div>
          <div class="stat-label">Pour créer son menu</div>
        </div>
        <div class="stat-div"></div>
        <div class="stat-item reveal" data-delay="3">
          <div class="stat-val">4.9 ★</div>
          <div class="stat-label">Satisfaction client</div>
        </div>
      </div>
    </section>

    <!-- ── Testimonials ─────────────────────────────────────── -->
    <section class="lp-section lp-testimonials">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">Témoignages</div>
          <h2 class="section-h2">Ils l'ont adopté, ils ne reviennent plus</h2>
        </div>
        <div class="testimonials-grid">
          @for (t of testimonials; track t.name; let i = $index) {
            <div class="testi-card reveal" [attr.data-delay]="i">
              <div class="testi-quote-mark">"</div>
              <p class="testi-text">{{ t.quote }}</p>
              <div class="testi-author">
                <div class="testi-av" [style.background]="t.color">{{ t.initial }}</div>
                <div>
                  <div class="testi-name">{{ t.name }}</div>
                  <div class="testi-role">{{ t.role }} · {{ t.restaurant }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ── Pricing ──────────────────────────────────────────── -->
    <section class="lp-section lp-pricing" id="pricing">
      <div class="lp-container">
        <div class="section-head reveal">
          <div class="section-tag">Tarifs</div>
          <h2 class="section-h2">Simple, transparent, sans surprise</h2>
          <p class="section-sub">Commencez gratuitement. Évoluez quand vous en avez besoin. Résiliez quand vous le souhaitez.</p>
        </div>

        <div class="pricing-toggle reveal">
          <button [class.ptog-active]="cycle() === 'monthly'" (click)="cycle.set('monthly')">Mensuel</button>
          <button [class.ptog-active]="cycle() === 'yearly'" (click)="cycle.set('yearly')">
            Annuel
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
                @if (isFeatured(i)) { <div class="price-badge">Recommandé</div> }
                <div class="price-name">{{ plan.name }}</div>
                <div class="price-amount">
                  @if (plan.priceMonthlyCents === 0) {
                    <span class="price-val">Gratuit</span>
                  } @else {
                    <span class="price-val">{{ formatPrice(plan, cycle()) }}</span>
                    <span class="price-period">/ {{ cycle() === 'monthly' ? 'mois' : 'an' }}</span>
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
                  {{ plan.priceMonthlyCents === 0 ? 'Démarrer gratuitement' : 'Essai 14 jours gratuit' }}
                </a>
              </div>
            }
          </div>
        }

        <p class="pricing-note reveal">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          14 jours d'essai gratuit sur tous les plans payants · Aucune carte requise · Résiliation en un clic
        </p>
      </div>
    </section>

    <!-- ── FAQ ──────────────────────────────────────────────── -->
    <section class="lp-section lp-faq">
      <div class="lp-container faq-layout">
        <div class="faq-left reveal">
          <div class="section-tag">FAQ</div>
          <h2 class="section-h2" style="font-size:2rem">Des questions ?<br>On a les réponses.</h2>
          <p class="section-sub" style="max-width:280px">Une question qui n'est pas là ? Écrivez-nous, on répond sous 24h.</p>
          <a href="mailto:hello@menuapp.co" class="faq-contact">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            hello&#64;menuapp.co
          </a>
        </div>
        <div class="faq-list reveal" data-delay="1">
          @for (faq of faqs; track faq.q; let i = $index) {
            <div class="faq-item" [class.faq-open]="openFaq() === i">
              <button class="faq-q" (click)="toggleFaq(i)">
                {{ faq.q }}
                <span class="faq-chevron">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              </button>
              @if (openFaq() === i) {
                <div class="faq-a">{{ faq.a }}</div>
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
          Démarrez en 5 minutes
        </div>
        <h2 class="cta-h2">Rejoignez 1 200+ restaurants<br>qui ont digitalisé leur menu</h2>
        <p class="cta-sub">14 jours d'essai gratuit · Aucune carte requise · Résiliez à tout moment</p>
        <div class="cta-btns">
          <a routerLink="/register" class="btn-cta-primary">
            Créer mon restaurant gratuitement
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <a routerLink="/pricing" class="btn-cta-ghost">Voir les tarifs</a>
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
            <span>MenuApp</span>
          </div>
          <p class="footer-tagline">La vitrine digitale pour les restaurants d'Afrique.</p>
          <div class="footer-countries">CI · SN · ML · CM · BF · TG · BJ · GH</div>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Produit</div>
          <a href="#features" class="footer-link" (click)="scrollTo($event, 'features')">Fonctionnalités</a>
          <a href="#pricing" class="footer-link" (click)="scrollTo($event, 'pricing')">Tarifs</a>
          <a href="#how" class="footer-link" (click)="scrollTo($event, 'how')">Comment ça marche</a>
          <a routerLink="/pricing" class="footer-link">Plans détaillés</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Compte</div>
          <a routerLink="/login" class="footer-link">Se connecter</a>
          <a routerLink="/register" class="footer-link">S'inscrire</a>
          <a routerLink="/forgot-password" class="footer-link">Mot de passe oublié</a>
        </div>

        <div class="footer-col">
          <div class="footer-col-title">Contact</div>
          <a href="mailto:hello@menuapp.co" class="footer-link">hello&#64;menuapp.co</a>
          <a href="mailto:support@menuapp.co" class="footer-link">support&#64;menuapp.co</a>
          <div class="footer-col-title" style="margin-top:var(--space-4)">Légal</div>
          <a href="#" class="footer-link">CGU</a>
          <a href="#" class="footer-link">Confidentialité</a>
        </div>
      </div>

      <div class="footer-bottom">
        <div class="lp-container footer-bottom-inner">
          <span>© 2025 MenuApp. Tous droits réservés.</span>
          <span>Fait avec ♥ pour les restaurateurs africains</span>
        </div>
      </div>
    </footer>
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
  `],
})
export class LandingComponent implements AfterViewInit, OnDestroy, OnInit {
  private readonly platformId        = inject(PLATFORM_ID)
  private readonly subscriptionSvc   = inject(SubscriptionService)

  readonly features     = FEATURES
  readonly steps        = STEPS
  readonly testimonials = TESTIMONIALS
  readonly faqs         = FAQS

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

  /** Only the enabled features (true values) as label strings */
  enabledFeatures(plan: Plan): string[] {
    if (!plan.features) return []
    return Object.entries(plan.features)
      .filter(([, v]) => v)
      .map(([k]) => k)
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return

    window.addEventListener('scroll', this.onScroll, { passive: true })

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
    return new Intl.NumberFormat('fr-FR').format(cents / 100) + ' FCFA'
  }
}
