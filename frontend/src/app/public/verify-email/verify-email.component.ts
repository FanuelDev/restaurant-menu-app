import { Component, signal, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { RegisterService } from '../../shared/services/register.service'

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="card">

        <a routerLink="/login" class="back-link">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 8H3M7 4L3 8l4 4"/>
          </svg>
          Retour à la connexion
        </a>

        <div class="icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>

        <h1 class="title">Vérifier votre email</h1>
        <p class="subtitle">
          Entrez l'adresse email utilisée lors de votre inscription. Nous vous renverrons le code de vérification.
        </p>

        @if (!sent()) {
          <div class="form-group">
            <label class="form-label">Adresse email</label>
            <input
              type="email"
              class="form-control"
              [(ngModel)]="email"
              placeholder="votre@email.com"
              autocomplete="email"
              (keyup.enter)="submit()"
            />
          </div>

          @if (error()) {
            <div class="alert-error">{{ error() }}</div>
          }

          <button class="btn-primary" (click)="submit()" [disabled]="loading() || !email.trim()">
            @if (loading()) { <span class="spinner"></span> Envoi en cours… }
            @else { Envoyer le code →  }
          </button>
        } @else {
          <div class="success-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <p>Code envoyé à <strong>{{ email }}</strong>. Vérifiez votre boîte mail.</p>
          </div>
          <a class="btn-primary" [routerLink]="['/register']" [queryParams]="{ email: email }">
            Entrer mon code →
          </a>
        }

      </div>
    </div>
  `,
  styles: [`
    .page {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: #f4f4f5; padding: 24px;
    }
    .card {
      background: #fff; border-radius: 16px; padding: 40px;
      width: 100%; max-width: 420px;
      box-shadow: 0 2px 12px rgba(0,0,0,.08);
    }
    .back-link {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: .875rem; color: #6b7280; text-decoration: none;
      margin-bottom: 28px;
      &:hover { color: #111; }
    }
    .icon-wrap {
      width: 60px; height: 60px; background: #fef2f2; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .title { font-size: 1.5rem; font-weight: 700; color: #111; margin: 0 0 8px; }
    .subtitle { font-size: .9375rem; color: #6b7280; margin: 0 0 28px; line-height: 1.6; }
    .form-group { margin-bottom: 16px; }
    .form-label { display: block; font-size: .875rem; font-weight: 500; color: #374151; margin-bottom: 6px; }
    .form-control {
      width: 100%; padding: 10px 14px; border: 1.5px solid #e5e7eb;
      border-radius: 8px; font-size: .9375rem; outline: none; box-sizing: border-box;
      &:focus { border-color: #C0392B; }
    }
    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 8px; padding: 10px 14px; font-size: .875rem; margin-bottom: 16px;
    }
    .btn-primary {
      display: block; width: 100%; padding: 13px; background: #C0392B; color: #fff;
      font-size: .9375rem; font-weight: 700; border: none; border-radius: 8px;
      cursor: pointer; text-align: center; text-decoration: none;
      &:hover:not(:disabled) { background: #a93226; }
      &:disabled { opacity: .6; cursor: not-allowed; }
    }
    .spinner {
      display: inline-block; width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,.4); border-top-color: #fff;
      border-radius: 50%; animation: spin .7s linear infinite; margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-box {
      display: flex; align-items: flex-start; gap: 10px;
      background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
      padding: 14px; font-size: .875rem; color: #166534; margin-bottom: 20px;
      p { margin: 0; line-height: 1.5; }
    }
  `],
})
export class VerifyEmailComponent {
  private readonly registerService = inject(RegisterService)
  private readonly router          = inject(Router)

  email   = ''
  readonly loading = signal(false)
  readonly error   = signal<string | null>(null)
  readonly sent    = signal(false)

  submit(): void {
    const email = this.email.trim()
    if (!email) return
    this.loading.set(true)
    this.error.set(null)
    this.registerService.resendVerification(email).subscribe({
      next: () => {
        this.loading.set(false)
        this.sent.set(true)
      },
      error: (err) => {
        this.loading.set(false)
        this.error.set(err.error?.message ?? 'Email introuvable ou déjà vérifié.')
      },
    })
  }
}
