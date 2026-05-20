// frontend/src/app/admin/restaurant/restaurant.component.ts
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'

const CURRENCIES = [
  { code: 'XOF', label: 'XOF — Franc CFA (UEMOA)' },
  { code: 'XAF', label: 'XAF — Franc CFA (CEMAC)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'USD', label: 'USD — Dollar ($)' },
  { code: 'GNF', label: 'GNF — Franc guinéen' },
  { code: 'CDF', label: 'CDF — Franc congolais' },
]

const DAYS: { key: string }[] = [
  { key: 'monday' },
  { key: 'tuesday' },
  { key: 'wednesday' },
  { key: 'thursday' },
  { key: 'friday' },
  { key: 'saturday' },
  { key: 'sunday' },
]

@Component({
  selector: 'app-restaurant',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslocoModule],
  templateUrl: './restaurant.component.html',
  styles: [`
    .page-container { max-width: 960px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--space-4); margin-bottom: var(--space-8); }
    .page-title { font-family: var(--font-display); font-size: 1.875rem; margin: 0 0 var(--space-1); color: var(--text-primary); line-height: 1.15; }
    .page-subtitle { color: var(--text-muted); margin: 0; font-size: .9375rem; }

    .two-col { display: grid; grid-template-columns: 1fr 340px; gap: var(--space-6); align-items: start; }
    @media (max-width: 768px) {
      .two-col { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--surface-1);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      padding: var(--space-6);
      margin-bottom: var(--space-5);
    }
    .card-title { font-size: 1.125rem; font-weight: 600; margin: 0 0 var(--space-5); }

    .form-group { margin-bottom: var(--space-4); }
    .form-row { display: flex; gap: var(--space-4); }
    .flex-1 { flex: 1; }
    .form-label { display: block; font-weight: 500; font-size: 0.875rem; color: var(--text-secondary); margin-bottom: var(--space-2); }
    .form-control {
      width: 100%; padding: 0.75rem 1rem; border: 1.5px solid var(--border);
      border-radius: var(--radius-md); font-size: 1rem; background: var(--surface-1);
      color: var(--text-primary); box-sizing: border-box;
    }
    .form-control:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }

    .color-input-row { display: flex; gap: var(--space-3); align-items: center; }
    .color-picker {
      width: 48px; height: 48px;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; padding: 2px;
    }

    /* Cover image */
    .cover-zone {
      width: 100%; height: 160px;
      border: 2px dashed var(--border); border-radius: var(--radius-lg);
      overflow: hidden; cursor: pointer; position: relative;
      display: flex; align-items: center; justify-content: center;
      background: var(--gray-50);
      transition: border-color var(--t-fast);
    }
    .cover-zone:hover { border-color: var(--brand); }
    .cover-preview { width: 100%; height: 100%; object-fit: cover; }
    .cover-overlay {
      position: absolute; inset: 0; background: rgba(0,0,0,.45);
      color: white; font-size: .875rem; font-weight: 600;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .2s;
    }
    .cover-zone:hover .cover-overlay { opacity: 1; }
    .cover-placeholder {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-2); color: var(--text-muted); text-align: center; padding: var(--space-4);
      svg { color: var(--gray-400); }
      span { font-size: .875rem; font-weight: 500; }
      small { font-size: .78rem; color: var(--text-muted); }
    }
    .cover-actions { margin-top: var(--space-2); display: flex; align-items: center; gap: var(--space-3); }
    .cover-delete-btn { color: var(--error, #dc2626); }
    .cover-delete-btn:hover { color: var(--error, #dc2626); background: rgba(220,38,38,.08); }

    .logo-zone {
      width: 120px; height: 120px;
      border: 2px dashed var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
      cursor: pointer;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .logo-zone:hover .logo-overlay { opacity: 1; }
    .logo-preview { width: 100%; height: 100%; object-fit: cover; }
    .logo-overlay {
      position: absolute; inset: 0;
      background: rgba(0,0,0,0.5);
      color: white;
      font-size: 0.8125rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .logo-placeholder { display: flex; flex-direction: column; align-items: center; gap: var(--space-2); color: var(--text-muted); font-size: 0.8125rem; }
    .logo-placeholder span:first-child { font-size: 2rem; }
    .file-input-hidden { display: none; }
    .uploading-hint { font-size: 0.8125rem; color: var(--text-muted); margin-top: var(--space-1); }

    .alert-error   { background: var(--error-bg);   border: 1px solid var(--error-border);   color: var(--error);   padding: var(--space-3); border-radius: var(--radius-md); font-size: .875rem; margin-bottom: var(--space-4); }
    .alert-success { background: var(--success-bg); border: 1px solid var(--success-border); color: var(--success); padding: var(--space-3); border-radius: var(--radius-md); font-size: .875rem; margin-bottom: var(--space-4); }

    .btn {
      display: inline-flex; align-items: center; gap: var(--space-2);
      border-radius: var(--radius-md); font-weight: 500; cursor: pointer; border: 1px solid transparent; transition: all 0.2s;
      padding: 0.625rem 1.25rem; font-size: 0.9375rem;
    }
    .btn-primary { background: var(--color-brand); color: white; }
    .btn-primary:hover:not(:disabled) { background: var(--color-brand-dark); }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-large { padding: 0.875rem 2rem; font-size: 1rem; }
    .btn-icon {
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      background: none; border: 1px solid var(--border); border-radius: var(--radius-md);
      color: var(--text-muted); cursor: pointer; transition: all var(--t-fast);
      &:hover { background: var(--gray-50); color: var(--text-primary); border-color: var(--gray-300); }
    }

    .hours-list { display: flex; flex-direction: column; gap: var(--space-3); }
    .hours-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--border); }
    .hours-row:last-child { border-bottom: none; }
    .hours-day { font-weight: 500; flex: 1; font-size: 0.9375rem; }
    .hours-time { font-size: 0.875rem; color: var(--text-secondary); white-space: nowrap; }
    .hours-closed { font-size: 0.875rem; color: var(--text-muted); font-style: italic; }

    /* ── Template selector ─────────────────────────── */
    .tpl-card { margin-top: var(--space-5); }
    .tpl-subtitle { font-size: .875rem; color: var(--text-muted); margin: -.75rem 0 1.25rem; }
    .tpl-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: var(--space-4);
    }
    @media (max-width: 900px) { .tpl-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 540px) { .tpl-grid { grid-template-columns: 1fr; } }

    .tpl-option {
      position: relative;
      background: var(--surface-1); border: 2px solid var(--border);
      border-radius: var(--radius-lg); padding: 0;
      cursor: pointer; text-align: left;
      transition: border-color .2s, box-shadow .2s, transform .2s;
      overflow: hidden; display: flex; flex-direction: column;
    }
    .tpl-option:hover { border-color: var(--color-brand); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,.1); }
    .tpl-active { border-color: var(--color-brand) !important; box-shadow: 0 0 0 3px var(--color-brand-light) !important; }

    .tpl-preview {
      width: 100%; aspect-ratio: 16/10; overflow: hidden; position: relative;
    }
    .tpl-label {
      padding: .875rem 1rem;
      display: flex; flex-direction: column; gap: 2px;
      strong { font-size: .9375rem; color: var(--text-primary); font-weight: 700; }
      span { font-size: .8125rem; color: var(--text-muted); }
    }
    .tpl-check {
      position: absolute; top: .625rem; right: .625rem;
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--color-brand); color: white;
      font-size: .75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      z-index: 2;
    }

    /* Template 1 preview */
    .tpl-preview-classic { background: #f8f7f5; padding: 8px 8px 4px; display: flex; flex-direction: column; gap: 5px; }
    .tp-header { display: flex; flex-direction: column; gap: 3px; }
    .tp-bar { height: 5px; background: #d1cfc9; border-radius: 3px; width: 55%; }
    .tp-bar-short { width: 35%; height: 3px; }
    .tp-tabs { display: flex; gap: 4px; margin-top: 2px; }
    .tp-tab { height: 8px; width: 28px; background: #d1cfc9; border-radius: 4px; }
    .tp-tab-active { background: var(--color-brand); }
    .tp-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; flex: 1; }
    .tp-card { background: white; border-radius: 5px; overflow: hidden; padding-bottom: 5px; }
    .tp-card-img { height: 30px; background: #e8e5e0; }
    .tp-card-line { height: 3px; background: #d1cfc9; border-radius: 2px; margin: 4px 5px 2px; }
    .tp-card-line-short { width: 50%; }

    /* Template 2 preview */
    .tpl-preview-magazine { background: #faf9f7; display: flex; flex-direction: column; gap: 0; }
    .tp-mag-header { display: grid; grid-template-columns: 45% 1fr; }
    .tp-mag-title { background: white; padding: 6px; display: flex; flex-direction: column; justify-content: center; gap: 3px; }
    .tp-mag-title::before { content: ''; display: block; height: 3px; width: 16px; background: var(--color-brand); border-radius: 2px; }
    .tp-mag-title::after  { content: ''; display: block; height: 6px; width: 40px; background: #d1cfc9; border-radius: 2px; }
    .tp-mag-cover { background: linear-gradient(135deg, #c9c5be, #a8a39a); height: 40px; }
    .tp-mag-body { display: grid; grid-template-columns: 28px 1fr; flex: 1; }
    .tp-mag-sidebar { background: white; padding: 4px 3px; display: flex; flex-direction: column; gap: 3px; border-right: 1px solid #e5e2de; }
    .tp-mag-idx { height: 4px; background: #d1cfc9; border-radius: 2px; }
    .tp-mag-idx:first-child { background: var(--color-brand); }
    .tp-mag-main { padding: 4px; display: flex; flex-direction: column; gap: 4px; }
    .tp-mag-hero { background: white; border-radius: 4px; height: 32px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
    .tp-mag-mini-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
    .tp-mag-mini { background: white; border-radius: 3px; height: 22px; box-shadow: 0 1px 3px rgba(0,0,0,.06); }

    /* Template 3 preview */
    .tpl-preview-immersive { background: #0a0a0a; }
    .tp-imm-screen { position: relative; width: 100%; height: 100%; }
    .tp-imm-photo { position: absolute; inset: 0; background: linear-gradient(135deg, #2c3e50, #4a1942, #1a1a2e); opacity: .9; }
    .tp-imm-gradient { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,.8) 100%); }
    .tp-imm-progress { position: absolute; top: 0; left: 0; height: 3px; width: 60%; background: var(--color-brand); }
    .tp-imm-overlay {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px; display: flex; flex-direction: column; gap: 3px;
    }
    .tp-imm-chip { height: 7px; width: 36px; background: var(--color-brand); border-radius: 999px; }
    .tp-imm-title { height: 9px; width: 70%; background: white; border-radius: 3px; opacity: .9; }
    .tp-imm-desc { height: 5px; width: 85%; background: rgba(255,255,255,.5); border-radius: 2px; }
    .tp-imm-foot { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .tp-imm-price { height: 8px; width: 30px; background: var(--color-brand); border-radius: 2px; }
    .tp-imm-btn { height: 12px; width: 40px; background: var(--color-brand); border-radius: 999px; }

    /* Template 4 preview – Obsidian */
    .tpl-preview-obsidian {
      background: #080808; display: flex; flex-direction: column; gap: 0; overflow: hidden;
    }
    .tp-obs-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 5px 6px; background: rgba(255,255,255,.04);
      border-bottom: 1px solid rgba(255,255,255,.06);
    }
    .tp-obs-dot {
      width: 6px; height: 6px; border-radius: 50%; background: var(--color-brand); opacity: .8;
    }
    .tp-obs-tabs { display: flex; gap: 3px; }
    .tp-obs-tab {
      height: 6px; width: 22px; background: rgba(255,255,255,.12); border-radius: 3px;
    }
    .tp-obs-tab-active { background: var(--color-brand); opacity: .85; }
    .tp-obs-hero {
      position: relative; height: 38px; overflow: hidden;
      background: linear-gradient(135deg, #1a0a0a, #0a0a1a, #0d1a12);
    }
    .tp-obs-hero-photo {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #2a1020 0%, #0d1825 50%, #101a10 100%); opacity: .8;
    }
    .tp-obs-hero-text {
      position: absolute; bottom: 5px; left: 6px; display: flex; flex-direction: column; gap: 2px;
    }
    .tp-obs-label {
      height: 4px; width: 28px; background: var(--color-brand); border-radius: 2px; opacity: .7;
    }
    .tp-obs-title {
      height: 8px; width: 55px; background: rgba(255,255,255,.85); border-radius: 2px;
    }
    .tp-obs-desc {
      height: 4px; width: 70px; background: rgba(255,255,255,.3); border-radius: 2px;
    }
    .tp-obs-grid { flex: 1; display: flex; flex-direction: column; gap: 3px; padding: 4px 5px; }
    .tp-obs-featured {
      display: grid; grid-template-columns: 40% 1fr; gap: 3px;
      background: rgba(255,255,255,.04); border-radius: 4px; overflow: hidden;
      border: 1px solid rgba(255,255,255,.06);
    }
    .tp-obs-feat-img {
      background: linear-gradient(135deg, #2a1020, #1a0818); height: 22px;
    }
    .tp-obs-feat-info {
      padding: 3px 4px; display: flex; flex-direction: column; gap: 2px; justify-content: center;
    }
    .tp-obs-feat-title {
      height: 4px; width: 80%; background: rgba(255,255,255,.7); border-radius: 2px;
    }
    .tp-obs-feat-price {
      height: 4px; width: 40%; background: var(--color-brand); border-radius: 2px; opacity: .8;
    }
    .tp-obs-mini-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px; }
    .tp-obs-card {
      background: rgba(255,255,255,.04); border-radius: 4px; overflow: hidden;
      border: 1px solid rgba(255,255,255,.06); height: 26px;
    }
    .tp-obs-card-img {
      height: 16px;
      background: linear-gradient(135deg, #1a1a2a, #1a2a1a);
    }
    .tp-obs-card-line {
      height: 3px; margin: 2px 4px; background: rgba(255,255,255,.2); border-radius: 2px;
    }

    /* Template 5 preview – Lumière */
    .tpl-preview-lumiere {
      background: #faf9f5; display: flex; flex-direction: column; gap: 0; overflow: hidden;
    }
    .tp-lum-hero {
      height: 36px; background: linear-gradient(135deg, #1a1814, #2a2420); position: relative;
      display: flex; flex-direction: column; justify-content: flex-end; padding: 5px 6px;
      gap: 2px;
    }
    .tp-lum-hero-label {
      height: 4px; width: 30px; background: var(--color-brand); border-radius: 2px; opacity: .75;
    }
    .tp-lum-hero-title {
      height: 7px; width: 60px; background: rgba(255,255,255,.85); border-radius: 2px;
    }
    .tp-lum-hero-sub {
      height: 4px; width: 45px; background: rgba(255,255,255,.35); border-radius: 2px;
    }
    .tp-lum-nav {
      display: flex; gap: 3px; padding: 4px 5px;
      background: white; border-bottom: 1px solid #ece9e3;
    }
    .tp-lum-pill {
      height: 8px; width: 24px; background: #e8e5df; border-radius: 999px;
    }
    .tp-lum-pill-active {
      background: var(--color-brand); opacity: .85;
    }
    .tp-lum-bento {
      flex: 1; display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: auto auto;
      gap: 3px; padding: 4px 5px;
    }
    .tp-lum-featured {
      grid-column: span 2;
      background: white; border-radius: 5px; overflow: hidden;
      box-shadow: 0 1px 6px rgba(0,0,0,.07);
      display: grid; grid-template-columns: 50% 1fr;
    }
    .tp-lum-feat-img {
      background: linear-gradient(135deg, #d4c8be, #c4b8a8); height: 30px;
    }
    .tp-lum-feat-info {
      padding: 4px; display: flex; flex-direction: column; gap: 2px; justify-content: center;
    }
    .tp-lum-feat-title {
      height: 4px; width: 80%; background: #1a1814; border-radius: 2px; opacity: .7;
    }
    .tp-lum-feat-price {
      height: 4px; width: 40%; background: var(--color-brand); border-radius: 2px; opacity: .75;
    }
    .tp-lum-cell {
      background: white; border-radius: 5px; overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); height: 30px;
    }
    .tp-lum-cell-img {
      height: 18px; background: linear-gradient(135deg, #e0dbd4, #cec8c0);
    }
    .tp-lum-cell-line {
      height: 3px; margin: 2px 4px; background: #d8d4ce; border-radius: 2px;
    }
  `],
})
export class RestaurantComponent implements OnInit {
  private readonly restaurantService = inject(RestaurantService)
  private readonly fb = inject(FormBuilder)
  private readonly transloco = inject(TranslocoService)

  readonly restaurant = this.restaurantService.restaurant
  readonly saving      = signal(false)
  readonly logoSaving  = signal(false)
  readonly coverSaving = signal(false)
  readonly saveError   = signal<string | null>(null)
  readonly saveSuccess = signal(false)
  readonly logoPreview  = signal<string | null>(null)
  readonly coverPreview = signal<string | null>(null)
  readonly selectedTemplate = signal(1)
  readonly templateSuccess  = signal(false)

  readonly days = DAYS
  readonly currencyOptions = CURRENCIES

  form = this.fb.group({
    name: ['', Validators.required],
    slogan: [''],
    brandColor: ['#C0392B'],
    address: [''],
    phone: [''],
    email: [''],
    currency: ['XOF'],
  })

  ngOnInit(): void {
    this.restaurantService.loadAdmin().subscribe((r) => {
      this.form.patchValue({
        name: r.name,
        slogan: r.slogan ?? '',
        brandColor: r.brandColor,
        address: r.address ?? '',
        phone: r.phone ?? '',
        email: r.email ?? '',
        currency: r.currency ?? 'XOF',
      })
      this.selectedTemplate.set(r.templateId ?? 1)
    })
  }

  selectTemplate(id: 1 | 2 | 3 | 4 | 5): void {
    this.selectedTemplate.set(id)
    this.restaurantService.update({ templateId: id } as never).subscribe({
      next: () => {
        this.templateSuccess.set(true)
        setTimeout(() => this.templateSuccess.set(false), 2500)
      },
    })
  }

  getHours(day: string) {
    return this.restaurant()?.openingHours?.[day] ?? null
  }

  editHours(day: string): void {
    const hours = this.getHours(day)
    const open = prompt(this.transloco.translate('restaurant.hoursPromptOpen', { day }), hours?.open ?? '12:00')
    if (open === null) return
    const close = prompt(this.transloco.translate('restaurant.hoursPromptClose', { day }), hours?.close ?? '22:00')
    if (close === null) return

    const updated = {
      ...this.restaurant()?.openingHours,
      [day]: { open, close, closed: false },
    }
    this.restaurantService.update({ openingHours: updated } as never).subscribe()
  }

  onLogoChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => this.logoPreview.set(e.target?.result as string)
    reader.readAsDataURL(file)

    this.logoSaving.set(true)
    this.restaurantService.uploadLogo(file).subscribe({
      next: () => this.logoSaving.set(false),
      error: () => {
        this.logoSaving.set(false)
        alert(this.transloco.translate('restaurant.logoError'))
      },
    })
  }

  onCoverChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => this.coverPreview.set(e.target?.result as string)
    reader.readAsDataURL(file)

    this.coverSaving.set(true)
    this.restaurantService.uploadCover(file).subscribe({
      next: () => { this.coverSaving.set(false) },
      error: () => { this.coverSaving.set(false); alert(this.transloco.translate('restaurant.coverError')) },
    })
  }

  deleteCover(event: Event): void {
    event.stopPropagation()
    if (!confirm(this.transloco.translate('restaurant.coverDeleteConfirm'))) return
    this.coverPreview.set(null)
    this.restaurantService.deleteCover().subscribe()
  }

  onSubmit(): void {
    if (this.form.invalid) return

    this.saving.set(true)
    this.saveError.set(null)
    this.saveSuccess.set(false)

    this.restaurantService.update(this.form.value as never).subscribe({
      next: () => {
        this.saving.set(false)
        this.saveSuccess.set(true)
        setTimeout(() => this.saveSuccess.set(false), 3000)
      },
      error: (err) => {
        this.saving.set(false)
        this.saveError.set(err?.error?.message ?? this.transloco.translate('restaurant.saveError'))
      },
    })
  }
}
