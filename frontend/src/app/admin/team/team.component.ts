import { Component, signal, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TeamService, CreateMemberPayload } from '../../shared/services/team.service'
import type { TeamMember } from '../../shared/models'

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="team-page">
      <div class="page-header">
        <h1>Équipe</h1>
        <button class="btn-primary" (click)="openCreateModal()">+ Ajouter un caissier</button>
      </div>

      @if (loading()) {
        <div class="loading">Chargement...</div>
      } @else if (members().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Aucun caissier</h3>
          <p>Ajoutez des caissiers pour qu'ils puissent gérer le menu.</p>
          <button class="btn-primary" (click)="openCreateModal()">Ajouter un caissier</button>
        </div>
      } @else {
        <div class="members-list">
          @for (m of members(); track m.id) {
            <div class="member-card">
              <div class="member-avatar">{{ initials(m.fullName) }}</div>
              <div class="member-info">
                <div class="member-name">{{ m.fullName }}</div>
                <div class="member-email">{{ m.email }}</div>
                @if (m.phone) { <div class="member-phone">{{ m.phone }}</div> }
              </div>
              <div class="member-status">
                <span class="badge" [class.badge-active]="m.isActive" [class.badge-inactive]="!m.isActive">
                  {{ m.isActive ? 'Actif' : 'Inactif' }}
                </span>
                @if (m.lastLoginAt) {
                  <div class="last-login">Dernière connexion : {{ m.lastLoginAt | date:'dd/MM/yyyy' }}</div>
                }
              </div>
              <div class="member-actions">
                <button class="btn-icon" title="Modifier" (click)="openEditModal(m)">✏️</button>
                <button class="btn-icon btn-icon-danger" title="Supprimer" (click)="confirmDelete(m)">🗑️</button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create / Edit modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingMember() ? 'Modifier le caissier' : 'Ajouter un caissier' }}</h3>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <div class="modal-body">
              <div class="form-group">
                <label>Nom complet *</label>
                <input [(ngModel)]="form.fullName" type="text" placeholder="Fatou Diallo" />
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input [(ngModel)]="form.email" type="email" placeholder="fatou@restaurant.ci"
                       [disabled]="!!editingMember()" />
              </div>
              <div class="form-group">
                <label>Téléphone</label>
                <input [(ngModel)]="form.phone" type="text" placeholder="+225 07 00 00 00 00" />
              </div>
              @if (!editingMember()) {
                <div class="form-group">
                  <label>Mot de passe *</label>
                  <input [(ngModel)]="form.password" type="password" placeholder="••••••••" />
                </div>
              }
              @if (editingMember()) {
                <div class="form-group">
                  <label class="toggle-label">
                    <input type="checkbox" [(ngModel)]="form.isActive" />
                    Compte actif
                  </label>
                </div>
              }
              @if (modalError()) {
                <div class="error-msg">{{ modalError() }}</div>
              }
            </div>
            <div class="modal-footer">
              <button class="btn-outline" (click)="closeModal()">Annuler</button>
              <button class="btn-primary" (click)="submitModal()" [disabled]="modalLoading()">
                {{ modalLoading() ? 'Enregistrement...' : (editingMember() ? 'Enregistrer' : 'Ajouter') }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete confirmation -->
      @if (deletingMember()) {
        <div class="modal-overlay">
          <div class="modal">
            <div class="modal-header">
              <h3>Supprimer ce caissier ?</h3>
              <button class="close-btn" (click)="deletingMember.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <p>Voulez-vous supprimer <strong>{{ deletingMember()!.fullName }}</strong> ?
                Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
              <button class="btn-outline" (click)="deletingMember.set(null)">Annuler</button>
              <button class="btn-danger" (click)="deleteMember()" [disabled]="modalLoading()">
                {{ modalLoading() ? 'Suppression...' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .team-page { max-width: 820px; }

    .members-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .member-card {
      display: flex; align-items: center; gap: var(--space-4);
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      transition: box-shadow var(--t-fast);
      animation: slideUpFade .4s var(--ease-spring) both;
      &:hover { box-shadow: var(--shadow-md); }
    }

    .member-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: var(--brand-light); border: 2px solid var(--brand-mid);
      color: var(--brand); font-weight: 700; font-size: .875rem;
      display: flex; align-items: center; justify-content: center;
    }

    .member-info { flex: 1; min-width: 0; }
    .member-name  { font-weight: 600; color: var(--text-primary); font-size: .9375rem; }
    .member-email { font-size: .8125rem; color: var(--text-muted); }
    .member-phone { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }

    .member-status { text-align: right; min-width: 120px; }
    .last-login { font-size: .70rem; color: var(--text-muted); margin-top: var(--space-1); }
    .member-actions { display: flex; gap: var(--space-2); }

    .toggle-label { display: flex; align-items: center; gap: var(--space-2); font-size: .9rem; cursor: pointer; }
    .error-msg { background: var(--error-bg); color: var(--error); padding: var(--space-3) var(--space-4); border-radius: var(--radius-md); font-size: .875rem; border: 1px solid var(--error-border); }
  `],
})
export class TeamComponent implements OnInit {
  private readonly teamService = inject(TeamService)

  readonly members = signal<TeamMember[]>([])
  readonly loading = signal(true)
  readonly showModal = signal(false)
  readonly editingMember = signal<TeamMember | null>(null)
  readonly deletingMember = signal<TeamMember | null>(null)
  readonly modalLoading = signal(false)
  readonly modalError = signal<string | null>(null)

  form = { fullName: '', email: '', phone: '', password: '', isActive: true }

  ngOnInit(): void {
    this.load()
  }

  private load(): void {
    this.teamService.getMembers().subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  initials(name: string): string {
    return name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  }

  openCreateModal(): void {
    this.editingMember.set(null)
    this.form = { fullName: '', email: '', phone: '', password: '', isActive: true }
    this.modalError.set(null)
    this.showModal.set(true)
  }

  openEditModal(m: TeamMember): void {
    this.editingMember.set(m)
    this.form = { fullName: m.fullName, email: m.email, phone: m.phone ?? '', password: '', isActive: m.isActive }
    this.modalError.set(null)
    this.showModal.set(true)
  }

  closeModal(): void {
    this.showModal.set(false)
    this.editingMember.set(null)
  }

  confirmDelete(m: TeamMember): void {
    this.deletingMember.set(m)
  }

  submitModal(): void {
    this.modalLoading.set(true)
    this.modalError.set(null)

    const editing = this.editingMember()

    if (editing) {
      this.teamService.updateMember(editing.id, {
        fullName: this.form.fullName,
        phone: this.form.phone || undefined,
        isActive: this.form.isActive,
      }).subscribe({
        next: (updated) => {
          this.members.update((ms) => ms.map((m) => m.id === updated.id ? updated : m))
          this.modalLoading.set(false)
          this.closeModal()
        },
        error: (err) => {
          this.modalLoading.set(false)
          this.modalError.set(err.error?.message ?? 'Erreur lors de la mise à jour.')
        },
      })
    } else {
      const payload: CreateMemberPayload = {
        fullName: this.form.fullName,
        email: this.form.email,
        password: this.form.password,
        phone: this.form.phone || undefined,
      }
      this.teamService.createMember(payload).subscribe({
        next: (m) => {
          this.members.update((ms) => [...ms, m])
          this.modalLoading.set(false)
          this.closeModal()
        },
        error: (err) => {
          this.modalLoading.set(false)
          this.modalError.set(err.error?.message ?? 'Erreur lors de la création.')
        },
      })
    }
  }

  deleteMember(): void {
    const m = this.deletingMember()
    if (!m) return
    this.modalLoading.set(true)
    this.teamService.deleteMember(m.id).subscribe({
      next: () => {
        this.members.update((ms) => ms.filter((x) => x.id !== m.id))
        this.modalLoading.set(false)
        this.deletingMember.set(null)
      },
      error: (err) => {
        this.modalLoading.set(false)
        this.modalError.set(err.error?.message ?? 'Erreur lors de la suppression.')
      },
    })
  }
}
