import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RestaurantService } from '../../shared/services/restaurant.service'
import type { ApiKeyItem, ApiKeyCreated } from '../../shared/models'

@Component({
  selector: 'app-api',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">

      <!-- En-tête -->
      <div class="page-header">
        <div>
          <h1 class="page-title">API Développeur</h1>
          <p class="page-subtitle">Intégrez SaeMenus dans vos propres applications via notre API REST</p>
        </div>
        <span class="enterprise-badge">Enterprise</span>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.tab-active]="activeTab() === 'keys'" (click)="activeTab.set('keys')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          Clés API
        </button>
        <button class="tab" [class.tab-active]="activeTab() === 'docs'" (click)="activeTab.set('docs')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Documentation
        </button>
      </div>

      <!-- ═══ ONGLET CLÉS ════════════════════════════════════════════════════ -->
      @if (activeTab() === 'keys') {

        @if (newKey()) {
          <div class="new-key-alert">
            <div class="nka-icon">🔑</div>
            <div class="nka-body">
              <div class="nka-title">Copiez votre clé maintenant — elle ne sera plus affichée</div>
              <div class="nka-key-wrap">
                <code class="nka-key">{{ newKey()!.key }}</code>
                <button class="btn-copy" (click)="copyKey(newKey()!.key)" [class.copied]="copied()">
                  @if (copied()) {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    Copié !
                  } @else {
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    Copier
                  }
                </button>
              </div>
              <p class="nka-warn">⚠ Cette clé ne sera plus affichée. Stockez-la dans un endroit sécurisé.</p>
            </div>
            <button class="nka-close" (click)="newKey.set(null)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        }

        <div class="create-card">
          <h2 class="create-title">Nouvelle clé API</h2>
          <div class="create-form">
            <input type="text" class="form-input" placeholder="Nom de la clé (ex : Mon app POS)"
              [(ngModel)]="newKeyName" (keyup.enter)="createKey()" maxlength="100" />
            <button class="btn-create" (click)="createKey()" [disabled]="creating() || !newKeyName.trim()">
              @if (creating()) { <span class="spinner-sm"></span> }
              @else {
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              }
              Créer
            </button>
          </div>
          @if (createError()) { <p class="form-error">{{ createError() }}</p> }
        </div>

        @if (loading()) {
          <div class="skeleton-list">
            @for (i of [1,2]; track i) { <div class="skeleton key-sk"></div> }
          </div>
        } @else if (keys().length === 0) {
          <div class="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".4"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
            <p>Aucune clé API. Créez-en une pour commencer.</p>
          </div>
        } @else {
          <div class="keys-table-wrap">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>Nom</th><th>Clé (préfixe)</th><th>Créée le</th>
                  <th>Dernière utilisation</th><th></th>
                </tr>
              </thead>
              <tbody>
                @for (key of keys(); track key.id) {
                  <tr>
                    <td class="key-name">{{ key.name }}</td>
                    <td><code class="key-prefix">{{ key.keyPrefix }}</code></td>
                    <td class="key-date">{{ key.createdAt | date:'dd/MM/yyyy' }}</td>
                    <td class="key-date">
                      @if (key.lastUsedAt) { {{ key.lastUsedAt | date:'dd/MM/yyyy HH:mm' }} }
                      @else { <span class="never">Jamais</span> }
                    </td>
                    <td>
                      <button class="btn-revoke" (click)="revokeKey(key)" [disabled]="revokingId() === key.id">
                        @if (revokingId() === key.id) { <span class="spinner-sm dark"></span> }
                        @else { Révoquer }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      }

      <!-- ═══ ONGLET DOCUMENTATION ══════════════════════════════════════════ -->
      @if (activeTab() === 'docs') {
        <div class="docs">

          <section class="doc-section">
            <h2 class="doc-h2">Base URL</h2>
            <div class="code-block">
              <span class="cb-label">Production</span>
              <code>https://backend.saemenus.com/ext/v1</code>
            </div>
          </section>

          <section class="doc-section">
            <h2 class="doc-h2">Authentification</h2>
            <p class="doc-p">Incluez votre clé API dans chaque requête via l'un de ces headers :</p>
            <div class="code-block">
              <span class="cb-label">Header (au choix)</span>
              <pre>Authorization: Bearer saem_live_xxxxxxxxxxxxxxxxxxxxxxxx
X-Api-Key: saem_live_xxxxxxxxxxxxxxxxxxxxxxxx</pre>
            </div>
            <div class="info-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              Chaque clé est liée à votre restaurant — elle n'a accès qu'aux données de votre établissement.
            </div>
          </section>

          <section class="doc-section">
            <h2 class="doc-h2">Codes de réponse HTTP</h2>
            <div class="code-block">
              <div class="http-codes">
                <div class="hc-row"><span class="hc-code hc-2xx">200</span><span>Succès</span></div>
                <div class="hc-row"><span class="hc-code hc-2xx">201</span><span>Ressource créée</span></div>
                <div class="hc-row"><span class="hc-code hc-4xx">401</span><span>Clé API manquante ou invalide</span></div>
                <div class="hc-row"><span class="hc-code hc-4xx">403</span><span>Plan insuffisant ou compte suspendu</span></div>
                <div class="hc-row"><span class="hc-code hc-4xx">404</span><span>Ressource introuvable</span></div>
                <div class="hc-row"><span class="hc-code hc-4xx">422</span><span>Erreur de validation des données</span></div>
                <div class="hc-row"><span class="hc-code hc-5xx">500</span><span>Erreur serveur</span></div>
              </div>
            </div>
          </section>

          <section class="doc-section">
            <h2 class="doc-h2">Endpoints disponibles</h2>

            <!-- GET /restaurant -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/restaurant</code>
                <span class="ep-desc">Infos du restaurant</span>
              </div>
              <div class="ep-body">
                <div class="ep-ex">
                  <div class="ex-label">Requête</div>
                  <pre class="ex-code">curl https://backend.saemenus.com/ext/v1/restaurant \
  -H "Authorization: Bearer saem_live_xxxx"</pre>
                </div>
                <div class="ep-ex">
                  <div class="ex-label">Réponse 200</div>
                  <pre class="ex-code">&#123;
  "id": 1, "slug": "mon-restaurant", "name": "Mon Restaurant",
  "address": "12 rue de la Paix, Abidjan",
  "currency": "XOF", "country": "CI",
  "openingHours": &#123; "monday": &#123; "open": "09:00", "close": "22:00", "closed": false &#125; &#125;
&#125;</pre>
                </div>
              </div>
            </div>

            <!-- GET /menu -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/menu</code>
                <span class="ep-desc">Menu complet (catégories + plats)</span>
              </div>
              <div class="ep-body">
                <div class="ep-ex">
                  <div class="ex-label">Réponse 200</div>
                  <pre class="ex-code">[
  &#123;
    "id": 1, "name": "Entrées", "sortOrder": 0,
    "items": [
      &#123; "id": 10, "name": "Salade César", "price": 3500,
        "currency": "XOF", "badge": "popular", "imageUrl": "https://..." &#125;
    ]
  &#125;
]</pre>
                </div>
              </div>
            </div>

            <!-- GET /menu/items -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/menu/items</code>
                <span class="ep-desc">Plats disponibles (filtre optionnel)</span>
              </div>
              <div class="ep-body">
                <div class="ep-params">
                  <div class="param-title">Paramètres</div>
                  <div class="param-row"><code class="param-name">categoryId</code><span class="param-type">number?</span><span>Filtrer par catégorie</span></div>
                </div>
              </div>
            </div>

            <!-- GET /orders -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/orders</code>
                <span class="ep-desc">Liste des commandes (paginée)</span>
              </div>
              <div class="ep-body">
                <div class="ep-params">
                  <div class="param-title">Paramètres</div>
                  <div class="param-row"><code class="param-name">page</code><span class="param-type">number</span><span>Page (défaut : 1)</span></div>
                  <div class="param-row"><code class="param-name">perPage</code><span class="param-type">number</span><span>Max 100 (défaut : 20)</span></div>
                  <div class="param-row"><code class="param-name">status</code><span class="param-type">string?</span><span>pending · confirmed · preparing · ready · delivered · cancelled</span></div>
                </div>
                <div class="ep-ex">
                  <div class="ex-label">Réponse 200</div>
                  <pre class="ex-code">&#123;
  "data": [
    &#123; "id": 42, "orderNumber": "ORD-...", "customerName": "Jean Dupont",
      "status": "confirmed", "total": 12500,
      "items": [&#123; "menuItemName": "Poulet rôti", "quantity": 2, "subtotal": 9000 &#125;] &#125;
  ],
  "meta": &#123; "total": 158, "perPage": 20, "currentPage": 1, "lastPage": 8 &#125;
&#125;</pre>
                </div>
              </div>
            </div>

            <!-- POST /orders -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method post">POST</span>
                <code class="ep-path">/ext/v1/orders</code>
                <span class="ep-desc">Créer une commande</span>
              </div>
              <div class="ep-body">
                <div class="ep-ex">
                  <div class="ex-label">Body JSON</div>
                  <pre class="ex-code">&#123;
  "customerName": "Jean Dupont",         // requis
  "customerPhone": "+225 07 00 00 00",   // optionnel
  "customerEmail": "jean&#64;email.com",    // optionnel
  "notes": "Sans piment svp",            // optionnel
  "items": [
    &#123; "menuItemId": 10, "quantity": 2, "specialInstructions": "" &#125;
  ]
&#125;</pre>
                </div>
              </div>
            </div>

            <!-- GET /orders/:orderNumber -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/orders/:orderNumber</code>
                <span class="ep-desc">Détail d'une commande</span>
              </div>
              <div class="ep-body">
                <div class="ep-ex">
                  <div class="ex-label">Exemple</div>
                  <pre class="ex-code">GET /ext/v1/orders/ORD-1716900000-A1B2</pre>
                </div>
              </div>
            </div>

            <!-- GET /reservations -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method get">GET</span>
                <code class="ep-path">/ext/v1/reservations</code>
                <span class="ep-desc">Liste des réservations (paginée)</span>
              </div>
              <div class="ep-body">
                <div class="ep-params">
                  <div class="param-title">Paramètres</div>
                  <div class="param-row"><code class="param-name">page</code><span class="param-type">number</span><span>Page</span></div>
                  <div class="param-row"><code class="param-name">perPage</code><span class="param-type">number</span><span>Max 100</span></div>
                  <div class="param-row"><code class="param-name">status</code><span class="param-type">string?</span><span>pending · confirmed · cancelled · no_show</span></div>
                  <div class="param-row"><code class="param-name">date</code><span class="param-type">string?</span><span>Filtrer par date YYYY-MM-DD</span></div>
                </div>
              </div>
            </div>

            <!-- POST /reservations -->
            <div class="endpoint-card">
              <div class="ep-header">
                <span class="method post">POST</span>
                <code class="ep-path">/ext/v1/reservations</code>
                <span class="ep-desc">Créer une réservation</span>
              </div>
              <div class="ep-body">
                <div class="ep-ex">
                  <div class="ex-label">Body JSON</div>
                  <pre class="ex-code">&#123;
  "customerName": "Marie Martin",        // requis
  "customerPhone": "+225 07 11 22 33",   // requis
  "customerEmail": "marie&#64;email.com",  // optionnel
  "reservedDate": "2025-06-15",          // requis — YYYY-MM-DD
  "reservedTime": "20:00",               // requis — HH:MM
  "guestsCount": 4,                      // requis
  "specialRequests": "Allergique noix"   // optionnel
&#125;</pre>
                </div>
              </div>
            </div>

          </section>

          <section class="doc-section">
            <h2 class="doc-h2">Limites & bonnes pratiques</h2>
            <div class="limits-grid">
              <div class="limit-card"><div class="limit-icon">⚡</div><div class="limit-label">Rate limit</div><div class="limit-val">300 req/min</div></div>
              <div class="limit-card"><div class="limit-icon">🔑</div><div class="limit-label">Clés par restaurant</div><div class="limit-val">10 max</div></div>
              <div class="limit-card"><div class="limit-icon">📄</div><div class="limit-label">Pagination</div><div class="limit-val">100 / page max</div></div>
              <div class="limit-card"><div class="limit-icon">🔒</div><div class="limit-label">Transport</div><div class="limit-val">HTTPS obligatoire</div></div>
            </div>
          </section>

          <section class="doc-section">
            <h2 class="doc-h2">Exemples par langage</h2>
            <div class="lang-tabs">
              <button class="ltab" [class.ltab-active]="langTab() === 'js'"  (click)="langTab.set('js')">JavaScript</button>
              <button class="ltab" [class.ltab-active]="langTab() === 'py'"  (click)="langTab.set('py')">Python</button>
              <button class="ltab" [class.ltab-active]="langTab() === 'php'" (click)="langTab.set('php')">PHP</button>
            </div>
            @if (langTab() === 'js') {
              <div class="code-block">
                <span class="cb-label">JavaScript / Node.js</span>
                <pre>const API_KEY = 'saem_live_xxxxxxxxxxxxxxxx';
const BASE    = 'https://backend.saemenus.com/ext/v1';
const headers = &#123; 'Authorization': \`Bearer $&#123;API_KEY&#125;\` &#125;;

// Récupérer le menu
const menu = await fetch(\`$&#123;BASE&#125;/menu\`, &#123; headers &#125;).then(r => r.json());

// Créer une commande
const order = await fetch(\`$&#123;BASE&#125;/orders\`, &#123;
  method: 'POST',
  headers: &#123; ...headers, 'Content-Type': 'application/json' &#125;,
  body: JSON.stringify(&#123;
    customerName: 'Jean Dupont',
    items: [&#123; menuItemId: 10, quantity: 2 &#125;]
  &#125;),
&#125;).then(r => r.json());</pre>
              </div>
            }
            @if (langTab() === 'py') {
              <div class="code-block">
                <span class="cb-label">Python (requests)</span>
                <pre>import requests

API_KEY = 'saem_live_xxxxxxxxxxxxxxxx'
BASE    = 'https://backend.saemenus.com/ext/v1'
HDR     = &#123;'Authorization': f'Bearer &#123;API_KEY&#125;'&#125;

menu  = requests.get(f'&#123;BASE&#125;/menu', headers=HDR).json()

order = requests.post(f'&#123;BASE&#125;/orders', headers=HDR, json=&#123;
    'customerName': 'Jean Dupont',
    'items': [&#123;'menuItemId': 10, 'quantity': 2&#125;]
&#125;).json()</pre>
              </div>
            }
            @if (langTab() === 'php') {
              <div class="code-block">
                <span class="cb-label">PHP (cURL)</span>
                <pre>$key  = 'saem_live_xxxxxxxxxxxxxxxx';
$base = 'https://backend.saemenus.com/ext/v1';

function api_get(string $path, string $key, string $base): array &#123;
    $ch = curl_init("$base$path");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ["Authorization: Bearer $key"],
    ]);
    return json_decode(curl_exec($ch), true);
&#125;

$menu = api_get('/menu', $key, $base);</pre>
              </div>
            }
          </section>

        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: var(--space-6);
    }
    .page-title   { margin: 0 0 4px; font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
    .page-subtitle { margin: 0; font-size: .875rem; color: var(--text-muted); }
    .enterprise-badge {
      padding: 4px 12px; background: linear-gradient(135deg,#7c3aed,#4f46e5);
      color: white; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase;
      white-space: nowrap;
    }

    .tabs {
      display: flex; gap: 2px; border-bottom: 2px solid var(--border);
      margin-bottom: var(--space-6);
    }
    .tab {
      display: flex; align-items: center; gap: 7px;
      padding: 9px 16px; background: none; border: none;
      cursor: pointer; font-size: .875rem; font-weight: 500; color: var(--text-muted);
      border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all var(--t-fast);
    }
    .tab:hover { color: var(--text-primary); }
    .tab-active { color: var(--brand); border-bottom-color: var(--brand); font-weight: 700; }

    /* New key alert */
    .new-key-alert {
      display: flex; gap: var(--space-4); align-items: flex-start;
      background: #fefce8; border: 1.5px solid #fde047; border-radius: var(--radius-xl);
      padding: var(--space-4) var(--space-5); margin-bottom: var(--space-5);
    }
    .nka-icon { font-size: 1.5rem; flex-shrink: 0; }
    .nka-body { flex: 1; min-width: 0; }
    .nka-title { font-weight: 700; font-size: .9375rem; color: #78350f; margin-bottom: var(--space-2); }
    .nka-key-wrap { display: flex; align-items: center; gap: var(--space-3); margin-bottom: var(--space-2); flex-wrap: wrap; }
    .nka-key {
      font-family: monospace; font-size: .8125rem; font-weight: 600;
      background: var(--surface-1); border: 1px solid #fde047; border-radius: var(--radius-md);
      padding: 6px 10px; color: #1c1917; word-break: break-all; flex: 1;
    }
    .btn-copy {
      display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
      padding: 6px 12px; border: 1.5px solid #fde047; border-radius: var(--radius-md);
      background: var(--surface-1); cursor: pointer; font-size: .8125rem; font-weight: 600;
      color: #78350f; transition: all var(--t-fast); white-space: nowrap;
    }
    .btn-copy:hover { background: var(--warning-bg); }
    .btn-copy.copied { color: #16a34a; border-color: #86efac; background: #f0fdf4; }
    .nka-warn { margin: 0; font-size: .8125rem; color: #92400e; }
    .nka-close {
      background: none; border: none; cursor: pointer; color: #92400e; padding: 4px;
      border-radius: 4px; flex-shrink: 0;
    }
    .nka-close:hover { background: #fde68a; }

    /* Create */
    .create-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-5); margin-bottom: var(--space-5);
    }
    .create-title { margin: 0 0 var(--space-3); font-size: 1rem; font-weight: 700; color: var(--text-primary); }
    .create-form { display: flex; gap: var(--space-3); }
    .form-input {
      flex: 1; padding: .5rem .875rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; color: var(--text-primary);
      background: var(--surface-1); transition: border-color var(--t-fast);
    }
    .form-input:focus { outline: none; border-color: var(--brand); }
    .btn-create {
      display: inline-flex; align-items: center; gap: 7px;
      padding: .5rem var(--space-5); background: var(--brand); color: white;
      border: none; border-radius: var(--radius-md); cursor: pointer;
      font-size: .875rem; font-weight: 600; transition: opacity var(--t-fast); white-space: nowrap;
    }
    .btn-create:hover:not(:disabled) { opacity: .88; }
    .btn-create:disabled { opacity: .5; cursor: not-allowed; }
    .form-error { margin: var(--space-2) 0 0; font-size: .8125rem; color: #dc2626; }

    /* Skeleton */
    .skeleton { background: linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-xl); }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .skeleton-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .key-sk { height: 52px; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-10) 0; color: var(--text-muted); font-size: .9rem;
    }

    /* Keys table */
    .keys-table-wrap { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; }
    .keys-table { width: 100%; border-collapse: collapse; }
    .keys-table th {
      text-align: left; padding: 10px 16px; font-size: .75rem; font-weight: 700;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em;
      background: var(--gray-50); border-bottom: 1px solid var(--border);
    }
    .keys-table td {
      padding: 13px 16px; border-bottom: 1px solid var(--border);
      font-size: .875rem; color: var(--text-primary); vertical-align: middle;
    }
    .keys-table tr:last-child td { border-bottom: none; }
    .key-name { font-weight: 600; }
    .key-prefix { font-family: monospace; font-size: .8125rem; color: var(--brand); }
    .key-date { color: var(--text-muted); font-size: .8125rem; white-space: nowrap; }
    .never { color: var(--text-muted); font-style: italic; }
    .btn-revoke {
      padding: 5px 12px; background: var(--surface-1); border: 1.5px solid var(--border);
      border-radius: var(--radius-md); cursor: pointer; font-size: .8125rem;
      font-weight: 600; color: var(--text-secondary); transition: all var(--t-fast);
    }
    .btn-revoke:hover:not(:disabled) { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
    .btn-revoke:disabled { opacity: .5; cursor: not-allowed; }

    /* Spinners */
    .spinner-sm {
      display: inline-block; width: 12px; height: 12px;
      border: 2px solid rgba(255,255,255,.35); border-top-color: white;
      border-radius: 50%; animation: spin .6s linear infinite;
    }
    .spinner-sm.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--text-secondary); }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Documentation ──────────────────────────────────────────────── */
    .docs { display: flex; flex-direction: column; gap: var(--space-8); }
    .doc-section {}
    .doc-h2 {
      font-size: 1.125rem; font-weight: 800; color: var(--text-primary);
      margin: 0 0 var(--space-4); padding-bottom: var(--space-2);
      border-bottom: 2px solid var(--border);
    }
    .doc-p { margin: 0 0 var(--space-3); font-size: .9375rem; color: var(--text-secondary); line-height: 1.6; }

    .code-block { background: #0f0f0f; border-radius: var(--radius-xl); overflow: hidden; }
    .cb-label {
      display: block; padding: 8px 16px; font-size: .7rem; font-weight: 700;
      letter-spacing: .08em; text-transform: uppercase; color: #6b7280;
      border-bottom: 1px solid #1f1f1f;
    }
    .code-block pre, .code-block code {
      display: block; padding: 16px; margin: 0;
      font-family: 'Fira Code', 'Cascadia Code', monospace; font-size: .8125rem;
      color: #d1d5db; line-height: 1.75; overflow-x: auto; white-space: pre;
    }

    .info-box {
      display: flex; align-items: flex-start; gap: 10px;
      background: rgba(37,99,235,0.12); border: 1px solid rgba(37,99,235,0.3); border-radius: var(--radius-lg);
      padding: 12px 16px; margin-top: var(--space-3);
      font-size: .875rem; color: #1e40af; line-height: 1.5;
    }
    .info-box svg { flex-shrink: 0; margin-top: 1px; }

    .http-codes { display: flex; flex-direction: column; gap: 6px; padding: 12px 16px; }
    .hc-row { display: flex; align-items: center; gap: 12px; font-size: .8125rem; color: #d1d5db; }
    .hc-code {
      width: 36px; text-align: center; font-weight: 700; font-family: monospace;
      border-radius: 4px; padding: 2px 4px;
    }
    .hc-2xx { background: #14532d; color: #86efac; }
    .hc-4xx { background: #7f1d1d; color: #fca5a5; }
    .hc-5xx { background: #713f12; color: #fde68a; }

    /* Endpoint cards */
    .endpoint-card { border: 1px solid var(--border); border-radius: var(--radius-xl); overflow: hidden; margin-bottom: var(--space-4); }
    .ep-header {
      display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap;
      padding: 12px 16px; background: var(--gray-50); border-bottom: 1px solid var(--border);
    }
    .method {
      padding: 3px 8px; border-radius: 5px; font-size: .7rem;
      font-weight: 800; letter-spacing: .06em; text-transform: uppercase; flex-shrink: 0;
    }
    .get  { background: #dbeafe; color: #1e40af; }
    .post { background: var(--success-bg); color: var(--success); }
    .ep-path { font-family: monospace; font-size: .875rem; font-weight: 600; color: var(--text-primary); }
    .ep-desc { font-size: .8125rem; color: var(--text-muted); margin-left: auto; }
    .ep-body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); background: var(--surface-1); }
    .ep-params { background: var(--gray-50); border-radius: var(--radius-lg); padding: var(--space-3); }
    .param-title { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 8px; }
    .param-row { display: flex; align-items: baseline; gap: var(--space-3); font-size: .8125rem; padding: 4px 0; color: var(--text-secondary); }
    .param-name { font-family: monospace; font-weight: 600; color: var(--brand); min-width: 110px; }
    .param-type { background: var(--gray-200); color: var(--text-muted); padding: 1px 6px; border-radius: 4px; font-size: .7rem; font-weight: 600; min-width: 60px; flex-shrink: 0; }
    .ep-ex { display: flex; flex-direction: column; gap: 6px; }
    .ex-label { font-size: .75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
    .ex-code {
      background: #0f0f0f; color: #d1d5db; border-radius: var(--radius-lg);
      padding: 12px 16px; font-family: monospace; font-size: .8125rem;
      line-height: 1.65; overflow-x: auto; white-space: pre; margin: 0;
    }

    /* Limits */
    .limits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-3); }
    .limit-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-4); text-align: center;
    }
    .limit-icon { font-size: 1.5rem; margin-bottom: 6px; }
    .limit-label { font-size: .75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 4px; }
    .limit-val { font-size: .875rem; font-weight: 700; color: var(--text-primary); }

    /* Lang tabs */
    .lang-tabs { display: flex; gap: 6px; margin-bottom: var(--space-3); }
    .ltab {
      padding: 6px 14px; border: 1.5px solid var(--border); border-radius: var(--radius-md);
      background: var(--surface-1); cursor: pointer; font-size: .8125rem; font-weight: 600;
      color: var(--text-secondary); transition: all var(--t-fast);
    }
    .ltab:hover { border-color: var(--brand); color: var(--brand); }
    .ltab-active { background: var(--brand); border-color: var(--brand); color: white; }
  `],
})
export class ApiComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService)

  readonly activeTab   = signal<'keys' | 'docs'>('keys')
  readonly langTab     = signal<'js' | 'py' | 'php'>('js')
  readonly keys        = signal<ApiKeyItem[]>([])
  readonly loading     = signal(true)
  readonly creating    = signal(false)
  readonly revokingId  = signal<number | null>(null)
  readonly newKey      = signal<ApiKeyCreated | null>(null)
  readonly copied      = signal(false)
  readonly createError = signal('')

  newKeyName = ''

  ngOnInit(): void {
    this.restaurantService.getApiKeys().subscribe({
      next:  (keys) => { this.keys.set(keys); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  createKey(): void {
    const name = this.newKeyName.trim()
    if (!name) return
    this.creating.set(true)
    this.createError.set('')
    this.restaurantService.createApiKey(name).subscribe({
      next: (created) => {
        this.keys.update((ks) => [{ ...created } as ApiKeyItem, ...ks])
        this.newKey.set(created)
        this.newKeyName = ''
        this.creating.set(false)
      },
      error: (err) => {
        this.createError.set(err?.error?.message ?? 'Erreur lors de la création.')
        this.creating.set(false)
      },
    })
  }

  revokeKey(key: ApiKeyItem): void {
    if (!confirm(`Révoquer la clé "${key.name}" ? Cette action est irréversible.`)) return
    this.revokingId.set(key.id)
    this.restaurantService.revokeApiKey(key.id).subscribe({
      next: () => {
        this.keys.update((ks) => ks.filter((k) => k.id !== key.id))
        this.revokingId.set(null)
        if (this.newKey()?.id === key.id) this.newKey.set(null)
      },
      error: () => this.revokingId.set(null),
    })
  }

  copyKey(key: string): void {
    navigator.clipboard.writeText(key).then(() => {
      this.copied.set(true)
      setTimeout(() => this.copied.set(false), 2500)
    })
  }
}
