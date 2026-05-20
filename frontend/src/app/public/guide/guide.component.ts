import { Component, signal, ChangeDetectionStrategy, AfterViewInit, OnDestroy, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser, CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'
import { TranslocoModule } from '@jsverse/transloco'

interface GuideSection {
  id: string
  icon: string
  title: string
}

const SECTIONS: GuideSection[] = [
  { id: 'start',        icon: '🚀', title: 'Créer son compte et configurer son restaurant' },
  { id: 'menu',         icon: '📋', title: 'Gérer catégories et plats' },
  { id: 'appearance',   icon: '🎨', title: 'Personnaliser le design et les templates' },
  { id: 'qrcode',       icon: '📱', title: 'Générer et partager votre QR code' },
  { id: 'orders',       icon: '🛒', title: 'Recevoir et gérer les commandes (Enterprise)' },
  { id: 'reservations', icon: '📅', title: 'Gérer les réservations en ligne' },
  { id: 'team',         icon: '👥', title: 'Inviter et gérer des collaborateurs' },
  { id: 'stats',        icon: '📊', title: 'Analyser la performance de votre menu' },
  { id: 'finance',      icon: '💰', title: 'Gérer les finances de votre restaurant (Enterprise)' },
]

@Component({
  selector: 'app-guide',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslocoModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide.component.html',
  styles: [`
    :host { display: block; font-family: var(--font-body); color: var(--text-primary); }
    * { box-sizing: border-box; }
    .gd-container { max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6); }

    /* Nav */
    .gd-nav {
      position: sticky; top: 0; z-index: 200;
      background: rgba(255,255,255,.92); backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .gd-nav-inner {
      max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6);
      height: 64px; display: flex; align-items: center; justify-content: space-between;
    }
    .gd-logo { display: flex; align-items: center; gap: var(--space-3); text-decoration: none; }
    .gd-logo-icon {
      width: 32px; height: 32px; background: var(--brand); border-radius: var(--radius-md);
      display: flex; align-items: center; justify-content: center;
    }
    .gd-logo-name { font-weight: 700; font-size: 1rem; color: var(--text-primary); }
    .gd-nav-right { display: flex; align-items: center; gap: var(--space-3); }
    .gd-nav-login { font-size: .9rem; color: var(--text-secondary); text-decoration: none; font-weight: 500; }
    .gd-nav-cta {
      display: inline-flex; align-items: center;
      background: var(--brand); color: white; text-decoration: none;
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      font-size: .875rem; font-weight: 600;
    }
    @media (max-width: 480px) { .gd-nav-right { display: none; } }

    /* Progress bar */
    .gd-progress-bar {
      position: sticky; top: 64px; z-index: 150;
      height: 3px; background: var(--gray-100);
    }
    .gd-progress-fill {
      height: 100%; background: var(--brand);
      transition: width .1s linear;
    }

    /* Hero */
    .gd-hero {
      padding: 64px 0 56px; position: relative; overflow: hidden;
      background: linear-gradient(160deg, #FFF8F7 0%, white 60%);
      border-bottom: 1px solid var(--border);
    }
    .gd-hero-bg { position: absolute; inset: 0; pointer-events: none; }
    .gd-blob {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, rgba(192,57,43,.06) 0%, transparent 70%);
    }
    .gd-blob-1 { width: 500px; height: 500px; top: -150px; right: -100px; }
    .gd-blob-2 { width: 300px; height: 300px; bottom: -80px; left: 200px; background: radial-gradient(circle, rgba(37,99,235,.04) 0%, transparent 70%); }
    .gd-back { margin-bottom: var(--space-5); }
    .gd-back-link {
      display: inline-flex; align-items: center; gap: var(--space-2);
      font-size: .875rem; color: var(--text-muted); text-decoration: none; font-weight: 500;
      &:hover { color: var(--brand); }
    }
    .gd-hero-tag {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .gd-hero-h1 {
      font-family: var(--font-display); font-size: clamp(1.875rem, 4vw, 3rem);
      margin: 0 0 var(--space-4); line-height: 1.1;
    }
    .gd-hero-sub {
      font-size: 1.125rem; color: var(--text-secondary); margin: 0 0 var(--space-8);
      line-height: 1.7; max-width: 600px;
    }
    .gd-hero-pills { display: flex; flex-wrap: wrap; gap: var(--space-2); }
    .gd-hero-pills a {
      display: inline-flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4); border-radius: var(--radius-full);
      border: 1px solid var(--border); background: white;
      font-size: .875rem; font-weight: 500; color: var(--text-secondary);
      text-decoration: none; transition: all .2s;
      &:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-subtle); }
    }

    /* Layout */
    .gd-layout-wrap { background: white; }
    .gd-layout {
      max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6);
      display: grid; grid-template-columns: 240px 1fr; gap: 64px;
    }
    @media (max-width: 900px) { .gd-layout { grid-template-columns: 1fr; } }

    /* Sidebar */
    .gd-sidebar {
      padding-top: 48px;
      position: sticky;
      top: 88px;
      height: fit-content;
      align-self: start;
    }
    @media (max-width: 900px) { .gd-sidebar { display: none; } }
    .gd-toc-title {
      font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .08em;
      color: var(--text-muted); margin-bottom: var(--space-3);
    }
    .gd-toc-item {
      display: flex; align-items: center; gap: var(--space-3);
      padding: var(--space-2) var(--space-3); border-radius: var(--radius-md);
      font-size: .875rem; color: var(--text-secondary); text-decoration: none;
      transition: all .2s; border-left: 2px solid transparent;
      &:hover { color: var(--brand); background: var(--brand-subtle); border-left-color: var(--brand); }
    }
    .gd-toc-active { color: var(--brand) !important; background: var(--brand-subtle) !important; border-left-color: var(--brand) !important; font-weight: 600; }
    .gd-toc-icon { font-size: 1rem; }
    .gd-sidebar-cta {
      margin-top: var(--space-8); padding: var(--space-5); border-radius: var(--radius-xl);
      background: var(--brand-subtle); border: 1px solid rgba(192,57,43,.15);
    }
    .gd-sidebar-cta-title { font-size: .875rem; font-weight: 700; margin-bottom: var(--space-3); color: var(--brand); }
    .gd-sidebar-cta-btn {
      display: block; text-align: center; background: var(--brand); color: white;
      text-decoration: none; padding: var(--space-3); border-radius: var(--radius-lg);
      font-size: .875rem; font-weight: 700;
    }

    /* Main */
    .gd-main { padding: 48px 0 80px; }

    /* Sections */
    .gd-section { margin-bottom: 80px; padding-bottom: 80px; border-bottom: 1px solid var(--border); }
    .gd-section:last-of-type { border-bottom: none; }
    .gd-section-head { margin-bottom: var(--space-8); }
    .gd-section-badge {
      display: inline-block; font-size: .7rem; font-weight: 700; letter-spacing: .08em;
      text-transform: uppercase; color: var(--brand); background: var(--brand-subtle);
      padding: 3px 10px; border-radius: var(--radius-full); margin-bottom: var(--space-4);
    }
    .gd-badge-pro { background: linear-gradient(135deg, #7C3AED22, #5B21B622); color: #7C3AED; }
    .gd-badge-enterprise { background: linear-gradient(135deg, #f59e0b22, #d9770622); color: #d97706; }
    .gd-h2 {
      font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem);
      margin: 0 0 var(--space-3); line-height: 1.2;
    }
    .gd-h3 { font-size: 1rem; font-weight: 700; margin: 0 0 var(--space-3); }
    p { font-size: .9375rem; color: var(--text-secondary); line-height: 1.8; margin: 0 0 var(--space-4); }
    .gd-section-intro { font-size: 1.0625rem; color: var(--text-secondary); margin: 0; max-width: 600px; }

    /* Steps */
    .gd-steps { display: flex; flex-direction: column; gap: var(--space-5); margin-bottom: var(--space-8); }
    .gd-step { display: flex; gap: var(--space-5); align-items: flex-start; }
    .gd-step-num {
      width: 36px; height: 36px; border-radius: 50%; background: var(--brand); color: white;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: .9375rem; flex-shrink: 0; margin-top: 2px;
    }
    .gd-step-content { flex: 1; }
    .gd-step-title { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-2); }

    /* Feature grid */
    .gd-feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); margin-bottom: var(--space-8); }
    @media (max-width: 600px) { .gd-feature-grid { grid-template-columns: 1fr; } }
    .gd-feature-card {
      padding: var(--space-5) var(--space-6); border-radius: var(--radius-xl);
      border: 1px solid var(--border); background: white;
    }
    .gd-feature-icon {
      width: 40px; height: 40px; border-radius: var(--radius-lg);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.25rem; margin-bottom: var(--space-3);
    }
    .gd-feature-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }

    /* Mock frame */
    .gd-mock-frame {
      border-radius: var(--radius-xl); overflow: hidden;
      border: 1px solid var(--border);
      box-shadow: 0 8px 32px rgba(0,0,0,.08), 0 0 0 1px rgba(0,0,0,.04);
      margin-bottom: var(--space-3);
    }
    .gd-mock-bar {
      background: var(--gray-50); border-bottom: 1px solid var(--border);
      padding: 10px 16px; display: flex; align-items: center; gap: 12px;
    }
    .gd-mock-dots { display: flex; gap: 6px; }
    .gd-mock-dots span { width: 12px; height: 12px; border-radius: 50%; display: block; }
    .gd-mock-url {
      flex: 1; text-align: center; font-size: .75rem; color: var(--text-muted);
      background: white; border: 1px solid var(--border); border-radius: var(--radius-md);
      padding: 4px 12px;
    }
    .gd-mock-body { background: var(--gray-50); }
    .gd-mock-line { border-radius: 4px; }
    .gd-mock-field { }
    .gd-mock-field-label { height: 8px; width: 35%; background: var(--gray-150); border-radius: 4px; margin-bottom: 6px; }
    .gd-mock-field-input { height: 40px; background: white; border: 1px solid var(--border); border-radius: 8px; }
    .gd-mock-caption { font-size: .8125rem; color: var(--text-muted); text-align: center; margin-bottom: var(--space-6); }

    /* Templates grid */
    .gd-templates-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3); margin-bottom: var(--space-8); }
    @media (max-width: 768px) { .gd-templates-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (max-width: 480px) { .gd-templates-grid { grid-template-columns: 1fr 1fr; } }
    .gd-tpl-card { text-align: center; }
    .gd-tpl-preview {
      height: 110px; border-radius: var(--radius-xl); border: 2px solid var(--border);
      overflow: hidden; margin-bottom: var(--space-3);
      display: flex; align-items: center; justify-content: center;
      transition: border-color .2s;
      &:hover { border-color: var(--brand); }
    }
    .gd-tpl-preview-inner { width: 100%; height: 100%; }
    .gd-tpl-name { font-size: .875rem; font-weight: 700; margin-bottom: 2px; }
    .gd-tpl-desc { font-size: .75rem; color: var(--text-muted); }

    /* QR layout */
    .gd-qr-layout { display: grid; grid-template-columns: 1fr auto; gap: 48px; align-items: start; margin-bottom: var(--space-6); }
    @media (max-width: 700px) { .gd-qr-layout { grid-template-columns: 1fr; } }
    .gd-qr-steps { display: flex; flex-direction: column; gap: var(--space-6); }
    .gd-qr-step { display: flex; gap: var(--space-4); }
    .gd-qr-step-icon {
      width: 44px; height: 44px; border-radius: var(--radius-xl); flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .gd-qr-step-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }
    .gd-qr-visual { }
    .gd-qr-card {
      padding: var(--space-6); background: white; border-radius: var(--radius-2xl);
      border: 1px solid var(--border); box-shadow: var(--shadow-md); text-align: center;
      min-width: 180px;
    }
    .gd-qr-code {
      width: 140px; height: 140px; margin: 0 auto var(--space-3); padding: 8px;
      border: 2px solid var(--gray-200); border-radius: var(--radius-lg);
      background: white;
    }
    .gd-qr-grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 1px; height: 100%; }
    .gd-qr-cell { border-radius: 1px; background: white; }
    .gd-qr-dark { background: #1a1a1a; }
    .gd-qr-label { font-size: .75rem; color: var(--text-muted); font-weight: 500; margin-bottom: var(--space-3); }

    /* Flow */
    .gd-flow {
      display: flex; align-items: flex-start; gap: var(--space-4);
      margin-bottom: var(--space-8); flex-wrap: wrap;
    }
    .gd-flow-step {
      flex: 1; min-width: 180px; padding: var(--space-6);
      border: 1px solid var(--border); border-radius: var(--radius-xl);
      background: white; text-align: center;
    }
    .gd-flow-num {
      display: inline-flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%; background: var(--brand); color: white;
      font-size: .8rem; font-weight: 700; margin-bottom: var(--space-3);
    }
    .gd-flow-icon { font-size: 1.75rem; margin-bottom: var(--space-2); }
    .gd-flow-title { font-size: .9375rem; font-weight: 700; margin-bottom: var(--space-2); }
    .gd-flow-desc { font-size: .8125rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
    .gd-flow-arrow {
      font-size: 1.5rem; color: var(--text-muted); align-self: center;
      padding-top: 0;
    }
    @media (max-width: 600px) { .gd-flow-arrow { transform: rotate(90deg); width: 100%; text-align: center; } }

    /* Roles grid */
    .gd-roles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-5); }
    @media (max-width: 600px) { .gd-roles-grid { grid-template-columns: 1fr; } }
    .gd-role-card { padding: var(--space-6); border: 1px solid var(--border); border-radius: var(--radius-xl); background: white; }
    .gd-role-badge { display: inline-block; font-size: .75rem; font-weight: 700; padding: 3px 12px; border-radius: var(--radius-full); margin-bottom: var(--space-4); }
    .gd-role-title { font-size: 1rem; font-weight: 700; margin-bottom: var(--space-4); }
    .gd-role-list { padding-left: var(--space-5); margin: 0; display: flex; flex-direction: column; gap: var(--space-2); }
    .gd-role-list li { font-size: .875rem; color: var(--text-secondary); line-height: 1.6; }

    /* Two col */
    .gd-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
    @media (max-width: 768px) { .gd-two-col { grid-template-columns: 1fr; } }

    /* Tip box */
    .gd-tip-box {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4) var(--space-5); border-radius: var(--radius-xl);
      background: #FFFBEB; border: 1px solid #FDE68A; margin-bottom: var(--space-6);
    }
    .gd-tip-icon {
      width: 28px; height: 28px; border-radius: var(--radius-md);
      background: #FEF3C7; color: #D97706;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: .9rem;
    }
    .gd-tip-box p { margin: 0; font-size: .875rem; color: #92400E; line-height: 1.7; }

    /* Final CTA */
    .gd-final-cta {
      margin-top: var(--space-10); padding: 64px var(--space-8);
      background: linear-gradient(135deg, var(--brand) 0%, #922B21 100%);
      border-radius: var(--radius-2xl); text-align: center;
    }
    .gd-final-cta-inner { max-width: 560px; margin: 0 auto; }
    .gd-final-cta-icon { font-size: 2.5rem; margin-bottom: var(--space-4); }
    .gd-final-cta-h2 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 2rem); color: white; margin: 0 0 var(--space-3); }
    .gd-final-cta p { color: rgba(255,255,255,.8); font-size: 1.0625rem; margin-bottom: var(--space-8); }
    .gd-final-cta-actions { display: flex; gap: var(--space-3); justify-content: center; flex-wrap: wrap; }
    .gd-final-btn-primary {
      display: inline-flex; align-items: center;
      background: white; color: var(--brand); text-decoration: none;
      padding: var(--space-4) var(--space-8); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 700;
    }
    .gd-final-btn-ghost {
      display: inline-flex; align-items: center;
      border: 1px solid rgba(255,255,255,.4); color: white; text-decoration: none;
      padding: var(--space-4) var(--space-8); border-radius: var(--radius-full);
      font-size: .9375rem; font-weight: 600;
      &:hover { background: rgba(255,255,255,.1); }
    }

    /* Footer */
    .gd-footer { background: var(--gray-50); border-top: 1px solid var(--border); padding: var(--space-6) 0; }
    .gd-footer-inner { max-width: 1180px; margin: 0 auto; padding: 0 var(--space-6); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: var(--space-4); }
    .gd-footer-inner span { font-size: .875rem; color: var(--text-muted); }
    .gd-footer-links { display: flex; gap: var(--space-5); }
    .gd-footer-link { font-size: .875rem; color: var(--text-muted); text-decoration: none; &:hover { color: var(--brand); } }
  `],
})
export class GuideComponent implements AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID)

  readonly sections = SECTIONS
  readonly activeSection = signal(SECTIONS[0].id)
  readonly readProgress = signal(0)

  private observer?: IntersectionObserver
  private scrollHandler?: () => void

  readonly templates = [
    { nameKey: 'tplClassique', descKey: 'tplClassiqueDesc', color: '#C0392B', bg: '#FFF5F5', preview: `<div style="padding:8px;width:100%;height:100%"><div style="height:20px;background:#C0392B;border-radius:4px 4px 0 0;margin-bottom:6px"></div><div style="display:flex;flex-direction:column;gap:4px;padding:0 6px"><div style="height:6px;background:#e0e0e0;border-radius:3px;width:80%"></div><div style="height:6px;background:#e0e0e0;border-radius:3px;width:60%"></div><div style="height:6px;background:#e0e0e0;border-radius:3px;width:70%"></div></div></div>` },
    { nameKey: 'tplMagazine',  descKey: 'tplMagazineDesc',  color: '#2563EB', bg: '#EFF6FF', preview: `<div style="padding:8px;width:100%;height:100%"><div style="height:16px;background:#2563EB;border-radius:4px;margin-bottom:6px"></div><div style="display:flex;flex-direction:column;gap:4px;padding:0 4px"><div style="display:flex;gap:4px;height:22px"><div style="width:28px;background:#d0d0d0;border-radius:3px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center"><div style="height:5px;background:#e0e0e0;border-radius:2px"></div><div style="height:4px;background:#ebebeb;border-radius:2px;width:70%"></div></div></div><div style="display:flex;gap:4px;height:22px"><div style="width:28px;background:#d0d0d0;border-radius:3px;flex-shrink:0"></div><div style="flex:1;display:flex;flex-direction:column;gap:3px;justify-content:center"><div style="height:5px;background:#e0e0e0;border-radius:2px"></div><div style="height:4px;background:#ebebeb;border-radius:2px;width:60%"></div></div></div></div></div>` },
    { nameKey: 'tplImmersif',  descKey: 'tplImmersifDesc',  color: '#16A34A', bg: '#111',    preview: `<div style="position:relative;width:100%;height:100%;background:linear-gradient(180deg,#1a1a1a 0%,#333 100%)"><div style="position:absolute;bottom:10px;left:8px;right:8px"><div style="height:8px;background:rgba(255,255,255,.9);border-radius:3px;margin-bottom:4px;width:70%"></div><div style="height:6px;background:rgba(255,255,255,.5);border-radius:3px;width:50%"></div></div><div style="position:absolute;top:8px;left:8px;right:8px;height:10px;background:rgba(255,255,255,.1);border-radius:3px"></div></div>` },
    { nameKey: 'tplZen',       descKey: 'tplZenDesc',       color: '#D97706', bg: '#FFFBEB', preview: `<div style="padding:10px 8px;width:100%;height:100%"><div style="text-align:center;margin-bottom:8px"><div style="height:8px;background:#D97706;border-radius:3px;width:50%;margin:0 auto 4px"></div><div style="height:5px;background:#e8d5b0;border-radius:2px;width:70%;margin:0 auto"></div></div><div style="display:flex;flex-direction:column;gap:5px"><div style="height:5px;background:#e0e0e0;border-radius:2px;width:100%"></div><div style="height:5px;background:#e0e0e0;border-radius:2px;width:85%"></div><div style="height:5px;background:#e0e0e0;border-radius:2px;width:90%"></div></div></div>` },
    { nameKey: 'tplBento',     descKey: 'tplBentoDesc',     color: '#7C3AED', bg: '#F5F3FF', preview: `<div style="padding:6px;width:100%;height:100%;display:grid;grid-template-columns:1fr 1fr;gap:3px"><div style="background:#d4b8ff;border-radius:4px"></div><div style="background:#e0d0ff;border-radius:4px"></div><div style="background:#e0d0ff;border-radius:4px;grid-column:span 2;height:28px"></div><div style="background:#d4b8ff;border-radius:4px"></div><div style="background:#ebe5ff;border-radius:4px"></div></div>` },
  ]

  readonly orderBadges = [
    { labelKey: 'ordersStatusPending',   bg: '#FFF7ED', color: '#C2410C' },
    { labelKey: 'ordersStatusPreparing', bg: '#EFF6FF', color: '#1D4ED8' },
    { labelKey: 'ordersStatusReady',     bg: '#F0FDF4', color: '#15803D' },
    { labelKey: 'ordersStatusDelivered', bg: '#F9FAFB', color: '#6B7280' },
  ]

  readonly mockOrders = [
    { num: '042', statusKey: 'ordersStatusPreparing', statusBg: '#EFF6FF', statusColor: '#1D4ED8' },
    { num: '041', statusKey: 'ordersStatusPending',   statusBg: '#FFF7ED', statusColor: '#C2410C' },
    { num: '040', statusKey: 'ordersStatusReady',     statusBg: '#F0FDF4', statusColor: '#15803D' },
  ]

  readonly mockKpis = [
    { labelKey: 'statsKpi1', color: '#C0392B' },
    { labelKey: 'statsKpi2', color: '#2563EB' },
    { labelKey: 'statsKpi3', color: '#16A34A' },
    { labelKey: 'statsKpi4', color: '#7C3AED' },
  ]

  readonly chartBars = [45, 60, 38, 72, 55, 80, 65]

  readonly financeChartBars = [
    { l: '01/05', r: 42, e: 18 }, { l: '05/05', r: 30, e: 25 }, { l: '09/05', r: 50, e: 12 },
    { l: '13/05', r: 65, e: 10 }, { l: '17/05', r: 38, e: 20 }, { l: '21/05', r: 55, e: 15 },
    { l: '25/05', r: 48, e: 22 }, { l: '29/05', r: 60, e: 8  },
  ]

  readonly donutLegend = [
    { lKey: 'financeDonut1', c: '#f59e0b' },
    { lKey: 'financeDonut2', c: '#6366f1' },
    { lKey: 'financeDonut3', c: '#3b82f6' },
    { lKey: 'financeDonut4', c: '#8b5cf6' },
  ]

  readonly financePeriods = ['financePeriodToday', 'financePeriod7', 'financePeriodMonth', 'financePeriod6m', 'financePeriodYear']

  // QR code pattern (10x10 deterministic decorative)
  readonly qrCells: boolean[] = (() => {
    const p = '1110111011010010101111011100101010001011010100010111010110001011111010010110100011011001101101011010110001011001011010100101'
    return p.split('').map(c => c === '1')
  })()

  scrollTo(id: string): void {
    const el = document.getElementById(id)
    if (el) {
      const offset = 120 // nav + progress bar
      const top = el.getBoundingClientRect().top + window.scrollY - offset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return

    // Progress bar
    this.scrollHandler = () => {
      const doc = document.documentElement
      const scrolled = doc.scrollTop
      const total = doc.scrollHeight - doc.clientHeight
      this.readProgress.set(total > 0 ? Math.round((scrolled / total) * 100) : 0)
    }
    window.addEventListener('scroll', this.scrollHandler, { passive: true })

    // Active section tracker
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            this.activeSection.set(e.target.id)
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )

    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) this.observer!.observe(el)
    })
  }

  ngOnDestroy(): void {
    if (this.scrollHandler) window.removeEventListener('scroll', this.scrollHandler)
    this.observer?.disconnect()
  }
}
