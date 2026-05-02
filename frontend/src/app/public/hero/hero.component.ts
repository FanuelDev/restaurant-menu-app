// frontend/src/app/public/hero/hero.component.ts
import { Component, Input, ChangeDetectionStrategy } from '@angular/core'
import { CommonModule } from '@angular/common'
import { trigger, state, style, animate, transition } from '@angular/animations'
import type { Restaurant } from '../../shared/models'

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlideIn', [
      state('void', style({ opacity: 0, transform: 'translateY(30px)' })),
      transition(':enter', [
        animate('0.7s cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
  template: `
    <section class="hero" aria-label="Présentation du restaurant">
      <!-- Overlay gradient -->
      <div class="hero__overlay" aria-hidden="true"></div>

      <div class="hero__content container" @fadeSlideIn>
        @if (restaurant?.logoUrl) {
          <img
            [src]="restaurant!.logoUrl"
            [alt]="restaurant!.name"
            class="hero__logo"
          />
        }

        <h1 class="hero__name">{{ restaurant?.name || 'Notre Restaurant' }}</h1>

        @if (restaurant?.slogan) {
          <p class="hero__slogan">{{ restaurant!.slogan }}</p>
        }

        <div class="hero__meta">
          @if (restaurant?.phone) {
            <a [href]="'tel:' + restaurant!.phone" class="hero__meta-item" aria-label="Téléphone">
              <span aria-hidden="true">📞</span> {{ restaurant!.phone }}
            </a>
          }
          @if (restaurant?.address) {
            <span class="hero__meta-item">
              <span aria-hidden="true">📍</span> {{ restaurant!.address }}
            </span>
          }
        </div>

        <a href="#menu-content" class="hero__cta" aria-label="Voir le menu">
          Découvrir le menu
          <span class="hero__cta-arrow" aria-hidden="true">↓</span>
        </a>
      </div>

      <!-- Scroll indicator -->
      <div class="hero__scroll-hint" aria-hidden="true">
        <div class="hero__scroll-dot"></div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      position: relative;
      min-height: 100svh;
      display: flex;
      align-items: center;
      background:
        /* Dégradé sombre sur l'image d'ambiance */
        linear-gradient(
          160deg,
          color-mix(in srgb, var(--color-brand) 85%, black) 0%,
          color-mix(in srgb, var(--color-brand) 40%, black) 50%,
          rgba(0, 0, 0, 0.92) 100%
        );
      overflow: hidden;

      /* Image d'ambiance générique — remplacer par une vraie photo */
      &::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80');
        background-size: cover;
        background-position: center;
        opacity: 0.2;
        mix-blend-mode: luminosity;
      }
    }

    .hero__overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 60% 40%, transparent 0%, rgba(0,0,0,0.4) 100%);
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--space-5);
    }

    .hero__content {
      position: relative;
      z-index: 1;
      padding: var(--space-20) var(--space-5);
      text-align: center;
    }

    .hero__logo {
      width: 96px;
      height: 96px;
      border-radius: var(--radius-xl);
      object-fit: cover;
      margin-bottom: var(--space-5);
      border: 3px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    .hero__name {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 7vw, 5.5rem);
      font-weight: 400;
      color: white;
      margin: 0 0 var(--space-4);
      line-height: 1.1;
      text-shadow: 0 2px 20px rgba(0, 0, 0, 0.4);
      letter-spacing: -0.02em;
    }

    .hero__slogan {
      font-size: clamp(1rem, 2.5vw, 1.375rem);
      color: rgba(255, 255, 255, 0.82);
      font-style: italic;
      margin: 0 auto var(--space-8);
      max-width: 600px;
      font-weight: 300;
      letter-spacing: 0.01em;
    }

    .hero__meta {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-6);
      flex-wrap: wrap;
      margin-bottom: var(--space-10);
    }

    .hero__meta-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      color: rgba(255, 255, 255, 0.75);
      font-size: 0.9375rem;
      text-decoration: none;
      transition: color 0.2s;

      &:hover { color: white; }
    }

    .hero__cta {
      display: inline-flex;
      align-items: center;
      gap: var(--space-3);
      padding: 1rem 2.5rem;
      background: white;
      color: var(--color-brand);
      border-radius: var(--radius-full);
      font-weight: 700;
      font-size: 1.0625rem;
      text-decoration: none;
      letter-spacing: 0.01em;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        background: color-mix(in srgb, var(--color-brand) 5%, white);
      }
    }

    .hero__cta-arrow {
      font-size: 1.25rem;
      animation: bounce 1.8s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(4px); }
    }

    .hero__scroll-hint {
      position: absolute;
      bottom: var(--space-8);
      left: 50%;
      transform: translateX(-50%);
    }

    .hero__scroll-dot {
      width: 6px;
      height: 6px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      animation: scrollPulse 2s ease-in-out infinite;
    }

    @keyframes scrollPulse {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.5); }
    }
  `],
})
export class HeroComponent {
  @Input() restaurant: import('../../shared/models').Restaurant | null = null
}
