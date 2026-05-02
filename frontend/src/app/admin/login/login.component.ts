// frontend/src/app/admin/login/login.component.ts
import { Component, inject, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AuthService } from '../../shared/services/auth.service'

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <div class="login-logo__icon" aria-hidden="true">🍽️</div>
          <h1 class="login-logo__title">Administration</h1>
          <p class="login-logo__sub">Espace réservé au personnel</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
          <div class="form-group">
            <label class="form-label" for="email">Adresse e-mail</label>
            <input
              id="email"
              type="email"
              class="form-control"
              formControlName="email"
              autocomplete="email"
              placeholder="admin@restaurant.fr"
              [class.is-invalid]="isFieldInvalid('email')"
              aria-describedby="email-error"
            />
            @if (isFieldInvalid('email')) {
              <span id="email-error" class="form-error" role="alert">
                Adresse e-mail invalide.
              </span>
            }
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              class="form-control"
              formControlName="password"
              autocomplete="current-password"
              placeholder="••••••••"
              [class.is-invalid]="isFieldInvalid('password')"
              aria-describedby="password-error"
            />
            @if (isFieldInvalid('password')) {
              <span id="password-error" class="form-error" role="alert">
                Le mot de passe doit contenir au moins 8 caractères.
              </span>
            }
          </div>

          @if (apiError()) {
            <div class="alert alert-error" role="alert">{{ apiError() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-full"
            [disabled]="loading()"
            [attr.aria-busy]="loading()"
          >
            @if (loading()) {
              <span class="spinner" aria-hidden="true"></span>
              Connexion en cours…
            } @else {
              Se connecter
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-2);
      padding: var(--space-4);
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: var(--surface-1);
      border-radius: var(--radius-xl);
      padding: var(--space-8);
      box-shadow: var(--shadow-lg);
    }

    .login-logo {
      text-align: center;
      margin-bottom: var(--space-8);

      &__icon { font-size: 3rem; margin-bottom: var(--space-3); }
      &__title { font-family: var(--font-display); font-size: 1.75rem; color: var(--text-primary); margin: 0 0 var(--space-1); }
      &__sub { color: var(--text-muted); font-size: 0.875rem; margin: 0; }
    }

    .form-group { margin-bottom: var(--space-5); }

    .form-label {
      display: block;
      font-weight: 500;
      margin-bottom: var(--space-2);
      color: var(--text-secondary);
      font-size: 0.875rem;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      font-size: 1rem;
      font-family: var(--font-body);
      background: var(--surface-1);
      color: var(--text-primary);
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;

      &:focus {
        outline: none;
        border-color: var(--color-brand);
        box-shadow: 0 0 0 3px var(--color-brand-light);
      }

      &.is-invalid { border-color: var(--color-error); }
    }

    .form-error {
      display: block;
      color: var(--color-error);
      font-size: 0.8125rem;
      margin-top: var(--space-1);
    }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fca5a5;
      color: #dc2626;
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      margin-bottom: var(--space-4);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-2);
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
      border: none;

      &-primary {
        background: var(--color-brand);
        color: white;
        &:hover:not(:disabled) { background: var(--color-brand-dark); }
        &:disabled { opacity: 0.6; cursor: not-allowed; }
      }
      &-full { width: 100%; }
    }

    .spinner {
      width: 1rem;
      height: 1rem;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder)
  private readonly authService = inject(AuthService)
  private readonly router = inject(Router)

  readonly loading = signal(false)
  readonly apiError = signal<string | null>(null)

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  })

  isFieldInvalid(field: string): boolean {
    const ctrl = this.form.get(field)
    return !!(ctrl?.invalid && ctrl.touched)
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.loading.set(true)
    this.apiError.set(null)

    const { email, password } = this.form.value as { email: string; password: string }

    this.authService.login(email, password).subscribe({
      next: () => this.router.navigate(['/admin/dashboard']),
      error: (err) => {
        this.loading.set(false)
        this.apiError.set(
          err.status === 400 || err.status === 401
            ? 'Identifiants incorrects. Veuillez réessayer.'
            : 'Une erreur est survenue. Veuillez réessayer.'
        )
      },
    })
  }
}
