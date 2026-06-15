import { Component, signal, inject, OnInit, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { SuperAdminService } from '../../shared/services/super-admin.service'
import type { GdprDeletionRequest } from '../../shared/models'

@Component({
  selector: 'app-sa-gdpr',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [`
    .sa-gdpr { max-width: 1000px; }

    .page-header { margin-bottom: var(--space-6); }
    .page-title  { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
    .page-sub    { color: var(--text-muted); font-size: .9rem; margin: 0; }

    .toolbar { display: flex; gap: var(--space-3); margin-bottom: var(--space-5); align-items: center; }

    .filter-wrap { position: relative; }
    .filter-select {
      appearance: none; padding: 9px 32px 9px 12px;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      font-size: .875rem; color: var(--text-primary); background: var(--surface-1);
      cursor: pointer; min-width: 160px;
      &:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px rgba(176,48,32,.1); }
    }
    .select-chevron { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }

    .count-badge {
      margin-left: auto; background: var(--surface-2); border: 1px solid var(--border);
      border-radius: 20px; padding: 4px 12px; font-size: .8rem; color: var(--text-muted);
    }

    /* Skeleton */
    .skeleton-wrap { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; }
    .skeleton-row  {
      height: 60px; border-bottom: 1px solid var(--border);
      background: linear-gradient(90deg, var(--gray-50) 25%, var(--gray-100) 50%, var(--gray-50) 75%);
      background-size: 200% 100%; animation: shimmer 1.4s ease-in-out infinite;
      &:last-child { border-bottom: none; }
    }
    @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

    /* Table */
    .table-wrap { background: var(--surface-1); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow-x: auto; animation: slideUpFade .4s var(--ease-spring) both; }
    @keyframes slideUpFade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    table { width: 100%; border-collapse: collapse; font-size: .875rem; }
    th {
      text-align: left; padding: 11px 16px; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted);
      background: var(--surface-2); border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }
    td { padding: 14px 16px; border-bottom: 1px solid var(--border); vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: var(--surface-2); }

    .email-cell { font-weight: 600; color: var(--text-primary); font-family: monospace; font-size: .82rem; }
    .ip-cell    { color: var(--text-muted); font-family: monospace; font-size: .8rem; }
    .date-cell  { color: var(--text-muted); font-size: .8rem; white-space: nowrap; }
    .notes-cell { color: var(--text-secondary); font-size: .8rem; max-width: 220px;
                  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Status badges */
    .badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px;
             border-radius: 20px; font-size: .75rem; font-weight: 700; white-space: nowrap; }
    .badge-pending   { background: #fef3c7; color: #92400e; }
    .badge-processed { background: #dcfce7; color: #166534; }
    .badge-rejected  { background: #fee2e2; color: #991b1b; }

    /* Actions */
    .action-btn {
      padding: 5px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border);
      font-size: .78rem; font-weight: 600; cursor: pointer; background: var(--surface-1);
      color: var(--text-secondary); transition: all var(--t-fast);
      &:hover { border-color: var(--brand); color: var(--brand); }
      &:disabled { opacity: .4; cursor: not-allowed; }
    }

    /* Notes inline editor */
    .notes-editor {
      width: 100%; padding: 7px 10px; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: .8rem; color: var(--text-primary); background: var(--surface-1); resize: vertical;
      min-height: 56px;
      &:focus { outline: none; border-color: var(--brand); }
    }
    .notes-save-btn {
      margin-top: 6px; padding: 5px 14px; background: var(--brand); color: white;
      border: none; border-radius: var(--radius-sm); font-size: .78rem; font-weight: 700;
      cursor: pointer; opacity: .9;
      &:hover { opacity: 1; }
    }

    /* Empty */
    .empty { padding: 56px; text-align: center; color: var(--text-muted); font-size: .9rem; }
    .empty svg { display: block; margin: 0 auto 12px; opacity: .3; }

    /* Pagination */
    .pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4) 0; }
    .page-btn {
      padding: 6px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm);
      font-size: .8rem; cursor: pointer; background: var(--surface-1); color: var(--text-primary);
      &:hover:not(:disabled) { border-color: var(--brand); color: var(--brand); }
      &:disabled { opacity: .4; cursor: not-allowed; }
      &.active { background: var(--brand); color: white; border-color: var(--brand); }
    }

    /* Expand row */
    .expand-row td { background: var(--surface-2); padding: 16px; }
    .expand-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .expand-label { font-size: .75rem; font-weight: 700; text-transform: uppercase;
                    letter-spacing: .05em; color: var(--text-muted); margin-bottom: 6px; }
    .expand-val { font-size: .85rem; color: var(--text-primary); }
  `],
  template: `
<div class="sa-gdpr">

  <!-- En-tête -->
  <div class="page-header">
    <h1 class="page-title">Demandes RGPD</h1>
    <p class="page-sub">Historique des demandes de suppression de données personnelles</p>
  </div>

  <!-- Barre de filtre -->
  <div class="toolbar">
    <div class="filter-wrap">
      <select class="filter-select" [(ngModel)]="statusFilter" (change)="onFilterChange()">
        <option value="">Tous les statuts</option>
        <option value="pending">En attente</option>
        <option value="processed">Traités</option>
        <option value="rejected">Rejetés</option>
      </select>
      <svg class="select-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M3 5l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <span class="count-badge">{{ meta()?.total ?? 0 }} demande(s)</span>
  </div>

  <!-- Skeleton -->
  @if (loading()) {
    <div class="skeleton-wrap">
      @for (_ of [1,2,3,4,5]; track $index) {
        <div class="skeleton-row"></div>
      }
    </div>
  }

  <!-- Table -->
  @if (!loading() && requests().length > 0) {
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Statut</th>
            <th>Date</th>
            <th>IP</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (req of requests(); track req.id) {
            <tr>
              <td class="email-cell">{{ req.email }}</td>
              <td><span [class]="'badge badge-' + req.status">{{ statusLabel(req.status) }}</span></td>
              <td class="date-cell">{{ formatDate(req.createdAt) }}</td>
              <td class="ip-cell">{{ req.ipAddress ?? '—' }}</td>
              <td class="notes-cell" [title]="req.adminNotes ?? ''">{{ req.adminNotes ?? '—' }}</td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="action-btn" (click)="toggleExpand(req.id)">
                    {{ expandedId() === req.id ? 'Fermer' : 'Détails' }}
                  </button>
                  @if (req.status !== 'processed') {
                    <button class="action-btn" [disabled]="saving() === req.id"
                      (click)="updateStatus(req, 'processed')">
                      ✓ Traité
                    </button>
                  }
                  @if (req.status !== 'rejected') {
                    <button class="action-btn" [disabled]="saving() === req.id"
                      (click)="updateStatus(req, 'rejected')">
                      ✕ Rejeter
                    </button>
                  }
                  @if (req.status !== 'pending') {
                    <button class="action-btn" [disabled]="saving() === req.id"
                      (click)="updateStatus(req, 'pending')">
                      Rouvrir
                    </button>
                  }
                </div>
              </td>
            </tr>

            <!-- Ligne d'expansion -->
            @if (expandedId() === req.id) {
              <tr class="expand-row">
                <td colspan="6">
                  <div class="expand-grid">
                    <div>
                      <div class="expand-label">Email complet</div>
                      <div class="expand-val" style="font-family:monospace">{{ req.email }}</div>
                      @if (req.processedAt) {
                        <div class="expand-label" style="margin-top:12px">Traité le</div>
                        <div class="expand-val">{{ formatDate(req.processedAt) }}</div>
                      }
                      @if (req.processedBy) {
                        <div class="expand-label" style="margin-top:12px">Traité par</div>
                        <div class="expand-val">{{ req.processedBy.fullName }}</div>
                      }
                    </div>
                    <div>
                      <div class="expand-label">Notes admin</div>
                      <textarea class="notes-editor"
                        [(ngModel)]="editNotes"
                        placeholder="Ajouter une note…"
                        rows="3"></textarea>
                      <button class="notes-save-btn" [disabled]="saving() === req.id"
                        (click)="saveNotes(req)">
                        Sauvegarder la note
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    @if (meta() && meta()!.lastPage > 1) {
      <div class="pagination">
        <button class="page-btn" [disabled]="page() === 1" (click)="goPage(page() - 1)">← Préc.</button>
        @for (p of pages(); track p) {
          <button class="page-btn" [class.active]="p === page()" (click)="goPage(p)">{{ p }}</button>
        }
        <button class="page-btn" [disabled]="page() === meta()!.lastPage" (click)="goPage(page() + 1)">Suiv. →</button>
      </div>
    }
  }

  <!-- Vide -->
  @if (!loading() && requests().length === 0) {
    <div class="empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Aucune demande de suppression trouvée
    </div>
  }

</div>
  `,
})
export class SaGdprComponent implements OnInit {
  private readonly saService = inject(SuperAdminService)

  readonly loading   = signal(true)
  readonly requests  = signal<GdprDeletionRequest[]>([])
  readonly meta      = signal<any>(null)
  readonly page      = signal(1)
  readonly saving    = signal<number | null>(null)
  readonly expandedId = signal<number | null>(null)

  statusFilter = ''
  editNotes    = ''

  readonly pages = computed(() => {
    const last = this.meta()?.lastPage ?? 1
    return Array.from({ length: Math.min(last, 7) }, (_, i) => i + 1)
  })

  ngOnInit() { this.load() }

  load() {
    this.loading.set(true)
    this.saService.getGdprRequests({ page: this.page(), status: this.statusFilter || undefined })
      .subscribe({
        next: ({ data, meta }) => { this.requests.set(data); this.meta.set(meta); this.loading.set(false) },
        error: () => this.loading.set(false),
      })
  }

  onFilterChange() { this.page.set(1); this.load() }
  goPage(p: number) { this.page.set(p); this.load() }

  toggleExpand(id: number) {
    if (this.expandedId() === id) {
      this.expandedId.set(null)
    } else {
      const req = this.requests().find(r => r.id === id)
      this.editNotes = req?.adminNotes ?? ''
      this.expandedId.set(id)
    }
  }

  updateStatus(req: GdprDeletionRequest, status: 'pending' | 'processed' | 'rejected') {
    this.saving.set(req.id)
    this.saService.updateGdprRequest(req.id, { status }).subscribe({
      next: (updated) => {
        this.requests.update(list => list.map(r => r.id === updated.id ? updated : r))
        this.saving.set(null)
      },
      error: () => this.saving.set(null),
    })
  }

  saveNotes(req: GdprDeletionRequest) {
    this.saving.set(req.id)
    this.saService.updateGdprRequest(req.id, { status: req.status, adminNotes: this.editNotes }).subscribe({
      next: (updated) => {
        this.requests.update(list => list.map(r => r.id === updated.id ? updated : r))
        this.saving.set(null)
      },
      error: () => this.saving.set(null),
    })
  }

  statusLabel(s: string) {
    return s === 'pending' ? 'En attente' : s === 'processed' ? 'Traité' : 'Rejeté'
  }

  formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
}
