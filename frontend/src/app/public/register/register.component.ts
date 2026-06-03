import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs'
import { RegisterService } from '../../shared/services/register.service'
import { AuthService } from '../../shared/services/auth.service'
import type { RegisterPayload } from '../../shared/models'
import { PhoneInputComponent } from '../../shared/components/phone-input/phone-input.component'

// ─── Données statiques ────────────────────────────────────────────────────────

interface StepOne {
  restaurantName: string; restaurantSlug: string; country: string
  currency: string; address: string; phone: string
}
interface StepTwo {
  fullName: string; email: string; password: string
  passwordConfirmation: string; ownerPhone: string
}

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
  { code: 'FR', name: 'France',        currency: 'EUR' },
  { code: 'BE', name: 'Belgique',      currency: 'EUR' },
  { code: 'CH', name: 'Suisse',        currency: 'EUR' },
  { code: 'LU', name: 'Luxembourg',    currency: 'EUR' },
  { code: 'US', name: 'États-Unis',    currency: 'USD' },
]

const CURRENCIES = [
  { code: 'XOF', label: 'XOF — Franc CFA (UEMOA)' },
  { code: 'XAF', label: 'XAF — Franc CFA (CEMAC)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'USD', label: 'USD — Dollar américain ($)' },
  { code: 'GNF', label: 'GNF — Franc guinéen' },
  { code: 'CDF', label: 'CDF — Franc congolais' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
  color: string
  percent: number
  checks: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    special: boolean
  }
}

function checkPasswordStrength(pw: string): PasswordStrength {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
    special:   /[^A-Za-z0-9]/.test(pw),
  }
  const score = Object.values(checks).filter(Boolean).length as 0 | 1 | 2 | 3 | 4
  const labels = ['', 'Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort']
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']
  return {
    score,
    label:   pw.length === 0 ? '' : (labels[score] ?? 'Fort'),
    color:   colors[score] ?? '#22c55e',
    percent: (score / 5) * 100,
    checks,
  }
}


// ─── Composant ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslocoModule, PhoneInputComponent],
  templateUrl: './register.component.html',
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

    .progress-bar {
      height: 3px; background: var(--gray-100); border-radius: var(--radius-full);
      margin-bottom: var(--space-8); overflow: hidden;
    }
    .progress-fill {
      height: 100%; background: var(--brand); border-radius: var(--radius-full);
      transition: width .5s var(--ease-spring);
    }

    .form-step { display: flex; flex-direction: column; }
    .step-heading { margin-bottom: var(--space-6); }
    .step-title { font-family: var(--font-display); font-size: 1.875rem; color: var(--text-primary); margin: 0 0 var(--space-2); }
    .step-desc  { color: var(--text-muted); margin: 0; font-size: .9375rem; }

    .req         { color: var(--brand); }
    .slug-suffix { color: var(--text-muted); font-weight: 400; font-size: .8rem; margin-left: var(--space-2); }
    .hint-inline { color: var(--text-muted); font-weight: 400; font-size: .78rem; margin-left: var(--space-2); }

    /* ── Phone feedback ── */
    .phone-error { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--error); margin-top: 4px; }
    .phone-ok    { display: flex; align-items: center; gap: 5px; font-size: .78rem; color: var(--success); margin-top: 4px; }

    /* ── Password strength ── */
    .pw-wrap { position: relative; }
    .pw-wrap .form-control { padding-right: 2.75rem; }
    .pw-toggle {
      position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; padding: 2px;
      color: var(--text-muted); display: flex; align-items: center;
      &:hover { color: var(--text-primary); }
    }

    .pw-strength {
      margin-top: var(--space-2);
    }
    .pw-strength-bar {
      height: 4px; background: var(--gray-100); border-radius: var(--radius-full);
      overflow: hidden; margin-bottom: var(--space-2);
    }
    .pw-strength-fill {
      height: 100%; border-radius: var(--radius-full);
      transition: width .3s ease, background-color .3s ease;
    }
    .pw-strength-label {
      font-size: .75rem; font-weight: 600; margin-bottom: var(--space-2);
    }
    .pw-checks {
      display: grid; grid-template-columns: 1fr 1fr; gap: 4px 12px;
    }
    .pw-check {
      display: flex; align-items: center; gap: 5px;
      font-size: .75rem; color: var(--text-muted);
      transition: color .2s;
    }
    .pw-check.ok { color: var(--success); }
    .pw-check svg { flex-shrink: 0; }

    /* ── OTP (étape 4) ── */
    .otp-wrap {
      display: flex; flex-direction: column; align-items: center;
      padding: var(--space-6) 0;
    }
    .otp-icon {
      width: 64px; height: 64px; background: var(--brand-bg);
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-4);
    }
    .otp-email {
      font-size: .875rem; font-weight: 600; color: var(--text-primary);
      background: var(--gray-50); border: 1px solid var(--border);
      border-radius: var(--radius-md); padding: var(--space-2) var(--space-3);
      margin-bottom: var(--space-6);
    }
    .otp-inputs {
      display: flex; gap: var(--space-3); justify-content: center;
      margin-bottom: var(--space-2);
    }
    .otp-digit {
      width: 52px; height: 60px;
      text-align: center; font-size: 1.5rem; font-weight: 700;
      border: 2px solid var(--border); border-radius: var(--radius-md);
      background: var(--gray-50); outline: none; transition: border-color .15s;
      color: var(--text-primary); caret-color: var(--brand);
      &:focus { border-color: var(--brand); background: #fff; }
    }
    .otp-digit.filled { border-color: var(--brand-300, #e87a6a); background: #fff; }
    .otp-hint { font-size: .8125rem; color: var(--text-muted); margin-bottom: var(--space-5); }
    .otp-resend { font-size: .875rem; color: var(--text-muted); text-align: center; margin-top: var(--space-3); }
    .otp-resend button {
      background: none; border: none; cursor: pointer;
      color: var(--brand); font-weight: 600; font-size: .875rem; padding: 0;
      &:disabled { color: var(--text-muted); cursor: default; }
    }
    .otp-countdown { font-weight: 600; color: var(--text-muted); }

    /* ── Misc ── */
    .slug-wrap { position: relative; }
    .slug-wrap .form-control { padding-right: 2.75rem; }
    .slug-status {
      position: absolute; right: .9rem; top: 50%; transform: translateY(-50%);
      display: flex; align-items: center;
    }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

    .step-actions { display: flex; gap: var(--space-3); align-items: center; margin-top: var(--space-6); }

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
export class RegisterComponent implements OnInit, OnDestroy {
  private readonly registerService = inject(RegisterService)
  private readonly authService     = inject(AuthService)
  private readonly router          = inject(Router)

  readonly countries     = COUNTRIES
  readonly currencies    = CURRENCIES

  /** ISO2 codes (lowercase) des pays autorisés dans le sélecteur téléphone */
  readonly allowedPhoneCountries = COUNTRIES.map((c) => c.code.toLowerCase())

  /** Priorités : même ordre que COUNTRIES (les africains en premier, puis Europe/US) */
  readonly phoneCountryOrder = COUNTRIES.slice(0, 12).map((c) => c.code.toLowerCase())
  readonly step          = signal(1)
  readonly slugStatus    = signal<'idle'|'checking'|'available'|'taken'>('idle')
  readonly loading       = signal(false)
  readonly error         = signal<string|null>(null)
  readonly showPw        = signal(false)
  readonly showPwConfirm = signal(false)

  // Step 4 — OTP
  readonly pendingEmail  = signal<string>('')
  readonly otpDigits     = signal<string[]>(['', '', '', '', '', ''])
  readonly otpResendCountdown = signal(0)
  readonly otpSuccess    = signal(false)
  private countdownInterval: ReturnType<typeof setInterval> | null = null

  s1: StepOne = { restaurantName: '', restaurantSlug: '', country: 'CI', currency: 'XOF', address: '', phone: '' }
  s2: StepTwo = { fullName: '', email: '', password: '', passwordConfirmation: '', ownerPhone: '' }

  // Phone validation state (alimenté par l'output validityChange du PhoneInputComponent)
  readonly s1PhoneValid  = signal<boolean | null>(null)
  readonly s2PhoneValid  = signal<boolean | null>(null)

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

  // ─── Session persistence (survie au F5) ────────────────────────────────────

  private readonly SESSION_KEY = 'saem_reg_draft'

  ngOnInit(): void {
    this.restoreSession()
  }

  /** Sauvegarde l'état courant dans sessionStorage */
  saveSession(): void {
    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        step: this.step(),
        s1: this.s1,
        s2: {
          fullName:             this.s2.fullName,
          email:                this.s2.email,
          password:             this.s2.password,
          passwordConfirmation: this.s2.passwordConfirmation,
          ownerPhone:           this.s2.ownerPhone,
        },
        pendingEmail: this.pendingEmail(),
      }))
    } catch { /* sessionStorage non disponible (private browsing strict) */ }
  }

  /** Restaure l'état depuis sessionStorage au rechargement */
  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY)
      if (!raw) return
      const d = JSON.parse(raw)

      if (d.s1) {
        this.s1 = { ...this.s1, ...d.s1 }
        // Reclencher la vérif du slug restauré
        if (this.s1.restaurantSlug) this.checkSlug(this.s1.restaurantSlug)
      }
      if (d.s2) {
        this.s2 = { ...this.s2, ...d.s2 }
        if (d.s2.password) this._pw.set(d.s2.password)
      }
      if (d.pendingEmail) this.pendingEmail.set(d.pendingEmail)

      // Restaurer l'étape en dernier (après que les données soient prêtes)
      const savedStep = Number(d.step)
      if (savedStep >= 1 && savedStep <= 4) {
        this.step.set(savedStep)
        // Sur l'étape 4, lancer le countdown renvoyer (le code reste valide 15 min)
        if (savedStep === 4) this.startResendCountdown()
      }
    } catch { /* données corrompues → on ignore */ }
  }

  /** Supprime la session après inscription réussie */
  private clearSession(): void {
    try { sessionStorage.removeItem(this.SESSION_KEY) } catch {}
  }

  ngOnDestroy() {
    if (this.countdownInterval) clearInterval(this.countdownInterval)
  }

  // ── Computed ────────────────────────────────────────────────────────────────

  readonly countryName = computed(() => COUNTRIES.find((c) => c.code === this.s1.country)?.name ?? this.s1.country)

  // Signal qui suit la valeur du mot de passe (computed ne traque pas les objets plain)
  readonly _pw = signal('')
  readonly pwStrength = computed(() => checkPasswordStrength(this._pw()))

  readonly otpCode = computed(() => this.otpDigits().join(''))

  // ── Slug handlers ───────────────────────────────────────────────────────────

  onNameChange(name: string): void {
    const slug = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    this.s1.restaurantSlug = slug
    this.checkSlug(slug)
  }

  checkSlug(slug: string): void { this.slugSubject.next(slug) }

  onCountryChange(code: string): void {
    const found = COUNTRIES.find((c) => c.code === code)
    if (found) this.s1.currency = found.currency
    this.saveSession()
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  canGoStep2(): boolean {
    return !!(
      this.s1.restaurantName && this.s1.restaurantSlug &&
      this.slugStatus() === 'available' && this.s1.country &&
      (this.s1PhoneValid() !== false) // null = vide = ok
    )
  }

  canGoStep3(): boolean {
    const pw = this.pwStrength()
    return !!(
      this.s2.fullName && this.s2.email &&
      pw.score >= 4 && // Fort ou Très fort requis
      pw.checks.length && pw.checks.uppercase && pw.checks.lowercase && pw.checks.number && pw.checks.special &&
      this._pw() === this.s2.passwordConfirmation &&
      (this.s2PhoneValid() !== false)
    )
  }

  nextStep(): void { this.step.update((s) => s + 1); this.saveSession() }

  goStep(n: number): void { this.step.set(n); this.saveSession() }

  // ── OTP handlers ────────────────────────────────────────────────────────────

  onOtpInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement
    const val = input.value.replace(/\D/g, '').slice(-1) // chiffres seulement
    const digits = [...this.otpDigits()]
    digits[index] = val
    this.otpDigits.set(digits)
    input.value = val

    // Auto-focus suivant
    if (val && index < 5) {
      const next = input.parentElement?.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement
      next?.focus()
    }
  }

  onOtpKeydown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      const digits = [...this.otpDigits()]
      if (!digits[index] && index > 0) {
        digits[index - 1] = ''
        this.otpDigits.set(digits)
        const prev = (event.target as HTMLElement).parentElement
          ?.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement
        prev?.focus()
      }
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      const prev = (event.target as HTMLElement).parentElement
        ?.querySelectorAll('.otp-digit')[index - 1] as HTMLInputElement
      prev?.focus()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      const next = (event.target as HTMLElement).parentElement
        ?.querySelectorAll('.otp-digit')[index + 1] as HTMLInputElement
      next?.focus()
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault()
    const text = event.clipboardData?.getData('text')?.replace(/\D/g, '').slice(0, 6) ?? ''
    const digits = text.split('').concat(['', '', '', '', '', '']).slice(0, 6)
    this.otpDigits.set(digits)
  }

  private startResendCountdown(): void {
    this.otpResendCountdown.set(60)
    if (this.countdownInterval) clearInterval(this.countdownInterval)
    this.countdownInterval = setInterval(() => {
      const cur = this.otpResendCountdown()
      if (cur <= 1) {
        this.otpResendCountdown.set(0)
        clearInterval(this.countdownInterval!)
      } else {
        this.otpResendCountdown.set(cur - 1)
      }
    }, 1000)
  }

  resendOtp(): void {
    if (this.otpResendCountdown() > 0) return
    this.registerService.resendVerification(this.pendingEmail()).subscribe({
      next: () => {
        this.error.set(null)
        this.startResendCountdown()
      },
      error: (err) => this.error.set(err.error?.message ?? 'Erreur lors du renvoi du code.'),
    })
  }

  verifyOtp(): void {
    if (this.otpCode().length !== 6) return
    this.loading.set(true)
    this.error.set(null)
    this.registerService.verifyEmail(this.pendingEmail(), this.otpCode()).subscribe({
      next: (res) => {
        this.clearSession() // inscription terminée → on vide la session
        this.authService.loginFromRegistration(res.token.value, res.user, res.restaurant)
        this.router.navigate(['/admin'])
      },
      error: (err) => {
        this.loading.set(false)
        this.error.set(err.error?.message ?? 'Code incorrect ou expiré.')
        if (err.error?.expired) {
          // Réinitialiser les champs OTP
          this.otpDigits.set(['', '', '', '', '', ''])
        }
      },
    })
  }

  // ── Submit principal (étape 3 → 4) ─────────────────────────────────────────

  submit(): void {
    this.loading.set(true)
    this.error.set(null)
    const payload: RegisterPayload = {
      restaurantName: this.s1.restaurantName,
      restaurantSlug: this.s1.restaurantSlug,
      country: this.s1.country,
      currency: this.s1.currency,
      address: this.s1.address || undefined,
      phone: this.s1.phone || undefined,
      fullName: this.s2.fullName,
      email: this.s2.email,
      password: this.s2.password,
      password_confirmation: this.s2.passwordConfirmation,
      ownerPhone: this.s2.ownerPhone || undefined,
      planSlug: 'free',
    }
    this.registerService.register(payload).subscribe({
      next: (res) => {
        this.loading.set(false)
        this.pendingEmail.set(res.email)
        this.otpDigits.set(['', '', '', '', '', ''])
        this.startResendCountdown()
        this.step.set(4)
        this.saveSession() // persiste l'étape 4 + pendingEmail
      },
      error: (err) => {
        this.loading.set(false)
        this.error.set(err.error?.message ?? 'Une erreur est survenue.')
      },
    })
  }
}
