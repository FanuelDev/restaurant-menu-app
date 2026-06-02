import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  forwardRef,
} from '@angular/core'
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms'
import { FormsModule } from '@angular/forms'
import intlTelInput from 'intl-tel-input/intlTelInputWithUtils'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyOptions = any

@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="iti-wrapper" [class.iti-invalid]="validity === false" [class.iti-valid]="validity === true">
      <input
        #phoneEl
        type="tel"
        class="iti-input"
        [placeholder]="placeholder"
        autocomplete="tel"
      />
    </div>
  `,
  styles: [`
    :host { display: block; }

    .iti-wrapper {
      /* let intl-tel-input take the full width */
      --iti-border-color: var(--border, #e2e1de);
      --iti-border-radius: var(--radius-md, 8px);
      --iti-hover-color: rgba(0,0,0,.04);
      --iti-dropdown-bg: var(--white, #fff);
      --iti-dropdown-border-color: var(--border, #e2e1de);
      --iti-input-padding: 0 .875rem;
      --iti-country-selector-bg: var(--gray-50, #fafaf9);
    }

    /* border highlight states */
    .iti-invalid ::ng-deep .iti__tel-input,
    .iti-invalid ::ng-deep .iti__selected-dial-code { border-color: var(--error, #ef4444) !important; }
    .iti-valid ::ng-deep .iti__tel-input { border-color: var(--success, #22c55e) !important; }
    .iti-valid ::ng-deep .iti__flag-container button { border-color: var(--success, #22c55e) !important; }

    /* native input styling to match form-control */
    ::ng-deep .iti {
      width: 100%;
    }
    ::ng-deep .iti__tel-input {
      width: 100%;
      height: 42px;
      border: 1px solid var(--border, #e2e1de);
      border-radius: var(--radius-md, 8px);
      padding: 0 .875rem 0 3.75rem;
      font-size: .9375rem;
      font-family: inherit;
      color: var(--text-primary, #1a1917);
      background: var(--white, #fff);
      outline: none;
      transition: border-color .15s;
      &:focus { border-color: var(--brand, #c0392b); box-shadow: 0 0 0 3px rgba(192,57,43,.12); }
      &::placeholder { color: var(--text-muted, #a8a29e); }
    }
    ::ng-deep .iti__flag-container {
      background: var(--gray-50, #fafaf9);
      border-right: 1px solid var(--border, #e2e1de);
      border-radius: var(--radius-md, 8px) 0 0 var(--radius-md, 8px);
    }
    ::ng-deep .iti__selected-flag,
    ::ng-deep .iti__selected-country {
      border-radius: var(--radius-md, 8px) 0 0 var(--radius-md, 8px);
      padding: 0 10px 0 12px;
      height: 42px;
      background: transparent;
      gap: 6px;
    }
    ::ng-deep .iti__country-list {
      border-radius: var(--radius-lg, 12px);
      border-color: var(--border, #e2e1de);
      box-shadow: var(--shadow-lg, 0 10px 40px rgba(0,0,0,.14));
      font-family: inherit;
      font-size: .875rem;
    }
    ::ng-deep .iti__search-input {
      border-bottom: 1px solid var(--border, #e2e1de);
      padding: 10px 14px;
      font-family: inherit;
      font-size: .875rem;
      outline: none;
    }
    ::ng-deep .iti__country.iti__highlight { background: var(--brand-light, rgba(192,57,43,.08)); }
    ::ng-deep .iti__dial-code { color: var(--text-muted, #a8a29e); }
  `],
})
export class PhoneInputComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('phoneEl') phoneEl!: ElementRef<HTMLInputElement>

  /** ISO2 country code used by default (e.g. 'ci', 'sn', 'fr') */
  @Input() initialCountry = 'ci'

  /** Countries shown at the top of the list, e.g. ['ci','sn','ml','fr'] */
  @Input() priorityCountries: string[] = ['ci', 'sn', 'ml', 'bf', 'cm', 'fr']

  /** Emits null (empty), true (valid) or false (invalid) */
  @Output() validityChange = new EventEmitter<boolean | null>()

  validity: boolean | null = null
  placeholder = ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private iti!: any
  private onChange: (val: string) => void = () => {}
  private onTouched: () => void = () => {}

  ngAfterViewInit(): void {
    const options: AnyOptions = {
      initialCountry: this.initialCountry,
      countryOrder: this.priorityCountries.length ? this.priorityCountries : null,
      separateDialCode: true,
      countrySearch: true,
      showSelectedDialCode: true,
      i18n: {
        searchPlaceholder: 'Rechercher un pays…',
        noCountrySelected: 'Sélectionner',
      },
    }

    this.iti = intlTelInput(this.phoneEl.nativeElement, options)

    const el = this.phoneEl.nativeElement
    el.addEventListener('input', () => this.handleChange())
    el.addEventListener('countrychange', () => this.handleChange())
    el.addEventListener('blur', () => { this.onTouched(); this.handleChange() })
  }

  private handleChange(): void {
    const number = this.iti?.getNumber() ?? ''
    this.onChange(number)
    if (!this.phoneEl.nativeElement.value.trim()) {
      this.validity = null
    } else {
      this.validity = this.iti?.isValidNumber() ?? false
    }
    this.validityChange.emit(this.validity)
  }

  // ── ControlValueAccessor ──────────────────────────────────────────────────

  writeValue(value: string): void {
    if (this.iti && value) {
      this.iti.setNumber(value)
    }
  }

  registerOnChange(fn: (val: string) => void): void { this.onChange = fn }
  registerOnTouched(fn: () => void): void { this.onTouched = fn }

  setDisabledState(isDisabled: boolean): void {
    if (this.phoneEl) this.phoneEl.nativeElement.disabled = isDisabled
  }

  ngOnDestroy(): void { this.iti?.destroy() }
}
