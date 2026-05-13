import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Nav -->
    <nav class="pv-nav">
      <div class="pv-nav-inner">
        <a routerLink="/" class="pv-logo">
          <div class="pv-logo-icon">
            <svg width="16" height="16" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="pv-logo-name">SaeMenus</span>
        </a>
        <div class="pv-nav-right">
          <a routerLink="/login" class="pv-nav-login">Connexion</a>
          <a routerLink="/register" class="pv-nav-cta">Commencer gratuitement</a>
        </div>
      </div>
    </nav>

    <!-- Hero -->
    <div class="pv-hero">
      <div class="pv-container">
        <div class="pv-back">
          <a routerLink="/" class="pv-back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Retour
          </a>
        </div>
        <div class="pv-hero-tag">Légal</div>
        <h1 class="pv-hero-h1">Politique de confidentialité</h1>
        <p class="pv-hero-sub">Dernière mise à jour : 13 mai 2026</p>
      </div>
    </div>

    <!-- Content -->
    <div class="pv-body">
      <div class="pv-container pv-layout">

        <!-- Table of contents -->
        <aside class="pv-toc">
          <div class="pv-toc-title">Sommaire</div>
          <nav class="pv-toc-nav">
            <a href="#collecte" class="pv-toc-link">1. Données collectées</a>
            <a href="#utilisation" class="pv-toc-link">2. Utilisation des données</a>
            <a href="#conservation" class="pv-toc-link">3. Conservation</a>
            <a href="#partage" class="pv-toc-link">4. Partage</a>
            <a href="#cookies" class="pv-toc-link">5. Cookies</a>
            <a href="#droits" class="pv-toc-link">6. Vos droits (RGPD)</a>
            <a href="#securite" class="pv-toc-link">7. Sécurité</a>
            <a href="#contact" class="pv-toc-link">8. Contact</a>
          </nav>
        </aside>

        <!-- Main text -->
        <article class="pv-article">

          <p class="pv-intro">
            SaeMenus (<strong>saemenus.com</strong>), exploité par la société SaeMenus, s'engage à protéger la vie privée de ses utilisateurs.
            La présente politique décrit quelles données nous collectons, pourquoi nous les collectons et comment vous pouvez exercer vos droits.
          </p>

          <section id="collecte" class="pv-section">
            <h2 class="pv-h2">1. Données collectées</h2>

            <h3 class="pv-h3">1.1 Données de compte</h3>
            <p>Lors de l'inscription ou de l'utilisation de la plateforme, nous collectons :</p>
            <ul class="pv-list">
              <li>Nom et prénom du propriétaire ou gérant</li>
              <li>Adresse e-mail et mot de passe (haché, non lisible)</li>
              <li>Nom du restaurant, adresse, numéro de téléphone</li>
              <li>Informations de profil : logo, description, horaires d'ouverture</li>
            </ul>

            <h3 class="pv-h3">1.2 Données de paiement</h3>
            <p>
              Les paiements sont traités via <strong>CinetPay</strong>. Nous ne stockons aucun numéro de carte bancaire.
              Seules les informations de transaction (identifiant, montant, statut) sont conservées pour la gestion des abonnements.
            </p>

            <h3 class="pv-h3">1.3 Données d'utilisation</h3>
            <ul class="pv-list">
              <li>Adresse IP et type de navigateur (logs serveur)</li>
              <li>Pages visitées et actions effectuées sur le tableau de bord</li>
              <li>Informations de menu créées (catégories, plats, prix, images)</li>
              <li>Commandes et réservations reçues via la plateforme (plan Pro/Enterprise)</li>
            </ul>

            <h3 class="pv-h3">1.4 Données des clients finaux</h3>
            <p>
              Lorsqu'un client scanne un QR code et passe une commande ou effectue une réservation, les informations suivantes
              peuvent être collectées : nom, téléphone, e-mail. Ces données appartiennent au restaurant et sont soumises à sa propre politique de confidentialité.
            </p>
          </section>

          <section id="utilisation" class="pv-section">
            <h2 class="pv-h2">2. Utilisation des données</h2>
            <p>Nous utilisons vos données pour :</p>
            <ul class="pv-list">
              <li>Fournir, maintenir et améliorer la plateforme SaeMenus</li>
              <li>Gérer votre abonnement et traiter les paiements</li>
              <li>Envoyer des notifications importantes (renouvellement, factures)</li>
              <li>Assurer la sécurité des comptes et détecter les fraudes</li>
              <li>Générer des statistiques anonymisées sur l'utilisation de la plateforme</li>
              <li>Répondre à vos demandes de support</li>
            </ul>
            <p>Nous n'utilisons jamais vos données à des fins publicitaires tierces.</p>
          </section>

          <section id="conservation" class="pv-section">
            <h2 class="pv-h2">3. Conservation des données</h2>
            <div class="pv-table-wrap">
              <table class="pv-table">
                <thead>
                  <tr><th>Type de données</th><th>Durée de conservation</th></tr>
                </thead>
                <tbody>
                  <tr><td>Données de compte actif</td><td>Durée de l'abonnement + 30 jours</td></tr>
                  <tr><td>Données après résiliation</td><td>3 ans (obligations légales)</td></tr>
                  <tr><td>Logs serveur</td><td>90 jours</td></tr>
                  <tr><td>Données de paiement</td><td>7 ans (comptabilité)</td></tr>
                  <tr><td>Commandes / réservations</td><td>2 ans</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="partage" class="pv-section">
            <h2 class="pv-h2">4. Partage des données</h2>
            <p>Nous ne vendons jamais vos données. Nous pouvons les partager uniquement avec :</p>
            <ul class="pv-list">
              <li><strong>CinetPay</strong> — traitement des paiements</li>
              <li><strong>Fournisseurs d'hébergement</strong> — stockage sécurisé des données (serveurs en Europe)</li>
              <li><strong>Autorités légales</strong> — uniquement sur demande judiciaire formelle</li>
            </ul>
            <p>Tous nos sous-traitants sont soumis à des accords de traitement des données conformes au RGPD.</p>
          </section>

          <section id="cookies" class="pv-section">
            <h2 class="pv-h2">5. Cookies</h2>
            <p>SaeMenus utilise des cookies essentiels uniquement :</p>
            <div class="pv-table-wrap">
              <table class="pv-table">
                <thead>
                  <tr><th>Cookie</th><th>Finalité</th><th>Durée</th></tr>
                </thead>
                <tbody>
                  <tr><td><code>auth_token</code></td><td>Session d'authentification</td><td>7 jours</td></tr>
                  <tr><td><code>lang</code></td><td>Préférence de langue</td><td>1 an</td></tr>
                  <tr><td><code>tenant</code></td><td>Identification du restaurant (menu public)</td><td>Session</td></tr>
                </tbody>
              </table>
            </div>
            <p>Aucun cookie publicitaire ou de suivi tiers n'est utilisé.</p>
          </section>

          <section id="droits" class="pv-section">
            <h2 class="pv-h2">6. Vos droits (RGPD)</h2>
            <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <div class="pv-rights-grid">
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit d'accès</div>
                  <div class="pv-right-desc">Obtenir une copie de toutes vos données personnelles détenues par SaeMenus.</div>
                </div>
              </div>
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit de rectification</div>
                  <div class="pv-right-desc">Corriger toute donnée inexacte ou incomplète vous concernant.</div>
                </div>
              </div>
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit à l'effacement</div>
                  <div class="pv-right-desc">Demander la suppression de votre compte et de vos données personnelles.</div>
                </div>
              </div>
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit à la portabilité</div>
                  <div class="pv-right-desc">Recevoir vos données dans un format structuré et lisible par machine.</div>
                </div>
              </div>
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit d'opposition</div>
                  <div class="pv-right-desc">Vous opposer au traitement de vos données à tout moment.</div>
                </div>
              </div>
              <div class="pv-right-card">
                <div class="pv-right-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <div class="pv-right-title">Droit à la limitation</div>
                  <div class="pv-right-desc">Demander la suspension du traitement de vos données dans certains cas.</div>
                </div>
              </div>
            </div>
            <p>Pour exercer l'un de ces droits, envoyez un e-mail à <a href="mailto:privacy@saemenus.com" class="pv-link">privacy&#64;saemenus.com</a>. Nous répondrons dans un délai de 30 jours.</p>
          </section>

          <section id="securite" class="pv-section">
            <h2 class="pv-h2">7. Sécurité</h2>
            <p>Nous mettons en œuvre des mesures techniques et organisationnelles adaptées :</p>
            <ul class="pv-list">
              <li>Chiffrement HTTPS (TLS 1.3) sur toutes les communications</li>
              <li>Mots de passe hachés avec bcrypt (jamais stockés en clair)</li>
              <li>Accès aux bases de données restreint et audité</li>
              <li>Sauvegardes chiffrées quotidiennes</li>
              <li>Journal d'audit complet de toutes les actions administratives</li>
            </ul>
            <p>
              En cas de violation de données susceptible d'affecter vos droits, nous vous en informerons dans les 72 heures
              conformément à l'article 33 du RGPD.
            </p>
          </section>

          <section id="contact" class="pv-section">
            <h2 class="pv-h2">8. Contact & réclamations</h2>
            <p>Pour toute question relative à cette politique ou à vos données personnelles :</p>
            <div class="pv-contact-box">
              <div class="pv-contact-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <a href="mailto:privacy@saemenus.com" class="pv-link">privacy&#64;saemenus.com</a>
              </div>
              <div class="pv-contact-row">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                Réponse garantie sous 72 heures ouvrées
              </div>
            </div>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité
              de protection des données compétente dans votre pays de résidence.
            </p>
          </section>

          <div class="pv-footer-note">
            SaeMenus se réserve le droit de modifier cette politique. Toute modification substantielle sera notifiée par e-mail
            au moins 15 jours avant son entrée en vigueur.
          </div>

        </article>
      </div>
    </div>

    <!-- Footer -->
    <footer class="pv-footer">
      <div class="pv-container pv-footer-inner">
        <span>© 2026 SaeMenus. Tous droits réservés.</span>
        <div class="pv-footer-links">
          <a routerLink="/" class="pv-footer-link">Accueil</a>
          <a routerLink="/pricing" class="pv-footer-link">Tarifs</a>
          <a routerLink="/guide" class="pv-footer-link">Guide</a>
          <a routerLink="/faq" class="pv-footer-link">FAQ</a>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }

    .pv-container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }

    /* Nav */
    .pv-nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .pv-nav-inner {
      max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6);
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .pv-logo { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; }
    .pv-logo-icon {
      width: 32px; height: 32px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .pv-logo-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .pv-nav-right { display: flex; align-items: center; gap: var(--space-3); }
    .pv-nav-login { font-size: .9rem; color: var(--text-secondary); text-decoration: none; font-weight: 500; }
    .pv-nav-cta {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .875rem; font-weight: 600;
    }
    @media (max-width: 480px) { .pv-nav-right { display: none; } }

    /* Hero */
    .pv-hero {
      background: linear-gradient(160deg, var(--gray-50) 0%, white 100%);
      padding: 56px 0 48px; border-bottom: 1px solid var(--border);
    }
    .pv-back { margin-bottom: var(--space-5); }
    .pv-back-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-decoration: none; font-weight: 500;
      transition: color .2s;
      &:hover { color: var(--brand); }
    }
    .pv-hero-tag {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .pv-hero-h1 {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      margin: 0 0 var(--space-3); line-height: 1.15;
    }
    .pv-hero-sub { font-size: .9rem; color: var(--text-muted); margin: 0; }

    /* Body layout */
    .pv-body { padding: 64px 0 96px; }
    .pv-layout { display: grid; grid-template-columns: 220px 1fr; gap: 64px; align-items: start; }
    @media (max-width: 768px) { .pv-layout { grid-template-columns: 1fr; gap: 0; } }

    /* TOC */
    .pv-toc { position: sticky; top: 88px; }
    @media (max-width: 768px) { .pv-toc { display: none; } }
    .pv-toc-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: var(--space-3); }
    .pv-toc-nav { display: flex; flex-direction: column; gap: 2px; }
    .pv-toc-link {
      font-size: .875rem; color: var(--text-secondary); text-decoration: none;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      border-left: 2px solid transparent; transition: all .2s;
      &:hover { color: var(--brand); background: var(--brand-subtle); border-left-color: var(--brand); }
    }

    /* Article */
    .pv-article { min-width: 0; }
    .pv-intro {
      font-size: 1.0625rem; color: var(--text-secondary); line-height: 1.8;
      padding: var(--space-6); background: var(--gray-50); border-radius: var(--radius-xl);
      border: 1px solid var(--border); margin-bottom: var(--space-10);
    }
    .pv-section { margin-bottom: var(--space-12); }
    .pv-h2 {
      font-family: var(--font-display); font-size: 1.5rem;
      margin: 0 0 var(--space-5); padding-bottom: var(--space-4);
      border-bottom: 2px solid var(--brand-subtle); color: var(--text-primary);
    }
    .pv-h3 { font-size: 1rem; font-weight: 700; margin: var(--space-6) 0 var(--space-3); color: var(--text-primary); }
    p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 var(--space-4); }
    .pv-list { padding-left: var(--space-5); margin: 0 0 var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .pv-list li { font-size: .9375rem; color: var(--text-secondary); line-height: 1.7; }
    .pv-link { color: var(--brand); text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }

    /* Table */
    .pv-table-wrap { overflow-x: auto; margin: var(--space-4) 0; border-radius: var(--radius-xl); border: 1px solid var(--border); }
    .pv-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .pv-table th { background: var(--gray-50); font-weight: 700; color: var(--text-primary); text-align: left; padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border); }
    .pv-table td { padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border); color: var(--text-secondary); }
    .pv-table tr:last-child td { border-bottom: none; }
    code { font-family: monospace; font-size: .85em; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }

    /* Rights grid */
    .pv-rights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin: var(--space-5) 0; }
    @media (max-width: 600px) { .pv-rights-grid { grid-template-columns: 1fr; } }
    .pv-right-card {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl);
      border: 1px solid var(--border); background: white;
    }
    .pv-right-icon {
      width: 36px; height: 36px; background: var(--brand-subtle); color: var(--brand);
      border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .pv-right-title { font-size: .875rem; font-weight: 700; margin-bottom: 2px; }
    .pv-right-desc { font-size: .8125rem; color: var(--text-muted); line-height: 1.6; }

    /* Contact box */
    .pv-contact-box {
      padding: var(--space-5) var(--space-6); background: var(--gray-50);
      border-radius: var(--radius-xl); border: 1px solid var(--border);
      display: flex; flex-direction: column; gap: var(--space-3); margin: var(--space-4) 0;
    }
    .pv-contact-row { display: flex; align-items: center; gap: var(--space-3); font-size: .9375rem; color: var(--text-secondary); }

    /* Footer note */
    .pv-footer-note {
      padding: var(--space-5) var(--space-6); background: var(--brand-subtle);
      border-radius: var(--radius-xl); border: 1px solid rgba(192,57,43,.15);
      font-size: .875rem; color: var(--brand); line-height: 1.7;
    }

    /* Footer */
    .pv-footer { background: var(--gray-50); border-top: 1px solid var(--border); padding: var(--space-6) 0; }
    .pv-footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .pv-footer-inner span { font-size: .875rem; color: var(--text-muted); }
    .pv-footer-links { display: flex; gap: var(--space-5); }
    .pv-footer-link { font-size: .875rem; color: var(--text-muted); text-decoration: none; &:hover { color: var(--brand); } }
  `],
})
export class PrivacyComponent {}
