import { Component, signal, inject, OnInit } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink, ActivatedRoute } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  template: `
    <div class="auth-page">

      <div class="auth-visual" aria-hidden="true">
        <div class="auth-visual-inner">
          <div class="av-icon-wrap">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h2 class="av-title">Nouveau mot de passe</h2>
          <p class="av-subtitle">Choisissez un mot de passe fort pour protéger votre compte</p>

          <div class="av-tips">
            <div class="av-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Au moins 8 caractères
            </div>
            <div class="av-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Mélangez lettres, chiffres et symboles
            </div>
            <div class="av-tip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Évitez les mots de passe réutilisés
            </div>
          </div>
        </div>
        <div class="av-blob av-blob-1"></div>
        <div class="av-blob av-blob-2"></div>
      </div>

      <div class="auth-form-panel">
        <div class="auth-form-wrap animate-right">

          @if (invalidToken()) {
            <div class="token-error animate-up">
              <div class="te-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
              </div>
              <h2 class="te-title">Lien invalide ou expiré</h2>
              <p class="te-msg">Ce lien de réinitialisation est invalide ou a expiré (validité : 1 heure). Veuillez refaire une demande.</p>
              <a routerLink="/forgot-password" class="btn btn-primary btn-full">Nouvelle demande</a>
            </div>
          } @else if (success()) {
            <div class="success-state animate-up">
              <div class="success-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 class="success-title">Mot de passe mis à jour !</h2>
              <p class="success-msg">Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.</p>
              <a routerLink="/login" class="btn btn-primary btn-full btn-lg">Se connecter</a>
            </div>
          } @else {
            <a routerLink="/login" class="back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              Retour à la connexion
            </a>

            <h1 class="af-title">Nouveau mot de passe</h1>
            <p class="af-sub">Choisissez un mot de passe sécurisé d'au moins 8 caractères.</p>

            <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
              <div class="form-group">
                <label class="form-label" for="password">Nouveau mot de passe</label>
                <div class="pw-wrap">
                  <input
                    id="password" [type]="showPw() ? 'text' : 'password'" class="form-control"
                    formControlName="password" autocomplete="new-password"
                    placeholder="••••••••"
                    [class.is-invalid]="isInvalid('password')"
                  />
                  <button type="button" class="pw-toggle" (click)="showPw.set(!showPw())" [attr.aria-label]="showPw() ? 'Masquer' : 'Afficher'">
                    @if (showPw()) {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (isInvalid('password')) {
                  <span class="form-error" role="alert">8 caractères minimum.</span>
                }
                <div class="pw-strength">
                  <div class="pw-strength-bar" [class]="pwStrengthClass()"></div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="confirm">Confirmer le mot de passe</label>
                <div class="pw-wrap">
                  <input
                    id="confirm" [type]="showPwConfirm() ? 'text' : 'password'" class="form-control"
                    formControlName="confirm" autocomplete="new-password"
                    placeholder="••••••••"
                    [class.is-invalid]="isInvalid('confirm') || mismatch()"
                  />
                  <button type="button" class="pw-toggle" (click)="showPwConfirm.set(!showPwConfirm())" [attr.aria-label]="showPwConfirm() ? 'Masquer' : 'Afficher'">
                    @if (showPwConfirm()) {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (mismatch()) {
                  <span class="form-error" role="alert">Les mots de passe ne correspondent pas.</span>
                }
              </div>

              @if (apiError()) {
                <div class="alert alert-error" role="alert" style="margin-bottom: var(--space-4)">{{ apiError() }}</div>
              }

              <button type="submit" class="btn btn-primary btn-full btn-lg" [disabled]="loading()">
                @if (loading()) { <span class="spinner"></span> Enregistrement… }
                @else { Enregistrer le mot de passe }
              </button>
            </form>
          }

        </div>
      </div>
    </div>
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
          this.apiError.set(err.error?.message ?? 'Une erreur est survenue.')
        }
      },
    })
  }
}
