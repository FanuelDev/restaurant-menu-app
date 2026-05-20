import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { Plan } from '../../shared/models'

@Component({
  selector: 'app-sa-plans',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule],
  templateUrl: './sa-plans.component.html',
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
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)
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
