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
      <div class="page-header">
        <h1>Plans tarifaires</h1>
        <button class="btn-primary" (click)="openCreate()">+ Nouveau plan</button>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else {
        <div class="plans-grid">
          @for (plan of plans(); track plan.id) {
            <div class="plan-card">
              <div class="plan-head">
                <div>
                  <div class="plan-name">{{ plan.name }}</div>
                  <div class="plan-slug">{{ plan.slug }}</div>
                </div>
                <div class="plan-badges">
                  @if (!plan.isActive) { <span class="badge inactive">Inactif</span> }
                  @if (!plan.isPublic) { <span class="badge private">Privé</span> }
                </div>
              </div>
              <div class="plan-prices">
                <div>Mensuel : <strong>{{ formatCents(plan.priceMonthlyCents) }}</strong></div>
                <div>Annuel : <strong>{{ formatCents(plan.priceYearlyCents) }}</strong></div>
              </div>
              <div class="plan-limits">
                <span>Catégories : {{ plan.maxCategories === -1 ? '∞' : plan.maxCategories }}</span>
                <span>Plats : {{ plan.maxMenuItems === -1 ? '∞' : plan.maxMenuItems }}</span>
                <span>Utilisateurs : {{ plan.maxUsers === -1 ? '∞' : plan.maxUsers }}</span>
              </div>
              <div class="plan-actions">
                <button class="btn-icon" (click)="openEdit(plan)">✏️ Modifier</button>
                <button class="btn-icon btn-icon-danger" (click)="deletePlan(plan)">🗑️</button>
              </div>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ editingPlan() ? 'Modifier le plan' : 'Nouveau plan' }}</h3>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Nom *</label>
                <input [(ngModel)]="form.name" type="text" placeholder="Pro" />
              </div>
              <div class="form-group">
                <label>Slug *</label>
                <input [(ngModel)]="form.slug" type="text" placeholder="pro" [disabled]="!!editingPlan()" />
              </div>
            </div>
            <div class="form-group">
              <label>Description</label>
              <input [(ngModel)]="form.description" type="text" placeholder="Pour les restaurants en croissance" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Prix mensuel (centimes)</label>
                <input [(ngModel)]="form.priceMonthlyCents" type="number" min="0" />
              </div>
              <div class="form-group">
                <label>Prix annuel (centimes)</label>
                <input [(ngModel)]="form.priceYearlyCents" type="number" min="0" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Max catégories (-1 = illimité)</label>
                <input [(ngModel)]="form.maxCategories" type="number" min="-1" />
              </div>
              <div class="form-group">
                <label>Max plats (-1 = illimité)</label>
                <input [(ngModel)]="form.maxMenuItems" type="number" min="-1" />
              </div>
              <div class="form-group">
                <label>Max utilisateurs (-1 = illimité)</label>
                <input [(ngModel)]="form.maxUsers" type="number" min="-1" />
              </div>
            </div>
            <div class="form-group">
              <label>Fonctionnalités (une par ligne)</label>
              <textarea [(ngModel)]="featuresText" rows="4" placeholder="20 catégories&#10;200 plats&#10;Support prioritaire"></textarea>
            </div>
            <div class="form-toggles">
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="form.isActive" /> Actif
              </label>
              <label class="toggle-label">
                <input type="checkbox" [(ngModel)]="form.isPublic" /> Public (visible sur la page pricing)
              </label>
            </div>
            @if (modalError()) { <div class="error-msg">{{ modalError() }}</div> }
          </div>
          <div class="modal-footer">
            <button class="btn-outline" (click)="closeModal()">Annuler</button>
            <button class="btn-primary" (click)="submitModal()" [disabled]="modalLoading()">
              {{ modalLoading() ? 'Enregistrement...' : (editingPlan() ? 'Enregistrer' : 'Créer') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .plans-page { max-width: 1000px; }

    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: var(--space-4); }
    .plan-card {
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5);
      animation: slideUpFade .4s var(--ease-spring) both;
      transition: box-shadow var(--t-fast);
      &:hover { box-shadow: var(--shadow-md); }
    }
    .plan-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: var(--space-4); }
    .plan-name { font-weight: 700; color: var(--text-primary); font-size: .9375rem; }
    .plan-slug { font-size: .75rem; color: var(--text-muted); margin-top: 2px; }
    .plan-badges { display: flex; gap: var(--space-1); flex-wrap: wrap; }
    .inactive { background: var(--gray-100); color: var(--gray-500); }
    .private  { background: var(--warning-bg); color: var(--warning); }
    .plan-prices { display: flex; flex-direction: column; gap: 4px; font-size: .8125rem; color: var(--text-secondary); margin-bottom: var(--space-3); }
    .plan-limits { display: flex; gap: var(--space-3); font-size: .75rem; color: var(--text-muted); margin-bottom: var(--space-4); flex-wrap: wrap; }
    .plan-actions { display: flex; justify-content: flex-end; gap: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--border); }

    .form-row    { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-toggles { display: flex; gap: var(--space-5); margin-bottom: var(--space-4); }
    .toggle-label { display: flex; align-items: center; gap: var(--space-2); font-size: .875rem; cursor: pointer; }
    .error-msg { background: var(--error-bg); color: var(--error); padding: var(--space-3); border-radius: var(--radius-md); font-size: .875rem; border: 1px solid var(--error-border); }
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
    this.featuresText = plan.features.join('\n')
    this.modalError.set(null)
    this.showModal.set(true)
  }

  closeModal(): void { this.showModal.set(false) }

  submitModal(): void {
    this.modalLoading.set(true)
    this.modalError.set(null)
    const payload = {
      ...this.form,
      features: this.featuresText.split('\n').map((l) => l.trim()).filter(Boolean),
    }
    const editing = this.editingPlan()
    const op = editing
      ? this.saService.updatePlan(editing.id, payload)
      : this.saService.createPlan(payload)

    op.subscribe({
      next: (p) => {
        if (editing) {
          this.plans.update((ps) => ps.map((x) => x.id === p.id ? p : x))
        } else {
          this.plans.update((ps) => [...ps, p])
        }
        this.modalLoading.set(false)
        this.closeModal()
      },
      error: (err) => {
        this.modalLoading.set(false)
        this.modalError.set(err.error?.message ?? 'Erreur')
      },
    })
  }

  deletePlan(plan: Plan): void {
    if (!confirm(`Supprimer le plan "${plan.name}" ?`)) return
    this.saService.deletePlan(plan.id).subscribe({
      next: () => this.plans.update((ps) => ps.filter((p) => p.id !== plan.id)),
    })
  }
}
