import { Component, signal, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

interface FaqItem {
  q: string
  a: string
  category: string
}

const FAQS: FaqItem[] = [
  // Général
  {
    category: 'Général',
    q: "Qu'est-ce que SaeMenus ?",
    a: "SaeMenus est une plateforme SaaS qui permet aux restaurants de créer un menu digital accessible via QR code. Les clients scannent le QR code avec leur smartphone et consultent le menu, passent des commandes ou réservent une table — sans aucune application à télécharger."
  },
  {
    category: 'Général',
    q: "Comment fonctionne le QR code ?",
    a: "Après avoir créé votre menu, SaeMenus génère automatiquement un QR code unique pour votre restaurant. Vous pouvez le télécharger, l'imprimer sur vos tables, menus physiques ou vitrine. Chaque scan affiche votre menu en temps réel — toute modification que vous faites est visible instantanément par vos clients."
  },
  {
    category: 'Général',
    q: "Faut-il une application pour utiliser SaeMenus ?",
    a: "Non. SaeMenus est accessible directement depuis le navigateur de n'importe quel smartphone. Vos clients n'ont rien à installer. De votre côté, le tableau de bord d'administration est accessible depuis un navigateur web sur ordinateur ou mobile."
  },
  // Compte & Plans
  {
    category: 'Compte & Plans',
    q: "Y a-t-il une période d'essai gratuite ?",
    a: "Oui, le plan Gratuit est disponible sans limite de temps. Il vous permet de créer un menu avec jusqu'à 3 catégories, de générer votre QR code et de recevoir des réservations de base. Vous pouvez upgrader vers un plan payant à tout moment depuis votre tableau de bord."
  },
  {
    category: 'Compte & Plans',
    q: "Quelle est la différence entre les plans ?",
    a: "Le plan Gratuit couvre l'essentiel : menu digital + QR code. Le plan Pro ajoute les commandes en ligne, les réservations avancées, les statistiques détaillées et la gestion d'équipe. Le plan Enterprise ajoute l'accès API, les QR codes cadeaux et un support prioritaire dédié. Consultez la page Tarifs pour le détail complet."
  },
  {
    category: 'Compte & Plans',
    q: "Puis-je changer de plan à tout moment ?",
    a: "Oui. Vous pouvez upgrader immédiatement depuis Tableau de bord → Abonnement. Le changement est effectif instantanément et vous n'êtes facturé que pour la période restante. Pour downgrader, le changement prend effet à la prochaine date de renouvellement."
  },
  {
    category: 'Compte & Plans',
    q: "Comment fonctionne la facturation ?",
    a: "Les paiements sont mensuels ou annuels (avec 20% de réduction). Nous utilisons CinetPay pour le traitement sécurisé des paiements. Vous recevez une facture par e-mail à chaque renouvellement. Aucun engagement : vous pouvez résilier à tout moment."
  },
  // Menu & Contenu
  {
    category: 'Menu & Contenu',
    q: "Combien de plats puis-je ajouter à mon menu ?",
    a: "Le plan Gratuit permet jusqu'à 30 plats. Le plan Pro monte à 200 plats. Le plan Enterprise est illimité. Chaque plat peut avoir un nom, une description, un prix, une image et des badges (Nouveau, Populaire, Végétarien, etc.)."
  },
  {
    category: 'Menu & Contenu',
    q: "Puis-je rendre certains plats indisponibles temporairement ?",
    a: "Oui. Dans le tableau de bord, vous pouvez activer ou désactiver un plat en un clic. Un plat désactivé n'apparaît plus dans le menu public mais ses données sont conservées. Idéal pour gérer les ruptures de stock ou les plats saisonniers."
  },
  {
    category: 'Menu & Contenu',
    q: "Quels formats d'images sont acceptés ?",
    a: "JPEG, PNG et WebP sont acceptés. La taille maximale est de 5 Mo par image. Les images sont automatiquement optimisées et redimensionnées pour un chargement rapide sur mobile. Nous recommandons un ratio 4:3 ou 16:9 pour un rendu optimal."
  },
  {
    category: 'Menu & Contenu',
    q: "Puis-je avoir plusieurs menus (déjeuner, dîner, carte des vins) ?",
    a: "Oui. Vous pouvez créer autant de catégories que votre plan le permet. Organisez-les librement : Entrées, Plats, Desserts, Boissons, Menu du jour, Carte des vins… L'ordre d'affichage est entièrement personnalisable par glisser-déposer."
  },
  // Commandes & Réservations
  {
    category: 'Commandes & Réservations',
    q: "Comment fonctionnent les commandes en ligne ?",
    a: "Avec le plan Pro ou Enterprise, vos clients peuvent ajouter des plats à leur panier directement depuis le menu et passer commande en indiquant leur nom, téléphone et numéro de table. Vous recevez les commandes en temps réel dans votre tableau de bord avec le statut et les détails. Vous pouvez les marquer comme en cours, prêtes ou terminées."
  },
  {
    category: 'Commandes & Réservations',
    q: "Comment fonctionnent les réservations ?",
    a: "Les clients peuvent envoyer une demande de réservation (date, heure, nombre de personnes, message) directement depuis le menu. Vous recevez les demandes dans votre dashboard et pouvez les confirmer ou les refuser. Un e-mail de confirmation est automatiquement envoyé au client."
  },
  {
    category: 'Commandes & Réservations',
    q: "Qu'est-ce que la fonctionnalité QR Cadeau ?",
    a: "Disponible en plan Enterprise, la fonctionnalité QR Cadeau permet à un client d'offrir un repas à quelqu'un. Il achète un bon cadeau, reçoit un QR code unique à offrir, et le bénéficiaire peut commander avec ce code lors de sa visite au restaurant."
  },
  // Technique
  {
    category: 'Technique',
    q: "Le menu est-il optimisé pour mobile ?",
    a: "Oui, c'est la priorité. SaeMenus est conçu mobile-first. Vos clients accèdent au menu depuis leur smartphone et bénéficient d'une expérience fluide et rapide. Plusieurs templates visuels sont disponibles (Classique, Magazine, Immersif, Zen, Bento) adaptés à tous les styles de restaurant."
  },
  {
    category: 'Technique',
    q: "Mon menu est-il toujours accessible si internet est lent ?",
    a: "Le menu est optimisé pour les connexions lentes : images compressées, chargement progressif et mise en cache navigateur. Les pages se chargent rapidement même avec une connexion 3G."
  },
  {
    category: 'Technique',
    q: "Puis-je accéder à une API ?",
    a: "Oui, le plan Enterprise inclut un accès API REST documenté pour intégrer SaeMenus à votre propre système (caisse, logiciel de gestion, etc.). L'API permet de récupérer les commandes, les réservations et de mettre à jour le menu programmatiquement."
  },
]

const CATEGORIES = ['Tous', 'Général', 'Compte & Plans', 'Menu & Contenu', 'Commandes & Réservations', 'Technique']

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Nav -->
    <nav class="fq-nav">
      <div class="fq-nav-inner">
        <a routerLink="/" class="fq-logo">
          <div class="fq-logo-icon">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="fq-logo-name">SaeMenus</span>
        </a>
        <div class="fq-nav-right">
          <a routerLink="/login" class="fq-nav-login">Connexion</a>
          <a routerLink="/register" class="fq-nav-cta">Commencer gratuitement</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <div class="fq-hero">
      <div class="fq-container">
        <div class="fq-back">
          <a routerLink="/" class="fq-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Retour
          </a>
        </div>
        <div class="fq-hero-tag">Support</div>
        <h1 class="fq-hero-h1">Questions fréquentes</h1>
        <p class="fq-hero-sub">Tout ce que vous devez savoir sur SaeMenus. Vous ne trouvez pas votre réponse ?
          <a href="mailto:support@saemenus.com" class="fq-inline-link">Contactez-nous</a>.
        </p>
      </div>
    </div>

    <!-- Category filter -->
    <div class="fq-filter-bar">
      <div class="fq-container">
        <div class="fq-filter-scroll">
          @for (cat of categories; track cat) {
            <button
              class="fq-filter-btn"
              [class.fq-filter-active]="activeCategory() === cat"
              (click)="activeCategory.set(cat)">
              {{ cat }}
              @if (cat !== 'Tous') {
                <span class="fq-filter-count">{{ countByCategory(cat) }}</span>
              }
            </button>
          }
        </div>
      </div>
    </div>

    <!-- FAQ list -->
    <div class="fq-body">
      <div class="fq-container">

        @for (cat of visibleCategories(); track cat) {
          <div class="fq-group">
            @if (activeCategory() === 'Tous') {
              <h2 class="fq-group-title">{{ cat }}</h2>
            }
            <div class="fq-list">
              @for (item of itemsByCategory(cat); track item.q; let i = $index) {
                <div class="fq-item" [class.fq-item-open]="isOpen(cat + i)">
                  <button class="fq-question" (click)="toggle(cat + i)" [attr.aria-expanded]="isOpen(cat + i)">
                    <span>{{ item.q }}</span>
                    <span class="fq-chevron" [class.fq-chevron-open]="isOpen(cat + i)">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </span>
                  </button>
                  @if (isOpen(cat + i)) {
                    <div class="fq-answer">
                      <p>{{ item.a }}</p>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        }

      </div>
    </div>

    <!-- CTA -->
    <div class="fq-cta-section">
      <div class="fq-container">
        <div class="fq-cta-box">
          <div class="fq-cta-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <div>
            <div class="fq-cta-title">Vous n'avez pas trouvé votre réponse ?</div>
            <div class="fq-cta-sub">Notre équipe répond sous 24h en semaine.</div>
          </div>
          <div class="fq-cta-actions">
            <a href="mailto:support@saemenus.com" class="fq-cta-btn-primary">Contacter le support</a>
            <a routerLink="/guide" class="fq-cta-btn-ghost">Voir le guide</a>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="fq-footer">
      <div class="fq-container fq-footer-inner">
        <span>© 2026 SaeMenus. Tous droits réservés.</span>
        <div class="fq-footer-links">
          <a routerLink="/" class="fq-footer-link">Accueil</a>
          <a routerLink="/pricing" class="fq-footer-link">Tarifs</a>
          <a routerLink="/guide" class="fq-footer-link">Guide</a>
          <a routerLink="/privacy" class="fq-footer-link">Confidentialité</a>
        </div>
      </div>
    </footer>
  `,
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
  readonly categories = CATEGORIES
  readonly activeCategory = signal('Tous')
  readonly openItems = signal<Set<string>>(new Set())

  visibleCategories(): string[] {
    const cat = this.activeCategory()
    if (cat === 'Tous') return CATEGORIES.filter(c => c !== 'Tous')
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
