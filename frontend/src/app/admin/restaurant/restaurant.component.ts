// frontend/src/app/admin/restaurant/restaurant.component.ts
import { Component, inject, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'

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
  template: `
    <ng-container *transloco="let t">
    <div class="page-container">
      <header class="page-header">
        <div>
          <h1 class="page-title">{{ t('restaurant.title') }}</h1>
          <p class="page-subtitle">{{ t('restaurant.subtitle') }}</p>
        </div>
      </header>

      <div class="two-col">
        <div class="main-col">
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="card">
              <h2 class="card-title">{{ t('restaurant.sectionIdentity') }}</h2>

              <div class="form-group">
                <label class="form-label">{{ t('restaurant.logoLabel') }}</label>
                <div class="logo-zone" (click)="logoInput.click()" role="button" tabindex="0" (keydown.enter)="logoInput.click()">
                  @if (logoPreview() || restaurant()?.logoUrl) {
                    <img [src]="logoPreview() || restaurant()!.logoUrl" alt="Logo" class="logo-preview" />
                    <div class="logo-overlay">{{ t('restaurant.logoChange') }}</div>
                  } @else {
                    <div class="logo-placeholder">
                      <span aria-hidden="true">🏪</span>
                      <span>{{ t('restaurant.logoUpload') }}</span>
                    </div>
                  }
                </div>
                <input #logoInput type="file" accept="image/*" class="file-input-hidden" (change)="onLogoChange($event)" />
                @if (logoSaving()) {
                  <p class="uploading-hint">{{ t('common.uploadInProgress') }}</p>
                }
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('restaurant.coverLabel') }}</label>
                <div class="cover-zone" (click)="coverInput.click()" role="button" tabindex="0" (keydown.enter)="coverInput.click()">
                  @if (coverPreview() || restaurant()?.coverImageUrl) {
                    <img [src]="coverPreview() || restaurant()!.coverImageUrl!" alt="Cover" class="cover-preview" />
                    <div class="cover-overlay">
                      <span>{{ t('restaurant.coverChange') }}</span>
                    </div>
                  } @else {
                    <div class="cover-placeholder">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                      <span>{{ t('restaurant.coverAdd') }}</span>
                      <small>{{ t('restaurant.coverHint') }}</small>
                    </div>
                  }
                </div>
                <input #coverInput type="file" accept="image/*" class="file-input-hidden" (change)="onCoverChange($event)" />
                <div class="cover-actions">
                  @if (coverSaving()) {
                    <span class="uploading-hint">{{ t('common.uploadInProgress') }}</span>
                  }
                  @if (restaurant()?.coverImageUrl && !coverSaving()) {
                    <button type="button" class="btn btn-ghost btn-sm cover-delete-btn" (click)="deleteCover($event)">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6M14 11v6"/></svg>
                      {{ t('restaurant.coverDelete') }}
                    </button>
                  }
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="r-name">{{ t('restaurant.fieldName') }} *</label>
                <input id="r-name" type="text" class="form-control" formControlName="name" />
              </div>

              <div class="form-group">
                <label class="form-label" for="r-slogan">{{ t('restaurant.fieldSlogan') }}</label>
                <input id="r-slogan" type="text" class="form-control" formControlName="slogan" [placeholder]="t('restaurant.fieldSloganPlaceholder')" />
              </div>

              <div class="form-group">
                <label class="form-label" for="r-color">{{ t('restaurant.fieldColor') }}</label>
                <div class="color-input-row">
                  <input id="r-color" type="color" class="color-picker" formControlName="brandColor" />
                  <input type="text" class="form-control" formControlName="brandColor" placeholder="#C0392B" />
                </div>
              </div>
            </div>

            <div class="card">
              <h2 class="card-title">{{ t('restaurant.sectionContact') }}</h2>

              <div class="form-group">
                <label class="form-label" for="r-addr">{{ t('restaurant.fieldAddress') }}</label>
                <input id="r-addr" type="text" class="form-control" formControlName="address" />
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label class="form-label" for="r-phone">{{ t('restaurant.fieldPhone') }}</label>
                  <input id="r-phone" type="tel" class="form-control" formControlName="phone" />
                </div>
                <div class="form-group flex-1">
                  <label class="form-label" for="r-email">{{ t('restaurant.fieldEmail') }}</label>
                  <input id="r-email" type="email" class="form-control" formControlName="email" />
                </div>
              </div>
            </div>

            @if (saveError()) {
              <div class="alert-error" role="alert">{{ saveError() }}</div>
            }
            @if (saveSuccess()) {
              <div class="alert-success" role="status">✅ {{ t('restaurant.saveSuccess') }}</div>
            }

            <button type="submit" class="btn btn-primary btn-large" [disabled]="saving()">
              {{ saving() ? t('common.saving') : t('restaurant.submitSave') }}
            </button>
          </form>

          <!-- Template selector -->
          <div class="card tpl-card">
            <h2 class="card-title">🎨 Apparence du menu client</h2>
            <p class="tpl-subtitle">Choisissez la mise en page de votre page menu publique.</p>
            @if (templateSuccess()) {
              <div class="alert-success" role="status" style="margin-bottom:1rem">✅ Template mis à jour.</div>
            }
            <div class="tpl-grid">

              <!-- Template 1 : Classique -->
              <button class="tpl-option" [class.tpl-active]="selectedTemplate() === 1" (click)="selectTemplate(1)" type="button">
                <div class="tpl-preview tpl-preview-classic">
                  <div class="tp-header">
                    <div class="tp-bar"></div>
                    <div class="tp-bar tp-bar-short"></div>
                  </div>
                  <div class="tp-tabs">
                    <div class="tp-tab tp-tab-active"></div>
                    <div class="tp-tab"></div>
                    <div class="tp-tab"></div>
                  </div>
                  <div class="tp-grid">
                    @for (i of [1,2,3,4,5,6]; track i) {
                      <div class="tp-card">
                        <div class="tp-card-img"></div>
                        <div class="tp-card-line"></div>
                        <div class="tp-card-line tp-card-line-short"></div>
                      </div>
                    }
                  </div>
                </div>
                <div class="tpl-label">
                  <strong>Classique</strong>
                  <span>Grille élégante avec recherche et filtres</span>
                </div>
                @if (selectedTemplate() === 1) { <div class="tpl-check">✓</div> }
              </button>

              <!-- Template 2 : Magazine -->
              <button class="tpl-option" [class.tpl-active]="selectedTemplate() === 2" (click)="selectTemplate(2)" type="button">
                <div class="tpl-preview tpl-preview-magazine">
                  <div class="tp-mag-header">
                    <div class="tp-mag-title"></div>
                    <div class="tp-mag-cover"></div>
                  </div>
                  <div class="tp-mag-body">
                    <div class="tp-mag-sidebar">
                      <div class="tp-mag-idx"></div>
                      <div class="tp-mag-idx"></div>
                      <div class="tp-mag-idx"></div>
                    </div>
                    <div class="tp-mag-main">
                      <div class="tp-mag-hero"></div>
                      <div class="tp-mag-mini-row">
                        <div class="tp-mag-mini"></div>
                        <div class="tp-mag-mini"></div>
                        <div class="tp-mag-mini"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="tpl-label">
                  <strong>Magazine</strong>
                  <span>Éditorial chic avec index latéral</span>
                </div>
                @if (selectedTemplate() === 2) { <div class="tpl-check">✓</div> }
              </button>

              <!-- Template 3 : Immersif -->
              <button class="tpl-option" [class.tpl-active]="selectedTemplate() === 3" (click)="selectTemplate(3)" type="button">
                <div class="tpl-preview tpl-preview-immersive">
                  <div class="tp-imm-screen">
                    <div class="tp-imm-photo"></div>
                    <div class="tp-imm-gradient"></div>
                    <div class="tp-imm-progress"></div>
                    <div class="tp-imm-overlay">
                      <div class="tp-imm-chip"></div>
                      <div class="tp-imm-title"></div>
                      <div class="tp-imm-desc"></div>
                      <div class="tp-imm-foot">
                        <div class="tp-imm-price"></div>
                        <div class="tp-imm-btn"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="tpl-label">
                  <strong>Immersif</strong>
                  <span>Plein écran par swipe, style app luxe</span>
                </div>
                @if (selectedTemplate() === 3) { <div class="tpl-check">✓</div> }
              </button>

            </div>
          </div>
        </div>

        <div class="side-col">
          <div class="card">
            <h2 class="card-title">{{ t('restaurant.hoursTitle') }}</h2>
            <div class="hours-list">
              @for (day of days; track day.key) {
                <div class="hours-row">
                  <span class="hours-day">{{ t('restaurant.days.' + day.key) }}</span>
                  @if (getHours(day.key)?.closed) {
                    <span class="hours-closed">{{ t('restaurant.hoursClosed') }}</span>
                  } @else {
                    <span class="hours-time">{{ getHours(day.key)?.open }} – {{ getHours(day.key)?.close }}</span>
                  }
                  <button class="btn-icon" (click)="editHours(day.key)" [attr.aria-label]="t('restaurant.hoursEditAria', { day: t('restaurant.days.' + day.key) })">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    </ng-container>
  `,
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
      display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--space-4);
    }
    @media (max-width: 900px) { .tpl-grid { grid-template-columns: 1fr; } }

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

  form = this.fb.group({
    name: ['', Validators.required],
    slogan: [''],
    brandColor: ['#C0392B'],
    address: [''],
    phone: [''],
    email: [''],
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
      })
      this.selectedTemplate.set(r.templateId ?? 1)
    })
  }

  selectTemplate(id: 1 | 2 | 3): void {
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
