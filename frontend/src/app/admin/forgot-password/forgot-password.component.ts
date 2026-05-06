import { Component, signal, inject } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'
import { TranslocoModule } from '@jsverse/transloco'

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="auth-page">

      <div class="auth-visual" aria-hidden="true">
        <div class="auth-visual-inner">
          <div class="av-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h2 class="av-title">{{ t('auth.forgotPassword.title') }}</h2>
          <p class="av-subtitle">{{ t('auth.forgotPassword.subtitle') }}</p>

          <div class="av-steps">
            <div class="av-step" [class.av-step-done]="sent()">
              <div class="av-step-icon">
                @if (sent()) {
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                } @else { 1 }
              </div>
              <span>{{ t('auth.forgotPassword.step1') }}</span>
            </div>
            <div class="av-step-line" [class.done]="sent()"></div>
            <div class="av-step" [class.av-step-done]="false">
              <div class="av-step-icon">2</div>
              <span>{{ t('auth.forgotPassword.step2') }}</span>
            </div>
            <div class="av-step-line"></div>
            <div class="av-step">
              <div class="av-step-icon">3</div>
              <span>{{ t('auth.forgotPassword.step3') }}</span>
            </div>
          </div>
        </div>

        <div class="av-blob av-blob-1"></div>
        <div class="av-blob av-blob-2"></div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-wrap animate-right">

          <a routerLink="/login" class="back-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            {{ t('auth.forgotPassword.backToLogin') }}
          </a>

          @if (!sent()) {
            <h1 class="af-title">{{ t('auth.forgotPassword.title') }}</h1>
            <p class="af-sub">{{ t('auth.forgotPassword.subtitle') }}</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <div class="form-group">
                <label class="form-label" for="email">{{ t('auth.forgotPassword.email') }}</label>
                <input
                  id="email" type="email" class="form-control"
                  formControlName="email" autocomplete="email"
                  [placeholder]="t('auth.forgotPassword.emailPlaceholder')"
                  [class.is-invalid]="isInvalid('email')"
                />
                @if (isInvalid('email')) {
                  <span class="form-error" role="alert">{{ t('auth.forgotPassword.emailInvalid') }}</span>
                }
              </div>

              @if (apiError()) {
                <div class="alert alert-error" role="alert" style="margin-bottom: var(--space-4)">{{ apiError() }}</div>
              }

              <button type="submit" class="btn btn-primary btn-full btn-lg" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span> {{ t('auth.forgotPassword.submitting') }} }
                @else { {{ t('auth.forgotPassword.submit') }} }
              </button>
            </form>
          } @else {
            <div class="success-state animate-up">
              <div class="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h2 class="success-title">{{ t('auth.forgotPassword.successTitle') }}</h2>
              <p class="success-msg">
                {{ t('auth.forgotPassword.successMessage', { email: form.value.email }) }}
              </p>
              <p class="success-hint">{{ t('auth.forgotPassword.checkSpam') }}</p>
              <button class="btn btn-outline btn-full" (click)="reset()">{{ t('auth.forgotPassword.tryAgain') }}</button>
            </div>
          }

        </div>
      </div>
    </div>
    </ng-container>
  `,
  styles: [`
    .auth-page { display: flex; min-height: 100vh; }

    .auth-visual {
      flex: 1; position: relative; overflow: hidden;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-12) var(--space-8);
      animation: slideLeftFade .65s var(--ease-spring) both;
    }
    @media (max-width: 820px) { .auth-visual { display: none; } }
    .auth-visual::before {
      content: ''; position: absolute; inset: 0;
      background: linear-gradient(145deg, #B03020 0%, #7A1A10 55%, #4A0A06 100%);
    }

    .auth-visual-inner { position: relative; z-index: 2; text-align: center; color: white; max-width: 380px; }

    .av-icon-wrap {
      width: 72px; height: 72px; background: rgba(255,255,255,.15);
      border-radius: var(--radius-xl); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto var(--space-6);
    }
    .av-title    { font-family: var(--font-display); font-size: 2.4rem; color: white; margin: 0 0 var(--space-2); }
    .av-subtitle { color: rgba(255,255,255,.65); font-size: 1rem; margin: 0 0 var(--space-10); }

    .av-steps { display: flex; flex-direction: column; gap: 0; text-align: left; }
    .av-step {
      display: flex; align-items: center; gap: var(--space-3);
      font-size: .875rem; color: rgba(255,255,255,.65);
    }
    .av-step-done { color: rgba(255,255,255,.95); }
    .av-step-icon {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.3);
      display: flex; align-items: center; justify-content: center;
      font-size: .75rem; font-weight: 700; flex-shrink: 0;
    }
    .av-step-done .av-step-icon { background: rgba(255,255,255,.25); border-color: rgba(255,255,255,.6); }
    .av-step-line { width: 1.5px; height: 20px; background: rgba(255,255,255,.2); margin-left: 13px; }
    .av-step-line.done { background: rgba(255,255,255,.5); }

    .av-blob { position: absolute; border-radius: 50%; filter: blur(70px); opacity: .2; pointer-events: none; }
    .av-blob-1 { width: 240px; height: 240px; background: #FF8A65; top: -40px; right: -60px; animation: float 7s ease-in-out infinite; }
    .av-blob-2 { width: 180px; height: 180px; background: #FFB74D; bottom: -40px; left: -30px; animation: float 9s ease-in-out infinite reverse; }

    .auth-form-panel {
      width: 500px; min-width: 500px;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-10) var(--space-12); background: white;
    }
    @media (max-width: 820px) { .auth-form-panel { width: 100%; min-width: 0; padding: var(--space-8) var(--space-5); } }

    .auth-form-wrap { width: 100%; max-width: 360px; }

    .back-btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      color: var(--text-muted); font-size: .875rem; text-decoration: none;
      margin-bottom: var(--space-6); transition: color var(--t-fast);
      &:hover { color: var(--text-primary); }
    }

    .af-title { font-family: var(--font-display); font-size: 2rem; color: var(--text-primary); margin: 0 0 var(--space-2); line-height: 1.15; }
    .af-sub   { color: var(--text-muted); margin: 0 0 var(--space-7); font-size: .9375rem; line-height: 1.6; }

    .success-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-4) 0; }
    .success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: var(--success-bg); color: var(--success);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-5);
    }
    .success-title { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-3); }
    .success-msg   { color: var(--text-secondary); font-size: .9375rem; line-height: 1.65; margin: 0 0 var(--space-2); }
    .success-hint  { font-size: .8125rem; color: var(--text-muted); margin: 0 0 var(--space-6); }
  `],
})
export class ForgotPasswordComponent {
  private readonly fb          = inject(FormBuilder)
  private readonly authService = inject(AuthService)

  readonly loading  = signal(false)
  readonly apiError = signal<string | null>(null)
  readonly sent     = signal(false)

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  })

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field)
    return !!(ctrl?.invalid && ctrl.touched)
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.loading.set(true)
    this.apiError.set(null)
    const { email } = this.form.value as { email: string }
    this.authService.forgotPassword(email).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true) },
      error: () => { this.loading.set(false); this.sent.set(true) }, // Always show success
    })
  }

  reset(): void {
    this.sent.set(false)
    this.form.reset()
  }
}
