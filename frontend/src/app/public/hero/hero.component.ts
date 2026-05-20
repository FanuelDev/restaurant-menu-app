import { Component, Input, ChangeDetectionStrategy, computed, signal, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslocoModule, TranslocoService } from '@jsverse/transloco'
import { trigger, style, animate, transition } from '@angular/animations'
import type { Restaurant } from '../../shared/models'

const DAY_KEYS: Record<string, string> = {
  monday: 'public.menu.dayMon', tuesday: 'public.menu.dayTue', wednesday: 'public.menu.dayWed',
  thursday: 'public.menu.dayThu', friday: 'public.menu.dayFri', saturday: 'public.menu.daySat', sunday: 'public.menu.daySun',
}
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(32px)' }),
        animate('0.75s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'none' })),
      ]),
    ]),
  ],
  templateUrl: './hero.component.html',
  styles: [`
    .hero {
      position: relative;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* ── Background ── */
    .hero-bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      transition: background-image .3s ease;
    }
    .hero-gradient {
      position: absolute; inset: 0;
      background: linear-gradient(
        160deg,
        color-mix(in srgb, var(--color-brand, #111) 90%, black) 0%,
        color-mix(in srgb, var(--color-brand, #111) 55%, black) 40%,
        rgba(0,0,0,0.88) 100%
      );
    }

    /* ── Body ── */
    .hero-body {
      position: relative; z-index: 2;
      display: flex; flex-direction: column; align-items: center;
      text-align: center;
      padding: var(--space-24, 6rem) var(--space-6, 1.5rem) var(--space-16, 4rem);
      max-width: 720px; width: 100%;
    }

    /* Logo */
    .hero-logo {
      width: 100px; height: 100px; border-radius: 50%;
      object-fit: cover; margin-bottom: var(--space-6, 1.5rem);
      border: 3px solid rgba(255,255,255,.35);
      box-shadow: 0 8px 32px rgba(0,0,0,.5);
    }
    .hero-logo-placeholder {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(255,255,255,.15); backdrop-filter: blur(8px);
      border: 2px solid rgba(255,255,255,.25);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: var(--space-6, 1.5rem);
    }

    /* Name */
    .hero-name {
      font-family: var(--font-display, Georgia, serif);
      font-size: clamp(2.4rem, 6vw, 5rem);
      font-weight: 400; color: white; line-height: 1.08;
      margin: 0 0 var(--space-4, 1rem);
      text-shadow: 0 2px 24px rgba(0,0,0,.5);
      letter-spacing: -0.02em;
    }

    /* Slogan */
    .hero-slogan {
      font-size: clamp(.95rem, 2vw, 1.25rem);
      color: rgba(255,255,255,.78); font-style: italic;
      font-weight: 300; letter-spacing: .01em;
      margin: 0 0 var(--space-8, 2rem);
      max-width: 560px;
    }

    /* Meta chips */
    .hero-meta {
      display: flex; flex-wrap: wrap; justify-content: center;
      gap: var(--space-3, .75rem); margin-bottom: var(--space-6, 1.5rem);
    }
    .hero-meta-chip {
      display: inline-flex; align-items: center; gap: var(--space-2, .5rem);
      background: rgba(255,255,255,.12); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,.18);
      border-radius: 999px; padding: .4rem 1rem;
      color: rgba(255,255,255,.88); font-size: .875rem;
      text-decoration: none; transition: background .2s;
    }
    .hero-meta-chip:hover { background: rgba(255,255,255,.2); }

    /* Status badge */
    .hero-status {
      display: inline-flex; align-items: center; gap: var(--space-2, .5rem);
      padding: .35rem .9rem; border-radius: 999px;
      font-size: .8125rem; font-weight: 600;
      margin-bottom: var(--space-8, 2rem);
      backdrop-filter: blur(8px);
    }
    .hero-status-open { background: rgba(34,197,94,.18); color: #86efac; border: 1px solid rgba(34,197,94,.3); }
    .hero-status-closed { background: rgba(239,68,68,.18); color: #fca5a5; border: 1px solid rgba(239,68,68,.3); }
    .hero-status-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: currentColor; animation: pulse 2s ease infinite;
    }

    /* CTA button */
    .hero-cta {
      display: inline-flex; align-items: center; gap: var(--space-3, .75rem);
      padding: .875rem 2.25rem;
      background: white; color: var(--color-brand, #111);
      border-radius: 999px; font-weight: 700; font-size: 1rem;
      text-decoration: none; letter-spacing: .01em;
      box-shadow: 0 4px 24px rgba(0,0,0,.35);
      transition: all .25s cubic-bezier(0.16,1,0.3,1);
    }
    .hero-cta:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,.45); }

    /* ── Hours panel ── */
    .hero-hours {
      position: relative; z-index: 2;
      width: 100%; margin-top: auto;
      background: rgba(0,0,0,.45); backdrop-filter: blur(16px);
      border-top: 1px solid rgba(255,255,255,.1);
    }
    .hero-hours-inner {
      display: flex; justify-content: center; flex-wrap: wrap;
      gap: 0; max-width: 900px; margin: 0 auto;
    }
    .hero-hours-day {
      display: flex; flex-direction: column; align-items: center;
      padding: .75rem 1.25rem; border-right: 1px solid rgba(255,255,255,.07);
      min-width: 80px;
    }
    .hero-hours-day:last-child { border-right: none; }
    .hero-hours-label { font-size: .7rem; font-weight: 700; color: rgba(255,255,255,.45); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 2px; }
    .hero-hours-time  { font-size: .8rem; color: rgba(255,255,255,.8); font-weight: 500; }
    .hero-hours-today .hero-hours-label { color: var(--color-brand, #fff); }
    .hero-hours-today .hero-hours-time  { color: white; font-weight: 700; }
    .hero-hours-closed .hero-hours-time { color: rgba(255,255,255,.35); }

    /* ── Scroll hint ── */
    .hero-scroll {
      position: absolute; bottom: 5rem; left: 50%; transform: translateX(-50%);
      z-index: 2;
    }
    .hero-scroll-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: rgba(255,255,255,.4);
      animation: scrollPulse 2s ease-in-out infinite;
    }

    @keyframes scrollPulse {
      0%,100% { opacity: .3; transform: scale(1); }
      50%      { opacity: 1;  transform: scale(1.6); }
    }
    @keyframes pulse {
      0%,100% { opacity: 1; }
      50%      { opacity: .4; }
    }

    @media (max-width: 600px) {
      .hero-hours-day { padding: .6rem .75rem; min-width: 60px; }
      .hero-hours-time { font-size: .75rem; }
    }
  `],
})
export class HeroComponent {
  private readonly transloco = inject(TranslocoService)

  static readonly DEFAULT_COVER = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80'

  @Input() set restaurant(r: Restaurant | null) { this._restaurant = r }
  get restaurant() { return this._restaurant }
  private _restaurant: Restaurant | null = null

  private t(key: string, params?: Record<string, unknown>): string {
    return this.transloco.translate(key, params)
  }

  coverBg(): string {
    const url = this._restaurant?.coverImageUrl || HeroComponent.DEFAULT_COVER
    return `url('${url}')`
  }

  /** Today's opening status */
  todayStatus(): { open: boolean; label: string } | null {
    const hours = this._restaurant?.openingHours
    if (!hours) return null
    const dayKey = DAY_ORDER[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]
    const day = hours[dayKey]
    if (!day) return null
    if (day.closed) return { open: false, label: this.t('public.menu.statusClosed') }

    const now = new Date()
    const [oh, om] = day.open.split(':').map(Number)
    const [ch, cm] = day.close.split(':').map(Number)
    const nowMin = now.getHours() * 60 + now.getMinutes()
    const openMin = oh * 60 + om
    const closeMin = ch * 60 + cm
    const isOpen = nowMin >= openMin && nowMin < closeMin
    return isOpen
      ? { open: true, label: this.t('public.menu.statusOpen', { time: day.close }) }
      : { open: false, label: nowMin < openMin
          ? this.t('public.menu.statusOpenAt', { time: day.open })
          : this.t('public.menu.statusClosedReopen', { next: this.nextOpenDay() }) }
  }

  openingHoursEntries(): { day: string; label: string; open: string; close: string; closed: boolean; isToday: boolean }[] {
    const hours = this._restaurant?.openingHours
    if (!hours) return []
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    return DAY_ORDER.map((day, i) => {
      const h = hours[day]
      return {
        day,
        label: this.t(DAY_KEYS[day]),
        open: h?.open ?? '',
        close: h?.close ?? '',
        closed: h?.closed ?? true,
        isToday: i === todayIdx,
      }
    })
  }

  private nextOpenDay(): string {
    const hours = this._restaurant?.openingHours
    if (!hours) return ''
    const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
    for (let i = 1; i <= 7; i++) {
      const idx = (todayIdx + i) % 7
      const h = hours[DAY_ORDER[idx]]
      if (h && !h.closed) return `${this.t(DAY_KEYS[DAY_ORDER[idx]])} à ${h.open}`
    }
    return ''
  }
}
