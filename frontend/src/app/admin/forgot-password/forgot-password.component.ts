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
  templateUrl: './forgot-password.component.html',
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
