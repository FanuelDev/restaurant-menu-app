import { Component, signal, inject, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink, ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'
import { TranslocoModule } from '@jsverse/transloco'

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoModule],
  templateUrl: './reset-password.component.html',
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
    .av-title    { font-family: var(--font-display); font-size: 2.2rem; color: white; margin: 0 0 var(--space-2); }
    .av-subtitle { color: rgba(255,255,255,.65); font-size: 1rem; margin: 0 0 var(--space-10); }

    .av-tips { display: flex; flex-direction: column; gap: var(--space-3); text-align: left; }
    .av-tip  { display: flex; align-items: center; gap: var(--space-2); font-size: .875rem; color: rgba(255,255,255,.75); }

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
    .af-sub   { color: var(--text-muted); margin: 0 0 var(--space-6); font-size: .9375rem; line-height: 1.6; }

    .pw-wrap { position: relative; }
    .pw-wrap .form-control { padding-right: 2.75rem; }
    .pw-toggle {
      position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: var(--space-1);
      color: var(--text-muted); display: flex; align-items: center;
      transition: color var(--t-fast);
      &:hover { color: var(--text-primary); }
    }

    .pw-strength { height: 3px; background: var(--gray-100); border-radius: 2px; margin-top: var(--space-2); overflow: hidden; }
    .pw-strength-bar { height: 100%; border-radius: 2px; transition: width .4s var(--ease-spring), background .4s; width: 0; }
    .pw-strength-bar.weak   { width: 33%; background: var(--error); }
    .pw-strength-bar.medium { width: 66%; background: var(--warning); }
    .pw-strength-bar.strong { width: 100%; background: var(--success); }

    .token-error, .success-state { display: flex; flex-direction: column; align-items: center; text-align: center; padding: var(--space-4) 0; }
    .te-icon, .success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; margin-bottom: var(--space-5);
    }
    .te-icon     { background: var(--error-bg);   color: var(--error); }
    .success-icon { background: var(--success-bg); color: var(--success); }
    .te-title, .success-title { font-size: 1.375rem; font-weight: 700; color: var(--text-primary); margin: 0 0 var(--space-3); }
    .te-msg, .success-msg { color: var(--text-secondary); font-size: .9375rem; line-height: 1.65; margin: 0 0 var(--space-6); }
  `],
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb          = inject(FormBuilder)
  private readonly authService = inject(AuthService)
  private readonly router      = inject(Router)
  private readonly route       = inject(ActivatedRoute)

  readonly loading       = signal(false)
  readonly apiError      = signal<string | null>(null)
  readonly success       = signal(false)
  readonly invalidToken  = signal(false)
  readonly showPw        = signal(false)
  readonly showPwConfirm = signal(false)

  private token = ''

  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirm:  ['', [Validators.required]],
  })

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] ?? ''
    if (!this.token) this.invalidToken.set(true)
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field)
    return !!(ctrl?.invalid && ctrl.touched)
  }

  mismatch(): boolean {
    const { password, confirm } = this.form.value
    return !!(password && confirm && password !== confirm && this.form.get('confirm')?.touched)
  }

  pwStrengthClass(): string {
    const pw = this.form.value.password ?? ''
    if (pw.length === 0) return ''
    if (pw.length < 8) return 'weak'
    const hasUpper   = /[A-Z]/.test(pw)
    const hasDigit   = /\d/.test(pw)
    const hasSpecial = /[^A-Za-z0-9]/.test(pw)
    const score = [hasUpper, hasDigit, hasSpecial].filter(Boolean).length
    return score >= 2 ? 'strong' : 'medium'
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    const { password, confirm } = this.form.value as { password: string; confirm: string }
    if (password !== confirm) return

    this.loading.set(true)
    this.apiError.set(null)

    this.authService.resetPassword(this.token, password).subscribe({
      next: () => { this.loading.set(false); this.success.set(true) },
      error: (err) => {
        this.loading.set(false)
        if (err.status === 400) {
          this.invalidToken.set(true)
        } else {
          this.apiError.set(err.error?.message ?? 'common.error')
        }
      },
    })
  }
}
