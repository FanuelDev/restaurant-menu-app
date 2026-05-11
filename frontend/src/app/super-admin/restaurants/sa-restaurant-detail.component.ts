import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Restaurant, AuditLog, Plan, BillingCycle } from '../../shared/models'

@Component({
  selector: 'app-sa-restaurant-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="detail-page">

      <!-- Nav -->
      <a routerLink="/super-admin/restaurants" class="back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        {{ t('superAdmin.restaurantDetail.back') }}
      </a>

      @if (loading()) {
        <div class="skeleton-page">
          <div class="skeleton hero-sk"></div>
          <div class="sk-grid">
            <div class="skeleton card-sk"></div>
            <div class="skeleton card-sk short"></div>
          </div>
        </div>
      } @else if (restaurant()) {

        <!-- Hero header -->
        <div class="hero" [class.hero-blocked]="restaurant()!.blockedAt">
          <div class="hero-avatar">{{ restaurant()!.name.charAt(0).toUpperCase() }}</div>
          <div class="hero-info">
            <div class="hero-top">
              <h1 class="hero-name">{{ restaurant()!.name }}</h1>
              <span class="status-pill status-{{ restaurant()!.blockedAt ? 'blocked' : restaurant()!.subscriptionStatus }}">
                {{ t('superAdmin.status.' + (restaurant()!.blockedAt ? 'blocked' : restaurant()!.subscriptionStatus)) }}
              </span>
            </div>
            <div class="hero-meta">
              <span class="meta-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                {{ restaurant()!.slug }}
              </span>
              <span class="meta-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>
                {{ restaurant()!.country }} · {{ restaurant()!.currency }}
              </span>
              @if (restaurant()!.plan) {
                <span class="meta-chip plan-chip">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  {{ restaurant()!.plan!.name }}
                </span>
              }
              <span class="meta-chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ t('superAdmin.restaurantDetail.fieldCreated') }} {{ restaurant()!.createdAt | date:'dd/MM/yyyy' }}
              </span>
            </div>
          </div>
        </div>

        <div class="detail-grid">
          <!-- Left col -->
          <div class="main-col">

            <!-- Info card -->
            <div class="card">
              <div class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                Informations
              </div>
              <div class="info-grid">
                @if (restaurant()!.phone) {
                  <div class="info-row">
                    <span class="info-label">Téléphone</span>
                    <span class="info-val">{{ restaurant()!.phone }}</span>
                  </div>
                }
                @if (restaurant()!.address) {
                  <div class="info-row">
                    <span class="info-label">Adresse</span>
                    <span class="info-val">{{ restaurant()!.address }}</span>
                  </div>
                }
                @if (restaurant()!.trialEndsAt) {
                  <div class="info-row">
                    <span class="info-label">Fin d'essai</span>
                    <span class="info-val trial">{{ restaurant()!.trialEndsAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="info-label">Pays</span>
                  <span class="info-val">{{ restaurant()!.country }}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Devise</span>
                  <span class="info-val">{{ restaurant()!.currency }}</span>
                </div>
              </div>
            </div>

            <!-- Block / unblock card -->
            <div class="card danger-zone">
              <div class="card-title danger-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Zone de modération
              </div>

              @if (restaurant()!.blockedAt) {
                <div class="blocked-banner">
                  <div class="blocked-top">
                    <span class="blocked-icon">🔒</span>
                    <div>
                      <div class="blocked-title">Compte suspendu</div>
                      <div class="blocked-date">depuis le {{ restaurant()!.blockedAt | date:'dd/MM/yyyy à HH:mm' }}</div>
                    </div>
                  </div>
                  @if (restaurant()!.blockedReason) {
                    <div class="blocked-reason">"{{ restaurant()!.blockedReason }}"</div>
                  }
                  <button class="btn-success" (click)="unblock()" [disabled]="actionLoading()">
                    @if (actionLoading()) { <span class="spinner dark"></span> }
                    🔓 {{ t('superAdmin.restaurantDetail.unblockSubmit') }}
                  </button>
                </div>
              } @else {
                <p class="danger-desc">Suspendre ce restaurant bloque immédiatement l'accès à tous ses utilisateurs.</p>
                @if (!showBlockForm()) {
                  <button class="btn-danger-outline" (click)="showBlockForm.set(true)">
                    🔒 {{ t('superAdmin.restaurantDetail.blockTitle') }}
                  </button>
                } @else {
                  <div class="block-form">
                    <div class="form-group">
                      <label>{{ t('superAdmin.restaurantDetail.blockReasonLabel') }} <span class="required">*</span></label>
                      <textarea [(ngModel)]="blockReason" rows="3" [placeholder]="t('superAdmin.restaurantDetail.blockReasonLabel')"></textarea>
                    </div>
                    @if (actionError()) { <div class="alert-error">{{ actionError() }}</div> }
                    <div class="block-actions">
                      <button class="btn-ghost" (click)="showBlockForm.set(false)">Annuler</button>
                      <button class="btn-danger" (click)="block()" [disabled]="actionLoading() || !blockReason.trim()">
                        @if (actionLoading()) { <span class="spinner"></span> }
                        {{ t('superAdmin.restaurantDetail.blockSubmit') }}
                      </button>
                    </div>
                  </div>
                }
              }
            </div>

            <!-- Audit logs -->
            <div class="card">
              <div class="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                {{ t('superAdmin.restaurantDetail.sectionLogs') }}
              </div>
              @if (logs().length === 0) {
                <div class="empty-state">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity=".3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>Aucune activité récente</span>
                </div>
              } @else {
                <div class="timeline">
                  @for (log of logs(); track log.id) {
                    <div class="timeline-item">
                      <div class="timeline-dot"></div>
                      <div class="timeline-content">
                        <div class="log-action">{{ log.action }}</div>
                        <div class="log-meta">
                          <span class="log-user">{{ log.userEmail }}</span>
                          <span class="log-time">{{ log.createdAt | date:'dd/MM à HH:mm' }}</span>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

          </div>

          <!-- Right col -->
          <div class="side-col">

            <!-- Grant plan card -->
            <div class="grant-card">
              <div class="grant-header">
                <div class="grant-icon">⚡</div>
                <div>
                  <h3>{{ t('superAdmin.restaurantDetail.grantPlanTitle') }}</h3>
                  <p>{{ t('superAdmin.restaurantDetail.grantPlanSubtitle') }}</p>
                </div>
                <span class="sa-pill">SUPER ADMIN</span>
              </div>

              <div class="grant-body">
                <div class="form-group">
                  <label>{{ t('superAdmin.restaurantDetail.grantFieldPlan') }}</label>
                  <select [(ngModel)]="grantForm.planSlug" class="form-select">
                    <option value="">— Sélectionner —</option>
                    @for (p of plans(); track p.id) {
                      @if (p.priceMonthlyCents > 0) {
                        <option [value]="p.slug">{{ p.name }}</option>
                      }
                    }
                  </select>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>{{ t('superAdmin.restaurantDetail.grantFieldCycle') }}</label>
                    <select [(ngModel)]="grantForm.billingCycle" class="form-select">
                      <option value="monthly">Mensuel</option>
                      <option value="yearly">Annuel</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>{{ t('superAdmin.restaurantDetail.grantFieldDuration') }}</label>
                    <div class="duration-row">
                      <input type="number" [(ngModel)]="grantForm.duration" min="1" max="24" class="form-input" />
                      <span class="duration-unit">{{ grantForm.billingCycle === 'yearly' ? 'ans' : 'mois' }}</span>
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label>Note <span class="opt">optionnel</span></label>
                  <input type="text" [(ngModel)]="grantForm.note" class="form-input" placeholder="Raison de l'attribution gratuite..." />
                </div>

                @if (grantSuccess()) {
                  <div class="alert-success">✓ {{ grantSuccess() }}</div>
                }
                @if (grantError()) {
                  <div class="alert-error">{{ grantError() }}</div>
                }

                <button class="btn-grant" (click)="assignPlan()" [disabled]="grantLoading() || !grantForm.planSlug">
                  @if (grantLoading()) { <span class="spinner"></span> }
                  @else { <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> }
                  {{ t('superAdmin.restaurantDetail.grantSubmit') }}
                </button>
              </div>
            </div>

          </div>
        </div>
      }
    </div>
    </ng-container>
  `,
  styles: [`
    .detail-page { max-width: 1060px; }

    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      color: var(--text-muted); text-decoration: none; font-size: .8125rem; font-weight: 500;
      margin-bottom: var(--space-5); transition: color var(--t-fast);
      &:hover { color: var(--brand); }
    }

    /* ── Skeleton ── */
    .skeleton { background: linear-gradient(90deg,var(--gray-100) 25%,var(--gray-50) 50%,var(--gray-100) 75%); background-size: 400% 100%; animation: shimmer 1.4s infinite; border-radius: var(--radius-lg); }
    @keyframes shimmer { to { background-position: -400% 0; } }
    .hero-sk { height: 110px; margin-bottom: var(--space-5); }
    .sk-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); }
    .card-sk { height: 260px; }
    .card-sk.short { height: 180px; }

    /* ── Hero ── */
    .hero {
      display: flex; align-items: center; gap: var(--space-5);
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-5) var(--space-6);
      margin-bottom: var(--space-6); animation: slideUpFade .4s var(--ease-spring) both;
    }
    .hero-blocked { border-color: var(--error-border); background: var(--error-bg); }
    .hero-avatar {
      width: 64px; height: 64px; border-radius: var(--radius-lg);
      background: var(--brand); color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.75rem; font-weight: 800; flex-shrink: 0;
    }
    .hero-blocked .hero-avatar { background: var(--error); }
    .hero-info { flex: 1; min-width: 0; }
    .hero-top { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; margin-bottom: var(--space-2); }
    .hero-name { margin: 0; font-size: 1.375rem; font-weight: 800; color: var(--text-primary); }
    .hero-meta { display: flex; flex-wrap: wrap; gap: var(--space-2); }

    .meta-chip {
      display: inline-flex; align-items: center; gap: 5px;
      background: var(--gray-100); color: var(--text-muted);
      padding: 3px 10px; border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 500;
    }
    .plan-chip { background: #ede9fe; color: #6d28d9; }

    .status-pill {
      display: inline-flex; align-items: center;
      padding: .25rem .7rem; border-radius: var(--radius-full);
      font-size: .7rem; font-weight: 800; text-transform: uppercase; letter-spacing: .06em;
    }
    .status-trialing  { background: #fef9c3; color: #854d0e; }
    .status-active    { background: #dcfce7; color: #166534; }
    .status-blocked, .status-canceled, .status-suspended { background: #fee2e2; color: #991b1b; }

    /* ── Grid ── */
    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-5); align-items: start; }
    @media (max-width: 768px) { .detail-grid { grid-template-columns: 1fr; } }

    /* ── Cards ── */
    .card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-xl); padding: var(--space-5);
      margin-bottom: var(--space-4); animation: slideUpFade .4s var(--ease-spring) both;
    }
    .card-title {
      display: flex; align-items: center; gap: var(--space-2);
      font-size: .8125rem; font-weight: 700; color: var(--text-secondary);
      text-transform: uppercase; letter-spacing: .06em;
      margin-bottom: var(--space-4); padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border);
    }
    .danger-zone { border-color: var(--error-border); }
    .danger-title { color: var(--error); }

    /* ── Info grid ── */
    .info-grid { display: flex; flex-direction: column; gap: 2px; }
    .info-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: .875rem;
      &:nth-child(odd) { background: var(--gray-50); }
    }
    .info-label { color: var(--text-muted); font-weight: 500; font-size: .8125rem; }
    .info-val { color: var(--text-primary); font-weight: 500; }
    .info-val.trial { color: var(--warning); font-weight: 600; }

    /* ── Block section ── */
    .danger-desc { font-size: .8125rem; color: var(--text-muted); margin: 0 0 var(--space-4); }
    .blocked-banner {
      background: #fff1f2; border: 1px solid #fecdd3;
      border-radius: var(--radius-lg); padding: var(--space-4);
    }
    .blocked-top { display: flex; align-items: flex-start; gap: var(--space-3); margin-bottom: var(--space-3); }
    .blocked-icon { font-size: 1.5rem; }
    .blocked-title { font-weight: 700; color: var(--error); font-size: .9375rem; }
    .blocked-date { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
    .blocked-reason {
      font-size: .8125rem; color: var(--text-secondary); font-style: italic;
      background: white; padding: var(--space-3); border-radius: var(--radius-md);
      border: 1px solid #fecdd3; margin-bottom: var(--space-4);
    }
    .btn-success {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: var(--success);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: opacity var(--t-fast);
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .btn-danger-outline {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: transparent;
      color: var(--error); border: 1.5px solid var(--error);
      border-radius: var(--radius-md); cursor: pointer; font-size: .875rem; font-weight: 600;
      transition: background var(--t-fast);
      &:hover { background: #fff1f2; }
    }
    .block-form { margin-top: var(--space-4); }
    .block-actions { display: flex; gap: var(--space-3); justify-content: flex-end; margin-top: var(--space-3); }
    .btn-ghost {
      padding: .5rem var(--space-4); background: transparent;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; color: var(--text-secondary);
      &:hover { border-color: var(--gray-400); }
    }
    .btn-danger {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: .5rem var(--space-4); background: var(--error);
      color: white; border: none; border-radius: var(--radius-md);
      cursor: pointer; font-size: .875rem; font-weight: 600;
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .required { color: var(--error); }

    /* ── Timeline logs ── */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-2);
      padding: var(--space-6) 0; color: var(--text-muted); font-size: .8125rem;
    }
    .timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item {
      display: flex; gap: var(--space-3); padding: var(--space-3) 0;
      border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .timeline-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--brand);
      flex-shrink: 0; margin-top: 5px;
    }
    .timeline-content { flex: 1; min-width: 0; }
    .log-action { font-size: .8125rem; color: var(--text-primary); font-weight: 600; font-family: monospace; }
    .log-meta { display: flex; justify-content: space-between; margin-top: 3px; }
    .log-user { font-size: .75rem; color: var(--text-muted); }
    .log-time { font-size: .75rem; color: var(--text-muted); }

    /* ── Form shared ── */
    .form-group { margin-bottom: var(--space-4); }
    .form-group label {
      display: block; font-size: .75rem; font-weight: 700;
      color: var(--text-secondary); margin-bottom: var(--space-2);
      text-transform: uppercase; letter-spacing: .05em;
    }
    .opt { font-weight: 400; text-transform: none; letter-spacing: 0; color: var(--text-muted); font-size: .7rem; }
    .form-select, .form-input {
      width: 100%; padding: .5rem .75rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; background: white;
      color: var(--text-primary); box-sizing: border-box; font-family: var(--font-body);
      transition: border-color var(--t-fast), box-shadow var(--t-fast);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .form-group textarea {
      width: 100%; padding: var(--space-3); border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: .875rem; resize: vertical;
      box-sizing: border-box; font-family: var(--font-body); color: var(--text-primary);
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
    }
    .form-row { display: flex; gap: var(--space-3); }
    .form-row .form-group { flex: 1; }
    .duration-row { display: flex; align-items: center; gap: var(--space-2); }
    .duration-row .form-input { flex: 1; }
    .duration-unit { font-size: .8125rem; color: var(--text-muted); white-space: nowrap; }

    .alert-success {
      display: flex; align-items: center; gap: var(--space-2);
      background: #dcfce7; color: #166534; border: 1px solid #bbf7d0;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      font-size: .8125rem; font-weight: 500; margin-bottom: var(--space-3);
    }
    .alert-error {
      background: #fee2e2; color: #991b1b; border: 1px solid #fecaca;
      padding: var(--space-3) var(--space-4); border-radius: var(--radius-md);
      font-size: .8125rem; margin-bottom: var(--space-3);
    }

    /* ── Grant card ── */
    .grant-card {
      background: white; border-radius: var(--radius-xl);
      border: 2px solid var(--brand);
      animation: slideUpFade .4s var(--ease-spring) both;
      overflow: hidden;
    }
    .grant-header {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-5); border-bottom: 1px solid var(--border);
      background: linear-gradient(135deg, #f8f4ff 0%, #fff 100%);
    }
    .grant-icon {
      width: 40px; height: 40px; background: var(--brand); border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.125rem; flex-shrink: 0;
    }
    .grant-header h3 { margin: 0 0 2px; font-size: .9375rem; color: var(--text-primary); font-weight: 700; }
    .grant-header p { margin: 0; font-size: .75rem; color: var(--text-muted); }
    .sa-pill {
      margin-left: auto; flex-shrink: 0;
      font-size: .6rem; font-weight: 800; padding: 3px 8px;
      border-radius: var(--radius-full); letter-spacing: .08em;
      background: var(--brand); color: white;
    }
    .grant-body { padding: var(--space-5); }

    .btn-grant {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      background: var(--brand); color: white; border: none;
      border-radius: var(--radius-md); padding: .7rem var(--space-4);
      font-size: .9375rem; font-weight: 700; cursor: pointer;
      transition: opacity var(--t-fast), transform var(--t-fast);
      &:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
      &:active:not(:disabled) { transform: translateY(0); }
      &:disabled { opacity: .45; cursor: not-allowed; }
    }

    /* ── Spinner ── */
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3);
      border-top-color: white; border-radius: 50%;
      animation: spin .7s linear infinite; display: inline-block;
    }
    .spinner.dark { border-color: rgba(0,0,0,.15); border-top-color: var(--success); }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class SaRestaurantDetailComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)
  private readonly route = inject(ActivatedRoute)

  readonly restaurant = signal<Restaurant | null>(null)
  readonly logs = signal<AuditLog[]>([])
  readonly plans = signal<Plan[]>([])
  readonly loading = signal(true)
  readonly showBlockForm = signal(false)
  readonly actionLoading = signal(false)
  readonly actionError = signal<string | null>(null)

  // Grant plan form
  readonly grantLoading = signal(false)
  readonly grantError = signal<string | null>(null)
  readonly grantSuccess = signal<string | null>(null)
  grantForm: { planSlug: string; billingCycle: BillingCycle; duration: number; note: string } = {
    planSlug: '', billingCycle: 'monthly', duration: 1, note: '',
  }

  blockReason = ''

  ngOnInit(): void {
    const id = Number(this.route.snapshot.params['id'])
    this.saService.getRestaurant(id).subscribe({
      next: (r) => { this.restaurant.set(r.restaurant); this.logs.set(r.recentLogs); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
    this.saService.getPlans().subscribe({ next: (p) => this.plans.set(p) })
  }

  assignPlan(): void {
    const r = this.restaurant()
    if (!r || !this.grantForm.planSlug) return
    this.grantLoading.set(true)
    this.grantError.set(null)
    this.grantSuccess.set(null)
    this.saService.assignPlan(r.id, {
      planSlug: this.grantForm.planSlug,
      billingCycle: this.grantForm.billingCycle,
      duration: this.grantForm.duration,
      note: this.grantForm.note || undefined,
    }).subscribe({
      next: (res) => {
        this.grantLoading.set(false)
        this.grantSuccess.set(res.message)
        this.restaurant.set(res.restaurant)
        this.grantForm = { planSlug: '', billingCycle: 'monthly', duration: 1, note: '' }
      },
      error: (err) => {
        this.grantLoading.set(false)
        this.grantError.set(err.error?.message ?? 'Erreur lors de l\'attribution.')
      },
    })
  }

  block(): void {
    const r = this.restaurant()
    if (!r) return
    this.actionLoading.set(true)
    this.saService.blockRestaurant(r.id, this.blockReason).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.showBlockForm.set(false)
        this.restaurant.update((prev) => prev ? { ...prev, blockedAt: new Date().toISOString(), blockedReason: this.blockReason } : prev)
      },
      error: (err) => { this.actionLoading.set(false); this.actionError.set(err.error?.message) },
    })
  }

  unblock(): void {
    const r = this.restaurant()
    if (!r) return
    this.actionLoading.set(true)
    this.saService.unblockRestaurant(r.id).subscribe({
      next: () => {
        this.actionLoading.set(false)
        this.restaurant.update((prev) => prev ? { ...prev, blockedAt: null, blockedReason: null } : prev)
      },
      error: (err) => { this.actionLoading.set(false); this.actionError.set(err.error?.message) },
    })
  }
}
