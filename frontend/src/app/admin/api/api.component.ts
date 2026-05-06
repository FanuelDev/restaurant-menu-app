import { Component, inject, computed } from '@angular/core'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-api',
  standalone: true,
  imports: [RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('api.title') }}</h1>
          <p class="page-subtitle">{{ t('api.subtitle') }}</p>
        </div>
      </header>

      @if (!hasAccess()) {
        <div class="upgrade-card">
          <div class="upgrade-icon">⚡</div>
          <h2 class="upgrade-title">{{ t('api.enterpriseFeature') }}</h2>
          <p class="upgrade-desc">{{ t('api.enterpriseDescription') }}</p>
          <a routerLink="/admin/subscription" class="btn btn-primary">{{ t('api.upgradeBtn') }}</a>
        </div>
      } @else {
        <div class="api-panel">
          <div class="api-section">
            <h2 class="section-title">{{ t('api.keyTitle') }}</h2>
            <p class="section-desc">{{ t('api.keyDescription') }}</p>
            <div class="api-key-row">
              <code class="api-key">••••••••••••••••••••••••••••••••</code>
              <button class="btn btn-outline" disabled>{{ t('api.reveal') }}</button>
              <button class="btn btn-outline" disabled>{{ t('api.regenerate') }}</button>
            </div>
            <p class="coming-note">🚧 {{ t('api.wip') }}</p>
          </div>
        </div>
      }
    </div>
    </ng-container>
  `,
  styles: [`
    .page-container { max-width: 800px; }

    .upgrade-card {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-12) var(--space-8); text-align: center;
      box-shadow: var(--shadow-xs);
      display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
    }
    .upgrade-icon { font-size: 3rem; line-height: 1; }
    .upgrade-title { font-size: 1.5rem; font-weight: 700; margin: 0; color: var(--text-primary); }
    .upgrade-desc { font-size: .9375rem; color: var(--text-secondary); max-width: 480px; line-height: 1.7; margin: 0; }

    .api-panel {
      background: white; border: 1px solid var(--border); border-radius: var(--radius-xl);
      padding: var(--space-6); box-shadow: var(--shadow-xs);
    }
    .api-section { display: flex; flex-direction: column; gap: var(--space-3); }
    .section-title { font-size: 1.125rem; font-weight: 700; margin: 0; }
    .section-desc { font-size: .9375rem; color: var(--text-secondary); margin: 0; }
    .api-key-row { display: flex; align-items: center; gap: var(--space-3); }
    .api-key {
      flex: 1; background: var(--gray-100); padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md); font-size: .9375rem; color: var(--text-secondary);
      letter-spacing: .08em;
    }
    .coming-note { font-size: .8125rem; color: var(--text-muted); margin: 0; }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: 0.625rem 1.5rem; border-radius: var(--radius-md);
      font-weight: 600; font-size: .9375rem; cursor: pointer;
      border: 1px solid transparent; text-decoration: none; transition: all .2s;
      white-space: nowrap;
    }
    .btn-primary { background: var(--color-brand); color: white; border-color: var(--color-brand); }
    .btn-primary:hover { background: var(--color-brand-dark); }
    .btn-outline { border-color: var(--border); color: var(--text-secondary); background: white; }
    .btn-outline:disabled { opacity: .5; cursor: not-allowed; }
  `],
})
export class ApiComponent {
  private readonly authService = inject(AuthService)

  readonly hasAccess = computed(() => {
    return this.authService.restaurant()?.plan?.slug === 'enterprise'
  })
}
