import { Component, ChangeDetectionStrategy } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy.component.html',
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }

    .pv-container { max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6); }

    /* Nav */
    .pv-nav {
      position: sticky; top: 0; z-index: 100;
      background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .pv-nav-inner {
      max-width: 1100px; margin: 0 auto; padding: 0 var(--space-6);
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .pv-logo { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; }
    .pv-logo-icon {
      width: 32px; height: 32px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .pv-logo-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .pv-nav-right { display: flex; align-items: center; gap: var(--space-3); }
    .pv-nav-login { font-size: .9rem; color: var(--text-secondary); text-decoration: none; font-weight: 500; }
    .pv-nav-cta {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .875rem; font-weight: 600;
    }
    @media (max-width: 480px) { .pv-nav-right { display: none; } }

    /* Hero */
    .pv-hero {
      background: linear-gradient(160deg, var(--gray-50) 0%, white 100%);
      padding: 56px 0 48px; border-bottom: 1px solid var(--border);
    }
    .pv-back { margin-bottom: var(--space-5); }
    .pv-back-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-decoration: none; font-weight: 500;
      transition: color .2s;
      &:hover { color: var(--brand); }
    }
    .pv-hero-tag {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .pv-hero-h1 {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      margin: 0 0 var(--space-3); line-height: 1.15;
    }
    .pv-hero-sub { font-size: .9rem; color: var(--text-muted); margin: 0; }

    /* Body layout */
    .pv-body { padding: 64px 0 96px; }
    .pv-layout { display: grid; grid-template-columns: 220px 1fr; gap: 64px; align-items: start; }
    @media (max-width: 768px) { .pv-layout { grid-template-columns: 1fr; gap: 0; } }

    /* TOC */
    .pv-toc { position: sticky; top: 88px; }
    @media (max-width: 768px) { .pv-toc { display: none; } }
    .pv-toc-title { font-size: .75rem; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: var(--space-3); }
    .pv-toc-nav { display: flex; flex-direction: column; gap: 2px; }
    .pv-toc-link {
      font-size: .875rem; color: var(--text-secondary); text-decoration: none;
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      border-left: 2px solid transparent; transition: all .2s;
      &:hover { color: var(--brand); background: var(--brand-subtle); border-left-color: var(--brand); }
    }

    /* Article */
    .pv-article { min-width: 0; }
    .pv-intro {
      font-size: 1.0625rem; color: var(--text-secondary); line-height: 1.8;
      padding: var(--space-6); background: var(--gray-50); border-radius: var(--radius-xl);
      border: 1px solid var(--border); margin-bottom: var(--space-10);
    }
    .pv-section { margin-bottom: var(--space-12); }
    .pv-h2 {
      font-family: var(--font-display); font-size: 1.5rem;
      margin: 0 0 var(--space-5); padding-bottom: var(--space-4);
      border-bottom: 2px solid var(--brand-subtle); color: var(--text-primary);
    }
    .pv-h3 { font-size: 1rem; font-weight: 700; margin: var(--space-6) 0 var(--space-3); color: var(--text-primary); }
    p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 var(--space-4); }
    .pv-list { padding-left: var(--space-5); margin: 0 0 var(--space-4); display: flex; flex-direction: column; gap: var(--space-2); }
    .pv-list li { font-size: .9375rem; color: var(--text-secondary); line-height: 1.7; }
    .pv-link { color: var(--brand); text-decoration: none; font-weight: 500; &:hover { text-decoration: underline; } }

    /* Table */
    .pv-table-wrap { overflow-x: auto; margin: var(--space-4) 0; border-radius: var(--radius-xl); border: 1px solid var(--border); }
    .pv-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
    .pv-table th { background: var(--gray-50); font-weight: 700; color: var(--text-primary); text-align: left; padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border); }
    .pv-table td { padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--border); color: var(--text-secondary); }
    .pv-table tr:last-child td { border-bottom: none; }
    code { font-family: monospace; font-size: .85em; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }

    /* Rights grid */
    .pv-rights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin: var(--space-5) 0; }
    @media (max-width: 600px) { .pv-rights-grid { grid-template-columns: 1fr; } }
    .pv-right-card {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl);
      border: 1px solid var(--border); background: white;
    }
    .pv-right-icon {
      width: 36px; height: 36px; background: var(--brand-subtle); color: var(--brand);
      border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .pv-right-title { font-size: .875rem; font-weight: 700; margin-bottom: 2px; }
    .pv-right-desc { font-size: .8125rem; color: var(--text-muted); line-height: 1.6; }

    /* Contact box */
    .pv-contact-box {
      padding: var(--space-5) var(--space-6); background: var(--gray-50);
      border-radius: var(--radius-xl); border: 1px solid var(--border);
      display: flex; flex-direction: column; gap: var(--space-3); margin: var(--space-4) 0;
    }
    .pv-contact-row { display: flex; align-items: center; gap: var(--space-3); font-size: .9375rem; color: var(--text-secondary); }

    /* Footer note */
    .pv-footer-note {
      padding: var(--space-5) var(--space-6); background: var(--brand-subtle);
      border-radius: var(--radius-xl); border: 1px solid rgba(192,57,43,.15);
      font-size: .875rem; color: var(--brand); line-height: 1.7;
    }

    /* Footer */
    .pv-footer { background: var(--gray-50); border-top: 1px solid var(--border); padding: var(--space-6) 0; }
    .pv-footer-inner { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .pv-footer-inner span { font-size: .875rem; color: var(--text-muted); }
    .pv-footer-links { display: flex; gap: var(--space-5); }
    .pv-footer-link { font-size: .875rem; color: var(--text-muted); text-decoration: none; &:hover { color: var(--brand); } }
  `],
})
export class PrivacyComponent {}
