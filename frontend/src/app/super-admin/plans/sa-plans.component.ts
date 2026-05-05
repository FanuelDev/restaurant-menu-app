import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Plan } from '../../shared/models'

@Component({
  selector: 'app-sa-plans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="plans-page">

      <header class="page-header">
        <div>
          <h1 class="page-title">Plans tarifaires</h1>
          <p class="page-sub">{{ plans().length }} plan{{ plans().length > 1 ? 's' : '' }} configuré{{ plans().length > 1 ? 's' : '' }}</p>
        </div>
        <button class="btn btn-primary" (click)="openCreate()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau plan
        </button>
      </header>

      @if (loading()) {
        <div class="plans-skeleton">
          @for (i of [1,2,3]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else {
        <div class="plans-grid">
          @for (plan of plans(); track plan.id) {
            <div class="plan-card" [class.plan-highlighted]="plan.isActive && plan.isPublic">
              <div class="plan-head">
                <div class="plan-identity">
                  <div class="plan-name">{{ plan.name }}</div>
                  <code class="plan-slug">{{ plan.slug }}</code>
                </div>
                <div class="plan-badges">
                  @if (!plan.isActive) { <span class="badge badge-inactive">Inactif</span> }
                  @if (!plan.isPublic) { <span class="badge badge-private">Privé</span> }
                  @if (plan.isActive && plan.isPublic) { <span class="badge badge-live">Live</span> }
                </div>
              </div>

              @if (plan.description) {
                <p class="plan-desc">{{ plan.description }}</p>
              }

              <div class="plan-prices">
                <div class="price-item">
                  <div class="price-amount">{{ formatCents(plan.priceMonthlyCents) }}</div>
                  <div class="price-label">/ mois</div>
                </div>
                <div class="price-sep"></div>
                <div class="price-item">
                  <div class="price-amount">{{ formatCents(plan.priceYearlyCents) }}</div>
                  <div class="price-label">/ an</div>
                </div>
              </div>

              <div class="plan-limits">
                <div class="limit-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  <span>{{ plan.maxCategories === -1 ? '∞' : plan.maxCategories }} cat.</span>
                </div>
                <div class="limit-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span>{{ plan.maxMenuItems === -1 ? '∞' : plan.maxMenuItems }} plats</span>
                </div>
                <div class="limit-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>{{ plan.maxUsers === -1 ? '∞' : plan.maxUsers }} user{{ plan.maxUsers !== 1 && plan.maxUsers !== -1 ? 's' : '' }}</span>
                </div>
              </div>

              <div class="plan-footer">
                <button class="btn btn-ghost btn-sm" (click)="openEdit(plan)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Modifier
                </button>
                <button class="btn-delete" (click)="deletePlan(plan)" title="Supprimer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          }

          @if (!plans().length) {
            <div class="empty-state">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--gray-300)"><rect x="1.5" y="4.5" width="21" height="15" rx="2"/><path d="M1.5 9h21" stroke-linecap="round"/><path d="M5 14h3" stroke-linecap="round"/></svg>
              <p>Aucun plan configuré</p>
              <button class="btn btn-primary btn-sm" (click)="openCreate()">Créer le premier plan</button>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingPlan() ? 'Modifier « ' + editingPlan()!.name + ' »' : 'Nouveau plan' }}</h3>
            <button class="close-btn" (click)="closeModal()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom <span class="req">*</span></label>
                <input [(ngModel)]="form.name" type="text" class="form-control" placeholder="Pro" />
              </div>
              <div class="form-group">
                <label class="form-label">Slug <span class="req">*</span></label>
                <input [(ngModel)]="form.slug" type="text" class="form-control" placeholder="pro" [disabled]="!!editingPlan()" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <input [(ngModel)]="form.description" type="text" class="form-control" placeholder="Pour les restaurants en croissance" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Prix mensuel <span class="form-hint">(centimes)</span></label>
                <input [(ngModel)]="form.priceMonthlyCents" type="number" min="0" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Prix annuel <span class="form-hint">(centimes)</span></label>
                <input [(ngModel)]="form.priceYearlyCents" type="number" min="0" class="form-control" />
              </div>
            </div>
            <div class="form-row form-row-3">
              <div class="form-group">
                <label class="form-label">Max catégories <span class="form-hint">(-1 = ∞)</span></label>
                <input [(ngModel)]="form.maxCategories" type="number" min="-1" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Max plats <span class="form-hint">(-1 = ∞)</span></label>
                <input [(ngModel)]="form.maxMenuItems" type="number" min="-1" class="form-control" />
              </div>
              <div class="form-group">
                <label class="form-label">Max utilisateurs <span class="form-hint">(-1 = ∞)</span></label>
                <input [(ngModel)]="form.maxUsers" type="number" min="-1" class="form-control" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Fonctionnalités <span class="form-hint">(une par ligne · préfixe <code>- </code> pour désactiver)</span></label>
              <textarea [(ngModel)]="featuresText" rows="5" class="form-control" placeholder="QR Code&#10;Badges &amp; disponibilités&#10;Journal d'audit&#10;- Accès API"></textarea>
            </div>
            <div class="form-toggles">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="form.isActive" class="toggle-checkbox" />
                <span class="toggle-track"></span>
                <span>Actif</span>
              </label>
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="form.isPublic" class="toggle-checkbox" />
                <span class="toggle-track"></span>
                <span>Public <span class="form-hint">(visible sur la page tarifs)</span></span>
              </label>
            </div>
            @if (modalError()) {
              <div class="alert alert-error">{{ modalError() }}</div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="submitModal()" [disabled]="modalLoading()">
              @if (modalLoading()) { <span class="spinner"></span> }
              {{ editingPlan() ? 'Enregistrer' : 'Créer le plan' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .plans-page { max-width: 1100px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      margin-bottom: var(--space-7);
    }
    .page-title { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-sub   { color: var(--text-muted); font-size: .9rem; margin: 0; }

    /* Skeleton */
    .plans-skeleton { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: var(--space-4); }
    .skeleton-card {
      height: 220px; border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Grid */
    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5); }

    .plan-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5);
      display: flex; flex-direction: column; gap: var(--space-4);
      animation: slideUpFade .4s var(--ease-spring) both;
      transition: box-shadow var(--t-fast), transform var(--t-fast);
      &:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
    }
    .plan-highlighted { border-color: var(--brand); border-width: 1.5px; }

    .plan-head { display: flex; justify-content: space-between; align-items: flex-start; }
    .plan-name { font-weight: 700; color: var(--text-primary); font-size: 1rem; margin-bottom: 3px; }
    .plan-slug { background: var(--gray-100); color: var(--gray-600); padding: .15rem .4rem; border-radius: var(--radius-xs); font-size: .72rem; }
    .plan-desc { color: var(--text-muted); font-size: .8125rem; margin: 0; line-height: 1.5; }

    .plan-badges { display: flex; gap: var(--space-1); flex-wrap: wrap; }
    .badge { padding: .2rem .5rem; border-radius: var(--radius-full); font-size: .68rem; font-weight: 700; }
    .badge-inactive { background: var(--gray-100); color: var(--gray-500); }
    .badge-private  { background: var(--warning-bg); color: var(--warning); }
    .badge-live     { background: var(--success-bg); color: var(--success); }

    .plan-prices {
      display: flex; align-items: center; gap: var(--space-4);
      padding: var(--space-3) var(--space-4);
      background: var(--gray-50); border-radius: var(--radius-md);
    }
    .price-item { flex: 1; text-align: center; }
    .price-amount { font-size: .9375rem; font-weight: 700; color: var(--text-primary); }
    .price-label  { font-size: .72rem; color: var(--text-muted); margin-top: 2px; }
    .price-sep { width: 1px; height: 32px; background: var(--border); }

    .plan-limits { display: flex; gap: var(--space-3); flex-wrap: wrap; }
    .limit-item { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--text-secondary); }
    .limit-item svg { color: var(--text-muted); flex-shrink: 0; }

    .plan-footer { display: flex; align-items: center; justify-content: space-between; padding-top: var(--space-3); border-top: 1px solid var(--border); margin-top: auto; }
    .btn-delete {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      background: white; color: var(--text-muted); cursor: pointer;
      transition: all var(--t-fast);
      &:hover { background: var(--error-bg); color: var(--error); border-color: var(--error-border, #FCA5A5); }
    }

    .empty-state {
      grid-column: 1 / -1;
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      padding: var(--space-16) var(--space-8); text-align: center;
      color: var(--text-muted); font-size: .9375rem;
    }

    /* Modal */
    .modal-lg { max-width: 600px; }
    .form-row   { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-row-3 { grid-template-columns: 1fr 1fr 1fr; }
    .form-hint  { font-size: .75rem; color: var(--text-muted); font-weight: 400; }
    .req        { color: var(--error); }

    .form-toggles { display: flex; flex-direction: column; gap: var(--space-3); margin-bottom: var(--space-2); }
    .toggle-label { display: flex; align-items: center; gap: var(--space-3); cursor: pointer; font-size: .875rem; color: var(--text-secondary); }
    .toggle-checkbox { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle-track {
      width: 36px; height: 20px; border-radius: 10px; flex-shrink: 0;
      background: var(--gray-200); border: 1px solid var(--gray-300);
      position: relative; transition: background var(--t-fast);
      &::after {
        content: ''; position: absolute; top: 2px; left: 2px;
        width: 14px; height: 14px; border-radius: 50%;
        background: white; box-shadow: 0 1px 3px rgba(0,0,0,.2);
        transition: transform var(--t-fast);
      }
    }
    .toggle-checkbox:checked + .toggle-track {
      background: var(--brand); border-color: var(--brand);
      &::after { transform: translateX(16px); }
    }
  `],
})
export class SaPlansComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly plans = signal<Plan[]>([])
  readonly loading = signal(true)
  readonly showModal = signal(false)
  readonly editingPlan = signal<Plan | null>(null)
  readonly modalLoading = signal(false)
  readonly modalError = signal<string | null>(null)

  form = {
    name: '', slug: '', description: '',
    priceMonthlyCents: 0, priceYearlyCents: 0,
    maxCategories: -1, maxMenuItems: -1, maxUsers: -1,
    isActive: true, isPublic: true,
  }
  featuresText = ''

  ngOnInit(): void {
    this.saService.getPlans().subscribe({ next: (p) => { this.plans.set(p); this.loading.set(false) } })
  }

  formatCents(cents: number): string {
    if (cents === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR').format(cents / 100) + ' FCFA'
  }

  openCreate(): void {
    this.editingPlan.set(null)
    this.form = { name: '', slug: '', description: '', priceMonthlyCents: 0, priceYearlyCents: 0, maxCategories: -1, maxMenuItems: -1, maxUsers: -1, isActive: true, isPublic: true }
    this.featuresText = ''
    this.modalError.set(null)
    this.showModal.set(true)
  }

  openEdit(plan: Plan): void {
    this.editingPlan.set(plan)
    this.form = { name: plan.name, slug: plan.slug, description: plan.description ?? '', priceMonthlyCents: plan.priceMonthlyCents, priceYearlyCents: plan.priceYearlyCents, maxCategories: plan.maxCategories, maxMenuItems: plan.maxMenuItems, maxUsers: plan.maxUsers, isActive: plan.isActive, isPublic: plan.isPublic }
    this.featuresText = plan.features
      ? Object.entries(plan.features).map(([k, v]) => v ? k : `- ${k}`).join('\n')
      : ''
    this.modalError.set(null)
    this.showModal.set(true)
  }

  closeModal(): void { this.showModal.set(false) }

  submitModal(): void {
    this.modalLoading.set(true)
    this.modalError.set(null)
    const features: Record<string, boolean> = {}
    this.featuresText.split('\n').map((l) => l.trim()).filter(Boolean).forEach((line) => {
      if (line.startsWith('- ')) { features[line.slice(2).trim()] = false }
      else { features[line] = true }
    })
    const payload = { ...this.form, features }
    const editing = this.editingPlan()
    const op = editing ? this.saService.updatePlan(editing.id, payload) : this.saService.createPlan(payload)
    op.subscribe({
      next: (p) => {
        this.plans.update((ps) => editing ? ps.map((x) => x.id === p.id ? p : x) : [...ps, p])
        this.modalLoading.set(false)
        this.closeModal()
      },
      error: (err) => { this.modalLoading.set(false); this.modalError.set(err.error?.message ?? 'Erreur') },
    })
  }

  deletePlan(plan: Plan): void {
    if (!confirm(`Supprimer le plan « ${plan.name} » ?`)) return
    this.saService.deletePlan(plan.id).subscribe({
      next: () => this.plans.update((ps) => ps.filter((p) => p.id !== plan.id)),
    })
  }
}
