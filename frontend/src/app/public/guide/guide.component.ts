import { Component, signal, ChangeDetectionStrategy, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

interface GuideSection {
  id: string
  icon: string
  label: string
  title: string
}

const SECTIONS: GuideSection[] = [
  { id: 'start',        icon: '🚀', label: 'Démarrage',      title: 'Créer son compte et configurer son restaurant' },
  { id: 'menu',         icon: '📋', label: 'Menu',            title: 'Gérer catégories et plats' },
  { id: 'appearance',   icon: '🎨', label: 'Apparence',       title: 'Personnaliser le design et les templates' },
  { id: 'qrcode',       icon: '📱', label: 'QR Code',         title: 'Générer et partager votre QR code' },
  { id: 'orders',       icon: '🛒', label: 'Commandes',       title: 'Recevoir et gérer les commandes (Enterprise)' },
  { id: 'reservations', icon: '📅', label: 'Réservations',    title: 'Gérer les réservations en ligne' },
  { id: 'team',         icon: '👥', label: 'Équipe',          title: 'Inviter et gérer des collaborateurs' },
  { id: 'stats',        icon: '📊', label: 'Statistiques',    title: 'Analyser la performance de votre menu' },
  { id: 'finance',      icon: '💰', label: 'Finance',         title: 'Gérer les finances de votre restaurant (Enterprise)' },
]

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Nav -->
    <nav class="gd-nav">
      <div class="gd-nav-inner">
        <a routerLink="/" class="gd-logo">
          <div class="gd-logo-icon">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="gd-logo-name">SaeMenus</span>
        </a>
        <div class="gd-nav-right">
          <a routerLink="/faq" class="gd-nav-login">FAQ</a>
          <a routerLink="/register" class="gd-nav-cta">Commencer gratuitement</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <div class="gd-hero">
      <div class="gd-hero-bg" aria-hidden="true">
        <div class="gd-blob gd-blob-1"></div>
        <div class="gd-blob gd-blob-2"></div>
      </div>
      <div class="gd-container">
        <div class="gd-back">
          <a routerLink="/" class="gd-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Retour
          </a>
        </div>
        <div class="gd-hero-tag">Documentation</div>
        <h1 class="gd-hero-h1">Guide d'utilisation SaeMenus</h1>
        <p class="gd-hero-sub">Tout ce qu'il faut savoir pour créer, configurer et gérer votre restaurant digital en quelques minutes.</p>
        <div class="gd-hero-pills">
          @for (s of sections; track s.id) {
            <a href="javascript:void(0)" class="gd-pill" (click)="scrollTo(s.id)">{{ s.icon }} {{ s.label }}</a>
          }
        </div>
      </div>
    </div>

    <!-- Progress bar (sticky) -->
    <div class="gd-progress-bar" aria-hidden="true">
      <div class="gd-progress-fill" [style.width.%]="readProgress()"></div>
    </div>

    <!-- Layout -->
    <div class="gd-layout-wrap">
      <div class="gd-layout">

        <!-- Sidebar TOC -->
        <aside class="gd-sidebar">
          <div class="gd-toc-title">Dans ce guide</div>
          @for (s of sections; track s.id) {
            <a href="javascript:void(0)" class="gd-toc-item" [class.gd-toc-active]="activeSection() === s.id" (click)="scrollTo(s.id)">
              <span class="gd-toc-icon">{{ s.icon }}</span>
              <span>{{ s.label }}</span>
            </a>
          }
          <div class="gd-sidebar-cta">
            <div class="gd-sidebar-cta-title">Prêt à démarrer ?</div>
            <a routerLink="/register" class="gd-sidebar-cta-btn">Créer mon compte</a>
          </div>
        </aside>

        <!-- Main content -->
        <main class="gd-main">

          <!-- ── Section 1 : Démarrage ─────────────────────────── -->
          <section id="start" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Étape 1</div>
              <h2 class="gd-h2">🚀 {{ sections[0].title }}</h2>
              <p class="gd-section-intro">En moins de 5 minutes, votre menu est en ligne. Voici comment.</p>
            </div>

            <div class="gd-steps">
              <div class="gd-step">
                <div class="gd-step-num">1</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Créer votre compte</div>
                  <p>Rendez-vous sur <strong>saemenus.com/register</strong>. Renseignez les informations de votre restaurant : nom, adresse, téléphone, et créez votre identifiant avec votre e-mail et un mot de passe sécurisé.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">2</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Configurer votre profil restaurant</div>
                  <p>Dans <strong>Administration → Infos restaurant</strong>, ajoutez votre logo, une description, vos horaires d'ouverture et la devise de votre pays. Ces informations apparaissent en haut de votre menu public.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">3</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Choisir votre abonnement</div>
                  <p>Commencez avec le plan Gratuit pour tester la plateforme. Upgradez vers Pro lorsque vous souhaitez activer les commandes en ligne et les statistiques avancées.</p>
                </div>
              </div>
            </div>

            <!-- Mock : Registration form -->
            <div class="gd-mock-frame">
              <div class="gd-mock-bar">
                <div class="gd-mock-dots">
                  <span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span>
                </div>
                <div class="gd-mock-url">saemenus.com/register</div>
              </div>
              <div class="gd-mock-body" style="padding: 32px 28px;">
                <div style="text-align:center; margin-bottom: 24px;">
                  <div style="width:40px;height:40px;background:var(--brand);border-radius:10px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
                    <svg width="18" height="18" viewBox="0 0 40 40" fill="none"><path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/><path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/></svg>
                  </div>
                  <div class="gd-mock-line" style="height:14px;width:60%;margin:0 auto 6px;background:var(--gray-200)"></div>
                  <div class="gd-mock-line" style="height:9px;width:80%;margin:0 auto;background:var(--gray-100)"></div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                  <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                  <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                </div>
                <div class="gd-mock-field" style="margin-bottom:12px"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                <div class="gd-mock-field" style="margin-bottom:20px"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                <div style="height:40px;background:var(--brand);border-radius:999px;opacity:.9"></div>
              </div>
            </div>
            <p class="gd-mock-caption">Formulaire d'inscription — étape 1 sur 2</p>
          </section>

          <!-- ── Section 2 : Menu ──────────────────────────────── -->
          <section id="menu" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Étape 2</div>
              <h2 class="gd-h2">📋 {{ sections[1].title }}</h2>
              <p class="gd-section-intro">Construisez votre menu en quelques clics. Catégories, plats, prix, images — tout est gérable depuis le tableau de bord.</p>
            </div>

            <div class="gd-feature-grid">
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FFF5F5; color:var(--brand)">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </div>
                <div class="gd-feature-title">Créer une catégorie</div>
                <p>Organisez votre menu en sections : Entrées, Plats, Desserts, Boissons… Réorganisez-les par glisser-déposer.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#EFF6FF; color:#2563EB">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                </div>
                <div class="gd-feature-title">Ajouter un plat</div>
                <p>Nom, description, prix, photo, badges (Nouveau, Populaire, Végétarien…) et statut de disponibilité.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#F0FDF4; color:#16A34A">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div class="gd-feature-title">Modifier en direct</div>
                <p>Toute modification est visible instantanément par vos clients. Pas de publication manuelle.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FDF4FF; color:#7C3AED">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                </div>
                <div class="gd-feature-title">Désactiver un plat</div>
                <p>Rupture de stock ? Désactivez un plat en un clic. Il disparaît du menu mais ses données sont conservées.</p>
              </div>
            </div>

            <!-- Mock : Menu items dashboard -->
            <div class="gd-mock-frame">
              <div class="gd-mock-bar">
                <div class="gd-mock-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
                <div class="gd-mock-url">saemenus.com/admin/menu-items</div>
              </div>
              <div class="gd-mock-body" style="padding: 20px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
                  <div>
                    <div class="gd-mock-line" style="height:12px;width:120px;background:var(--gray-200);margin-bottom:6px"></div>
                    <div class="gd-mock-line" style="height:8px;width:80px;background:var(--gray-100)"></div>
                  </div>
                  <div style="height:36px;width:120px;background:var(--brand);border-radius:999px;opacity:.9"></div>
                </div>
                <div style="display:flex;gap:8px;margin-bottom:16px">
                  @for (t of [1,2,3,4]; track t) {
                    <div style="height:28px;padding:0 12px;border-radius:999px;border:1px solid var(--border);display:flex;align-items:center;">
                      <div class="gd-mock-line" [style.width.px]="50 + t*10" style="height:8px;background:var(--gray-150)"></div>
                    </div>
                  }
                </div>
                @for (row of [1,2,3]; track row) {
                  <div style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:white">
                    <div style="width:56px;height:56px;border-radius:10px;background:var(--gray-100);flex-shrink:0"></div>
                    <div style="flex:1">
                      <div class="gd-mock-line" [style.width.%]="40 + row * 10" style="height:10px;background:var(--gray-200);margin-bottom:6px"></div>
                      <div class="gd-mock-line" style="height:8px;width:70%;background:var(--gray-100)"></div>
                    </div>
                    <div style="width:60px;text-align:right">
                      <div class="gd-mock-line" style="height:10px;width:50px;background:var(--brand);opacity:.4;border-radius:4px"></div>
                    </div>
                    <div style="width:44px;height:24px;border-radius:999px;" [style.background]="row < 3 ? 'var(--success)' : 'var(--gray-200)'" style="opacity:.6"></div>
                  </div>
                }
              </div>
            </div>
            <p class="gd-mock-caption">Vue de gestion des plats — liste avec statut actif/inactif</p>
          </section>

          <!-- ── Section 3 : Apparence ─────────────────────────── -->
          <section id="appearance" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Étape 3</div>
              <h2 class="gd-h2">🎨 {{ sections[2].title }}</h2>
              <p class="gd-section-intro">Choisissez parmi 5 templates visuels et adaptez les couleurs à votre identité.</p>
            </div>

            <div class="gd-templates-grid">
              @for (tpl of templates; track tpl.name) {
                <div class="gd-tpl-card" [style.--tc]="tpl.color">
                  <div class="gd-tpl-preview" [style.background]="tpl.bg">
                    <div class="gd-tpl-preview-inner" [innerHTML]="tpl.preview"></div>
                  </div>
                  <div class="gd-tpl-name">{{ tpl.name }}</div>
                  <div class="gd-tpl-desc">{{ tpl.desc }}</div>
                </div>
              }
            </div>

            <div class="gd-tip-box">
              <div class="gd-tip-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p><strong>Astuce :</strong> La couleur de marque est utilisée pour les boutons, badges et éléments d'accentuation de votre menu. Choisissez-la en accord avec votre logo. Changeable à tout moment depuis <em>Infos restaurant → Couleur de marque</em>.</p>
            </div>
          </section>

          <!-- ── Section 4 : QR Code ──────────────────────────── -->
          <section id="qrcode" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Étape 4</div>
              <h2 class="gd-h2">📱 {{ sections[3].title }}</h2>
              <p class="gd-section-intro">Votre QR code est généré automatiquement. Imprimez-le et placez-le sur vos tables.</p>
            </div>

            <div class="gd-qr-layout">
              <div class="gd-qr-steps">
                <div class="gd-qr-step">
                  <div class="gd-qr-step-icon" style="background:#FFF5F5;color:var(--brand)">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  </div>
                  <div>
                    <div class="gd-qr-step-title">Accéder au tableau de bord</div>
                    <p>Dans <strong>Administration → Infos restaurant</strong>, vous trouverez votre QR code dans la section dédiée.</p>
                  </div>
                </div>
                <div class="gd-qr-step">
                  <div class="gd-qr-step-icon" style="background:#EFF6FF;color:#2563EB">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div>
                    <div class="gd-qr-step-title">Télécharger en haute résolution</div>
                    <p>Le QR code est disponible en format PNG (haute résolution) adapté à l'impression sur supports physiques.</p>
                  </div>
                </div>
                <div class="gd-qr-step">
                  <div class="gd-qr-step-icon" style="background:#F0FDF4;color:#16A34A">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                  </div>
                  <div>
                    <div class="gd-qr-step-title">Partager le lien direct</div>
                    <p>Copiez l'URL unique de votre menu pour la partager sur vos réseaux sociaux, Google My Business ou WhatsApp.</p>
                  </div>
                </div>
              </div>

              <!-- QR code mock -->
              <div class="gd-qr-visual">
                <div class="gd-qr-card">
                  <div class="gd-qr-code">
                    <div class="gd-qr-grid">
                      @for (cell of qrCells; track $index) {
                        <div class="gd-qr-cell" [class.gd-qr-dark]="cell"></div>
                      }
                    </div>
                  </div>
                  <div class="gd-qr-label">saemenus.com/menu</div>
                  <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
                    <div style="height:32px;width:110px;background:var(--brand);border-radius:999px;opacity:.9"></div>
                    <div style="height:32px;width:80px;background:var(--gray-100);border-radius:999px"></div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Section 5 : Commandes ────────────────────────── -->
          <section id="orders" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge gd-badge-pro">Pro</div>
              <h2 class="gd-h2">🛒 {{ sections[4].title }}</h2>
              <p class="gd-section-intro">Avec le plan Pro, vos clients commandent directement depuis leur smartphone. Les commandes arrivent en temps réel dans votre dashboard.</p>
            </div>

            <div class="gd-flow">
              <div class="gd-flow-step">
                <div class="gd-flow-num">1</div>
                <div class="gd-flow-icon">📱</div>
                <div class="gd-flow-title">Client scanne</div>
                <div class="gd-flow-desc">Il consulte le menu, ajoute des plats au panier et valide sa commande avec son nom et numéro de table.</div>
              </div>
              <div class="gd-flow-arrow">→</div>
              <div class="gd-flow-step">
                <div class="gd-flow-num">2</div>
                <div class="gd-flow-icon">🔔</div>
                <div class="gd-flow-title">Vous recevez</div>
                <div class="gd-flow-desc">La commande apparaît immédiatement dans <em>Administration → Commandes</em> avec tous les détails.</div>
              </div>
              <div class="gd-flow-arrow">→</div>
              <div class="gd-flow-step">
                <div class="gd-flow-num">3</div>
                <div class="gd-flow-icon">✅</div>
                <div class="gd-flow-title">Vous traitez</div>
                <div class="gd-flow-desc">Changez le statut : En attente → En préparation → Prêt → Livré. Le suivi est complet.</div>
              </div>
            </div>

            <!-- Mock : Orders dashboard -->
            <div class="gd-mock-frame">
              <div class="gd-mock-bar">
                <div class="gd-mock-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
                <div class="gd-mock-url">saemenus.com/admin/orders</div>
              </div>
              <div class="gd-mock-body" style="padding:20px">
                <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
                  @for (badge of orderBadges; track badge.label) {
                    <div style="display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:.75rem;font-weight:700;" [style.background]="badge.bg" [style.color]="badge.color">
                      <div style="width:8px;height:8px;border-radius:50%;" [style.background]="badge.color"></div>
                      {{ badge.label }}
                    </div>
                  }
                </div>
                @for (order of mockOrders; track order.num) {
                  <div style="display:flex;align-items:center;gap:12px;padding:14px;border:1px solid var(--border);border-radius:12px;margin-bottom:8px;background:white">
                    <div style="text-align:center;min-width:48px">
                      <div style="font-size:.7rem;font-weight:700;color:var(--text-muted)">#{{ order.num }}</div>
                    </div>
                    <div style="flex:1">
                      <div class="gd-mock-line" style="height:10px;width:55%;background:var(--gray-200);margin-bottom:5px"></div>
                      <div class="gd-mock-line" style="height:8px;width:75%;background:var(--gray-100)"></div>
                    </div>
                    <div style="padding:4px 12px;border-radius:999px;font-size:.7rem;font-weight:700;" [style.background]="order.statusBg" [style.color]="order.statusColor">{{ order.status }}</div>
                    <div class="gd-mock-line" style="height:10px;width:50px;background:var(--brand);opacity:.5;border-radius:4px"></div>
                  </div>
                }
              </div>
            </div>
            <p class="gd-mock-caption">Tableau de bord des commandes — vue en temps réel avec filtres par statut</p>
          </section>

          <!-- ── Section 6 : Réservations ──────────────────────── -->
          <section id="reservations" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Inclus</div>
              <h2 class="gd-h2">📅 {{ sections[5].title }}</h2>
              <p class="gd-section-intro">Recevez et gérez les demandes de réservation directement depuis votre tableau de bord.</p>
            </div>

            <div class="gd-two-col">
              <div>
                <h3 class="gd-h3">Ce que voient vos clients</h3>
                <p>Un bouton "Réserver une table" est affiché sur votre menu public. Le client choisit la date, l'heure, le nombre de personnes et peut laisser un message. Aucune application à télécharger.</p>
                <h3 class="gd-h3" style="margin-top:var(--space-6)">Ce que vous voyez</h3>
                <p>Les demandes arrivent dans <strong>Administration → Réservations</strong> avec toutes les informations. Vous pouvez confirmer ou refuser chaque demande. Un e-mail est automatiquement envoyé au client.</p>
                <div class="gd-tip-box" style="margin-top:var(--space-5)">
                  <div class="gd-tip-icon">💡</div>
                  <p>Les réservations peuvent être filtrées par date, statut (En attente, Confirmée, Annulée) et exportées.</p>
                </div>
              </div>
              <!-- Mock reservation form -->
              <div class="gd-mock-frame" style="margin-top:0">
                <div class="gd-mock-bar">
                  <div class="gd-mock-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
                  <div class="gd-mock-url">Menu → Réserver</div>
                </div>
                <div class="gd-mock-body" style="padding:20px">
                  <div class="gd-mock-line" style="height:12px;width:60%;background:var(--gray-200);margin-bottom:20px"></div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                    <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                    <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
                    <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                    <div class="gd-mock-field"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input"></div></div>
                  </div>
                  <div class="gd-mock-field" style="margin-bottom:16px"><div class="gd-mock-field-label"></div><div class="gd-mock-field-input" style="height:64px"></div></div>
                  <div style="height:38px;background:var(--brand);border-radius:999px;opacity:.9"></div>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Section 7 : Équipe ────────────────────────────── -->
          <section id="team" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge">Pro</div>
              <h2 class="gd-h2">👥 {{ sections[6].title }}</h2>
              <p class="gd-section-intro">Donnez accès à votre tableau de bord à vos employés selon leur rôle.</p>
            </div>

            <div class="gd-roles-grid">
              <div class="gd-role-card">
                <div class="gd-role-badge" style="background:#FFF5F5;color:var(--brand)">Admin</div>
                <div class="gd-role-title">Propriétaire / Admin</div>
                <ul class="gd-role-list">
                  <li>Accès complet à toutes les fonctionnalités</li>
                  <li>Gestion du menu, de l'équipe et de l'abonnement</li>
                  <li>Consultation des statistiques et logs d'audit</li>
                  <li>Paramètres du restaurant</li>
                </ul>
              </div>
              <div class="gd-role-card">
                <div class="gd-role-badge" style="background:#EFF6FF;color:#2563EB">Caissier</div>
                <div class="gd-role-title">Caissier / Serveur</div>
                <ul class="gd-role-list">
                  <li>Vue et gestion des commandes en cours</li>
                  <li>Confirmation et suivi des réservations</li>
                  <li>Lecture seule du menu</li>
                  <li>Pas d'accès aux paramètres ni à la facturation</li>
                </ul>
              </div>
            </div>

            <div class="gd-steps" style="margin-top:var(--space-8)">
              <div class="gd-step">
                <div class="gd-step-num">1</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Aller dans Administration → Équipe</div>
                  <p>Cliquez sur "Inviter un membre". Saisissez l'e-mail de votre collaborateur et sélectionnez son rôle.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">2</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Votre collaborateur reçoit un e-mail</div>
                  <p>Il clique sur le lien d'invitation, crée son mot de passe et accède immédiatement au tableau de bord avec ses droits.</p>
                </div>
              </div>
            </div>
          </section>

          <!-- ── Section 8 : Statistiques ─────────────────────── -->
          <section id="stats" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge gd-badge-pro">Pro</div>
              <h2 class="gd-h2">📊 {{ sections[7].title }}</h2>
              <p class="gd-section-intro">Comprenez les tendances de votre menu et identifiez vos plats les plus populaires.</p>
            </div>

            <!-- Stats mock -->
            <div class="gd-mock-frame">
              <div class="gd-mock-bar">
                <div class="gd-mock-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
                <div class="gd-mock-url">saemenus.com/admin/stats</div>
              </div>
              <div class="gd-mock-body" style="padding:20px">
                <!-- KPIs -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px">
                  @for (kpi of mockKpis; track kpi.label) {
                    <div style="padding:14px;border-radius:12px;border:1px solid var(--border);background:white">
                      <div class="gd-mock-line" [style.background]="kpi.color" style="height:6px;width:50%;border-radius:4px;opacity:.5;margin-bottom:8px"></div>
                      <div class="gd-mock-line" [style.background]="kpi.color" style="height:16px;width:70%;border-radius:4px;margin-bottom:4px"></div>
                      <div class="gd-mock-line" style="height:8px;width:60%;background:var(--gray-100);border-radius:4px"></div>
                    </div>
                  }
                </div>
                <!-- Bar chart mock -->
                <div style="padding:16px;border-radius:12px;border:1px solid var(--border);background:white">
                  <div class="gd-mock-line" style="height:10px;width:30%;background:var(--gray-200);margin-bottom:16px"></div>
                  <div style="display:flex;align-items:flex-end;gap:8px;height:80px">
                    @for (bar of chartBars; track $index) {
                      <div style="flex:1;border-radius:6px 6px 0 0;background:var(--brand);" [style.height.%]="bar" [style.opacity]="0.3 + bar/150"></div>
                    }
                  </div>
                </div>
              </div>
            </div>
            <p class="gd-mock-caption">Tableau de bord statistiques — KPIs + graphe d'activité hebdomadaire</p>

            <div class="gd-feature-grid" style="margin-top:var(--space-8)">
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FFF5F5;color:var(--brand)">📈</div>
                <div class="gd-feature-title">Vues du menu</div>
                <p>Nombre de scans QR code et de visites uniques sur votre menu, par jour et par semaine.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#EFF6FF;color:#2563EB">🍽️</div>
                <div class="gd-feature-title">Plats populaires</div>
                <p>Classement de vos plats les plus commandés ou les plus consultés.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#F0FDF4;color:#16A34A">💰</div>
                <div class="gd-feature-title">Revenus estimés</div>
                <p>Suivi du chiffre d'affaires généré via les commandes en ligne sur la période sélectionnée.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FDF4FF;color:#7C3AED">📅</div>
                <div class="gd-feature-title">Pics d'activité</div>
                <p>Identifiez les heures et jours de la semaine où votre menu est le plus consulté.</p>
              </div>
            </div>
          </section>

          <!-- ── Section 9 : Finance ──────────────────────── -->
          <section id="finance" class="gd-section">
            <div class="gd-section-head">
              <div class="gd-section-badge gd-badge-enterprise">Enterprise</div>
              <h2 class="gd-h2">💰 {{ sections[8].title }}</h2>
              <p class="gd-section-intro">Suivez l'intégralité de vos flux financiers : revenus des commandes, entrées manuelles et dépenses classées par catégorie. Des graphes interactifs vous donnent une vision claire de la santé de votre activité.</p>
            </div>

            <!-- KPI cards mock -->
            <div class="gd-mock-frame">
              <div class="gd-mock-bar">
                <div class="gd-mock-dots"><span style="background:#FF5F57"></span><span style="background:#FEBC2E"></span><span style="background:#28C840"></span></div>
                <div class="gd-mock-url">saemenus.com/admin/finance</div>
              </div>
              <div class="gd-mock-body" style="padding:20px">
                <!-- Period pills -->
                <div style="display:flex;gap:6px;margin-bottom:18px">
                  @for (lbl of ["Aujourd'hui","7 jours","Ce mois","6 mois","Cette année"]; track lbl) {
                    <div style="padding:5px 12px;border-radius:7px;font-size:11px;font-weight:600;background:white;border:1px solid var(--border);color:var(--text-secondary)">{{ lbl }}</div>
                  }
                </div>
                <!-- 4 KPI cards -->
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px">
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Revenus totaux</div>
                    <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:2px">1 250 000 F</div>
                    <div style="font-size:9px;color:#10b981;font-weight:600">↑ +18% vs période préc.</div>
                  </div>
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Dépenses totales</div>
                    <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:2px">340 000 F</div>
                    <div style="font-size:9px;color:#ef4444;font-weight:600">↑ +5% vs période préc.</div>
                  </div>
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Bénéfice net</div>
                    <div style="font-size:18px;font-weight:800;color:#10b981;margin-bottom:2px">910 000 F</div>
                    <div style="font-size:9px;color:#6b7280">Bénéficiaire sur la période</div>
                  </div>
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Marge nette</div>
                    <div style="font-size:18px;font-weight:800;color:#111;margin-bottom:6px">73%</div>
                    <div style="height:4px;background:#e5e7eb;border-radius:4px"><div style="height:100%;width:73%;background:linear-gradient(90deg,#3b82f6,#6366f1);border-radius:4px"></div></div>
                  </div>
                </div>
                <!-- Chart placeholder + donut -->
                <div style="display:grid;grid-template-columns:1fr 220px;gap:10px">
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:10px;font-weight:700;color:#111;margin-bottom:12px">Revenus vs Dépenses</div>
                    <div style="display:flex;align-items:flex-end;gap:5px;height:70px;padding:0 4px">
                      @for (bar of financeChartBars; track bar.l) {
                        <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px">
                          <div style="width:100%;display:flex;gap:2px;align-items:flex-end;justify-content:center">
                            <div [style.height.px]="bar.r" style="flex:1;background:#10b981;border-radius:2px 2px 0 0;opacity:.85"></div>
                            <div [style.height.px]="bar.e" style="flex:1;background:#f59e0b;border-radius:2px 2px 0 0;opacity:.85"></div>
                          </div>
                          <div style="font-size:7px;color:#9ca3af">{{ bar.l }}</div>
                        </div>
                      }
                    </div>
                  </div>
                  <div style="background:white;border:1px solid var(--border);border-radius:12px;padding:14px">
                    <div style="font-size:10px;font-weight:700;color:#111;margin-bottom:12px">Répartition dépenses</div>
                    <div style="display:flex;align-items:center;gap:10px">
                      <svg viewBox="0 0 60 60" width="60" height="60" style="flex-shrink:0">
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#f59e0b" stroke-width="10" stroke-dasharray="83 55" transform="rotate(-90 30 30)"/>
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#6366f1" stroke-width="10" stroke-dasharray="42 96" stroke-dashoffset="-83" transform="rotate(-90 30 30)"/>
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#3b82f6" stroke-width="10" stroke-dasharray="8 130" stroke-dashoffset="-125" transform="rotate(-90 30 30)"/>
                        <circle cx="30" cy="30" r="22" fill="none" stroke="#8b5cf6" stroke-width="10" stroke-dasharray="5 133" stroke-dashoffset="-133" transform="rotate(-90 30 30)"/>
                      </svg>
                      <div style="display:flex;flex-direction:column;gap:5px">
                        @for (cat of donutLegend; track cat.l) {
                          <div style="display:flex;align-items:center;gap:5px;font-size:8px">
                            <div [style.background]="cat.c" style="width:7px;height:7px;border-radius:50%;flex-shrink:0"></div>
                            <span style="color:#6b7280">{{ cat.l }}</span>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <p class="gd-mock-caption">Tableau de bord financier — KPIs, graphe barres groupées et répartition des dépenses</p>

            <!-- Feature cards -->
            <div class="gd-feature-grid" style="margin-top:var(--space-8)">
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FFF5F5;color:var(--brand)">📊</div>
                <div class="gd-feature-title">KPIs en temps réel</div>
                <p>Revenus totaux, dépenses, bénéfice net et marge en pourcentage. Chaque indicateur affiche l'évolution par rapport à la période précédente.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#FFF7ED;color:#f59e0b">🧾</div>
                <div class="gd-feature-title">Suivi des dépenses</div>
                <p>Enregistrez vos dépenses par catégorie : <strong>Ingrédients</strong>, <strong>Outils</strong>, <strong>Accessoires</strong> ou <strong>Autre</strong>. Ajoutez un libellé, un montant, une date et des notes.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#F0FDF4;color:#10b981">💵</div>
                <div class="gd-feature-title">Revenus automatiques & manuels</div>
                <p>Les commandes validées sont intégrées automatiquement. Ajoutez aussi des entrées manuelles (traiteur, vente directe…) pour un tableau complet.</p>
              </div>
              <div class="gd-feature-card">
                <div class="gd-feature-icon" style="background:#EDE9FE;color:#6366f1">📈</div>
                <div class="gd-feature-title">Graphes sur 5 périodes</div>
                <p>Analysez vos flux sur la journée (par heure), 7 jours, le mois, les 6 derniers mois ou l'année complète. Revenus, dépenses et bénéfice net sur le même graphe.</p>
              </div>
            </div>

            <!-- Steps -->
            <div class="gd-steps" style="margin-top:var(--space-8)">
              <div class="gd-step">
                <div class="gd-step-num">1</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Accéder à la section Finance</div>
                  <p>Dans le menu latéral de votre tableau de bord, cliquez sur <strong>Finance</strong>. Cette section est réservée aux comptes sur le plan Enterprise.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">2</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Choisir la période d'analyse</div>
                  <p>Utilisez le sélecteur en haut à droite pour filtrer : <em>Aujourd'hui</em>, <em>7 jours</em>, <em>Ce mois</em>, <em>6 mois</em> ou <em>Cette année</em>. Les KPIs et graphes se mettent à jour instantanément.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">3</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Enregistrer une dépense</div>
                  <p>Dans l'onglet <strong>Dépenses</strong>, cliquez sur <em>Ajouter une dépense</em>. Sélectionnez la catégorie (Ingrédients, Outils, Accessoires, Autre), renseignez le libellé, le montant et la date.</p>
                </div>
              </div>
              <div class="gd-step">
                <div class="gd-step-num">4</div>
                <div class="gd-step-content">
                  <div class="gd-step-title">Ajouter un revenu manuel</div>
                  <p>Basculez sur l'onglet <strong>Revenus manuels</strong> pour saisir une entrée d'argent hors commandes : vente de traiteur, prestation spéciale, subvention…</p>
                </div>
              </div>
            </div>

            <div class="gd-tip-box" style="margin-top:var(--space-8)">
              <div class="gd-tip-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p><strong>Astuce :</strong> Le graphe en donut à droite décompose vos dépenses par catégorie. Si une catégorie représente une part trop importante (ex. Ingrédients > 60%), c'est un signal pour renégocier vos fournisseurs.</p>
            </div>
          </section>

          <!-- Final CTA -->
          <div class="gd-final-cta">
            <div class="gd-final-cta-inner">
              <div class="gd-final-cta-icon">🚀</div>
              <h2 class="gd-final-cta-h2">Prêt à digitaliser votre restaurant ?</h2>
              <p>Créez votre menu en 5 minutes. Aucune carte bancaire requise pour commencer.</p>
              <div class="gd-final-cta-actions">
                <a routerLink="/register" class="gd-final-btn-primary">Créer mon compte gratuitement</a>
                <a routerLink="/pricing" class="gd-final-btn-ghost">Voir les tarifs</a>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>

    <!-- Footer -->
    <footer class="gd-footer">
      <div class="gd-footer-inner">
        <span>© 2026 SaeMenus. Tous droits réservés.</span>
        <div class="gd-footer-links">
          <a routerLink="/" class="gd-footer-link">Accueil</a>
          <a routerLink="/pricing" class="gd-footer-link">Tarifs</a>
          <a routerLink="/faq" class="gd-footer-link">FAQ</a>
          <a routerLink="/privacy" class="gd-footer-link">Confidentialité</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }
    .gd-container { max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6); }

    /* Nav */
    .gd-nav {
      position: sticky; top: 0; z-index: 200;
      background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .gd-nav-inner {
      max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6);
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .gd-logo { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; }
    .gd-logo-icon {
      width: 32px; height: 32px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .gd-logo-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .gd-nav-right { display: flex; align-items: center; gap: var(--space-3); }
    .gd-nav-login { font-size: .9rem; color: var(--text-secondary); text-decoration: none; font-weight: 500; }
    .gd-nav-cta {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .875rem; font-weight: 600;
    }
    @media (max-width: 480px) { .gd-nav-right { display: none; } }

    /* Progress bar */
    .gd-progress-bar {
      position: sticky; top: 64px; z-index: 150;
      height: 3px; background: var(--gray-100);
    }
    .gd-progress-fill {
      height: 100%; background: var(--brand);
      transition: width .1s linear;
    }

    /* Hero */
    .gd-hero {
      padding: 64px 0 56px; position: relative; overflow: hidden;
      background: linear-gradient(160deg, #FFF8F7 0%, white 60%);
      border-bottom: 1px solid var(--border);
    }
    .gd-hero-bg { position: absolute; inset: 0; pointer-events: none; }
    .gd-blob {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.06) 0%, transparent 70%);
    }
    .gd-blob-1 { width: 500px; height: 500px; top: -150px; right: -100px; }
    .gd-blob-2 { width: 300px; height: 300px; bottom: -80px; left: 200px; background: radial-gradient(circle, rgba(37,99,235,.04) 0%, transparent 70%); }
    .gd-back { margin-bottom: var(--space-5); }
    .gd-back-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-decoration: none; font-weight: 500;
      &:hover { color: var(--brand); }
    }
    .gd-hero-tag {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .gd-hero-h1 {
      font-family: var(--font-display); font-size: clamp(1.875rem, 4vw, 3rem);
      margin: 0 0 var(--space-4); line-height: 1.1;
    }
    .gd-hero-sub {
      font-size: 1.125rem; color: var(--text-secondary); margin: 0 0 var(--space-8);
      line-height: 1.7; max-width: 600px;
    }
    .gd-hero-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .gd-hero-pills a {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      border: 1px solid var(--border); background: white;
      font-size: .875rem; font-weight: 500; color: var(--text-secondary);
      text-decoration: none; transition: all .2s;
      &:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
    }

    /* Layout */
    .gd-layout-wrap { background: white; }
    .gd-layout {
      max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6);
      display: grid; grid-template-columns: 240px 1fr; gap: 64px;
    }
    @media (max-width: 900px) { .gd-layout { grid-template-columns: 1fr; } }

    /* Sidebar */
    .gd-sidebar {
      padding-top: 48px;
      position: sticky;
      top: 88px;
      height: fit-content;
      align-self: start;
    }
    @media (max-width: 900px) { .gd-sidebar { display: none; } }
    .gd-toc-title {
      font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted); margin-bottom: var(--space-3);
    }
    .gd-toc-item {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: .875rem; color: var(--text-secondary); text-decoration: none;
      transition: all .2s; border-left: 2px solid transparent;
      &:hover { color: var(--brand); background: var(--brand-subtle); border-left-color: var(--brand); }
    }
    .gd-toc-active { color: var(--brand) !important; background: var(--brand-subtle) !important; border-left-color: var(--brand) !important; font-weight: 600; }
    .gd-toc-icon { font-size: 1rem; }
    .gd-sidebar-cta {
      margin-top: var(--space-8); padding: var(--space-5); border-radius: var(--radius-xl);
      background: var(--brand-subtle); border: 1px solid rgba(192,57,43,.15);
    }
    .gd-sidebar-cta-title { font-size: .875rem; font-weight: 700; margin-bottom: var(--space-3); color: var(--brand); }
    .gd-sidebar-cta-btn {
      display: block; text-align: center; background: var(--brand); color: white;
      text-decoration: none; padding: var(--space-3); border-radius: var(--radius-lg);
      font-size: .875rem; font-weight: 700;
    }

    /* Main */
    .gd-main { padding: 48px 0 80px; }

    /* Sections */
    .gd-section { margin-bottom: 80px; padding-bottom: 80px; border-bottom: 1px solid var(--border); }
    .gd-section:last-of-type { border-bottom: none; }
    .gd-section-head { margin-bottom: var(--space-8); }
    .gd-section-badge {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .gd-badge-pro { background: linear-gradient(135deg, #7C3AED22, #5B21B622); color: #7C3AED; }
    .gd-badge-enterprise { background: linear-gradient(135deg, #f59e0b22, #d9770622); color: #d97706; }
    .gd-h2 {
      font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem);
      margin: 0 0 var(--space-3); line-height: 1.2;
    }
    .gd-h3 { font-size: 1rem; font-weight: 700; margin: 0 0 var(--space-3); }
    p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 var(--space-4); }
    .gd-section-intro { font-size: 1.0625rem; color: var(--text-secondary); margin: 0; max-width: 600px; }

    /* Steps */
    .gd-steps { display: flex; flex-direction: column; gap: var(--space-5); margin-bottom: var(--space-8); }
    .gd-step { display: flex; gap: var(--space-5); align-items: flex-start; }
    .gd-step-num {
      width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .9375rem; flex-shrink: 0; margin-top: 2px;
    }
    .gd-step-content { flex: 1; }
    .gd-step-title { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-2); }

    /* Feature grid */
    .gd-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-8); }
    @media (max-width: 600px) { .gd-feature-grid { grid-template-columns: 1fr; } }
    .gd-feature-card {
      padding: var(--space-5) var(--space-6); border-radius: var(--radius-xl);
      border: 1px solid var(--border); background: white;
    }
    .gd-feature-icon {
      width: 40px; height: 40px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; margin-bottom: var(--space-3);
    }
    .gd-feature-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }

    /* Mock frame */
    .gd-mock-frame {
      border-radius: var(--radius-xl); overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04);
      margin-bottom: var(--space-3);
    }
    .gd-mock-bar {
      background: var(--gray-50); border-bottom: 1px solid var(--border);
      padding: 10px 16px; display: flex; align-items: center; gap: 12px;
    }
    .gd-mock-dots { display: flex; gap: 6px; }
    .gd-mock-dots span { width: 12px; height: 12px; border-radius: 50%; display: block; }
    .gd-mock-url {
      flex: 1; text-align: center; font-size: .75rem; color: var(--text-muted);
      background: white; border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 4px 12px;
    }
    .gd-mock-body { background: var(--gray-50); }
    .gd-mock-line { border-radius: 4px; }
    .gd-mock-field { }
    .gd-mock-field-label { height: 8px; width: 35%; background: var(--gray-150); border-radius: 4px; margin-bottom: 6px; }
    .gd-mock-field-input { height: 40px; background: white; border: 1px solid var(--border); border-radius: 8px; }
    .gd-mock-caption { font-size: .8125rem; color: var(--text-muted); text-align: center; margin-bottom: var(--space-6); }

    /* Templates grid */
    .gd-templates-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3); margin-bottom: var(--space-8); }
    @media (max-width: 768px) { .gd-templates-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 480px) { .gd-templates-grid { grid-template-columns: 1fr 1fr; } }
    .gd-tpl-card { text-align: center; }
    .gd-tpl-preview {
      height: 110px; border-radius: var(--radius-xl); border: 2px solid var(--border);
      overflow: hidden; margin-bottom: var(--space-3);
      display: flex; align-items: center; justify-content: center;
      transition: border-color .2s;
      &:hover { border-color: var(--brand); }
    }
    .gd-tpl-preview-inner { width: 100%; height: 100%; }
    .gd-tpl-name { font-size: .875rem; font-weight: 700; margin-bottom: 2px; }
    .gd-tpl-desc { font-size: .75rem; color: var(--text-muted); }

    /* QR layout */
    .gd-qr-layout { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: start; margin-bottom: var(--space-6); }
    @media (max-width: 700px) { .gd-qr-layout { grid-template-columns: 1fr; } }
    .gd-qr-steps { display: flex; flex-direction: column; gap: var(--space-6); }
    .gd-qr-step { display: flex; gap: var(--space-4); }
    .gd-qr-step-icon {
      width: 44px; height: 44px; border-radius: var(--radius-xl); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .gd-qr-step-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }
    .gd-qr-visual { }
    .gd-qr-card {
      padding: var(--space-6); background: white; border-radius: var(--radius-2xl);
      border: 1px solid var(--border); box-shadow: var(--shadow-md); text-align: center;
      min-width: 180px;
    }
    .gd-qr-code {
      width: 140px; height: 140px; margin: 0 auto var(--space-3); padding: 8px;
      border: 2px solid var(--gray-200); border-radius: var(--radius-lg);
      background: white;
    }
    .gd-qr-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px; height: 100%; }
    .gd-qr-cell { border-radius: 1px; background: white; }
    .gd-qr-dark { background: #1a1a1a; }
    .gd-qr-label { font-size: .75rem; color: var(--text-muted); font-weight: 500; margin-bottom: var(--space-3); }

    /* Flow */
    .gd-flow {
      display: flex; align-items: flex-start; gap: var(--space-4);
      margin-bottom: var(--space-8); flex-wrap: wrap;
    }
    .gd-flow-step {
      flex: 1; min-width: 180px; padding: var(--space-6);
      border: 1px solid var(--border); border-radius: var(--radius-xl);
      background: white; text-align: center;
    }
    .gd-flow-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%; background: var(--brand); color: white;
      font-size: .8rem; font-weight: 700; margin-bottom: var(--space-3);
    }
    .gd-flow-icon { font-size: 1.75rem; margin-bottom: var(--space-2); }
    .gd-flow-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }
    .gd-flow-desc { font-size: .8125rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
    .gd-flow-arrow {
      font-size: 1.5rem; color: var(--text-muted); align-self: center;
      padding-top: 0;
    }
    @media (max-width: 600px) { .gd-flow-arrow { transform: rotate(90deg); width: 100%; text-align: center; } }

    /* Roles grid */
    .gd-roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    @media (max-width: 600px) { .gd-roles-grid { grid-template-columns: 1fr; } }
    .gd-role-card { padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-xl); background: white; }
    .gd-role-badge { display: inline-block; font-size: .75rem; font-weight: 700; padding: 3px 12px; border-radius: var(--radius-full); margin-bottom: var(--space-4); }
    .gd-role-title { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-4); }
    .gd-role-list { padding-left: var(--space-5); margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .gd-role-list li { font-size: .875rem; color: var(--text-secondary); line-height: 1.6; }

    /* Two col */
    .gd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    @media (max-width: 768px) { .gd-two-col { grid-template-columns: 1fr; } }

    /* Tip box */
    .gd-tip-box {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl);
      background: #FFFBEB; border: 1px solid #FDE68A; margin-bottom: var(--space-6);
    }
    .gd-tip-icon {
      width: 28px; height: 28px; border-radius: var(--radius-md);
      background: #FEF3C7; color: #D97706;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .9rem;
    }
    .gd-tip-box p { margin: 0; font-size: .875rem; color: #92400E; line-height: 1.7; }

    /* Final CTA */
    .gd-final-cta {
      margin-top: var(--space-10); padding: 64px var(--space-8);
      background: linear-gradient(135deg, var(--brand) 0%, #922B21 100%);
      border-radius: var(--radius-2xl); text-align: center;
    }
    .gd-final-cta-inner { max-width: 560px; margin: 0 auto; }
    .gd-final-cta-icon { font-size: 2.5rem; margin-bottom: var(--space-4); }
    .gd-final-cta-h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem); color: white; margin: 0 0 var(--space-3); }
    .gd-final-cta p { color: rgba(255,255,255,.8); font-size: 1.0625rem; margin-bottom: var(--space-8); }
    .gd-final-cta-actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
    .gd-final-btn-primary {
      display: inline-flex; align-items: center;
      background: white; color: var(--brand); text-decoration: none;
      padding: var(--space-4) var(--space-8); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 700;
    }
    .gd-final-btn-ghost {
      display: inline-flex; align-items: center;
      border: 1px solid rgba(255,255,255,.4); color: white; text-decoration: none;
      padding: var(--space-4) var(--space-8); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 600;
      &:hover { background: rgba(255,255,255,.1); }
    }

    /* Footer */
    .gd-footer { background: var(--gray-50); border-top: 1px solid var(--border); padding: var(--space-6) 0; }
    .gd-footer-inner { max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .gd-footer-inner span { font-size: .875rem; color: var(--text-muted); }
    .gd-footer-links { display: flex; gap: var(--space-5); }
    .gd-footer-link { font-size: .875rem; color: var(--text-muted); text-decoration: none; &:hover { color: var(--brand); } }
  `],
})
export class GuideComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID)

  readonly sections = SECTIONS
  readonly activeSection = signal(SECTIONS[0].id)
  readonly readProgress = signal(0)

  private observer?: IntersectionObserver
  private scrollHandler?: () => void

  readonly templates = [
    { name: 'Classique',  desc: 'Simple & lisible', color: '#C0392B', bg: '#FFF5F5', preview: `<div style="padding:8px;width:100%;height:100%"><div style="height:20px;background:#C0392B;border-radius:4px 4px 0 0;margin-bottom:6px"></div><div style="display:flex;flex-direction:column;gap:4px;padding:0 6px"><div style="height:6px;background:#e0e0e0;border-radius:3px;width:80%"></div><div style="height:6px;background:#e0e0e0;border-radius:3px;width:60%"></div><div style="height:6px;background:#e0e0e0;border-radius:3px;width:70%"></div></div></div>` },
    { name: 'Magazine',   desc: 'Texte + image',    color: '#2563EB', bg: '#EFF6FF', preview: `<div style="padding:8px;width:100%;height:100%"><div style="height:16px;background:#2563EB;border-radius:4px;margin-bottom:6px"></div><div style="display:flex;flex-direction:column;gap:4px;padding:0 4px"><div style="display:flex;gap:4px;height:22px"><div style="width:28px;background:#d0d0d0;border-radius:3px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center"><div style="height:5px;background:#e0e0e0;border-radius:2px"></div><div style="height:4px;background:#ebebeb;border-radius:2px;width:70%"></div></div></div><div style="display:flex;gap:4px;height:22px"><div style="width:28px;background:#d0d0d0;border-radius:3px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center"><div style="height:5px;background:#e0e0e0;border-radius:2px"></div><div style="height:4px;background:#ebebeb;border-radius:2px;width:60%"></div></div></div></div></div>` },
    { name: 'Immersif',   desc: 'Full image',       color: '#16A34A', bg: '#111',    preview: `<div style="position:relative;width:100%;height:100%;background:linear-gradient(180deg,#1a1a1a 0%,#333 100%)"><div style="position:absolute;bottom:10px;left:8px;right:8px"><div style="height:8px;background:rgba(255,255,255,.9);border-radius:3px;margin-bottom:4px;width:70%"></div><div style="height:6px;background:rgba(255,255,255,.5);border-radius:3px;width:50%"></div></div><div style="position:absolute;top:8px;left:8px;right:8px;height:10px;background:rgba(255,255,255,.1);border-radius:3px"></div></div>` },
    { name: 'Zen',        desc: 'Minimaliste',      color: '#D97706', bg: '#FFFBEB', preview: `<div style="padding:10px 8px;width:100%;height:100%"><div style="text-align:center;margin-bottom:8px"><div style="height:8px;background:#D97706;border-radius:3px;width:50%;margin:0 auto 4px"></div><div style="height:5px;background:#e8d5b0;border-radius:2px;width:70%;margin:0 auto"></div></div><div style="display:flex;flex-direction:column;gap:5px"><div style="height:5px;background:#e0e0e0;border-radius:2px;width:100%"></div><div style="height:5px;background:#e0e0e0;border-radius:2px;width:85%"></div><div style="height:5px;background:#e0e0e0;border-radius:2px;width:90%"></div></div></div>` },
    { name: 'Bento',      desc: 'Grille moderne',   color: '#7C3AED', bg: '#F5F3FF', preview: `<div style="padding:6px;width:100%;height:100%;display:grid;grid-template-columns:1fr 1fr;gap:3px"><div style="background:#d4b8ff;border-radius:4px"></div><div style="background:#e0d0ff;border-radius:4px"></div><div style="background:#e0d0ff;border-radius:4px;grid-column:span 2;height:28px"></div><div style="background:#d4b8ff;border-radius:4px"></div><div style="background:#ebe5ff;border-radius:4px"></div></div>` },
  ]

  readonly orderBadges = [
    { label: 'En attente', bg: '#FFF7ED', color: '#C2410C' },
    { label: 'En préparation', bg: '#EFF6FF', color: '#1D4ED8' },
    { label: 'Prêt', bg: '#F0FDF4', color: '#15803D' },
    { label: 'Livré', bg: '#F9FAFB', color: '#6B7280' },
  ]

  readonly mockOrders = [
    { num: '042', status: 'En préparation', statusBg: '#EFF6FF', statusColor: '#1D4ED8' },
    { num: '041', status: 'En attente',     statusBg: '#FFF7ED', statusColor: '#C2410C' },
    { num: '040', status: 'Prêt',           statusBg: '#F0FDF4', statusColor: '#15803D' },
  ]

  readonly mockKpis = [
    { label: 'Scans',    color: '#C0392B' },
    { label: 'Commandes', color: '#2563EB' },
    { label: 'Revenus',  color: '#16A34A' },
    { label: 'Plats vendus', color: '#7C3AED' },
  ]

  readonly chartBars = [45, 60, 38, 72, 55, 80, 65]

  readonly financeChartBars = [
    { l: '01/05', r: 42, e: 18 }, { l: '05/05', r: 30, e: 25 }, { l: '09/05', r: 50, e: 12 },
    { l: '13/05', r: 65, e: 10 }, { l: '17/05', r: 38, e: 20 }, { l: '21/05', r: 55, e: 15 },
    { l: '25/05', r: 48, e: 22 }, { l: '29/05', r: 60, e: 8  },
  ]

  readonly donutLegend = [
    { l: 'Ingrédients', c: '#f59e0b' },
    { l: 'Outils',      c: '#6366f1' },
    { l: 'Accessoires', c: '#3b82f6' },
    { l: 'Autre',       c: '#8b5cf6' },
  ]

  // QR code pattern (10x10 deterministic decorative)
  readonly qrCells: boolean[] = (() => {
    const p = '1110111011010010101111011100101010001011010100010111010110001011111010010110100011011001101101011010110001011001011010100101'
    return p.split('').map(c => c === '1')
  })()

  scrollTo(id: string): void {
    const el = document.getElementById(id)
    if (el) {
      const offset = 120 // nav + progress bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return

    // Progress bar
    this.scrollHandler = () => {
      const doc = document.documentElement
      const scrolled = doc.scrollTop
      const total = doc.scrollHeight - doc.clientHeight
      this.readProgress.set(total > 0 ? Math.round((scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', this.scrollHandler, { passive: true })

    // Active section tracker
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            this.activeSection.set(e.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) this.observer!.observe(el)
    })
  }

  ngOnDestroy(): void {
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler)
    this.observer?.disconnect()
  }
}
