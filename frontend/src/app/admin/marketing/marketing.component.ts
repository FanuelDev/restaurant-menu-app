import { Component, inject, signal, computed, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import QRCode from 'qrcode'
import {
  MarketingService,
  MarketingVoucher,
  MarketingVoucherUsage,
  MarketingStats,
  CreateVoucherPayload,
} from '../../shared/services/marketing.service'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EVENT_LABELS: Record<string, string> = {
  after_work: '🍸 After-work',
  birthday:   '🎂 Anniversaire',
  christmas:  '🎄 Noël',
  easter:     '🐣 Pâques',
  new_year:   '🥂 Nouvel An',
  other:      '🎟 Autre',
}

function fmt(n: number): string {
  return n.toLocaleString('fr-FR') + ' FCFA'
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-marketing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page-container-lg">

  <!-- Header -->
  <div class="page-header">
    <div>
      <h1 class="page-title">🎟 Marketing</h1>
      <p class="page-subtitle">Bons de commande pour événements</p>
    </div>
    <button class="btn btn-primary" (click)="openCreateModal()">+ Créer un bon</button>
  </div>

  <!-- Error -->
  @if (error()) {
    <div class="alert alert-error" style="margin-bottom:var(--space-5)">{{ error() }}</div>
  }

  <!-- Stats -->
  <div class="stats-grid animate-up">
    @if (statsLoading()) {
      @for (i of [1,2,3,4]; track i) {
        <div class="stat-card"><div class="skeleton" style="height:64px;border-radius:var(--radius-lg)"></div></div>
      }
    } @else if (stats()) {
      <div class="stat-card">
        <div class="stat-value">{{ stats()!.totalVouchers }}</div>
        <div class="stat-label">Total bons</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-value-green">{{ stats()!.activeVouchers }}</div>
        <div class="stat-label">Actifs</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats()!.totalRedemptions }}</div>
        <div class="stat-label">Utilisations</div>
      </div>
      <div class="stat-card">
        <div class="stat-value stat-value-brand">{{ fmtAmount(stats()!.totalValueRedeemed) }}</div>
        <div class="stat-label">Valeur encaissée</div>
      </div>
    }
  </div>

  <!-- Filter tabs -->
  <div class="filter-bar">
    <button class="filter-chip" [class.filter-chip-active]="activeFilter() === 'all'" (click)="setFilter('all')">Tous</button>
    <button class="filter-chip" [class.filter-chip-active]="activeFilter() === 'active'" (click)="setFilter('active')">Actifs</button>
    <button class="filter-chip" [class.filter-chip-active]="activeFilter() === 'expired'" (click)="setFilter('expired')">Expirés</button>
  </div>

  <!-- Voucher list -->
  @if (loading()) {
    <div class="voucher-grid">
      @for (i of [1,2,3,4,5,6]; track i) {
        <div class="skeleton" style="height:160px;border-radius:var(--radius-xl)"></div>
      }
    </div>
  } @else if (vouchers().length === 0) {
    <div class="empty-state animate-fade">
      <div class="empty-icon">🎟</div>
      <div class="empty-title">Aucun bon trouvé</div>
      <div class="empty-sub">Créez votre premier bon marketing pour commencer</div>
      <button class="btn btn-primary" style="margin-top:var(--space-4)" (click)="openCreateModal()">+ Créer un bon</button>
    </div>
  } @else {
    <div class="voucher-grid animate-up">
      @for (v of vouchers(); track v.id) {
        <div class="voucher-card" (click)="openDetail(v)" [class.voucher-card-active]="v.status === 'active'">
          <div class="vc-top">
            <span class="event-badge">{{ eventLabel(v.eventType) }}</span>
            <span [class]="statusClass(v.status)">{{ statusLabel(v.status) }}</span>
          </div>
          <div class="vc-label">{{ v.label }}</div>
          <div class="vc-amount">{{ fmtAmount(v.amount) }}</div>
          <div class="vc-meta">
            <span>{{ formatDate(v.validFrom) }} → {{ formatDate(v.validUntil) }}</span>
          </div>
          <div class="vc-footer">
            <span class="usage-pill">
              {{ v.usageCount }} / {{ v.maxUsages ?? '∞' }} utilisation{{ v.usageCount !== 1 ? 's' : '' }}
            </span>
            <div class="vc-actions" (click)="$event.stopPropagation()">
              <button class="btn btn-sm btn-outline" (click)="openEdit(v)">Modifier</button>
              <button class="btn btn-sm btn-danger" (click)="confirmDelete(v)">Supprimer</button>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="btn btn-sm btn-outline" [disabled]="currentPage() === 1" (click)="goToPage(currentPage() - 1)">← Précédent</button>
        <span class="page-info">Page {{ currentPage() }} / {{ totalPages() }}</span>
        <button class="btn btn-sm btn-outline" [disabled]="currentPage() === totalPages()" (click)="goToPage(currentPage() + 1)">Suivant →</button>
      </div>
    }
  }

</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     DETAIL SIDE PANEL
═══════════════════════════════════════════════════════════════════════════ -->
@if (showDetailPanel()) {
  <div class="panel-overlay" (click)="closeDetail()"></div>
  <aside class="detail-panel animate-slide-in">

    <div class="panel-header">
      <div>
        <h2 class="panel-title">{{ selectedVoucher()!.label }}</h2>
        <span [class]="statusClass(selectedVoucher()!.status)">{{ statusLabel(selectedVoucher()!.status) }}</span>
      </div>
      <button class="modal-close" (click)="closeDetail()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <div class="panel-body">

      <!-- QR Code -->
      <div class="qr-section">
        @if (qrDataUrl()) {
          <img [src]="qrDataUrl()!" alt="QR Code" class="qr-img" />
        } @else {
          <div class="skeleton qr-placeholder"></div>
        }
        <button class="btn btn-outline btn-sm" (click)="downloadQr()">⬇ Télécharger QR</button>
      </div>

      <!-- Details -->
      <div class="detail-section">
        <div class="detail-row">
          <span class="detail-key">Événement</span>
          <span class="detail-val">{{ eventLabel(selectedVoucher()!.eventType) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Montant</span>
          <span class="detail-val detail-val-big">{{ fmtAmount(selectedVoucher()!.amount) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Validité</span>
          <span class="detail-val">{{ formatDate(selectedVoucher()!.validFrom) }} → {{ formatDate(selectedVoucher()!.validUntil) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-key">Utilisations</span>
          <span class="detail-val">{{ selectedVoucher()!.usageCount }} / {{ selectedVoucher()!.maxUsages ?? '∞' }}</span>
        </div>
        @if (selectedVoucher()!.notes) {
          <div class="detail-row detail-row-col">
            <span class="detail-key">Notes</span>
            <span class="detail-val">{{ selectedVoucher()!.notes }}</span>
          </div>
        }
      </div>

      <!-- Actions -->
      <div class="panel-actions">
        @if (selectedVoucher()!.status === 'active') {
          <button class="btn btn-primary" style="flex:1" (click)="openRedeem()">Utiliser ce bon</button>
        }
        <button class="btn btn-outline" (click)="openEdit(selectedVoucher()!)">Modifier</button>
        <button class="btn btn-danger" (click)="confirmDelete(selectedVoucher()!)">Supprimer</button>
      </div>

      <!-- Usage history -->
      @if (selectedVoucher()!.usages && selectedVoucher()!.usages!.length > 0) {
        <div class="usage-section">
          <h3 class="usage-title">Historique des utilisations</h3>
          @for (u of selectedVoucher()!.usages!; track u.id) {
            <div class="usage-row">
              <div class="usage-customer">{{ u.customerName }}</div>
              <div class="usage-date">{{ formatDateTime(u.redeemedAt) }}</div>
              <div class="usage-amounts">
                <span class="usage-covered">Bon: {{ fmtAmount(u.voucherAmountUsed) }}</span>
                <span class="usage-total">Total cmd: {{ fmtAmount(u.orderTotal) }}</span>
                @if (u.surplusPaid > 0) {
                  <span class="usage-surplus">Surplus: {{ fmtAmount(u.surplusPaid) }}</span>
                }
              </div>
            </div>
          }
        </div>
      } @else if (selectedVoucher()!.usageCount === 0) {
        <p class="no-usages">Aucune utilisation pour ce bon.</p>
      }

    </div>
  </aside>
}

<!-- ═══════════════════════════════════════════════════════════════════════════
     CREATE / EDIT MODAL
═══════════════════════════════════════════════════════════════════════════ -->
@if (showCreateModal()) {
  <div class="modal-overlay" (click)="closeCreateModal()">
    <div class="modal animate-scale" (click)="$event.stopPropagation()" style="max-width:540px">
      <div class="modal-header">
        <h2 class="modal-title">{{ editingVoucher() ? 'Modifier le bon' : 'Créer un bon marketing' }}</h2>
        <button class="modal-close" (click)="closeCreateModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">

        @if (formError()) {
          <div class="alert alert-error" style="margin-bottom:var(--space-4)">{{ formError() }}</div>
        }

        <div class="form-group">
          <label class="form-label">Libellé <span style="color:var(--error)">*</span></label>
          <input class="form-control" type="text" [(ngModel)]="form.label" placeholder="Ex: Bon anniversaire client VIP" />
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Type d'événement <span style="color:var(--error)">*</span></label>
            <select class="form-control" [(ngModel)]="form.eventType">
              <option value="">-- Choisir --</option>
              <option value="after_work">🍸 After-work</option>
              <option value="birthday">🎂 Anniversaire</option>
              <option value="christmas">🎄 Noël</option>
              <option value="easter">🐣 Pâques</option>
              <option value="new_year">🥂 Nouvel An</option>
              <option value="other">🎟 Autre</option>
            </select>
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Montant (FCFA) <span style="color:var(--error)">*</span></label>
            <input class="form-control" type="number" min="0" [(ngModel)]="form.amount" placeholder="5000" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex:1">
            <label class="form-label">Valide du <span style="color:var(--error)">*</span></label>
            <input class="form-control" type="date" [(ngModel)]="form.validFrom" />
          </div>
          <div class="form-group" style="flex:1">
            <label class="form-label">Valide au <span style="color:var(--error)">*</span></label>
            <input class="form-control" type="date" [(ngModel)]="form.validUntil" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Utilisations max</label>
          <input class="form-control" type="number" min="1" [(ngModel)]="form.maxUsages" placeholder="Laisser vide = illimité" />
          <p class="form-hint">Laisser vide pour des utilisations illimitées</p>
        </div>

        <div class="form-group">
          <label class="form-label">Notes (optionnel)</label>
          <textarea class="form-control" rows="3" [(ngModel)]="form.notes" placeholder="Instructions ou remarques..."></textarea>
        </div>

      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" (click)="closeCreateModal()">Annuler</button>
        <button class="btn btn-primary" [disabled]="saving()" (click)="saveVoucher()">
          {{ saving() ? 'Enregistrement…' : (editingVoucher() ? 'Enregistrer' : 'Créer le bon') }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ═══════════════════════════════════════════════════════════════════════════
     REDEEM MODAL
═══════════════════════════════════════════════════════════════════════════ -->
@if (showRedeemModal() && selectedVoucher()) {
  <div class="modal-overlay" (click)="closeRedeemModal()">
    <div class="modal animate-scale" (click)="$event.stopPropagation()" style="max-width:460px">
      <div class="modal-header">
        <h2 class="modal-title">Utiliser le bon</h2>
        <button class="modal-close" (click)="closeRedeemModal()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">

        @if (redeemError()) {
          <div class="alert alert-error" style="margin-bottom:var(--space-4)">{{ redeemError() }}</div>
        }
        @if (redeemSuccess()) {
          <div class="alert alert-success" style="margin-bottom:var(--space-4)">{{ redeemSuccess() }}</div>
        }

        <div class="redeem-voucher-info">
          <span class="event-badge">{{ eventLabel(selectedVoucher()!.eventType) }}</span>
          <strong>{{ selectedVoucher()!.label }}</strong>
          <span class="detail-val-big" style="margin-left:auto">{{ fmtAmount(selectedVoucher()!.amount) }}</span>
        </div>

        <div class="form-group">
          <label class="form-label">Nom du client <span style="color:var(--error)">*</span></label>
          <input class="form-control" type="text" [(ngModel)]="redeemForm.customerName" placeholder="Prénom Nom" />
        </div>

        <div class="form-group">
          <label class="form-label">Total de la commande (FCFA) <span style="color:var(--error)">*</span></label>
          <input class="form-control" type="number" min="0" [(ngModel)]="redeemForm.orderTotal" placeholder="0" />
        </div>

        <!-- Live calculation -->
        @if (redeemForm.orderTotal > 0) {
          <div class="redeem-calc">
            <div class="calc-row">
              <span class="calc-label">Montant couvert par le bon</span>
              <span class="calc-val calc-val-green">{{ fmtAmount(redeemCovered()) }}</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Surplus à payer par le client</span>
              <span class="calc-val" [class.calc-val-muted]="redeemSurplus() === 0">{{ fmtAmount(redeemSurplus()) }}</span>
            </div>
          </div>
        }

      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" (click)="closeRedeemModal()">Annuler</button>
        <button class="btn btn-primary" [disabled]="redeeming() || !!redeemSuccess()" (click)="submitRedeem()">
          {{ redeeming() ? 'Validation…' : 'Valider l\'utilisation' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ═══════════════════════════════════════════════════════════════════════════
     DELETE CONFIRM MODAL
═══════════════════════════════════════════════════════════════════════════ -->
@if (showDeleteConfirm()) {
  <div class="modal-overlay" (click)="cancelDelete()">
    <div class="modal animate-scale" (click)="$event.stopPropagation()" style="max-width:400px">
      <div class="modal-header">
        <h2 class="modal-title">Supprimer ce bon ?</h2>
        <button class="modal-close" (click)="cancelDelete()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin:0">
          Voulez-vous vraiment supprimer <strong>{{ deletingVoucher()?.label }}</strong> ?
          Cette action est irréversible.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" (click)="cancelDelete()">Annuler</button>
        <button class="btn btn-danger" [disabled]="deleting()" (click)="executeDelete()">
          {{ deleting() ? 'Suppression…' : 'Supprimer' }}
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    /* ── Stats grid ─────────────────────────────────── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    @media (max-width: 900px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
    .stat-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-5);
    }
    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      line-height: 1;
      margin-bottom: var(--space-1);
    }
    .stat-value-green { color: #16a34a; }
    .stat-value-brand { color: var(--brand); }
    .stat-label {
      font-size: .8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* ── Filter bar ──────────────────────────────────── */
    .filter-bar {
      display: flex;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }
    .filter-chip {
      padding: 6px 16px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-size: .875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--t-fast);
    }
    .filter-chip:hover { background: var(--gray-50); color: var(--text-primary); }
    .filter-chip-active {
      background: var(--brand);
      border-color: var(--brand);
      color: white;
    }
    .filter-chip-active:hover { background: var(--brand); opacity: .9; }

    /* ── Voucher grid ────────────────────────────────── */
    .voucher-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: var(--space-4);
    }
    .voucher-card {
      background: var(--surface-1);
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-4) var(--space-5);
      cursor: pointer;
      transition: box-shadow var(--t-fast), border-color var(--t-fast), transform var(--t-fast);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }
    .voucher-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,.08);
      border-color: var(--brand);
      transform: translateY(-1px);
    }
    .voucher-card-active { border-left: 3px solid #16a34a; }
    .vc-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
    }
    .event-badge {
      font-size: .78rem;
      font-weight: 600;
      background: var(--gray-100);
      color: var(--text-secondary);
      padding: 2px 8px;
      border-radius: var(--radius-full);
    }
    .vc-label {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      line-height: 1.3;
    }
    .vc-amount {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--brand);
      line-height: 1;
    }
    .vc-meta {
      font-size: .8rem;
      color: var(--text-muted);
    }
    .vc-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2);
      flex-wrap: wrap;
      margin-top: var(--space-1);
    }
    .usage-pill {
      font-size: .78rem;
      color: var(--text-secondary);
      background: var(--gray-50);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 2px 8px;
    }
    .vc-actions {
      display: flex;
      gap: var(--space-2);
    }

    /* ── Empty state ─────────────────────────────────── */
    .empty-state {
      text-align: center;
      padding: var(--space-16) var(--space-4);
      color: var(--text-muted);
    }
    .empty-icon { font-size: 3rem; margin-bottom: var(--space-3); }
    .empty-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--space-1); }
    .empty-sub { font-size: .875rem; }

    /* ── Pagination ──────────────────────────────────── */
    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-4);
      margin-top: var(--space-6);
    }
    .page-info { font-size: .875rem; color: var(--text-secondary); }

    /* ── Detail panel ────────────────────────────────── */
    .panel-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      z-index: 200;
    }
    .detail-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      max-width: 100vw;
      height: 100vh;
      background: var(--surface-1);
      border-left: 1px solid var(--border);
      z-index: 201;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -8px 0 32px rgba(0,0,0,.1);
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    .animate-slide-in { animation: slideIn .22s ease; }
    .panel-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: var(--space-3);
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .panel-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--text-primary);
      margin: 0 0 var(--space-1);
    }
    .panel-body {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-5) var(--space-6);
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }
    .qr-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-4);
      background: var(--gray-50);
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
    }
    .qr-img {
      width: 220px;
      height: 220px;
      border-radius: var(--radius-lg);
    }
    .qr-placeholder {
      width: 220px;
      height: 220px;
      border-radius: var(--radius-lg);
    }
    .detail-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
    }
    .detail-row {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }
    .detail-row-col { flex-direction: column; align-items: flex-start; }
    .detail-key {
      width: 110px;
      flex-shrink: 0;
      font-size: .8125rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .detail-val {
      font-size: .9rem;
      color: var(--text-primary);
    }
    .detail-val-big {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--brand);
    }
    .panel-actions {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
    }
    .usage-section { display: flex; flex-direction: column; gap: var(--space-3); }
    .usage-title {
      font-size: .9375rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      padding-bottom: var(--space-2);
      border-bottom: 1px solid var(--border);
    }
    .usage-row {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: var(--space-3);
      background: var(--gray-50);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
    }
    .usage-customer { font-weight: 600; font-size: .9rem; color: var(--text-primary); }
    .usage-date { font-size: .78rem; color: var(--text-muted); }
    .usage-amounts { display: flex; gap: var(--space-3); flex-wrap: wrap; margin-top: 2px; }
    .usage-covered { font-size: .8rem; color: #16a34a; font-weight: 600; }
    .usage-total { font-size: .8rem; color: var(--text-secondary); }
    .usage-surplus { font-size: .8rem; color: var(--brand); font-weight: 600; }
    .no-usages { font-size: .875rem; color: var(--text-muted); text-align: center; margin: var(--space-2) 0; }

    /* ── Form helpers ────────────────────────────────── */
    .form-row {
      display: flex;
      gap: var(--space-4);
    }
    @media (max-width: 480px) { .form-row { flex-direction: column; } }

    /* ── Redeem modal ────────────────────────────────── */
    .redeem-voucher-info {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: var(--space-3) var(--space-4);
      background: var(--gray-50);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      margin-bottom: var(--space-4);
      flex-wrap: wrap;
    }
    .redeem-calc {
      background: var(--gray-50);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-3) var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-top: var(--space-2);
    }
    .calc-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3);
    }
    .calc-label { font-size: .875rem; color: var(--text-secondary); }
    .calc-val { font-size: .9375rem; font-weight: 700; color: var(--text-primary); }
    .calc-val-green { color: #16a34a; }
    .calc-val-muted { color: var(--text-muted); }
  `],
})
export class MarketingComponent implements OnInit {
  private readonly svc = inject(MarketingService)

  // ── State ──────────────────────────────────────────────────────────────────
  readonly stats        = signal<MarketingStats | null>(null)
  readonly statsLoading = signal(true)
  readonly vouchers     = signal<MarketingVoucher[]>([])
  readonly loading      = signal(true)
  readonly error        = signal<string | null>(null)

  readonly activeFilter  = signal<'all' | 'active' | 'expired'>('all')
  readonly currentPage   = signal(1)
  readonly totalPages    = signal(1)

  // Detail panel
  readonly showDetailPanel  = signal(false)
  readonly selectedVoucher  = signal<MarketingVoucher | null>(null)
  readonly qrDataUrl        = signal<string | null>(null)

  // Create/edit modal
  readonly showCreateModal = signal(false)
  readonly editingVoucher  = signal<MarketingVoucher | null>(null)
  readonly saving          = signal(false)
  readonly formError       = signal<string | null>(null)

  form: {
    label: string
    eventType: string
    amount: number | null
    validFrom: string
    validUntil: string
    maxUsages: number | null
    notes: string
  } = { label: '', eventType: '', amount: null, validFrom: today(), validUntil: '', maxUsages: null, notes: '' }

  // Redeem modal
  readonly showRedeemModal = signal(false)
  readonly redeeming       = signal(false)
  readonly redeemError     = signal<string | null>(null)
  readonly redeemSuccess   = signal<string | null>(null)

  redeemForm: { customerName: string; orderTotal: number } = { customerName: '', orderTotal: 0 }

  readonly redeemCovered = computed(() => {
    if (!this.selectedVoucher()) return 0
    const amt = this.selectedVoucher()!.amount
    const total = this.redeemForm.orderTotal
    return Math.min(amt, total)
  })

  readonly redeemSurplus = computed(() => {
    if (!this.selectedVoucher()) return 0
    const amt = this.selectedVoucher()!.amount
    const total = this.redeemForm.orderTotal
    return Math.max(0, total - amt)
  })

  // Delete
  readonly showDeleteConfirm = signal(false)
  readonly deletingVoucher   = signal<MarketingVoucher | null>(null)
  readonly deleting          = signal(false)

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadStats()
    this.loadVouchers()
  }

  // ── Data loading ───────────────────────────────────────────────────────────
  private loadStats(): void {
    this.statsLoading.set(true)
    this.svc.getStats().subscribe({
      next: (s) => { this.stats.set(s); this.statsLoading.set(false) },
      error: ()  => { this.statsLoading.set(false) },
    })
  }

  private loadVouchers(): void {
    this.loading.set(true)
    this.error.set(null)
    const params: { page?: number; status?: string } = { page: this.currentPage() }
    if (this.activeFilter() !== 'all') params['status'] = this.activeFilter()
    this.svc.listVouchers(params).subscribe({
      next: (res) => {
        this.vouchers.set(res.data)
        this.totalPages.set(res.meta.lastPage)
        this.loading.set(false)
      },
      error: (e) => {
        this.error.set(e?.error?.message ?? 'Erreur lors du chargement des bons.')
        this.loading.set(false)
      },
    })
  }

  // ── Filters & pagination ───────────────────────────────────────────────────
  setFilter(f: 'all' | 'active' | 'expired'): void {
    this.activeFilter.set(f)
    this.currentPage.set(1)
    this.loadVouchers()
  }

  goToPage(p: number): void {
    this.currentPage.set(p)
    this.loadVouchers()
  }

  // ── Detail panel ───────────────────────────────────────────────────────────
  openDetail(v: MarketingVoucher): void {
    this.qrDataUrl.set(null)
    this.redeemError.set(null)
    this.redeemSuccess.set(null)
    // Load full voucher with usages
    this.svc.getVoucher(v.id).subscribe({
      next: (full) => {
        this.selectedVoucher.set(full)
        this.showDetailPanel.set(true)
        this.generateQrCode(full.qrToken)
      },
      error: () => {
        this.selectedVoucher.set(v)
        this.showDetailPanel.set(true)
        this.generateQrCode(v.qrToken)
      },
    })
  }

  closeDetail(): void {
    this.showDetailPanel.set(false)
    this.selectedVoucher.set(null)
    this.qrDataUrl.set(null)
  }

  async generateQrCode(token: string): Promise<void> {
    try {
      const url = await QRCode.toDataURL('MV:' + token, {
        width: 220,
        margin: 2,
        color: { dark: '#1C1917', light: '#FFFFFF' },
      })
      this.qrDataUrl.set(url)
    } catch {
      this.qrDataUrl.set(null)
    }
  }

  downloadQr(): void {
    const url = this.qrDataUrl()
    if (!url || !this.selectedVoucher()) return
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${this.selectedVoucher()!.qrToken}.png`
    a.click()
  }

  // ── Create / Edit modal ────────────────────────────────────────────────────
  openCreateModal(): void {
    this.editingVoucher.set(null)
    this.formError.set(null)
    this.form = { label: '', eventType: '', amount: null, validFrom: today(), validUntil: '', maxUsages: null, notes: '' }
    this.showCreateModal.set(true)
  }

  openEdit(v: MarketingVoucher): void {
    this.editingVoucher.set(v)
    this.formError.set(null)
    this.form = {
      label:     v.label,
      eventType: v.eventType,
      amount:    v.amount,
      validFrom: v.validFrom,
      validUntil: v.validUntil,
      maxUsages: v.maxUsages,
      notes:     v.notes ?? '',
    }
    this.showCreateModal.set(true)
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false)
    this.editingVoucher.set(null)
    this.formError.set(null)
  }

  saveVoucher(): void {
    if (!this.form.label.trim()) { this.formError.set('Le libellé est requis.'); return }
    if (!this.form.eventType) { this.formError.set('Le type d\'événement est requis.'); return }
    if (!this.form.amount || this.form.amount <= 0) { this.formError.set('Le montant doit être supérieur à 0.'); return }
    if (!this.form.validFrom) { this.formError.set('La date de début est requise.'); return }
    if (!this.form.validUntil) { this.formError.set('La date de fin est requise.'); return }

    this.saving.set(true)
    this.formError.set(null)

    const payload: CreateVoucherPayload = {
      label:      this.form.label.trim(),
      eventType:  this.form.eventType as CreateVoucherPayload['eventType'],
      amount:     this.form.amount,
      validFrom:  this.form.validFrom,
      validUntil: this.form.validUntil,
      maxUsages:  this.form.maxUsages || null,
      notes:      this.form.notes.trim() || null,
    }

    const editing = this.editingVoucher()
    const obs = editing
      ? this.svc.updateVoucher(editing.id, payload)
      : this.svc.createVoucher(payload)

    obs.subscribe({
      next: () => {
        this.saving.set(false)
        this.closeCreateModal()
        this.loadStats()
        this.loadVouchers()
      },
      error: (e) => {
        this.saving.set(false)
        this.formError.set(e?.error?.message ?? 'Une erreur est survenue.')
      },
    })
  }

  // ── Redeem ─────────────────────────────────────────────────────────────────
  openRedeem(): void {
    this.redeemForm = { customerName: '', orderTotal: 0 }
    this.redeemError.set(null)
    this.redeemSuccess.set(null)
    this.showRedeemModal.set(true)
  }

  closeRedeemModal(): void {
    this.showRedeemModal.set(false)
    this.redeemError.set(null)
    this.redeemSuccess.set(null)
  }

  submitRedeem(): void {
    if (!this.redeemForm.customerName.trim()) { this.redeemError.set('Le nom du client est requis.'); return }
    if (!this.redeemForm.orderTotal || this.redeemForm.orderTotal <= 0) { this.redeemError.set('Le total de la commande doit être supérieur à 0.'); return }

    const v = this.selectedVoucher()
    if (!v) return

    this.redeeming.set(true)
    this.redeemError.set(null)

    this.svc.redeemVoucher(v.id, {
      customerName: this.redeemForm.customerName.trim(),
      orderTotal:   this.redeemForm.orderTotal,
    }).subscribe({
      next: (res) => {
        this.redeeming.set(false)
        this.redeemSuccess.set(res.message ?? 'Bon utilisé avec succès.')
        this.loadStats()
        this.loadVouchers()
        // Refresh selected voucher
        setTimeout(() => {
          this.closeRedeemModal()
          if (v) this.openDetail({ ...v })
        }, 1800)
      },
      error: (e) => {
        this.redeeming.set(false)
        this.redeemError.set(e?.error?.message ?? 'Erreur lors de la validation.')
      },
    })
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  confirmDelete(v: MarketingVoucher): void {
    this.deletingVoucher.set(v)
    this.showDeleteConfirm.set(true)
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false)
    this.deletingVoucher.set(null)
  }

  executeDelete(): void {
    const v = this.deletingVoucher()
    if (!v) return
    this.deleting.set(true)
    this.svc.deleteVoucher(v.id).subscribe({
      next: () => {
        this.deleting.set(false)
        this.showDeleteConfirm.set(false)
        this.deletingVoucher.set(null)
        // Close detail panel if it was showing this voucher
        if (this.selectedVoucher()?.id === v.id) this.closeDetail()
        this.loadStats()
        this.loadVouchers()
      },
      error: (e) => {
        this.deleting.set(false)
        this.error.set(e?.error?.message ?? 'Erreur lors de la suppression.')
        this.cancelDelete()
      },
    })
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  eventLabel(type: string): string {
    return EVENT_LABELS[type] ?? '🎟 Autre'
  }

  fmtAmount(n: number): string {
    return fmt(n)
  }

  formatDate(d: string): string {
    if (!d) return ''
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  formatDateTime(d: string): string {
    if (!d) return ''
    return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  statusClass(status: string): string {
    if (status === 'active')     return 'badge badge-success'
    if (status === 'expired')    return 'badge badge-neutral'
    if (status === 'fully_used') return 'badge badge-error'
    return 'badge badge-neutral'
  }

  statusLabel(status: string): string {
    if (status === 'active')     return 'Actif'
    if (status === 'expired')    return 'Expiré'
    if (status === 'fully_used') return 'Épuisé'
    return status
  }
}
