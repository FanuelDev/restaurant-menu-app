import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { FinanceService, type ExpensePayload, type IncomePayload } from '../../shared/services/finance.service'
import { AuthService } from '../../shared/services/auth.service'
import type {
  FinanceSummary,
  FinanceChart,
  FinanceExpense,
  FinanceIncome,
  FinancePeriod,
  ExpenseCategory,
} from '../../shared/models'

type ModalMode = 'expense' | 'income'

interface FormState {
  mode: ModalMode
  id: number | null
  category: ExpenseCategory
  label: string
  amount: string
  date: string
  notes: string
}

const PERIOD_LABELS: Record<FinancePeriod, string> = {
  day: "Aujourd'hui",
  week: '7 jours',
  month: 'Ce mois',
  semester: '6 mois',
  year: 'Cette année',
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  ingredient: 'Ingrédients',
  tool: 'Outils',
  accessory: 'Accessoires',
  other: 'Autre',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  ingredient: '#f59e0b',
  tool:       '#6366f1',
  accessory:  '#3b82f6',
  other:      '#8b5cf6',
}

const DONUT_R = 54
const DONUT_CIRC = 2 * Math.PI * DONUT_R

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
<div class="fn-page">

  <!-- Header -->
  <header class="fn-header">
    <div class="fn-header-left">
      <div class="fn-header-icon">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 10C2 5.58 5.58 2 10 2s8 3.58 8 8-3.58 8-8 8-8-3.58-8-8z"/>
          <path d="M10 6v4l2.5 2.5"/>
        </svg>
      </div>
      <div>
        <h1 class="fn-title">Gestion financière</h1>
        <p class="fn-subtitle">Vue d'ensemble de vos revenus et dépenses</p>
      </div>
    </div>
    <!-- Period selector -->
    <div class="fn-periods">
      @for (p of periods; track p) {
        <button class="fn-period-btn" [class.fn-period-active]="period() === p" (click)="setPeriod(p)">
          {{ periodLabel(p) }}
        </button>
      }
    </div>
  </header>

  @if (loading()) {
    <div class="fn-skeleton">
      @for (i of [1,2,3,4]; track i) { <div class="fn-skel-card"></div> }
    </div>
    <div class="fn-skel-charts">
      <div class="fn-skel-big"></div>
      <div class="fn-skel-small"></div>
    </div>
  } @else if (summary()) {

    <!-- KPI Cards -->
    <div class="fn-kpis">

      <div class="fn-kpi fn-kpi-revenue">
        <div class="fn-kpi-top">
          <span class="fn-kpi-label">Revenus totaux</span>
          <div class="fn-kpi-icon fn-icon-revenue">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M8 1v14M11 4H6.5a2.5 2.5 0 000 5h3a2.5 2.5 0 010 5H5"/>
            </svg>
          </div>
        </div>
        <div class="fn-kpi-value">{{ formatAmount(summary()!.totalRevenue) }}</div>
        <div class="fn-kpi-detail">dont {{ formatAmount(summary()!.ordersRevenue) }} commandes</div>
        <div class="fn-kpi-trend" [class.trend-up]="(summary()!.trends.revenue ?? 0) >= 0" [class.trend-down]="(summary()!.trends.revenue ?? 0) < 0">
          @if (summary()!.trends.revenue !== null) {
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              @if ((summary()!.trends.revenue ?? 0) >= 0) {
                <path d="M2 9L6 3l4 6"/>
              } @else {
                <path d="M2 3L6 9l4-6"/>
              }
            </svg>
            {{ summary()!.trends.revenue! >= 0 ? '+' : '' }}{{ summary()!.trends.revenue }}%
          } @else {
            <span class="trend-neutral">— Première période</span>
          }
        </div>
      </div>

      <div class="fn-kpi fn-kpi-expenses">
        <div class="fn-kpi-top">
          <span class="fn-kpi-label">Dépenses totales</span>
          <div class="fn-kpi-icon fn-icon-expenses">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <path d="M2 4h12M2 8h12M2 12h8"/>
            </svg>
          </div>
        </div>
        <div class="fn-kpi-value">{{ formatAmount(summary()!.totalExpenses) }}</div>
        <div class="fn-kpi-detail">{{ expenseCategoryBreakdown() }}</div>
        <div class="fn-kpi-trend" [class.trend-up]="(summary()!.trends.expenses ?? 0) < 0" [class.trend-down]="(summary()!.trends.expenses ?? 0) > 0">
          @if (summary()!.trends.expenses !== null) {
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              @if ((summary()!.trends.expenses ?? 0) >= 0) {
                <path d="M2 3L6 9l4-6"/>
              } @else {
                <path d="M2 9L6 3l4 6"/>
              }
            </svg>
            {{ summary()!.trends.expenses! >= 0 ? '+' : '' }}{{ summary()!.trends.expenses }}% vs période préc.
          } @else {
            <span class="trend-neutral">— Première période</span>
          }
        </div>
      </div>

      <div class="fn-kpi fn-kpi-profit" [class.fn-kpi-loss]="summary()!.netProfit < 0">
        <div class="fn-kpi-top">
          <span class="fn-kpi-label">Bénéfice net</span>
          <div class="fn-kpi-icon fn-icon-profit">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 12 5 7 9 10 15 3"/>
            </svg>
          </div>
        </div>
        <div class="fn-kpi-value">{{ formatAmount(summary()!.netProfit) }}</div>
        <div class="fn-kpi-detail">{{ summary()!.netProfit >= 0 ? 'Bénéficiaire' : 'Déficitaire' }} sur la période</div>
        <div class="fn-kpi-trend" [class.trend-up]="(summary()!.trends.net ?? 0) >= 0" [class.trend-down]="(summary()!.trends.net ?? 0) < 0">
          @if (summary()!.trends.net !== null) {
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              @if ((summary()!.trends.net ?? 0) >= 0) {
                <path d="M2 9L6 3l4 6"/>
              } @else {
                <path d="M2 3L6 9l4-6"/>
              }
            </svg>
            {{ summary()!.trends.net! >= 0 ? '+' : '' }}{{ summary()!.trends.net }}% vs période préc.
          } @else {
            <span class="trend-neutral">— Première période</span>
          }
        </div>
      </div>

      <div class="fn-kpi fn-kpi-margin">
        <div class="fn-kpi-top">
          <span class="fn-kpi-label">Marge nette</span>
          <div class="fn-kpi-icon fn-icon-margin">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
              <circle cx="8" cy="8" r="6"/>
              <path d="M5 11L11 5"/>
              <circle cx="6" cy="6" r=".5" fill="currentColor" stroke="none"/>
              <circle cx="10" cy="10" r=".5" fill="currentColor" stroke="none"/>
            </svg>
          </div>
        </div>
        <div class="fn-kpi-value">{{ summary()!.marginPct }}%</div>
        <div class="fn-kpi-detail">Rentabilité de l'activité</div>
        <div class="fn-margin-bar">
          <div class="fn-margin-fill" [style.width.%]="clamp(summary()!.marginPct, 0, 100)"></div>
        </div>
      </div>

    </div>

    <!-- Charts row -->
    <div class="fn-charts-row">

      <!-- Bar chart -->
      <div class="fn-chart-card fn-chart-main">
        <div class="fn-chart-header">
          <h2 class="fn-chart-title">Revenus vs Dépenses</h2>
          <div class="fn-chart-legend">
            <span class="fn-legend-dot" style="background:#10b981"></span><span>Revenus</span>
            <span class="fn-legend-dot" style="background:#f59e0b"></span><span>Dépenses</span>
            <span class="fn-legend-line"></span><span>Net</span>
          </div>
        </div>
        @if (chartData()) {
          <div class="fn-bar-wrap">
            <svg [attr.viewBox]="'0 0 ' + svgW + ' ' + svgH" class="fn-bar-svg" [attr.aria-label]="'Graphe revenus vs dépenses'">
              <!-- Y-axis lines & labels -->
              @for (tick of yTicks(); track tick.y) {
                <line [attr.x1]="padL" [attr.y1]="tick.y" [attr.x2]="svgW - padR" [attr.y2]="tick.y" stroke="#e5e7eb" stroke-width="1"/>
                <text [attr.x]="padL - 6" [attr.y]="tick.y + 4" text-anchor="end" fill="#9ca3af" font-size="10">{{ tick.label }}</text>
              }
              <!-- Zero line -->
              <line [attr.x1]="padL" [attr.y1]="zeroY()" [attr.x2]="svgW - padR" [attr.y2]="zeroY()" stroke="#d1d5db" stroke-width="1.5"/>
              <!-- Bars -->
              @for (pt of barPoints(); track pt.label) {
                <!-- Revenue bar -->
                <rect [attr.x]="pt.rx" [attr.y]="pt.ry" [attr.width]="pt.bw" [attr.height]="pt.rh" rx="3" fill="#10b981" opacity=".85"/>
                <!-- Expenses bar -->
                <rect [attr.x]="pt.ex" [attr.y]="pt.ey" [attr.width]="pt.bw" [attr.height]="pt.eh" rx="3" fill="#f59e0b" opacity=".85"/>
                <!-- X label — only shown every N points -->
                @if (pt.showLabel) {
                  <text [attr.x]="pt.cx" [attr.y]="svgH - 5" text-anchor="middle" fill="#9ca3af" font-size="10">{{ pt.shortLabel }}</text>
                }
              }
              <!-- Net line -->
              @if (netLinePath()) {
                <path [attr.d]="netLinePath()!" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                @for (pt of barPoints(); track pt.label) {
                  <circle [attr.cx]="pt.cx" [attr.cy]="pt.ny" r="3" fill="#6366f1"/>
                }
              }
            </svg>
          </div>
        }
      </div>

      <!-- Donut chart -->
      <div class="fn-chart-card fn-chart-donut">
        <div class="fn-chart-header">
          <h2 class="fn-chart-title">Répartition dépenses</h2>
        </div>
        @if (summary() && summary()!.totalExpenses > 0) {
          <div class="fn-donut-wrap">
            <svg viewBox="0 0 140 140" class="fn-donut-svg">
              @for (seg of donutSegments(); track seg.category) {
                <circle
                  cx="70" cy="70" [attr.r]="donutR"
                  fill="none"
                  [attr.stroke]="seg.color"
                  stroke-width="22"
                  [attr.stroke-dasharray]="seg.dashArray"
                  [attr.stroke-dashoffset]="seg.dashOffset"
                  stroke-linecap="butt"
                  transform="rotate(-90 70 70)"
                />
              }
              <text x="70" y="65" text-anchor="middle" fill="#374151" font-size="16" font-weight="700">
                {{ formatAmountShort(summary()!.totalExpenses) }}
              </text>
              <text x="70" y="82" text-anchor="middle" fill="#9ca3af" font-size="9.5">Total dépenses</text>
            </svg>
            <div class="fn-donut-legend">
              @for (cat of expenseCategories; track cat) {
                <div class="fn-donut-item">
                  <span class="fn-donut-dot" [style.background]="CATEGORY_COLORS[cat]"></span>
                  <span class="fn-donut-lbl">{{ CATEGORY_LABELS[cat] }}</span>
                  <span class="fn-donut-amt">{{ formatAmount(summary()!.byCategory[cat]) }}</span>
                </div>
              }
            </div>
          </div>
        } @else {
          <div class="fn-empty-donut">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="#e5e7eb" stroke-width="14"/>
              <text x="40" y="44" text-anchor="middle" fill="#d1d5db" font-size="11">0</text>
            </svg>
            <p>Aucune dépense sur la période</p>
          </div>
        }
      </div>

    </div>

    <!-- Transactions -->
    <div class="fn-transactions">

      <div class="fn-tx-header">
        <div class="fn-tabs">
          <button class="fn-tab" [class.fn-tab-active]="activeTab() === 'expenses'" (click)="activeTab.set('expenses')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M1 3h12M1 7h12M1 11h7"/></svg>
            Dépenses
            @if (expenses().length) { <span class="fn-tab-badge">{{ expenses().length }}</span> }
          </button>
          <button class="fn-tab" [class.fn-tab-active]="activeTab() === 'incomes'" (click)="activeTab.set('incomes')">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M7 1v12M3 5l4-4 4 4"/></svg>
            Revenus manuels
            @if (incomes().length) { <span class="fn-tab-badge">{{ incomes().length }}</span> }
          </button>
        </div>
        <button class="fn-add-btn" (click)="openAdd()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 2v10M2 7h10"/></svg>
          Ajouter {{ activeTab() === 'expenses' ? 'une dépense' : 'un revenu' }}
        </button>
      </div>

      <!-- Expenses list -->
      @if (activeTab() === 'expenses') {
        @if (expenses().length === 0) {
          <div class="fn-empty">
            <div class="fn-empty-icon">💸</div>
            <p>Aucune dépense enregistrée</p>
            <button class="fn-empty-btn" (click)="openAdd()">Ajouter une dépense</button>
          </div>
        } @else {
          <div class="fn-tx-list">
            @for (exp of expenses(); track exp.id) {
              <div class="fn-tx-item">
                <div class="fn-tx-cat" [style.background]="catColor(exp.category) + '18'" [style.color]="catColor(exp.category)">
                  {{ catIcon(exp.category) }}
                </div>
                <div class="fn-tx-info">
                  <div class="fn-tx-label">{{ exp.label }}</div>
                  <div class="fn-tx-meta">{{ catLabel(exp.category) }} · {{ exp.date }}</div>
                </div>
                @if (exp.notes) {
                  <div class="fn-tx-notes">{{ exp.notes }}</div>
                }
                <div class="fn-tx-amount fn-tx-expense">−{{ formatAmount(exp.amount) }}</div>
                <div class="fn-tx-actions">
                  <button class="fn-icon-btn" (click)="editExpense(exp)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l2 2-7 7H3v-2l7-7z"/></svg>
                  </button>
                  <button class="fn-icon-btn fn-icon-del" (click)="deleteExpense(exp)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 3h10M5 3V2h4v1M5.5 6v5M8.5 6v5"/><rect x="3" y="3" width="8" height="9" rx="1"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

      <!-- Incomes list -->
      @if (activeTab() === 'incomes') {
        @if (incomes().length === 0) {
          <div class="fn-empty">
            <div class="fn-empty-icon">💰</div>
            <p>Aucun revenu manuel enregistré</p>
            <button class="fn-empty-btn" (click)="openAdd()">Ajouter un revenu</button>
          </div>
        } @else {
          <div class="fn-tx-list">
            @for (inc of incomes(); track inc.id) {
              <div class="fn-tx-item">
                <div class="fn-tx-cat" style="background:#10b98118;color:#10b981">💰</div>
                <div class="fn-tx-info">
                  <div class="fn-tx-label">{{ inc.label }}</div>
                  <div class="fn-tx-meta">Revenu manuel · {{ inc.date }}</div>
                </div>
                @if (inc.notes) {
                  <div class="fn-tx-notes">{{ inc.notes }}</div>
                }
                <div class="fn-tx-amount fn-tx-income">+{{ formatAmount(inc.amount) }}</div>
                <div class="fn-tx-actions">
                  <button class="fn-icon-btn" (click)="editIncome(inc)" title="Modifier">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l2 2-7 7H3v-2l7-7z"/></svg>
                  </button>
                  <button class="fn-icon-btn fn-icon-del" (click)="deleteIncome(inc)" title="Supprimer">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M2 3h10M5 3V2h4v1M5.5 6v5M8.5 6v5"/><rect x="3" y="3" width="8" height="9" rx="1"/></svg>
                  </button>
                </div>
              </div>
            }
          </div>
        }
      }

    </div>

  }

</div>

<!-- Modal -->
@if (modal()) {
  <div class="fn-overlay" (click)="closeModal()">
    <div class="fn-modal" (click)="$event.stopPropagation()">
      <div class="fn-modal-header">
        <h3>{{ modal()!.id ? 'Modifier' : 'Ajouter' }} {{ modal()!.mode === 'expense' ? 'une dépense' : 'un revenu' }}</h3>
        <button class="fn-modal-close" (click)="closeModal()">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4l10 10M14 4L4 14"/></svg>
        </button>
      </div>

      <div class="fn-modal-body">
        @if (modal()!.mode === 'expense') {
          <div class="fn-field">
            <label class="fn-label">Catégorie</label>
            <select class="fn-select" [(ngModel)]="form.category">
              @for (cat of expenseCategories; track cat) {
                <option [value]="cat">{{ CATEGORY_LABELS[cat] }}</option>
              }
            </select>
          </div>
        }
        <div class="fn-field">
          <label class="fn-label">Libellé *</label>
          <input class="fn-input" type="text" [(ngModel)]="form.label" placeholder="{{ modal()!.mode === 'expense' ? 'Ex: Achat viandes, Location équipement...' : 'Ex: Vente traiteur, Commande spéciale...' }}" />
        </div>
        <div class="fn-row">
          <div class="fn-field">
            <label class="fn-label">Montant *</label>
            <div class="fn-amount-wrap">
              <input class="fn-input fn-input-amount" type="number" min="0" step="0.01" [(ngModel)]="form.amount" placeholder="0.00" />
              <span class="fn-currency">{{ currency() }}</span>
            </div>
          </div>
          <div class="fn-field">
            <label class="fn-label">Date *</label>
            <input class="fn-input" type="date" [(ngModel)]="form.date" />
          </div>
        </div>
        <div class="fn-field">
          <label class="fn-label">Notes <span class="fn-optional">(optionnel)</span></label>
          <textarea class="fn-textarea" [(ngModel)]="form.notes" rows="3" placeholder="Informations complémentaires..."></textarea>
        </div>
      </div>

      @if (formError()) {
        <div class="fn-form-error">{{ formError() }}</div>
      }

      <div class="fn-modal-footer">
        <button class="fn-btn-cancel" (click)="closeModal()">Annuler</button>
        <button class="fn-btn-save" [disabled]="saving()" (click)="save()">
          @if (saving()) {
            <span class="fn-spinner"></span>
          }
          {{ modal()!.id ? 'Enregistrer' : 'Ajouter' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    /* ── Page ──────────────────────────────────────────────────────────────── */
    .fn-page { max-width: 1200px; margin: 0 auto; }

    /* ── Header ────────────────────────────────────────────────────────────── */
    .fn-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; margin-bottom: 28px; flex-wrap: wrap;
    }
    .fn-header-left { display: flex; align-items: center; gap: 14px; }
    .fn-header-icon {
      width: 44px; height: 44px; border-radius: 12px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      display: flex; align-items: center; justify-content: center;
      color: white; flex-shrink: 0;
      box-shadow: 0 4px 14px rgba(99,102,241,.35);
    }
    .fn-title { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin: 0 0 2px; }
    .fn-subtitle { font-size: .875rem; color: var(--text-muted); margin: 0; }

    /* Period buttons */
    .fn-periods { display: flex; gap: 4px; background: var(--gray-100); padding: 4px; border-radius: 10px; flex-wrap: wrap; }
    .fn-period-btn {
      padding: 6px 14px; border: none; background: transparent; border-radius: 7px;
      font-size: .8125rem; font-weight: 500; color: var(--text-secondary); cursor: pointer;
      transition: all .15s; white-space: nowrap;
      &:hover { background: white; color: var(--text-primary); }
    }
    .fn-period-active { background: white !important; color: var(--text-primary) !important; box-shadow: 0 1px 4px rgba(0,0,0,.08); }

    /* ── Skeleton ──────────────────────────────────────────────────────────── */
    .fn-skeleton { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
    .fn-skel-card { height: 130px; border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    .fn-skel-charts { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
    .fn-skel-big { height: 260px; border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    .fn-skel-small { height: 260px; border-radius: 14px; background: linear-gradient(90deg, #f3f4f6 25%, #e9eaec 50%, #f3f4f6 75%); background-size: 200%; animation: shimmer 1.4s infinite; }
    @keyframes shimmer { to { background-position: -200% 0; } }

    /* ── KPI Cards ─────────────────────────────────────────────────────────── */
    .fn-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }

    .fn-kpi {
      background: white; border-radius: 14px; padding: 20px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
      display: flex; flex-direction: column; gap: 4px;
      transition: box-shadow .2s;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,.08); }
    }
    .fn-kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .fn-kpi-label { font-size: .75rem; font-weight: 600; letter-spacing: .02em; color: var(--text-muted); text-transform: uppercase; }
    .fn-kpi-icon {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
    }
    .fn-kpi-value { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); letter-spacing: -.02em; }
    .fn-kpi-detail { font-size: .75rem; color: var(--text-muted); }
    .fn-kpi-trend {
      display: flex; align-items: center; gap: 4px;
      font-size: .75rem; font-weight: 600; margin-top: 4px;
    }
    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
    .trend-neutral { color: var(--text-muted); font-weight: 400; }

    .fn-icon-revenue { background: #d1fae5; color: #10b981; }
    .fn-icon-expenses { background: #fef3c7; color: #f59e0b; }
    .fn-icon-profit { background: #ede9fe; color: #6366f1; }
    .fn-icon-margin { background: #dbeafe; color: #3b82f6; }

    .fn-kpi-loss .fn-kpi-value { color: #ef4444; }
    .fn-kpi-loss .fn-icon-profit { background: #fee2e2; color: #ef4444; }

    .fn-margin-bar {
      height: 4px; background: var(--gray-100); border-radius: 4px; overflow: hidden; margin-top: 8px;
    }
    .fn-margin-fill {
      height: 100%; background: linear-gradient(90deg, #3b82f6, #6366f1);
      border-radius: 4px; transition: width .6s ease;
    }

    /* ── Charts row ────────────────────────────────────────────────────────── */
    .fn-charts-row { display: grid; grid-template-columns: 1fr 320px; gap: 16px; margin-bottom: 20px; }

    .fn-chart-card {
      background: white; border-radius: 14px; padding: 20px;
      border: 1px solid var(--border);
      box-shadow: 0 1px 4px rgba(0,0,0,.04);
    }
    .fn-chart-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;
    }
    .fn-chart-title { font-size: .9375rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .fn-chart-legend {
      display: flex; align-items: center; gap: 8px;
      font-size: .75rem; color: var(--text-muted);
    }
    .fn-legend-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .fn-legend-line {
      width: 18px; height: 2px; background: #6366f1; border-radius: 2px; flex-shrink: 0;
    }

    .fn-bar-wrap { width: 100%; overflow-x: auto; }
    .fn-bar-svg { width: 100%; display: block; }

    /* Donut */
    .fn-chart-donut { display: flex; flex-direction: column; }
    .fn-donut-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; flex: 1; }
    .fn-donut-svg { width: 140px; height: 140px; flex-shrink: 0; }
    .fn-donut-legend { width: 100%; display: flex; flex-direction: column; gap: 8px; }
    .fn-donut-item { display: flex; align-items: center; gap: 8px; font-size: .8125rem; }
    .fn-donut-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .fn-donut-lbl { flex: 1; color: var(--text-secondary); }
    .fn-donut-amt { font-weight: 600; color: var(--text-primary); }
    .fn-empty-donut {
      flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 8px; color: var(--text-muted); font-size: .875rem;
      p { margin: 0; }
    }

    /* ── Transactions ───────────────────────────────────────────────────────── */
    .fn-transactions { background: white; border-radius: 14px; border: 1px solid var(--border); box-shadow: 0 1px 4px rgba(0,0,0,.04); overflow: hidden; }
    .fn-tx-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 20px; border-bottom: 1px solid var(--border);
      flex-wrap: wrap; gap: 12px;
    }
    .fn-tabs { display: flex; gap: 4px; }
    .fn-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 7px 14px; border: 1px solid var(--border); background: transparent;
      border-radius: 8px; font-size: .8125rem; font-weight: 500; color: var(--text-secondary);
      cursor: pointer; transition: all .15s;
      &:hover { background: var(--gray-50); color: var(--text-primary); }
    }
    .fn-tab-active { background: var(--brand-subtle) !important; border-color: var(--brand-mid) !important; color: var(--brand) !important; }
    .fn-tab-badge {
      background: var(--brand); color: white;
      font-size: .65rem; font-weight: 700; border-radius: 10px; padding: 1px 6px;
    }

    .fn-add-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; background: var(--brand); color: white;
      border: none; border-radius: 8px; font-size: .8125rem; font-weight: 600; cursor: pointer;
      transition: background .15s;
      &:hover { background: var(--brand-dark, #a93226); }
    }

    .fn-tx-list { }
    .fn-tx-item {
      display: flex; align-items: center; gap: 12px;
      padding: 12px 20px; border-bottom: 1px solid var(--border);
      transition: background .1s;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--gray-50); }
    }
    .fn-tx-cat {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem;
    }
    .fn-tx-info { flex: 1; min-width: 0; }
    .fn-tx-label { font-size: .875rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .fn-tx-meta { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }
    .fn-tx-notes { font-size: .75rem; color: var(--text-muted); max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-style: italic; }
    .fn-tx-amount { font-size: .9375rem; font-weight: 700; white-space: nowrap; }
    .fn-tx-expense { color: #ef4444; }
    .fn-tx-income { color: #10b981; }
    .fn-tx-actions { display: flex; gap: 4px; opacity: 0; transition: opacity .15s; }
    .fn-tx-item:hover .fn-tx-actions { opacity: 1; }
    .fn-icon-btn {
      width: 28px; height: 28px; border: 1px solid var(--border); background: white;
      border-radius: 6px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-muted); transition: all .15s;
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }
    .fn-icon-del:hover { background: #fee2e2 !important; color: #ef4444 !important; border-color: #fca5a5 !important; }

    .fn-empty {
      padding: 48px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px;
      color: var(--text-muted); text-align: center;
      p { margin: 0; font-size: .9rem; }
    }
    .fn-empty-icon { font-size: 2.5rem; }
    .fn-empty-btn {
      margin-top: 4px; padding: 8px 18px; border: 1px solid var(--border); background: white;
      border-radius: 8px; font-size: .8125rem; font-weight: 500; cursor: pointer;
      transition: all .15s; color: var(--text-secondary);
      &:hover { background: var(--gray-50); color: var(--text-primary); }
    }

    /* ── Modal ──────────────────────────────────────────────────────────────── */
    .fn-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 16px;
      backdrop-filter: blur(4px);
      animation: fadeIn .15s ease;
    }
    .fn-modal {
      background: white; border-radius: 16px; width: 100%; max-width: 480px;
      box-shadow: 0 24px 64px rgba(0,0,0,.18);
      animation: slideUp .18s ease;
    }
    .fn-modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 20px 24px 16px; border-bottom: 1px solid var(--border);
      h3 { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    }
    .fn-modal-close {
      width: 32px; height: 32px; border: 1px solid var(--border); background: white;
      border-radius: 8px; display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: var(--text-muted); transition: all .15s;
      &:hover { background: var(--gray-50); }
    }
    .fn-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
    .fn-field { display: flex; flex-direction: column; gap: 5px; }
    .fn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .fn-label { font-size: .8125rem; font-weight: 600; color: var(--text-secondary); }
    .fn-optional { font-weight: 400; color: var(--text-muted); }
    .fn-input, .fn-select, .fn-textarea {
      border: 1px solid var(--border); border-radius: 8px;
      padding: 9px 12px; font-size: .875rem; color: var(--text-primary);
      outline: none; font-family: inherit; width: 100%; box-sizing: border-box;
      transition: border-color .15s;
      &:focus { border-color: var(--brand); box-shadow: 0 0 0 3px rgba(192,57,43,.1); }
    }
    .fn-textarea { resize: vertical; min-height: 72px; }
    .fn-amount-wrap { position: relative; }
    .fn-input-amount { padding-right: 44px; }
    .fn-currency {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      font-size: .8rem; color: var(--text-muted); font-weight: 600; pointer-events: none;
    }
    .fn-form-error { margin: 0 24px; padding: 10px 14px; background: #fee2e2; border-radius: 8px; color: #b91c1c; font-size: .8125rem; }
    .fn-modal-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 16px 24px; border-top: 1px solid var(--border);
    }
    .fn-btn-cancel {
      padding: 9px 18px; border: 1px solid var(--border); background: white;
      border-radius: 8px; font-size: .875rem; font-weight: 500; cursor: pointer; color: var(--text-secondary);
      transition: all .15s;
      &:hover { background: var(--gray-50); }
    }
    .fn-btn-save {
      display: flex; align-items: center; gap: 6px;
      padding: 9px 20px; background: var(--brand); color: white;
      border: none; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer;
      transition: background .15s;
      &:hover:not(:disabled) { background: var(--brand-dark, #a93226); }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .fn-spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4);
      border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 1024px) {
      .fn-kpis { grid-template-columns: repeat(2, 1fr); }
      .fn-charts-row { grid-template-columns: 1fr; }
      .fn-chart-donut { order: -1; }
      .fn-donut-wrap { flex-direction: row; align-items: center; }
    }
    @media (max-width: 640px) {
      .fn-kpis { grid-template-columns: 1fr; }
      .fn-header { flex-direction: column; }
      .fn-periods { width: 100%; }
      .fn-row { grid-template-columns: 1fr; }
    }
  `],
})
export class FinanceComponent implements OnInit {
  private readonly financeService = inject(FinanceService)
  private readonly authService    = inject(AuthService)

  readonly periods: FinancePeriod[] = ['day', 'week', 'month', 'semester', 'year']
  readonly expenseCategories: ExpenseCategory[] = ['ingredient', 'tool', 'accessory', 'other']

  readonly CATEGORY_LABELS = CATEGORY_LABELS
  readonly CATEGORY_COLORS = CATEGORY_COLORS
  readonly donutR = DONUT_R

  readonly period    = signal<FinancePeriod>('month')
  readonly summary   = signal<FinanceSummary | null>(null)
  readonly chartData = signal<FinanceChart | null>(null)
  readonly expenses  = signal<FinanceExpense[]>([])
  readonly incomes   = signal<FinanceIncome[]>([])
  readonly activeTab = signal<'expenses' | 'incomes'>('expenses')
  readonly loading   = signal(true)
  readonly modal     = signal<{ mode: ModalMode; id: number | null } | null>(null)
  readonly saving    = signal(false)
  readonly formError = signal<string | null>(null)

  readonly currency = computed(() => this.authService.restaurant()?.currency ?? 'FCFA')

  form: FormState = this.emptyForm('expense')

  // ── SVG chart constants ────────────────────────────────────────────────────
  readonly svgW = 600
  readonly svgH = 230
  readonly padL = 48
  readonly padR = 12
  readonly padT = 12
  readonly padB = 30

  readonly plotW = computed(() => this.svgW - this.padL - this.padR)
  readonly plotH = computed(() => this.svgH - this.padT - this.padB)

  readonly maxVal = computed(() => {
    const pts = this.chartData()?.points ?? []
    if (!pts.length) return 1
    return Math.max(...pts.map(p => Math.max(p.revenue, p.expenses)), 1)
  })

  readonly minNet = computed(() => {
    const pts = this.chartData()?.points ?? []
    if (!pts.length) return 0
    return Math.min(...pts.map(p => p.net), 0)
  })

  readonly yScale = computed(() => this.plotH() / (this.maxVal() - Math.min(this.minNet(), 0)))

  readonly zeroY = computed(() => this.padT + this.plotH() - Math.abs(Math.min(this.minNet(), 0)) * this.yScale())

  readonly yTicks = computed(() => {
    const max = this.maxVal()
    const min = this.minNet()
    const range = max - Math.min(min, 0)
    const step = niceStep(range, 5)
    const ticks = []
    // positive ticks (including 0)
    for (let v = 0; v <= max + step * 0.5; v += step) {
      const y = this.zeroY() - v * this.yScale()
      if (y >= this.padT - 4) ticks.push({ y, label: formatAmountTick(v) })
    }
    // negative ticks
    if (min < 0) {
      for (let v = -step; v >= min - step * 0.5; v -= step) {
        const y = this.zeroY() - v * this.yScale()
        if (y <= this.svgH - this.padB + 4) ticks.push({ y, label: formatAmountTick(v) })
      }
    }
    return ticks
  })

  readonly barPoints = computed(() => {
    const pts = this.chartData()?.points ?? []
    if (!pts.length) return []
    const n = pts.length
    const gw = this.plotW() / n
    const bw = Math.min(gw * 0.32, 24)
    const gap = gw * 0.07
    const groupBy = this.chartData()?.groupBy ?? 'day'
    // Show at most 10 x-axis labels — compute step
    const step = Math.ceil(n / 10)

    return pts.map((p, i) => {
      const cx = this.padL + gw * i + gw / 2
      const rh = p.revenue * this.yScale()
      const eh = p.expenses * this.yScale()
      const ny = this.zeroY() - p.net * this.yScale()
      return {
        label: p.label,
        shortLabel: formatXLabel(p.label, groupBy),
        showLabel: i % step === 0,
        cx,
        bw,
        rx: cx - bw - gap / 2,
        ry: this.zeroY() - rh,
        rh: Math.max(rh, 0),
        ex: cx + gap / 2,
        ey: this.zeroY() - eh,
        eh: Math.max(eh, 0),
        ny,
      }
    })
  })

  readonly netLinePath = computed(() => {
    const pts = this.barPoints()
    if (pts.length < 2) return null
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx},${p.ny}`).join(' ')
  })

  // ── Donut segments ─────────────────────────────────────────────────────────
  readonly donutSegments = computed(() => {
    const s = this.summary()
    if (!s || s.totalExpenses === 0) return []

    const cats = this.expenseCategories
    const segments: { category: ExpenseCategory; color: string; dashArray: string; dashOffset: number }[] = []
    let offset = 0

    for (const cat of cats) {
      const val = s.byCategory[cat]
      if (val <= 0) continue
      const pct = val / s.totalExpenses
      const dash = pct * DONUT_CIRC
      segments.push({
        category: cat,
        color: CATEGORY_COLORS[cat],
        dashArray: `${dash} ${DONUT_CIRC - dash}`,
        dashOffset: -offset,
      })
      offset += dash
    }
    return segments
  })

  readonly expenseCategoryBreakdown = computed(() => {
    const s = this.summary()
    if (!s) return ''
    const top = this.expenseCategories
      .map(c => ({ c, v: s.byCategory[c] }))
      .filter(x => x.v > 0)
      .sort((a, b) => b.v - a.v)
      .slice(0, 2)
    if (!top.length) return 'Aucune dépense'
    return top.map(x => CATEGORY_LABELS[x.c]).join(', ')
  })

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void { this.loadAll() }

  setPeriod(p: FinancePeriod): void {
    this.period.set(p)
    this.loadAll()
  }

  private loadAll(): void {
    this.loading.set(true)
    const p = this.period()

    let done = 0
    const check = () => { if (++done === 4) this.loading.set(false) }

    this.financeService.getSummary(p).subscribe({ next: v => { this.summary.set(v); check() }, error: () => check() })
    this.financeService.getChart(p).subscribe({ next: v => { this.chartData.set(v); check() }, error: () => check() })
    this.financeService.listExpenses({}).subscribe({ next: v => { this.expenses.set(v.data); check() }, error: () => check() })
    this.financeService.listIncomes({}).subscribe({ next: v => { this.incomes.set(v.data); check() }, error: () => check() })
  }

  // ── Modal ──────────────────────────────────────────────────────────────────
  openAdd(): void {
    const mode = this.activeTab() === 'expenses' ? 'expense' : 'income'
    this.form = this.emptyForm(mode)
    this.formError.set(null)
    this.modal.set({ mode, id: null })
  }

  editExpense(exp: FinanceExpense): void {
    this.form = { mode: 'expense', id: exp.id, category: exp.category, label: exp.label, amount: String(exp.amount), date: exp.date, notes: exp.notes ?? '' }
    this.formError.set(null)
    this.modal.set({ mode: 'expense', id: exp.id })
  }

  editIncome(inc: FinanceIncome): void {
    this.form = { mode: 'income', id: inc.id, category: 'other', label: inc.label, amount: String(inc.amount), date: inc.date, notes: inc.notes ?? '' }
    this.formError.set(null)
    this.modal.set({ mode: 'income', id: inc.id })
  }

  closeModal(): void { this.modal.set(null) }

  save(): void {
    const { mode, id } = this.modal()!
    if (!this.form.label.trim()) { this.formError.set('Le libellé est requis.'); return }
    const amount = parseFloat(this.form.amount)
    if (isNaN(amount) || amount <= 0) { this.formError.set('Le montant doit être positif.'); return }
    if (!this.form.date) { this.formError.set('La date est requise.'); return }
    this.formError.set(null)
    this.saving.set(true)

    if (mode === 'expense') {
      const payload: ExpensePayload = { category: this.form.category, label: this.form.label.trim(), amount, date: this.form.date, notes: this.form.notes.trim() || undefined }
      const req$ = id ? this.financeService.updateExpense(id, payload) : this.financeService.createExpense(payload)
      req$.subscribe({
        next: (saved) => {
          this.expenses.update(list => id ? list.map(e => e.id === id ? saved : e) : [saved, ...list])
          this.saving.set(false); this.modal.set(null); this.loadSummary()
        },
        error: () => { this.formError.set('Une erreur est survenue.'); this.saving.set(false) },
      })
    } else {
      const payload: IncomePayload = { label: this.form.label.trim(), amount, date: this.form.date, notes: this.form.notes.trim() || undefined }
      const req$ = id ? this.financeService.updateIncome(id, payload) : this.financeService.createIncome(payload)
      req$.subscribe({
        next: (saved) => {
          this.incomes.update(list => id ? list.map(i => i.id === id ? saved : i) : [saved, ...list])
          this.saving.set(false); this.modal.set(null); this.loadSummary()
        },
        error: () => { this.formError.set('Une erreur est survenue.'); this.saving.set(false) },
      })
    }
  }

  deleteExpense(exp: FinanceExpense): void {
    if (!confirm(`Supprimer « ${exp.label} » ?`)) return
    this.financeService.deleteExpense(exp.id).subscribe({
      next: () => { this.expenses.update(l => l.filter(e => e.id !== exp.id)); this.loadSummary() },
    })
  }

  deleteIncome(inc: FinanceIncome): void {
    if (!confirm(`Supprimer « ${inc.label} » ?`)) return
    this.financeService.deleteIncome(inc.id).subscribe({
      next: () => { this.incomes.update(l => l.filter(i => i.id !== inc.id)); this.loadSummary() },
    })
  }

  private loadSummary(): void {
    const p = this.period()
    this.financeService.getSummary(p).subscribe(v => this.summary.set(v))
    this.financeService.getChart(p).subscribe(v => this.chartData.set(v))
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  periodLabel(p: FinancePeriod): string { return PERIOD_LABELS[p] }
  catLabel(c: ExpenseCategory): string { return CATEGORY_LABELS[c] }
  catColor(c: ExpenseCategory): string { return CATEGORY_COLORS[c] }
  catIcon(c: ExpenseCategory): string {
    return { ingredient: '🥩', tool: '🔧', accessory: '🛒', other: '📦' }[c]
  }

  formatAmount(v: number): string {
    const cur = this.currency()
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v) + ' ' + cur
  }

  formatAmountShort(v: number): string {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M'
    if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k'
    return String(Math.round(v))
  }

  clamp(v: number, min: number, max: number): number { return Math.min(Math.max(v, min), max) }

  private emptyForm(mode: ModalMode): FormState {
    const today = new Date().toISOString().slice(0, 10)
    return { mode, id: null, category: 'ingredient', label: '', amount: '', date: today, notes: '' }
  }
}

// ── Pure helpers (outside class) ───────────────────────────────────────────
function niceStep(max: number, targetTicks: number): number {
  const raw = max / targetTicks
  const pow = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / pow
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10
  return nice * pow
}

function formatAmountTick(v: number): string {
  const abs = Math.abs(v)
  const sign = v < 0 ? '−' : ''
  if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return sign + (abs / 1_000).toFixed(0) + 'k'
  return sign + String(Math.round(abs))
}

const MONTH_SHORT = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc']

function formatXLabel(label: string, groupBy: 'hour' | 'day' | 'month'): string {
  // hour: "2026-05-13 14:00" → "14h"
  if (groupBy === 'hour') {
    const h = label.slice(11, 13)
    return h ? `${parseInt(h, 10)}h` : label
  }
  // month: "2026-05" → "mai"
  if (groupBy === 'month') {
    const m = parseInt(label.slice(5, 7), 10)
    return MONTH_SHORT[m - 1] ?? label
  }
  // day: "2026-05-13" → "13/05"
  const parts = label.split('-')
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`
  return label
}
