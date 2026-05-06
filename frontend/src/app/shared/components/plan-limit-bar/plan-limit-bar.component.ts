import { Component, computed, input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'

@Component({
  selector: 'app-plan-limit-bar',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="usage-block">
      <div class="usage-header">
        <span class="usage-label">{{ label() }}</span>
        @if (max() === -1) {
          <span class="usage-badge badge-ok">{{ t('common.unlimited') }}</span>
        } @else {
          <span class="usage-badge" [class.badge-ok]="pct() < 80" [class.badge-warn]="pct() >= 80 && !atLimit()" [class.badge-danger]="atLimit()">
            {{ current() }}&thinsp;/&thinsp;{{ max() }}
          </span>
        }
      </div>

      @if (max() > -1) {
        <div class="usage-track" [attr.aria-label]="current() + ' / ' + max()">
          <div
            class="usage-fill"
            [class.fill-ok]="pct() < 80"
            [class.fill-warn]="pct() >= 80 && !atLimit()"
            [class.fill-danger]="atLimit()"
            [style.width.%]="pct()"
          ></div>
        </div>

        @if (atLimit()) {
          <p class="usage-msg msg-danger">
            {{ t('planLimit.atLimit') }}
            <a routerLink="/admin/subscription" class="upgrade-link">{{ t('planLimit.upgrade') }} →</a>
          </p>
        } @else if (nearLimit()) {
          <p class="usage-msg msg-warn">{{ t('planLimit.nearLimit') }}</p>
        }
      }
    </div>
    </ng-container>
  `,
  styles: [`
    .usage-block { display: flex; flex-direction: column; gap: 6px; }

    .usage-header { display: flex; justify-content: space-between; align-items: center; }
    .usage-label  { font-size: .8125rem; font-weight: 500; color: var(--text-secondary); }

    .usage-badge {
      font-size: .75rem; font-weight: 600; padding: .15rem .5rem;
      border-radius: var(--radius-full); white-space: nowrap;
    }
    .badge-ok     { background: var(--success-bg); color: var(--success); }
    .badge-warn   { background: #fff7ed; color: #c2410c; }
    .badge-danger { background: var(--error-bg); color: var(--error); }

    .usage-track {
      height: 6px; border-radius: 99px;
      background: var(--gray-100); overflow: hidden;
    }
    .usage-fill {
      height: 100%; border-radius: 99px;
      transition: width .4s ease, background-color .3s;
    }
    .fill-ok     { background: var(--success); }
    .fill-warn   { background: #f97316; }
    .fill-danger { background: var(--error); }

    .usage-msg {
      font-size: .75rem; margin: 0; line-height: 1.4;
    }
    .msg-warn   { color: #c2410c; }
    .msg-danger { color: var(--error); }

    .upgrade-link {
      color: var(--error); font-weight: 600; text-decoration: underline;
      text-underline-offset: 2px;
      &:hover { opacity: .8; }
    }
  `],
})
export class PlanLimitBarComponent {
  readonly label   = input('')
  readonly current = input(0)
  readonly max     = input(-1)

  readonly pct      = computed(() => this.max() <= 0 ? 0 : Math.min(100, Math.round((this.current() / this.max()) * 100)))
  readonly atLimit  = computed(() => this.max() > 0 && this.current() >= this.max())
  readonly nearLimit = computed(() => this.max() > 0 && this.pct() >= 80 && !this.atLimit())
}
