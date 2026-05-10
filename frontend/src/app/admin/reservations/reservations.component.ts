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
  template: `
    <ng-container *transloco="let t">
      <div class="res-page">

        <!-- Enterprise locked banner -->
        @if (!hasAccess()) {
          <div class="locked-banner">
            <div class="locked-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div class="locked-content">
              <div class="locked-title">{{ t('reservations.lockedTitle') }}</div>
              <div class="locked-desc">{{ t('reservations.lockedDesc') }}</div>
              <a routerLink="/admin/subscription" class="locked-cta">
                {{ t('reservations.lockedCta') }}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </a>
            </div>
          </div>
        }

        <!-- Full reservations management -->
        @if (hasAccess()) {
          <!-- Page header -->
          <div class="page-header">
            <div>
              <h1 class="page-title">{{ t('reservations.title') }}</h1>
              <p class="page-sub">{{ t('reservations.subtitle') }}</p>
            </div>
          </div>

          <!-- Alert banner for urgent reservations -->
          @if (urgentCount() > 0) {
            <div class="alert-banner" [class.alert-overdue]="overdueCount() > 0">
              <span class="alert-icon">{{ overdueCount() > 0 ? '⚠️' : '⏰' }}</span>
              <div class="alert-text">
                @if (overdueCount() > 0) {
                  <strong>{{ overdueCount() }} réservation{{ overdueCount() > 1 ? 's' : '' }} dépassée{{ overdueCount() > 1 ? 's' : '' }}</strong>
                  @if (imminentCount() > 0) {
                    &nbsp;· {{ imminentCount() }} imminente{{ imminentCount() > 1 ? 's' : '' }}
                  }
                } @else {
                  <strong>{{ imminentCount() }} réservation{{ imminentCount() > 1 ? 's' : '' }} dans moins de 30 min</strong>
                }
              </div>
            </div>
          }

          <!-- Filter bar -->
          <div class="filter-bar">
            <div class="filter-tabs">
              <button class="tab" [class.tab-active]="activeTab() === 'all'" (click)="setTab('all')">
                {{ t('reservations.tabAll') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'pending'" (click)="setTab('pending')">
                {{ t('reservations.tabPending') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'confirmed'" (click)="setTab('confirmed')">
                {{ t('reservations.tabConfirmed') }}
              </button>
              <button class="tab" [class.tab-active]="activeTab() === 'cancelled'" (click)="setTab('cancelled')">
                {{ t('reservations.tabCancelled') }}
              </button>
            </div>

            <div class="date-wrap">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="date-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <input
                type="date"
                class="date-input"
                [(ngModel)]="dateFilter"
                (change)="onDateChange()"
              />
            </div>
          </div>

          <!-- Loading skeleton -->
          @if (loading()) {
            <div class="res-list">
              @for (_ of [1,2,3]; track $index) {
                <div class="res-card skeleton-card">
                  <div class="skeleton" style="height:16px;width:40%;margin-bottom:8px;border-radius:6px"></div>
                  <div class="skeleton" style="height:12px;width:65%;border-radius:4px"></div>
                </div>
              }
            </div>
          }

          <!-- Reservations list -->
          @if (!loading()) {
            @if (reservations().length === 0) {
              <div class="empty-state">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="color:var(--text-secondary);opacity:.4"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <p>{{ t('reservations.emptyState') }}</p>
              </div>
            } @else {
              <div class="res-list">
                @for (res of reservations(); track res.id) {
                  <div class="res-card"
                    [class.card-overdue]="getUrgency(res) === 'overdue'"
                    [class.card-imminent]="getUrgency(res) === 'imminent'">
                    <!-- Card top -->
                    <div class="res-card-top">
                      <div class="res-datetime">
                        <div class="res-date">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          {{ res.reservedDate | date:'dd/MM/yyyy' }} · {{ res.reservedTime }}
                          @if (getUrgency(res) === 'overdue') {
                            <span class="urgency-pill pill-overdue">⚠️ Dépassée</span>
                          } @else if (getUrgency(res) === 'imminent') {
                            <span class="urgency-pill pill-imminent">⏰ Dans {{ minutesUntil(res) }} min</span>
                          }
                        </div>
                        <div class="res-guests">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          {{ res.guestsCount }} {{ t('reservations.guests') }}
                        </div>
                      </div>
                      <div class="status-badge" [style.color]="statusColor(res.status)" [style.background]="statusBg(res.status)">
                        {{ t('reservations.status.' + res.status) }}
                      </div>
                    </div>

                    <!-- Customer info -->
                    <div class="res-customer">
                      <div class="customer-name">{{ res.customerName }}</div>
                      <div class="customer-contact">
                        <a [href]="'tel:' + res.customerPhone" class="contact-link">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.09 6.09l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          {{ res.customerPhone }}
                        </a>
                        @if (res.customerEmail) {
                          <a [href]="'mailto:' + res.customerEmail" class="contact-link">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                            {{ res.customerEmail }}
                          </a>
                        }
                      </div>
                    </div>

                    <!-- Special requests -->
                    @if (res.specialRequests) {
                      <div class="special-requests">
                        <div class="special-label">{{ t('reservations.specialRequests') }}</div>
                        <p class="special-text">{{ res.specialRequests }}</p>
                      </div>
                    }

                    <!-- Notes -->
                    @if (res.notes) {
                      <div class="res-notes">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        {{ res.notes }}
                      </div>
                    }

                    <!-- Action bar -->
                    <div class="res-actions">
                      @if (res.status === 'pending') {
                        <button class="action-btn action-confirm" (click)="updateStatus(res, 'confirmed')" [disabled]="updatingId() === res.id">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {{ t('reservations.confirm') }}
                        </button>
                        <button class="action-btn action-cancel" (click)="updateStatus(res, 'cancelled')" [disabled]="updatingId() === res.id">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          {{ t('reservations.cancel') }}
                        </button>
                      }
                      @if (res.status === 'confirmed') {
                        <button class="action-btn action-noshow" (click)="updateStatus(res, 'no_show')" [disabled]="updatingId() === res.id">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                          {{ t('reservations.noShow') }}
                        </button>
                        <button class="action-btn action-cancel" (click)="updateStatus(res, 'cancelled')" [disabled]="updatingId() === res.id">
                          {{ t('reservations.cancel') }}
                        </button>
                      }

                      <!-- Inline notes input -->
                      <div class="notes-input-wrap">
                        <input
                          type="text"
                          class="notes-input"
                          [placeholder]="t('reservations.addNote')"
                          [(ngModel)]="notesMap[res.id]"
                          (keyup.enter)="saveNote(res)"
                        />
                        @if (notesMap[res.id]) {
                          <button class="notes-save" (click)="saveNote(res)">
                            {{ t('reservations.saveNote') }}
                          </button>
                        }
                      </div>
                    </div>
                  </div>
                }
              </div>

              <!-- Pagination -->
              @if (meta().lastPage > 1) {
                <div class="pagination">
                  <button class="page-btn" [disabled]="meta().currentPage <= 1" (click)="prevPage()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M15 18l-6-6 6-6"/></svg>
                    {{ t('reservations.prevPage') }}
                  </button>
                  <span class="page-info">{{ meta().currentPage }} / {{ meta().lastPage }}</span>
                  <button class="page-btn" [disabled]="meta().currentPage >= meta().lastPage" (click)="nextPage()">
                    {{ t('reservations.nextPage') }}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              }
            }
          }
        }
      </div>
    </ng-container>
  `,
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
    return !!(r as any)?.plan?.features?.['orders_and_reservations'] || (r as any)?.plan?.slug === 'enterprise'
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
