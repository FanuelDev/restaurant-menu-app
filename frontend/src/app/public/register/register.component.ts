import { Component, signal, inject, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { RegisterService } from '../../shared/services/register.service'
import { AuthService } from '../../shared/services/auth.service'
import type { RegisterPayload } from '../../shared/models'

interface StepOne { restaurantName: string; restaurantSlug: string; country: string; currency: string; address: string; phone: string }
interface StepTwo { fullName: string; email: string; password: string; passwordConfirmation: string; ownerPhone: string }

const COUNTRIES = [
  { code: 'CI', name: "Côte d'Ivoire", currency: 'XOF' },
  { code: 'SN', name: 'Sénégal',       currency: 'XOF' },
  { code: 'ML', name: 'Mali',           currency: 'XOF' },
  { code: 'BF', name: 'Burkina Faso',  currency: 'XOF' },
  { code: 'TG', name: 'Togo',          currency: 'XOF' },
  { code: 'BJ', name: 'Bénin',         currency: 'XOF' },
  { code: 'NE', name: 'Niger',         currency: 'XOF' },
  { code: 'GN', name: 'Guinée',        currency: 'GNF' },
  { code: 'CM', name: 'Cameroun',      currency: 'XAF' },
  { code: 'CG', name: 'Congo',         currency: 'XAF' },
  { code: 'CD', name: 'RD Congo',      currency: 'CDF' },
  { code: 'GA', name: 'Gabon',         currency: 'XAF' },
  { code: 'GH', name: 'Ghana',         currency: 'USD' },
  { code: 'NG', name: 'Nigeria',       currency: 'USD' },
]

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule],
  template: `
    <ng-container *transloco="let t">
    <div class="reg-page">

      <!-- Left visual -->
      <div class="reg-visual" aria-hidden="true">
        <div class="rv-inner">
          <div class="rv-logo">
            <svg width="18" height="18" viewBox="0 0 40 40" fill="none">
              <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
              <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
            </svg>
          </div>
          <h2 class="rv-title">MenuApp</h2>
          <p class="rv-sub">{{ t('public.register.rvSub') }}</p>

          <div class="rv-steps">
            <div class="rv-step" [class.rv-step-done]="step() > 1" [class.rv-step-active]="step() === 1">
              <div class="rv-step-num">{{ step() > 1 ? '✓' : '1' }}</div>
              <div>
                <div class="rv-step-name">{{ t('public.register.rvStep1Name') }}</div>
                <div class="rv-step-desc">{{ t('public.register.rvStep1Desc') }}</div>
              </div>
            </div>
            <div class="rv-step-connector" [class.done]="step() > 1"></div>
            <div class="rv-step" [class.rv-step-done]="step() > 2" [class.rv-step-active]="step() === 2">
              <div class="rv-step-num">{{ step() > 2 ? '✓' : '2' }}</div>
              <div>
                <div class="rv-step-name">{{ t('public.register.rvStep2Name') }}</div>
                <div class="rv-step-desc">{{ t('public.register.rvStep2Desc') }}</div>
              </div>
            </div>
            <div class="rv-step-connector" [class.done]="step() > 2"></div>
            <div class="rv-step" [class.rv-step-active]="step() === 3">
              <div class="rv-step-num">3</div>
              <div>
                <div class="rv-step-name">{{ t('public.register.rvStep3Name') }}</div>
                <div class="rv-step-desc">{{ t('public.register.rvStep3Desc') }}</div>
              </div>
            </div>
          </div>

          <div class="rv-trial-badge">
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round">
              <path d="M9 2l2 5.5 5.5.8-4 3.9.9 5.3L9 14.5 4.1 17l.9-5.3L1 7.8l5.5-.8z" stroke-linejoin="round"/>
            </svg>
            {{ t('public.register.trialBadge') }}
          </div>
        </div>
        <div class="rv-blob rv-blob-1"></div>
        <div class="rv-blob rv-blob-2"></div>
      </div>

      <!-- Form panel -->
      <div class="reg-form-panel">
        <div class="reg-form-wrap">

          <!-- Header minimal -->
          <div class="rf-nav">
            <a routerLink="/pricing" class="rf-back">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                <path d="M13 8H3M7 4L3 8l4 4" stroke-linejoin="round"/>
              </svg>
              {{ t('public.register.backToPricing') }}
            </a>
            <span class="rf-login">
              {{ t('public.register.alreadyRegistered') }} <a routerLink="/login">{{ t('public.register.login') }}</a>
            </span>
          </div>

          <!-- Barre de progression -->
          <div class="progress-bar">
            <div class="progress-fill" [style.width]="((step() - 1) / 2 * 100) + '%'"></div>
          </div>

          <!-- Step 1 -->
          @if (step() === 1) {
            <div class="form-step animate-right">
              <div class="step-heading">
                <h1 class="step-title">{{ t('public.register.step1Title') }}</h1>
                <p class="step-desc">{{ t('public.register.step1Desc') }}</p>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldRestaurantName') }}</label>
                <input class="form-control" [(ngModel)]="s1.restaurantName" type="text"
                       placeholder="Ex : Chez Maman Adjoua" (ngModelChange)="onNameChange($event)" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  {{ t('public.register.fieldSubdomainLabel') }} <span class="req">*</span>
                  <span class="slug-suffix">{{ t('public.register.fieldSubdomainSuffix') }}</span>
                </label>
                <div class="slug-wrap">
                  <input class="form-control" [(ngModel)]="s1.restaurantSlug" type="text"
                         placeholder="mon-restaurant" (ngModelChange)="checkSlug($event)"
                         [class.is-invalid]="slugStatus() === 'taken'" />
                  <div class="slug-status">
                    @if (slugStatus() === 'checking') {
                      <span class="spinner spinner-dark"></span>
                    } @else if (slugStatus() === 'available') {
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--success)" stroke-width="2.2" stroke-linecap="round"><path d="M3 8l3.5 3.5 7-7" stroke-linejoin="round"/></svg>
                    } @else if (slugStatus() === 'taken') {
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--error)" stroke-width="2.2" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>
                    }
                  </div>
                </div>
                @if (slugStatus() === 'taken') {
                  <span class="form-error">{{ t('public.register.fieldSubdomainTakenError') }}</span>
                }
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">{{ t('public.register.fieldCountry') }}</label>
                  <select class="form-control" [(ngModel)]="s1.country" (ngModelChange)="onCountryChange($event)">
                    @for (c of countries; track c.code) {
                      <option [value]="c.code">{{ c.name }}</option>
                    }
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">{{ t('public.register.fieldCurrency') }}</label>
                  <input class="form-control" [value]="s1.currency" readonly />
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldAddress') }}</label>
                <input class="form-control" [(ngModel)]="s1.address" type="text" placeholder="Ex : Plateau, Abidjan" />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldPhone') }}</label>
                <input class="form-control" [(ngModel)]="s1.phone" type="tel" placeholder="+225 07 00 00 00 00" />
              </div>

              <button class="btn btn-primary btn-full btn-lg" (click)="nextStep()" [disabled]="!canGoStep2()">
                {{ t('public.register.continueBtn') }}
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4" stroke-linejoin="round"/></svg>
              </button>
            </div>
          }

          <!-- Step 2 -->
          @if (step() === 2) {
            <div class="form-step animate-right">
              <div class="step-heading">
                <h1 class="step-title">{{ t('public.register.step2Title') }}</h1>
                <p class="step-desc">{{ t('public.register.step2Desc') }}</p>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldFullName') }}</label>
                <input class="form-control" [(ngModel)]="s2.fullName" type="text" placeholder="Ex : Kouamé Jean-Pierre" />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldEmail') }}</label>
                <input class="form-control" [(ngModel)]="s2.email" type="email" placeholder="vous@restaurant.com" />
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldPhone') }}</label>
                <input class="form-control" [(ngModel)]="s2.ownerPhone" type="tel" placeholder="+225 07 00 00 00 00" />
              </div>

              <div class="form-group">
                <label class="form-label">
                  {{ t('public.register.fieldPassword') }}
                  <span class="hint-inline">{{ t('public.register.fieldPasswordHint') }}</span>
                </label>
                <div class="pw-wrap">
                  <input class="form-control" [(ngModel)]="s2.password" [type]="showPw() ? 'text' : 'password'" placeholder="••••••••" />
                  <button type="button" class="pw-toggle" (click)="showPw.set(!showPw())" [attr.aria-label]="showPw() ? t('public.register.hidePassword') : t('public.register.showPassword')">
                    @if (showPw()) {
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('public.register.fieldPasswordConfirm') }}</label>
                <div class="pw-wrap">
                  <input class="form-control" [(ngModel)]="s2.passwordConfirmation" [type]="showPwConfirm() ? 'text' : 'password'" placeholder="••••••••"
                         [class.is-invalid]="s2.password && s2.passwordConfirmation && s2.password !== s2.passwordConfirmation" />
                  <button type="button" class="pw-toggle" (click)="showPwConfirm.set(!showPwConfirm())" [attr.aria-label]="showPwConfirm() ? t('public.register.hidePassword') : t('public.register.showPassword')">
                    @if (showPwConfirm()) {
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    } @else {
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    }
                  </button>
                </div>
                @if (s2.password && s2.passwordConfirmation && s2.password !== s2.passwordConfirmation) {
                  <span class="form-error">{{ t('public.register.passwordMismatch') }}</span>
                }
              </div>

              <div class="step-actions">
                <button class="btn btn-ghost" (click)="step.set(1)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M13 8H3M7 4L3 8l4 4" stroke-linejoin="round"/></svg>
                  {{ t('common.back') }}
                </button>
                <button class="btn btn-primary btn-lg" (click)="nextStep()" [disabled]="!canGoStep3()" style="flex:1">
                  {{ t('public.register.continueBtn') }}
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
          }

          <!-- Step 3 -->
          @if (step() === 3) {
            <div class="form-step animate-right">
              <div class="step-heading">
                <h1 class="step-title">{{ t('public.register.step3Title') }}</h1>
                <p class="step-desc">{{ t('public.register.step3Desc') }}</p>
              </div>

              <div class="summary-card">
                <div class="summary-row">
                  <span class="sr-label">{{ t('public.register.summaryRestaurant') }}</span>
                  <span class="sr-value">{{ s1.restaurantName }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('public.register.summarySubdomain') }}</span>
                  <span class="sr-value">{{ s1.restaurantSlug }}.menuapp.com</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('public.register.summaryCountryCurrency') }}</span>
                  <span class="sr-value">{{ countryName() }} · {{ s1.currency }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('public.register.summaryOwner') }}</span>
                  <span class="sr-value">{{ s2.fullName }}</span>
                </div>
                <div class="summary-row">
                  <span class="sr-label">{{ t('public.register.summaryEmail') }}</span>
                  <span class="sr-value">{{ s2.email }}</span>
                </div>
              </div>

              <div class="trial-banner">
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" stroke="var(--success)" stroke-width="1.8" stroke-linecap="round"><path d="M3 9l4 4 8-8" stroke-linejoin="round"/></svg>
                <div>
                  <strong>{{ t('public.register.trialTitle') }}</strong><br/>
                  <span>{{ t('public.register.trialDesc') }}</span>
                </div>
              </div>

              @if (error()) {
                <div class="alert alert-error" role="alert">{{ error() }}</div>
              }

              <div class="step-actions">
                <button class="btn btn-ghost" (click)="step.set(2)">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M13 8H3M7 4L3 8l4 4" stroke-linejoin="round"/></svg>
                  {{ t('common.back') }}
                </button>
                <button class="btn btn-primary btn-lg" (click)="submit()" [disabled]="loading()" style="flex:1">
                  @if (loading()) { <span class="spinner"></span> {{ t('public.register.submittingFinal') }} }
                  @else { {{ t('public.register.submitFinal') }} }
                </button>
              </div>
            </div>
          }

        </div>
      </div>
    </div>
    </ng-container>
  `,
  styles: [`
    .reg-page { display: flex; min-height: 100vh; }

    /* ── Visual (gauche) ─────────────────────────── */
    .reg-visual {
      width: 380px; flex-shrink: 0; position: relative; overflow: hidden;
      background: linear-gradient(145deg, #B03020 0%, #7A1A10 55%, #4A0A06 100%);
      display: flex; align-items: center; justify-content: center; padding: var(--space-8);
    }
    @media (max-width: 900px) { .reg-visual { display: none; } }

    .rv-inner { position: relative; z-index: 2; color: white; }

    .rv-logo {
      width: 52px; height: 52px; background: rgba(255,255,255,.15);
      border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-5); backdrop-filter: blur(8px);
    }
    .rv-title { font-family: var(--font-display); font-size: 2rem; color: white; margin: 0 0 var(--space-2); }
    .rv-sub   { color: rgba(255,255,255,.65); font-size: .9375rem; margin: 0 0 var(--space-10); line-height: 1.5; }

    /* Steps indicator */
    .rv-steps { display: flex; flex-direction: column; gap: 0; margin-bottom: var(--space-8); }
    .rv-step {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-3) 0; opacity: .5; transition: opacity var(--t-fast);
    }
    .rv-step-active { opacity: 1; }
    .rv-step-done   { opacity: .8; }
    .rv-step-num {
      width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 50%; border: 1.5px solid rgba(255,255,255,.4);
      display: flex; align-items: center; justify-content: center;
      font-size: .8125rem; font-weight: 700;
    }
    .rv-step-active .rv-step-num  { background: white; color: var(--brand); border-color: white; }
    .rv-step-done .rv-step-num    { background: rgba(255,255,255,.2); border-color: rgba(255,255,255,.6); }
    .rv-step-name  { font-size: .875rem; font-weight: 600; }
    .rv-step-desc  { font-size: .75rem; color: rgba(255,255,255,.55); margin-top: 2px; }

    .rv-step-connector {
      width: 1px; height: 24px; background: rgba(255,255,255,.2);
      margin-left: 13px; transition: background var(--t-normal);
    }
    .rv-step-connector.done { background: rgba(255,255,255,.5); }

    .rv-trial-badge {
      display: flex; align-items: center; gap: var(--space-2);
      background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);
      border-radius: var(--radius-lg); padding: var(--space-3) var(--space-4);
      font-size: .8125rem; backdrop-filter: blur(6px);
    }

    .rv-blob {
      position: absolute; border-radius: 50%; filter: blur(60px);
      opacity: .2; pointer-events: none;
    }
    .rv-blob-1 { width:240px; height:240px; background:#FF8A65; top:-60px;  right:-60px; animation:float 8s ease-in-out infinite; }
    .rv-blob-2 { width:180px; height:180px; background:#FFB74D; bottom:-40px; left:-40px; animation:float 10s ease-in-out infinite reverse; }

    /* ── Form (droite) ───────────────────────────── */
    .reg-form-panel {
      flex: 1; display: flex; align-items: flex-start; justify-content: center;
      padding: 0 var(--space-6); overflow-y: auto;
    }
    .reg-form-wrap { width: 100%; max-width: 440px; padding: var(--space-6) 0 var(--space-12); }

    .rf-nav {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: var(--space-6);
    }
    .rf-back {
      display: flex; align-items: center; gap: var(--space-2);
      color: var(--text-muted); text-decoration: none; font-size: .875rem;
      transition: color var(--t-fast);
      &:hover { color: var(--text-primary); }
    }
    .rf-login { font-size: .875rem; color: var(--text-muted); }
    .rf-login a { color: var(--brand); text-decoration: none; font-weight: 500; }
    .rf-login a:hover { text-decoration: underline; }

    /* Progress bar */
    .progress-bar {
      height: 3px; background: var(--gray-100); border-radius: var(--radius-full);
      margin-bottom: var(--space-8); overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--brand); border-radius: var(--radius-full);
      transition: width .5s var(--ease-spring);
    }

    /* Step content */
    .form-step { display: flex; flex-direction: column; }
    .step-heading { margin-bottom: var(--space-6); }
    .step-title { font-family: var(--font-display); font-size: 1.875rem; color: var(--text-primary); margin: 0 0 var(--space-2); }
    .step-desc  { color: var(--text-muted); margin: 0; font-size: .9375rem; }

    .req         { color: var(--brand); }
    .slug-suffix { color: var(--text-muted); font-weight: 400; font-size: .8rem; margin-left: var(--space-2); }
    .hint-inline { color: var(--text-muted); font-weight: 400; font-size: .78rem; margin-left: var(--space-2); }

    .pw-wrap { position: relative; }
    .pw-wrap .form-control { padding-right: 2.75rem; }
    .pw-toggle {
      position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 2px;
      color: var(--text-muted); display: flex; align-items: center;
      &:hover { color: var(--text-primary); }
    }

    .slug-wrap { position: relative; }
    .slug-wrap .form-control { padding-right: 2.75rem; }
    .slug-status {
      position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

    .step-actions { display: flex; gap: var(--space-3); align-items: center; margin-top: var(--space-6); }

    /* Summary */
    .summary-card {
      background: var(--gray-50); border: 1px solid var(--border);
      border-radius: var(--radius-lg); overflow: hidden; margin-bottom: var(--space-4);
    }
    .summary-row {
      display: flex; justify-content: space-between; align-items: baseline;
      padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
    }
    .sr-label { font-size: .8125rem; color: var(--text-muted); font-weight: 500; flex-shrink: 0; }
    .sr-value { font-size: .875rem; color: var(--text-primary); font-weight: 500; text-align: right; }

    .trial-banner {
      display: flex; align-items: flex-start; gap: var(--space-3);
      background: var(--success-bg); border: 1px solid var(--success-border);
      border-radius: var(--radius-md); padding: var(--space-4); margin-bottom: var(--space-5);
      font-size: .8125rem; color: var(--success); line-height: 1.5;
      strong { font-weight: 700; }
      svg { flex-shrink: 0; margin-top: 1px; }
    }
  `],
})
export class RegisterComponent {
  private readonly registerService = inject(RegisterService)
  private readonly authService     = inject(AuthService)
  private readonly router          = inject(Router)

  readonly countries     = COUNTRIES
  readonly step          = signal(1)
  readonly slugStatus    = signal<'idle'|'checking'|'available'|'taken'>('idle')
  readonly loading       = signal(false)
  readonly error         = signal<string|null>(null)
  readonly showPw        = signal(false)
  readonly showPwConfirm = signal(false)

  s1: StepOne = { restaurantName: '', restaurantSlug: '', country: 'CI', currency: 'XOF', address: '', phone: '' }
  s2: StepTwo = { fullName: '', email: '', password: '', passwordConfirmation: '', ownerPhone: '' }

  private slugSubject = new Subject<string>()

  constructor() {
    this.slugSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap((slug) => {
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) { this.slugStatus.set('taken'); return [] }
        this.slugStatus.set('checking')
        return this.registerService.checkSlug(slug)
      })
    ).subscribe({
      next: (res) => this.slugStatus.set(res.available ? 'available' : 'taken'),
      error: () => this.slugStatus.set('idle'),
    })
  }

  readonly countryName = computed(() => COUNTRIES.find((c) => c.code === this.s1.country)?.name ?? this.s1.country)

  onNameChange(name: string): void {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    this.s1.restaurantSlug = slug
    this.checkSlug(slug)
  }
  checkSlug(slug: string): void { this.slugSubject.next(slug) }
  onCountryChange(code: string): void {
    const found = COUNTRIES.find((c) => c.code === code)
    if (found) this.s1.currency = found.currency
  }
  canGoStep2(): boolean { return !!(this.s1.restaurantName && this.s1.restaurantSlug && this.slugStatus() === 'available' && this.s1.country) }
  canGoStep3(): boolean { return !!(this.s2.fullName && this.s2.email && this.s2.password.length >= 8 && this.s2.password === this.s2.passwordConfirmation) }
  nextStep(): void { this.step.update((s) => s + 1) }

  submit(): void {
    this.loading.set(true)
    this.error.set(null)
    const payload: RegisterPayload = {
      restaurantName: this.s1.restaurantName, restaurantSlug: this.s1.restaurantSlug,
      country: this.s1.country, currency: this.s1.currency,
      address: this.s1.address || undefined, phone: this.s1.phone || undefined,
      fullName: this.s2.fullName, email: this.s2.email, password: this.s2.password,
      password_confirmation: this.s2.passwordConfirmation,
      ownerPhone: this.s2.ownerPhone || undefined, planSlug: 'free',
    }
    this.registerService.register(payload).subscribe({
      next: (res) => {
        this.authService.loginFromRegistration(res.token.value, res.user, res.restaurant)
        this.router.navigate(['/admin'])
      },
      error: (err) => { this.loading.set(false); this.error.set(err.error?.message ?? 'Une erreur est survenue.') },
    })
  }
}
