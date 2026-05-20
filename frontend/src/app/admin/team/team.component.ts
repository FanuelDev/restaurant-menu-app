import { Component, signal, computed, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { TeamService, CreateMemberPayload } from '../../shared/services/team.service'
import { SubscriptionService } from '../../shared/services/subscription.service'
import { PlanLimitBarComponent } from '../../shared/components/plan-limit-bar/plan-limit-bar.component'
import type { TeamMember, ResourceUsage } from '../../shared/models'
import { TranslocoModule } from '@jsverse/transloco'

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PlanLimitBarComponent, TranslocoModule],
  templateUrl: './team.component.html',
  styles: [`
    .usage-section { margin-bottom: var(--space-5); }

    /* Skeleton */
    .members-skeleton { display: flex; flex-direction: column; gap: var(--space-3); }
    .skeleton-row {
      height: 72px; border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--gray-100) 25%, var(--gray-50) 50%, var(--gray-100) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    /* Empty */
    .empty-panel {
      display: flex; flex-direction: column; align-items: center; text-align: center;
      padding: var(--space-20) var(--space-8); gap: var(--space-4);
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      animation: slideUpFade .4s var(--ease-spring) both;
    }
    .empty-icon-wrap {
      width: 64px; height: 64px; border-radius: var(--radius-xl);
      background: var(--gray-100); color: var(--gray-400);
      display: flex; align-items: center; justify-content: center;
    }
    .empty-title { font-size: 1.0625rem; font-weight: 600; color: var(--text-primary); margin: 0; font-family: var(--font-body); }
    .empty-desc  { font-size: .9375rem; color: var(--text-muted); margin: 0; max-width: 280px; line-height: 1.6; }

    /* Members list */
    .members-list { display: flex; flex-direction: column; gap: var(--space-3); }

    .member-card {
      display: flex; align-items: center; gap: var(--space-4);
      background: white; border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: var(--space-4) var(--space-5);
      transition: box-shadow var(--t-fast), border-color var(--t-fast);
      &:hover { box-shadow: var(--shadow-md); border-color: var(--gray-300); }
    }

    .member-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: var(--brand-light); border: 2px solid var(--brand-mid);
      color: var(--brand); font-weight: 700; font-size: .8125rem;
      display: flex; align-items: center; justify-content: center;
    }

    .member-info { flex: 1; min-width: 0; }
    .member-name  { font-weight: 600; color: var(--text-primary); font-size: .9375rem; }
    .member-email { font-size: .8125rem; color: var(--text-muted); margin-top: 1px; }
    .member-phone { font-size: .75rem; color: var(--text-muted); margin-top: 1px; }

    .member-meta { text-align: right; min-width: 130px; flex-shrink: 0; }
    .status-pill {
      display: inline-flex; align-items: center; gap: 5px;
      padding: .25rem .6rem; border-radius: var(--radius-full);
      font-size: .75rem; font-weight: 600;
    }
    .pill-dot { width: 6px; height: 6px; border-radius: 50%; }
    .pill-active  { background: var(--success-bg); color: var(--success); }
    .pill-active .pill-dot  { background: var(--success); }
    .pill-inactive { background: var(--gray-100); color: var(--gray-500); }
    .pill-inactive .pill-dot { background: var(--gray-400); }
    .last-login { font-size: .70rem; color: var(--text-muted); margin-top: var(--space-1); }

    .member-actions { display: flex; gap: var(--space-2); flex-shrink: 0; }
    .action-btn {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      border: 1px solid var(--border); border-radius: var(--radius-md);
      background: white; color: var(--text-muted); cursor: pointer;
      transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }
    .action-btn-danger:hover { background: var(--error-bg) !important; color: var(--error) !important; border-color: var(--error-border) !important; }

    /* Modal extras */
    .req  { color: var(--error); margin-left: 2px; }
    .opt  { color: var(--text-muted); font-size: .75rem; font-weight: 400; margin-left: 4px; }

    .toggle-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4); background: var(--gray-50);
      border: 1px solid var(--border); border-radius: var(--radius-md);
    }
    .toggle-label-text { font-size: .9375rem; font-weight: 500; color: var(--text-primary); }
    .toggle-hint { font-size: .8125rem; color: var(--text-muted); margin-top: 1px; }

    .delete-confirm { display: flex; gap: var(--space-4); align-items: flex-start; }
    .delete-icon {
      width: 44px; height: 44px; border-radius: var(--radius-md); flex-shrink: 0;
      background: var(--error-bg); color: var(--error);
      display: flex; align-items: center; justify-content: center;
    }
    .delete-confirm p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.6; margin: 0; padding-top: 2px; }
  `],
})
export class TeamComponent implements OnInit {
  private readonly teamService = inject(TeamService)
  private readonly subscriptionService = inject(SubscriptionService)

  readonly members = signal<TeamMember[]>([])
  readonly loading = signal(true)
  readonly showModal = signal(false)
  readonly editingMember = signal<TeamMember | null>(null)
  readonly deletingMember = signal<TeamMember | null>(null)
  readonly modalLoading = signal(false)
  readonly modalError = signal<string | null>(null)
  readonly usage = signal<ResourceUsage | null>(null)

  readonly atLimit = computed(() => {
    const u = this.usage()
    return u !== null && u.max !== -1 && u.current >= u.max
  })

  form = { fullName: '', email: '', phone: '', password: '', isActive: true }

  ngOnInit(): void { this.load(); this.loadUsage() }

  private load(): void {
    this.teamService.getMembers().subscribe({
      next: (m) => { this.members.set(m); this.loading.set(false) },
      error: () => this.loading.set(false),
    })
  }

  private loadUsage(): void {
    this.subscriptionService.getUsage().subscribe({
      next: (u) => this.usage.set(u.users),
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

  closeModal(): void { this.showModal.set(false); this.editingMember.set(null) }

  confirmDelete(m: TeamMember): void { this.deletingMember.set(m); this.modalError.set(null) }

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
        error: (err) => { this.modalLoading.set(false); this.modalError.set(err.error?.message ?? 'team.errorUpdate') },
      })
    } else {
      const payload: CreateMemberPayload = {
        fullName: this.form.fullName,
        email: this.form.email,
        password: this.form.password,
        phone: this.form.phone || undefined,
      }
      this.teamService.createMember(payload).subscribe({
        next: (m) => { this.members.update((ms) => [...ms, m]); this.modalLoading.set(false); this.closeModal(); this.loadUsage() },
        error: (err) => {
          this.modalLoading.set(false)
          if (err?.status === 402) {
            this.modalError.set(err.error?.message ?? 'team.limitMessage')
          } else {
            this.modalError.set(err.error?.message ?? 'team.errorCreate')
          }
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
        this.loadUsage()
      },
      error: (err) => { this.modalLoading.set(false); this.modalError.set(err.error?.message ?? 'team.errorDelete') },
    })
  }
}
