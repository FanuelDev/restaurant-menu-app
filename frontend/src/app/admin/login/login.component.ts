import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, TranslocoModule],
  templateUrl: './login.component.html',
  styles: [`
    /* ── Page wrapper ─────────────────────────── */
    .auth-page {
      display: flex;
      min-height: 100vh;
    }

    /* ── Visual panel (gauche) ─────────────────── */
    .auth-visual {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-12) var(--space-8);
      animation: slideLeftFade .65s var(--ease-spring) both;
    }
    @media (max-width: 820px) { .auth-visual { display: none; } }

    .auth-visual::before {
      content: '';
      position: absolute; inset: 0;
      background: linear-gradient(145deg, #B03020 0%, #7A1A10 55%, #4A0A06 100%);
    }

    .auth-visual-inner {
      position: relative;
      z-index: 2;
      text-align: center;
      color: white;
      max-width: 400px;
    }

    /* Rings animées */
    .av-rings {
      position: relative;
      width: 100px; height: 100px;
      margin: 0 auto var(--space-8);
      display: flex; align-items: center; justify-content: center;
    }
    .av-ring {
      position: absolute; border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.22);
    }
    .av-ring-1 { width:  90px; height:  90px; animation: float 3.0s ease-in-out infinite; }
    .av-ring-2 { width: 120px; height: 120px; animation: float 3.8s ease-in-out infinite .6s; opacity: .7; }
    .av-ring-3 { width: 152px; height: 152px; animation: float 5.0s ease-in-out infinite 1.2s; opacity: .4; }

    .av-icon-wrap {
      position: relative; z-index: 1;
      width: 58px; height: 58px; background: rgba(255,255,255,.15);
      border-radius: var(--radius-lg); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
    }
    .av-icon { width: 30px; height: 30px; }

    .av-title {
      font-family: var(--font-display);
      font-size: 2.6rem; color: white; margin: 0 0 var(--space-2);
    }
    .av-subtitle { color: rgba(255,255,255,.65); font-size: 1rem; margin: 0 0 var(--space-10); }

    /* Testimonial */
    .av-testimonial {
      background: rgba(255,255,255,.10);
      border: 1px solid rgba(255,255,255,.18);
      border-radius: var(--radius-xl);
      padding: var(--space-5) var(--space-6);
      text-align: left;
      margin-bottom: var(--space-8);
      backdrop-filter: blur(6px);
    }
    .av-quote { color: rgba(255,255,255,.88); font-size: .9375rem; line-height: 1.65; font-style: italic; margin: 0 0 var(--space-4); }
    .av-author { display: flex; align-items: center; gap: var(--space-3); }
    .av-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.25); color: white; font-weight: 600; font-size: .9rem;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .av-author-name { font-size: .875rem; font-weight: 600; color: white; }
    .av-author-role { font-size: .75rem; color: rgba(255,255,255,.55); }

    /* Stats row */
    .av-stats {
      display: flex; align-items: center; justify-content: center; gap: var(--space-5);
    }
    .av-stat { text-align: center; }
    .av-stat-val   { display: block; font-size: 1.125rem; font-weight: 700; color: white; line-height: 1.2; }
    .av-stat-label { display: block; font-size: .75rem; color: rgba(255,255,255,.5); margin-top: 2px; }
    .av-stat-divider { width: 1px; height: 32px; background: rgba(255,255,255,.2); }

    /* Blobs décoratifs */
    .av-blob {
      position: absolute; border-radius: 50%; filter: blur(70px);
      opacity: .2; pointer-events: none;
    }
    .av-blob-1 { width:280px; height:280px; background:#FF8A65; top:-60px;  right:-80px; animation:float 7s ease-in-out infinite; }
    .av-blob-2 { width:200px; height:200px; background:#FFB74D; bottom:-60px; left:-40px; animation:float 9s ease-in-out infinite reverse; }
    .av-blob-3 { width:160px; height:160px; background:#FF6F60; bottom:40%;  right:10%;  animation:float 11s ease-in-out infinite .5s; }

    /* ── Form panel (droite) ───────────────────── */
    .auth-form-panel {
      width: 500px; min-width: 500px;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-10) var(--space-12);
      background: white;
    }
    @media (max-width: 820px) {
      .auth-form-panel { width: 100%; min-width: 0; padding: var(--space-8) var(--space-5); }
    }

    .auth-form-wrap { width: 100%; max-width: 360px; }

    .af-logo {
      width: 46px; height: 46px;
      background: var(--brand);
      border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-8);
      box-shadow: var(--shadow-brand);
    }

    .af-title {
      font-family: var(--font-display);
      font-size: 2.125rem; color: var(--text-primary);
      margin: 0 0 var(--space-2); line-height: 1.15;
    }

    .af-sub {
      color: var(--text-muted);
      margin: 0 0 var(--space-8);
      font-size: .9375rem;
    }

    .af-footer {
      text-align: center; margin-top: var(--space-8);
      font-size: .875rem; color: var(--text-muted);
      a { color: var(--brand); font-weight: 500; text-decoration: none; }
      a:hover { text-decoration: underline; }
    }

    .pw-label-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2); }
    .pw-label-row .form-label { margin-bottom: 0; }
    .forgot-link { font-size: .8125rem; color: var(--brand); text-decoration: none; font-weight: 500; }
    .forgot-link:hover { text-decoration: underline; }

    .pw-wrap { position: relative; }
    .pw-wrap .form-control { padding-right: 2.75rem; }
    .pw-toggle {
      position: absolute; right: var(--space-3); top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: var(--space-1);
      color: var(--text-muted); display: flex; align-items: center;
      transition: color var(--t-fast);
      &:hover { color: var(--text-primary); }
    }
  `],
})
export class LoginComponent {
  private readonly fb          = inject(FormBuilder)
  private readonly authService = inject(AuthService)
  private readonly router      = inject(Router)
  private readonly transloco   = inject(TranslocoService)

  readonly loading      = signal(false)
  readonly apiError     = signal<string | null>(null)
  readonly showPassword = signal(false)

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field)
    return !!(ctrl?.invalid && ctrl.touched)
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return }
    this.loading.set(true)
    this.apiError.set(null)
    const { email, password } = this.form.value as { email: string; password: string }
    this.authService.login(email, password).subscribe({
      next: (res) => {
        if (res.user.role === 'super_admin') this.router.navigate(['/super-admin/dashboard'])
        else this.router.navigate(['/admin/dashboard'])
      },
      error: (err) => {
        this.loading.set(false)
        this.apiError.set(
          err.status === 400 || err.status === 401
            ? this.transloco.translate('auth.login.errorCredentials')
            : this.transloco.translate('auth.login.errorGeneric')
        )
      },
    })
  }
}
