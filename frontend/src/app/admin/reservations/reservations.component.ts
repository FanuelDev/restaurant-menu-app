import { Component, inject, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { ReservationService } from '../../shared/services/reservation.service'
import { AuthService } from '../../shared/services/auth.service'
import { DesktopService } from '../../shared/services/desktop.service'
import type { Reservation, ReservationStatus } from '../../shared/models'

const STATUS_COLORS: Record<ReservationStatus, string> = {
  pending:   '#F59E0B',
  confirmed: '#10B981',
  cancelled: '#6B7280',
  no_show:   '#EF4444',
}

const STATUS_BG: Record<ReservationStatus, string> = {
  pending:   '#FFFBEB',
  confirmed: '#ECFDF5',
  cancelled: '#F9FAFB',
  no_show:   '#FEF2F2',
}

@Component({
  selector: 'app-admin-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reservations.component.html',
  styles: [`
    :host { display: block; }

    .res-page {
      padding: var(--space-6);
      max-width: 900px;
    }

    /* Locked banner */
    .locked-banner {
      display: flex;
      align-items: flex-start;
      gap: var(--space-6);
      background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%);
      border: 1.5px solid #DDD6FE;
      border-radius: var(--radius-md);
      padding: var(--space-8);
      margin-bottom: var(--space-6);
    }
    .locked-icon {
      width: 56px;
      height: 56px;
      background: white;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #7C3AED;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(124,58,237,.15);
    }
    .locked-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #3B0764;
      margin-bottom: var(--space-2);
    }
    .locked-desc {
      font-size: .9375rem;
      color: #6D28D9;
      line-height: 1.6;
      margin-bottom: var(--space-4);
    }
    .locked-cta {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      background: #7C3AED;
      color: white;
      text-decoration: none;
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-full);
      font-size: .9375rem;
      font-weight: 700;
      transition: background var(--t-fast), transform var(--t-fast);
    }
    .locked-cta:hover { background: #6D28D9; transform: translateY(-1px); }

    /* Page header */
    .page-header { margin-bottom: var(--space-6); }
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1);
    }
    .page-sub {
      font-size: .9375rem;
      color: var(--text-secondary);
      margin: 0;
    }

    /* Filter bar */
    .filter-bar {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      margin-bottom: var(--space-5);
      flex-wrap: wrap;
    }
    .filter-tabs {
      display: flex;
      gap: 2px;
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 3px;
    }
    .tab {
      padding: var(--space-2) var(--space-4);
      border: none;
      background: none;
      border-radius: calc(var(--radius-md) - 2px);
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-secondary);
      cursor: pointer;
      font-family: var(--font-body);
      transition: color var(--t-fast), background var(--t-fast);
    }
    .tab:hover { color: var(--text-primary); }
    .tab-active { background: white; color: var(--text-primary); box-shadow: 0 1px 3px rgba(0,0,0,.1); }

    .date-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .date-icon {
      position: absolute;
      left: var(--space-3);
      color: var(--text-secondary);
      pointer-events: none;
    }
    .date-input {
      padding: var(--space-3) var(--space-3) var(--space-3) calc(var(--space-3) + 23px);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      font-size: .875rem;
      font-family: var(--font-body);
      color: var(--text-primary);
      outline: none;
      background: white;
    }
    .date-input:focus { border-color: var(--color-brand); }

    /* Skeleton */
    .skeleton-card { padding: var(--space-5) !important; }
    .skeleton {
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s infinite;
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Alert banner */
    .alert-banner {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: #FFFBEB;
      border: 1.5px solid #FCD34D;
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      font-size: .9rem;
      color: #92400E;
      animation: slideDown .3s ease;
    }
    .alert-banner.alert-overdue {
      background: #FEF2F2;
      border-color: #FECACA;
      color: #991B1B;
    }
    .alert-icon { font-size: 1.1rem; flex-shrink: 0; }
    .alert-text { flex: 1; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    /* Urgency pills */
    .urgency-pill {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: var(--radius-full);
      font-size: .6875rem;
      font-weight: 700;
      letter-spacing: .03em;
      margin-left: var(--space-2);
      animation: pulse 2s ease-in-out infinite;
    }
    .pill-imminent { background: #FEF3C7; color: #92400E; border: 1px solid #FCD34D; }
    .pill-overdue  { background: #FEE2E2; color: #991B1B; border: 1px solid #FECACA; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .65; }
    }

    /* Card urgency states */
    .card-imminent {
      border-left: 3px solid #F59E0B !important;
      background: #FFFDF5;
    }
    .card-overdue {
      border-left: 3px solid #EF4444 !important;
      background: #FFFAFA;
    }

    /* Reservations list */
    .res-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .res-card {
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-5);
      transition: box-shadow var(--t-fast);
    }
    .res-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,.07); }

    /* Card top */
    .res-card-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-3);
      gap: var(--space-4);
    }
    .res-datetime { }
    .res-date {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }
    .res-guests {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      color: var(--text-secondary);
      margin-top: var(--space-1);
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: var(--radius-full);
      font-size: .75rem;
      font-weight: 700;
      letter-spacing: .03em;
      flex-shrink: 0;
    }

    /* Customer info */
    .res-customer { margin-bottom: var(--space-3); }
    .customer-name { font-size: .9375rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-2); }
    .customer-contact {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }
    .contact-link {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      color: var(--text-secondary);
      text-decoration: none;
    }
    .contact-link:hover { color: var(--color-brand); }

    /* Special requests */
    .special-requests {
      background: #F0F9FF;
      border: 1px solid #BAE6FD;
      border-radius: var(--radius-md);
      padding: var(--space-3) var(--space-4);
      margin-bottom: var(--space-3);
    }
    .special-label {
      font-size: .75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .06em;
      color: #0369A1;
      margin-bottom: var(--space-1);
    }
    .special-text {
      font-size: .875rem;
      color: #0C4A6E;
      margin: 0;
      line-height: 1.5;
      font-style: italic;
    }

    /* Notes */
    .res-notes {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      font-size: .8125rem;
      color: var(--text-secondary);
      margin-bottom: var(--space-3);
      font-style: italic;
    }

    /* Actions */
    .res-actions {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-wrap: wrap;
      padding-top: var(--space-3);
      border-top: 1px solid var(--border);
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-3);
      border: 1.5px solid;
      border-radius: var(--radius-md);
      background: white;
      font-size: .8125rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-body);
      transition: opacity var(--t-fast), transform var(--t-fast);
    }
    .action-btn:hover:not(:disabled) { opacity: .8; transform: translateY(-1px); }
    .action-btn:disabled { opacity: .5; cursor: not-allowed; }

    .action-confirm {
      color: #10B981;
      border-color: #6EE7B7;
      background: #ECFDF5;
    }
    .action-confirm:hover:not(:disabled) { background: #D1FAE5; }

    .action-cancel {
      color: #6B7280;
      border-color: #D1D5DB;
      background: #F9FAFB;
    }
    .action-cancel:hover:not(:disabled) { background: #F3F4F6; }

    .action-noshow {
      color: #EF4444;
      border-color: #FECACA;
      background: #FFF5F5;
    }
    .action-noshow:hover:not(:disabled) { background: #FEE2E2; }

    /* Notes input */
    .notes-input-wrap {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      flex: 1;
      min-width: 200px;
    }
    .notes-input {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      font-size: .8125rem;
      font-family: var(--font-body);
      color: var(--text-primary);
      outline: none;
      background: var(--surface-1);
    }
    .notes-input:focus { border-color: var(--color-brand); background: white; }
    .notes-save {
      padding: var(--space-2) var(--space-3);
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: .8125rem;
      font-weight: 600;
      font-family: var(--font-body);
      cursor: pointer;
      white-space: nowrap;
    }
    .notes-save:hover { opacity: .9; }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: var(--space-10) 0;
      color: var(--text-secondary);
    }
    .empty-state p { margin-top: var(--space-4); font-size: .9375rem; }

    /* Pagination */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .page-btn {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: white;
      font-size: .875rem;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      font-family: var(--font-body);
    }
    .page-btn:disabled { opacity: .4; cursor: not-allowed; }
    .page-btn:hover:not(:disabled) { background: var(--surface-1); }
    .page-info { font-size: .875rem; color: var(--text-secondary); }
  `],
})
export class ReservationsComponent implements OnInit, OnDestroy {
  private readonly reservationService = inject(ReservationService)
  private readonly authService = inject(AuthService)
  private readonly desktop = inject(DesktopService)

  readonly loading = signal(true)
  readonly reservations = signal<Reservation[]>([])
  readonly meta = signal({ total: 0, perPage: 20, currentPage: 1, lastPage: 1 })
  readonly updatingId = signal<number | null>(null)

  readonly activeTab = signal<'all' | 'pending' | 'confirmed' | 'cancelled'>('all')

  dateFilter = ''
  notesMap: Record<number, string> = {}

  private readonly now = signal(new Date())
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private readonly notifSentSet = new Set<string>()

  readonly hasAccess = computed(() => {
    const r = this.authService.restaurant()
    if (!r) return false
    const plan = (r as any)?.plan
    return !!(plan?.features?.['orders_and_reservations']) || plan?.slug === 'pro' || plan?.slug === 'enterprise'
  })

  readonly urgentCount = computed(() =>
    this.reservations().filter(r => this.getUrgency(r) !== 'none').length
  )
  readonly imminentCount = computed(() =>
    this.reservations().filter(r => this.getUrgency(r) === 'imminent').length
  )
  readonly overdueCount = computed(() =>
    this.reservations().filter(r => this.getUrgency(r) === 'overdue').length
  )

  statusColor(status: ReservationStatus): string { return STATUS_COLORS[status] ?? '#6B7280' }
  statusBg(status: ReservationStatus): string { return STATUS_BG[status] ?? '#F9FAFB' }

  getUrgency(res: Reservation): 'overdue' | 'imminent' | 'none' {
    if (!['pending', 'confirmed'].includes(res.status)) return 'none'
    const dt = new Date(`${res.reservedDate}T${res.reservedTime}`)
    const diffMin = (dt.getTime() - this.now().getTime()) / 60_000
    if (diffMin < 0) return 'overdue'
    if (diffMin <= 30) return 'imminent'
    return 'none'
  }

  minutesUntil(res: Reservation): number {
    const dt = new Date(`${res.reservedDate}T${res.reservedTime}`)
    return Math.max(0, Math.round((dt.getTime() - this.now().getTime()) / 60_000))
  }

  ngOnInit(): void {
    this.requestNotifPermission()
    this.loadReservations()
    this.tickInterval = setInterval(() => {
      this.now.set(new Date())
      this.checkNotifications()
    }, 60_000)
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval)
  }

  setTab(tab: 'all' | 'pending' | 'confirmed' | 'cancelled'): void {
    this.activeTab.set(tab)
    this.meta.update(m => ({ ...m, currentPage: 1 }))
    this.loadReservations()
  }

  onDateChange(): void {
    this.meta.update(m => ({ ...m, currentPage: 1 }))
    this.loadReservations()
  }

  loadReservations(): void {
    this.loading.set(true)
    const tab = this.activeTab()
    const params: Record<string, any> = { page: this.meta().currentPage }
    if (tab !== 'all') params['status'] = tab
    if (this.dateFilter) params['date'] = this.dateFilter

    this.reservationService.getAdminReservations(params).subscribe({
      next: (res) => {
        this.reservations.set(res.data)
        this.meta.set(res.meta)
        this.loading.set(false)
        this.checkNotifications()
      },
      error: () => this.loading.set(false),
    })
  }

  prevPage(): void {
    this.meta.update(m => ({ ...m, currentPage: m.currentPage - 1 }))
    this.loadReservations()
  }

  nextPage(): void {
    this.meta.update(m => ({ ...m, currentPage: m.currentPage + 1 }))
    this.loadReservations()
  }

  updateStatus(reservation: Reservation, status: ReservationStatus): void {
    this.updatingId.set(reservation.id)
    this.reservationService.updateReservationStatus(reservation.id, status).subscribe({
      next: (updated) => {
        this.reservations.update(list => list.map(r => r.id === updated.id ? updated : r))
        this.updatingId.set(null)
      },
      error: () => this.updatingId.set(null),
    })
  }

  saveNote(reservation: Reservation): void {
    const notes = this.notesMap[reservation.id]
    if (!notes?.trim()) return
    this.updatingId.set(reservation.id)
    this.reservationService.updateReservationStatus(reservation.id, reservation.status, notes.trim()).subscribe({
      next: (updated) => {
        this.reservations.update(list => list.map(r => r.id === updated.id ? updated : r))
        delete this.notesMap[reservation.id]
        this.updatingId.set(null)
      },
      error: () => this.updatingId.set(null),
    })
  }

  private requestNotifPermission(): void {
    // En mode desktop Electron, les notifications sont natives — pas besoin de permission browser
    if (this.desktop.isDesktop) return
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  private checkNotifications(): void {
    for (const res of this.reservations()) {
      const urgency = this.getUrgency(res)
      if (urgency === 'imminent' && !this.notifSentSet.has(`${res.id}-imminent`)) {
        this.notifSentSet.add(`${res.id}-imminent`)
        this.desktop.notify(
          `⏰ Réservation imminente — ${res.reservedTime}`,
          `${res.customerName} · ${res.guestsCount} couvert(s)`
        )
      } else if (urgency === 'overdue' && !this.notifSentSet.has(`${res.id}-overdue`)) {
        this.notifSentSet.add(`${res.id}-overdue`)
        this.desktop.notify(
          `⚠️ Réservation dépassée — ${res.reservedTime}`,
          `${res.customerName} · ${res.guestsCount} couvert(s) — à traiter`
        )
      }
    }
  }
}
