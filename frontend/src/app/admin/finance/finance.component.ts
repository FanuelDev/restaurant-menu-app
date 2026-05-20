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
  templateUrl: './finance.component.html',
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
