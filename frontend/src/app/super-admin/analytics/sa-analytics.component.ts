import {
  Component, signal, inject, OnInit, OnDestroy, ChangeDetectionStrategy,
} from '@angular/core'
import { CommonModule, DatePipe } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { forkJoin } from 'rxjs'

interface AnalyticsOverview {
  realtime: number
  today: number
  week: number
  month: number
  total: number
  totalPageViews: number
  topPages: { path: string; views: number; visitors: number }[]
}

interface DailyPoint { date: string; visitors: number; pageViews: number }

@Component({
  selector: 'app-sa-analytics',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './sa-analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .analytics-page { max-width: 1100px; }

    .page-header { margin-bottom: var(--space-7); }
    .page-title  { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-sub    { color: var(--text-muted); font-size: .9rem; margin: 0; display: flex; align-items: center; gap: var(--space-2); }

    .dot-live {
      width: 8px; height: 8px; border-radius: 50%; background: var(--success);
      display: inline-block; flex-shrink: 0;
      animation: livePulse 2s ease infinite;
    }
    @keyframes livePulse { 0%,100%{ box-shadow:0 0 0 0 rgba(22,163,74,.4) } 50%{ box-shadow:0 0 0 6px rgba(22,163,74,0) } }

    /* KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 1000px) { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }

    .kpi-card {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      display: flex; align-items: center; gap: var(--space-3);
      position: relative; overflow: hidden;
      animation: slideUpFade .4s var(--ease-spring) calc(var(--d, 0) * 60ms) both;
    }
    .kpi-accent { position: absolute; top: 0; left: 0; right: 0; height: 3px; }
    .kpi-icon-wrap {
      width: 44px; height: 44px; border-radius: var(--radius-md); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
    }
    .kpi-body { min-width: 0; }
    .kpi-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .kpi-label { font-size: .75rem; color: var(--text-muted); margin-top: 3px; }

    /* Bottom grid */
    .bottom-grid { display: grid; grid-template-columns: 1fr 300px; gap: var(--space-5); }
    @media (max-width: 900px) { .bottom-grid { grid-template-columns: 1fr; } }

    /* Chart panel */
    .panel {
      background: var(--surface-1); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-5) var(--space-6);
      animation: slideUpFade .5s var(--ease-spring) .3s both;
    }
    .panel-title {
      font-size: .8125rem; font-weight: 700; color: var(--text-primary);
      text-transform: uppercase; letter-spacing: .06em; margin-bottom: var(--space-4);
    }

    /* SVG chart */
    .chart-wrap { width: 100%; overflow: hidden; }
    .chart-wrap svg { width: 100%; height: 160px; display: block; }
    .chart-labels { display: flex; justify-content: space-between; margin-top: 6px; }
    .chart-lbl { font-size: .65rem; color: var(--text-muted); }

    /* Top pages table */
    .top-pages { display: flex; flex-direction: column; gap: 1px; }
    .tp-row {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) 0; border-bottom: 1px solid var(--border);
    }
    .tp-row:last-child { border-bottom: none; }
    .tp-path { flex: 1; font-size: .8rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0; }
    .tp-bar-wrap { width: 72px; height: 6px; background: var(--gray-100); border-radius: 3px; flex-shrink: 0; }
    .tp-bar { height: 100%; border-radius: 3px; background: var(--brand); }
    .tp-num { font-size: .75rem; font-weight: 600; color: var(--text-muted); width: 36px; text-align: right; flex-shrink: 0; }

    .skeleton { height: 108px; background: var(--gray-100); border-radius: var(--radius-lg); animation: pulse 1.4s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
    .skeleton-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-4); margin-bottom: var(--space-6); }
    .skeleton-panel { height: 280px; background: var(--gray-100); border-radius: var(--radius-lg); animation: pulse 1.4s ease-in-out infinite; }
  `],
})
export class SaAnalyticsComponent implements OnInit, OnDestroy {
  private readonly http = inject(HttpClient)
  private refreshTimer?: ReturnType<typeof setInterval>

  readonly loading = signal(true)
  readonly overview = signal<AnalyticsOverview | null>(null)
  readonly daily = signal<DailyPoint[]>([])
  readonly lastRefresh = signal<Date>(new Date())

  private readonly kpis = [
    { key: 'realtime',  label: 'En ce moment',   icon: '🟢', color: '#16A34A', bg: 'rgba(22,163,74,.1)',  d: 0 },
    { key: 'today',     label: "Aujourd'hui",     icon: '📅', color: '#2563EB', bg: 'rgba(37,99,235,.1)', d: 1 },
    { key: 'week',      label: '7 derniers jours',icon: '📆', color: '#7C3AED', bg: 'rgba(124,58,237,.1)',d: 2 },
    { key: 'month',     label: '30 derniers jours',icon: '🗓️',color: '#D97706', bg: 'rgba(217,119,6,.1)', d: 3 },
    { key: 'total',     label: 'Total visiteurs', icon: '🌍', color: '#C0392B', bg: 'rgba(192,57,43,.1)', d: 4 },
  ] as const

  get kpiList() { return this.kpis }

  ngOnInit(): void {
    this.load()
    this.refreshTimer = setInterval(() => this.load(), 30_000)
  }

  ngOnDestroy(): void {
    clearInterval(this.refreshTimer)
  }

  private load(): void {
    forkJoin({
      overview: this.http.get<AnalyticsOverview>('/api/super-admin/analytics/overview'),
      daily: this.http.get<DailyPoint[]>('/api/super-admin/analytics/daily', { params: { days: '30' } }),
    }).subscribe({
      next: ({ overview, daily }) => {
        this.overview.set(overview)
        this.daily.set(daily)
        this.loading.set(false)
        this.lastRefresh.set(new Date())
      },
      error: () => this.loading.set(false),
    })
  }

  kpiValue(key: string): number {
    const ov = this.overview()
    if (!ov) return 0
    return (ov as any)[key] ?? 0
  }

  // ── SVG line chart ──────────────────────────────────────────────────────────

  get chartPath(): string {
    const data = this.daily()
    if (data.length < 2) return ''
    return this.buildPath(data.map((d) => d.visitors), 740, 140)
  }

  get chartFill(): string {
    const data = this.daily()
    if (data.length < 2) return ''
    const path = this.buildPath(data.map((d) => d.visitors), 740, 140)
    return `${path} L 740,140 L 0,140 Z`
  }

  private buildPath(vals: number[], w: number, h: number): string {
    const max = Math.max(...vals, 1)
    const points = vals.map((v, i) => ({
      x: (i / (vals.length - 1)) * w,
      y: h - (v / max) * h * 0.88 - 4,
    }))
    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) / 2
      d += ` C ${cp1x},${points[i - 1].y} ${cp1x},${points[i].y} ${points[i].x},${points[i].y}`
    }
    return d
  }

  get chartLabels(): string[] {
    const data = this.daily()
    if (!data.length) return []
    const indices = [0, Math.floor(data.length / 4), Math.floor(data.length / 2), Math.floor(3 * data.length / 4), data.length - 1]
    return indices.map((i) => {
      const d = new Date(data[i].date)
      return `${d.getDate()}/${d.getMonth() + 1}`
    })
  }

  get maxVisitors(): number {
    const data = this.daily()
    return Math.max(...data.map((d) => d.visitors), 1)
  }

  topPageWidth(views: number): number {
    const ov = this.overview()
    if (!ov || !ov.topPages.length) return 0
    const max = ov.topPages[0].views
    return max > 0 ? Math.round((views / max) * 100) : 0
  }
}
