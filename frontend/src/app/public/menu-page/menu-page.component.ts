// frontend/src/app/public/menu-page/menu-page.component.ts
import { Component, inject, OnInit, OnDestroy, signal, computed, AfterViewInit, PLATFORM_ID } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TranslocoModule } from '@jsverse/transloco'
import { MenuService } from '../../shared/services/menu.service'
import { RestaurantService } from '../../shared/services/restaurant.service'
import { OrderService } from '../../shared/services/order.service'
import { ReservationService } from '../../shared/services/reservation.service'
import { HeroComponent } from '../hero/hero.component'
import { CategoryTabsComponent } from '../category-tabs/category-tabs.component'
import { DishCardComponent } from '../dish-card/dish-card.component'
import type { MenuItemBadge, CartItem, MenuItem, Order, CreateReservationPayload } from '../../shared/models'
import { TemplateMagazineComponent } from '../templates/template-magazine.component'
import { TemplateImmersiveComponent } from '../templates/template-immersive.component'
import { TemplateZenComponent } from '../templates/template-zen.component'
import { TemplateBentoComponent } from '../templates/template-bento.component'
import QRCode from 'qrcode'

@Component({
  selector: 'app-menu-page',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoModule, HeroComponent, CategoryTabsComponent, DishCardComponent, TemplateMagazineComponent, TemplateImmersiveComponent, TemplateZenComponent, TemplateBentoComponent],
  templateUrl: './menu-page.component.html',
  styles: [`
    .menu-page { min-height: 100vh; background: var(--bg); }
    .container { max-width: 1200px; margin: 0 auto; padding: 0 var(--space-5); }

    .filter-section {
      background: var(--surface-1);
      border-bottom: 1px solid var(--border);
      padding: var(--space-4) 0;
      position: sticky;
      top: 0;
      z-index: 40;
    }
    .filters { display: flex; align-items: center; gap: var(--space-4); flex-wrap: wrap; }
    .search-wrap { position: relative; flex: 1; min-width: 200px; max-width: 320px; }
    .search-icon { position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); font-size: 0.9rem; }
    .search-input {
      width: 100%;
      padding: 0.5rem 1rem 0.5rem 2.25rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      background: var(--surface-2);
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-family: var(--font-body);
      box-sizing: border-box;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .filter-chips { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .chip {
      padding: 0.375rem 0.875rem;
      border-radius: var(--radius-full);
      border: 1.5px solid var(--border);
      background: var(--surface-1);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;
    }
    .chip:hover { border-color: var(--color-brand); color: var(--color-brand); }
    .chip-active { background: var(--color-brand); border-color: var(--color-brand); color: white; }

    .menu-content { padding: var(--space-10) var(--space-5); }
    .category-section { margin-bottom: var(--space-14); scroll-margin-top: 130px; }
    .category-header { margin-bottom: var(--space-6); }
    .category-title {
      font-family: var(--font-display);
      font-size: clamp(1.75rem, 3vw, 2.5rem);
      color: var(--text-primary);
      margin: 0 0 var(--space-2);
      display: inline-block;
    }
    .category-title::after {
      content: '';
      display: block;
      width: 3rem;
      height: 3px;
      background: var(--color-brand);
      margin-top: var(--space-2);
      border-radius: 2px;
    }
    .category-desc { color: var(--text-muted); font-size: 1rem; margin: 0; }
    .dishes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
      gap: var(--space-5);
    }

    .loading-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--space-5); padding: var(--space-10) 0; }
    .skeleton-card {
      height: 320px;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, var(--surface-2) 25%, var(--surface-1) 50%, var(--surface-2) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .empty-menu { text-align: center; padding: var(--space-20) 0; color: var(--text-muted); font-size: 1.125rem; }

    /* ─── Reservation FAB ─── */
    .res-fab {
      position: fixed;
      bottom: var(--space-6);
      left: var(--space-6);
      z-index: 200;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 13px 20px;
      background: var(--surface-1);
      color: var(--text-primary);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 18px rgba(0,0,0,.14);
      transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
    }
    .res-fab:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(0,0,0,.18);
      border-color: var(--color-brand);
      color: var(--color-brand);
    }
    .res-fab svg { color: var(--color-brand); flex-shrink: 0; }
    .res-fab-label { font-size: 0.9rem; }

    /* ─── Reservation backdrop ─── */
    .res-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 300;
      animation: fadeIn 0.2s ease;
    }

    /* ─── Reservation drawer ─── */
    .res-drawer {
      position: fixed;
      top: 0; left: 0; bottom: 0;
      width: min(440px, 100vw);
      background: var(--surface-1);
      z-index: 301;
      display: flex; flex-direction: column;
      box-shadow: 4px 0 32px rgba(0,0,0,.15);
      animation: slideInLeft 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
      overflow: hidden;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }

    /* Drawer header */
    .res-drawer-header {
      position: relative;
      padding: var(--space-6) var(--space-6) var(--space-5);
      overflow: hidden;
      flex-shrink: 0;
    }
    .res-drawer-header-bg {
      position: absolute; inset: 0;
      background: linear-gradient(135deg, var(--color-brand) 0%, color-mix(in srgb, var(--color-brand) 75%, #000) 100%);
      opacity: 0.92;
    }
    .res-header-content {
      position: relative; z-index: 1;
      display: flex; align-items: center; gap: var(--space-4);
    }
    .res-header-icon {
      width: 44px; height: 44px; border-radius: var(--radius-lg);
      background: rgba(255,255,255,.2);
      display: flex; align-items: center; justify-content: center;
      color: white; flex-shrink: 0;
    }
    .res-drawer-title {
      font-size: 1.125rem; font-weight: 700;
      color: white; margin: 0 0 2px;
    }
    .res-drawer-sub { font-size: 0.8125rem; color: rgba(255,255,255,.75); margin: 0; }
    .res-close-btn {
      position: absolute; top: var(--space-4); right: var(--space-4); z-index: 2;
      width: 30px; height: 30px; border-radius: 50%;
      border: none; background: rgba(255,255,255,.2);
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .res-close-btn:hover { background: rgba(255,255,255,.35); }

    /* Drawer body */
    .res-drawer-body {
      flex: 1; overflow-y: auto;
      padding: var(--space-5) var(--space-6);
    }

    /* Form layout */
    .res-form { display: flex; flex-direction: column; gap: var(--space-5); }
    .res-form-group {
      display: flex; flex-direction: column; gap: var(--space-3);
      background: white;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: var(--space-4) var(--space-4) var(--space-5);
    }
    .res-group-label {
      display: flex; align-items: center; gap: 6px;
      font-size: 0.75rem; font-weight: 700; letter-spacing: .07em;
      text-transform: uppercase; color: var(--text-muted);
    }
    .res-group-label svg { color: var(--color-brand); flex-shrink: 0; }
    .res-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }
    .res-field { display: flex; flex-direction: column; gap: 5px; }
    .res-label { font-size: 0.8125rem; font-weight: 600; color: var(--text-secondary); }
    .res-input {
      padding: 9px 12px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-2);
      color: var(--text-primary);
      font-size: 0.9rem; font-family: var(--font-body);
      box-sizing: border-box; width: 100%;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .res-input:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .res-textarea { resize: vertical; min-height: 72px; }

    /* Guests stepper */
    .res-guests-ctrl {
      display: flex; align-items: center; gap: var(--space-3);
    }
    .res-guests-btn {
      width: 34px; height: 34px; border-radius: 50%;
      border: 1.5px solid var(--border); background: var(--surface-2);
      font-size: 1.125rem; font-weight: 700; cursor: pointer;
      color: var(--text-primary);
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
    }
    .res-guests-btn:hover { border-color: var(--color-brand); color: var(--color-brand); background: var(--color-brand-light); }
    .res-guests-val {
      font-size: 1.5rem; font-weight: 800;
      color: var(--text-primary); min-width: 32px; text-align: center;
    }
    .res-guests-unit { font-size: 0.875rem; color: var(--text-muted); font-weight: 500; }

    /* Error */
    .res-error {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 14px;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: var(--radius-md);
      color: #dc2626; font-size: 0.875rem;
    }
    .res-error svg { flex-shrink: 0; }

    /* Submit button */
    .res-submit {
      width: 100%; padding: 13px 20px;
      background: var(--color-brand); color: white; border: none;
      border-radius: var(--radius-lg);
      font-size: 0.9375rem; font-weight: 700; cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 8px;
      transition: opacity 0.15s, transform 0.15s;
    }
    .res-submit:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); }
    .res-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

    /* Submit spinner */
    .res-spinner {
      width: 15px; height: 15px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: white;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }

    /* Success state */
    .res-success {
      display: flex; flex-direction: column; align-items: center;
      gap: var(--space-4); padding: var(--space-8) var(--space-4);
      text-align: center;
      animation: fadeIn 0.4s ease;
    }
    .res-success-anim {
      position: relative;
      width: 80px; height: 80px;
      display: flex; align-items: center; justify-content: center;
    }
    .res-success-ring {
      position: absolute; inset: 0; border-radius: 50%;
      background: var(--color-brand);
      animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    @keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .res-success-anim svg { position: relative; z-index: 1; }
    .res-success-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    .res-success-desc { font-size: 0.9rem; color: var(--text-muted); margin: 0; max-width: 280px; }
    .res-new-btn {
      margin-top: var(--space-2);
      padding: 10px 22px;
      background: transparent; color: var(--color-brand);
      border: 1.5px solid var(--color-brand);
      border-radius: var(--radius-full);
      font-size: 0.9rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .res-new-btn:hover { background: var(--color-brand); color: white; }

    /* Shared form styles */
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-field { display: flex; flex-direction: column; gap: 6px; }
    .form-field-sm { max-width: 120px; }
    .form-label { font-size: 0.875rem; font-weight: 600; color: var(--text-secondary); }
    .form-input {
      padding: 10px 14px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-2);
      color: var(--text-primary);
      font-size: 0.9375rem;
      font-family: var(--font-body);
      box-sizing: border-box;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    .form-input:focus { outline: none; border-color: var(--color-brand); box-shadow: 0 0 0 3px var(--color-brand-light); }
    .form-textarea { resize: vertical; min-height: 70px; }
    .form-error { color: var(--error); font-size: 0.875rem; margin: 0; }

    /* Buttons */
    .btn-primary {
      padding: 12px 24px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
    }
    .btn-primary:hover:not(:disabled) { opacity: 0.88; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary.btn-full { width: 100%; }
    .btn-outline {
      padding: 10px 20px;
      border: 1.5px solid var(--color-brand);
      background: transparent;
      color: var(--color-brand);
      border-radius: var(--radius-md);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .btn-outline:hover { background: var(--color-brand); color: white; }

    /* Menu footer */
    .menu-footer { background: var(--surface-1); border-top: 1px solid var(--border); padding: var(--space-8) 0; }
    .footer-content { display: flex; align-items: center; gap: var(--space-5); margin-bottom: var(--space-3); }
    .footer-logo { width: 48px; height: 48px; border-radius: var(--radius-md); object-fit: cover; }
    .footer-info { display: flex; flex-direction: column; gap: 2px; font-size: 0.9375rem; color: var(--text-secondary); }
    .footer-info strong { color: var(--text-primary); }
    .footer-info a { color: var(--color-brand); text-decoration: none; }
    .footer-copy { font-size: 0.8125rem; color: var(--text-muted); margin: 0; }

    /* Cart FAB */
    .cart-fab {
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      z-index: 200;
      display: flex;
      align-items: center;
      gap: var(--space-3);
      padding: 14px 20px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-full);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,.25);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cart-fab:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.3); }
    .cart-fab-count {
      background: white;
      color: var(--color-brand);
      border-radius: 50%;
      min-width: 22px; height: 22px;
      font-size: 0.75rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }
    .cart-fab-total { font-size: 0.9375rem; }

    /* Cart drawer */
    .drawer-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.45);
      z-index: 300;
    }
    .cart-drawer {
      position: fixed;
      top: 0; right: 0; bottom: 0;
      width: min(400px, 100vw);
      background: white;
      z-index: 301;
      display: flex; flex-direction: column;
      box-shadow: -4px 0 32px rgba(0,0,0,.15);
    }
    .cart-drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
    }
    .cart-drawer-title { font-size: 1.125rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .drawer-close {
      width: 32px; height: 32px;
      border: none; background: var(--gray-100);
      border-radius: 50%; cursor: pointer;
      font-size: 0.875rem; color: var(--text-secondary);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .drawer-close:hover { background: var(--gray-200); color: var(--text-primary); }
    .cart-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 1rem; }
    .cart-items { flex: 1; overflow-y: auto; padding: var(--space-4) var(--space-6); display: flex; flex-direction: column; gap: var(--space-3); }
    .cart-item {
      display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--gray-100);
    }
    .cart-item:last-child { border-bottom: none; }
    .cart-item-info { flex: 1; min-width: 0; }
    .cart-item-name { display: block; font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .cart-item-price { display: block; font-size: 0.875rem; color: var(--color-brand); font-weight: 600; }
    .cart-item-controls { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .qty-btn-sm {
      width: 26px; height: 26px; border-radius: 50%;
      border: 1.5px solid var(--border); background: white;
      font-size: 1rem; font-weight: 700; cursor: pointer; color: var(--text-primary);
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .qty-btn-sm:hover { background: var(--gray-100); }
    .qty-val-sm { font-size: 0.9375rem; font-weight: 700; min-width: 22px; text-align: center; }
    .remove-btn { background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.5; transition: opacity 0.15s; padding: 2px; }
    .remove-btn:hover { opacity: 1; }
    .cart-summary {
      padding: var(--space-5) var(--space-6);
      border-top: 1px solid var(--border);
      display: flex; flex-direction: column; gap: var(--space-4);
    }
    .cart-total-row { display: flex; justify-content: space-between; font-size: 1rem; }
    .cart-total-row strong { font-size: 1.125rem; color: var(--color-brand); }

    /* Checkout modal */
    .modal-backdrop {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.5);
      z-index: 400;
      display: flex; align-items: flex-start; justify-content: center;
      padding: var(--space-6) var(--space-4);
      overflow-y: auto;
    }
    .checkout-modal {
      background: white;
      border-radius: var(--radius-xl);
      width: min(540px, 100%);
      box-shadow: 0 16px 60px rgba(0,0,0,.22);
      margin: auto;
      overflow: hidden;
    }

    /* Modal header */
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: var(--space-5) var(--space-6);
      border-bottom: 1px solid var(--border);
      background: var(--gray-50);
    }
    .modal-header-left { display: flex; align-items: center; gap: var(--space-3); }
    .modal-header-icon {
      width: 36px; height: 36px; border-radius: var(--radius-md);
      background: var(--color-brand); color: white;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .modal-title { font-size: 1.0625rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .modal-close-btn {
      width: 32px; height: 32px; border-radius: 50%;
      border: none; background: var(--gray-200); color: var(--text-muted);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: background 0.15s, color 0.15s; flex-shrink: 0;
    }
    .modal-close-btn:hover { background: var(--gray-300); color: var(--text-primary); }

    /* Modal body */
    .modal-body { display: flex; flex-direction: column; }
    .modal-section { padding: var(--space-5) var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .modal-section-label {
      font-size: 0.75rem; font-weight: 700; letter-spacing: .07em;
      text-transform: uppercase; color: var(--text-muted);
      margin: 0 0 var(--space-1);
    }
    .modal-divider { height: 1px; background: var(--border); margin: 0 var(--space-6); }

    /* Form rows inside modal */
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); }

    /* Gift toggle */
    .gift-toggle-row {
      display: flex; align-items: flex-start; gap: var(--space-3);
      padding: var(--space-4);
      background: var(--gray-50);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .gift-toggle-row:hover { border-color: var(--color-brand); background: var(--color-brand-light, #fef3f2); }
    .gift-checkbox { width: 18px; height: 18px; accent-color: var(--color-brand); cursor: pointer; flex-shrink: 0; margin-top: 2px; }
    .gift-toggle-content { display: flex; flex-direction: column; gap: 2px; }
    .gift-toggle-title { font-size: 0.9375rem; font-weight: 600; color: var(--text-primary); }
    .gift-toggle-desc { font-size: 0.8125rem; color: var(--text-muted); }
    .gift-message-field { display: flex; flex-direction: column; gap: 6px; }
    .gift-textarea { border-color: #f59e0b40; background: #fffbeb; }
    .gift-textarea:focus { border-color: #f59e0b; box-shadow: 0 0 0 3px #fef3c740; }

    /* Order summary inside modal */
    .modal-order-summary {
      background: var(--gray-50);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .modal-order-line {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-3) var(--space-4);
      border-bottom: 1px solid var(--gray-100);
      gap: var(--space-3);
    }
    .modal-order-line:last-of-type { border-bottom: none; }
    .order-line-name { font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: var(--space-2); }
    .order-line-qty {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 24px; height: 20px;
      background: var(--gray-200); border-radius: 4px;
      font-size: 0.75rem; font-weight: 700; color: var(--text-primary);
      padding: 0 5px;
    }
    .order-line-price { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; }
    .modal-order-total {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-4);
      background: white;
      border-top: 1.5px solid var(--border);
    }
    .modal-order-total span { font-size: 0.9375rem; font-weight: 600; color: var(--text-secondary); }
    .total-amount { font-size: 1.25rem; font-weight: 800; color: var(--color-brand); }

    /* Error box */
    .form-error-box {
      display: flex; align-items: center; gap: var(--space-2);
      margin: 0 var(--space-6);
      padding: var(--space-3) var(--space-4);
      background: var(--error-bg, #fef2f2);
      border: 1px solid var(--error-border, #fecaca);
      border-radius: var(--radius-md);
      color: var(--error, #dc2626); font-size: 0.875rem;
    }

    /* Modal footer with submit button */
    .modal-footer {
      padding: var(--space-5) var(--space-6) var(--space-6);
      border-top: 1px solid var(--border);
      background: var(--gray-50);
    }
    .btn-submit {
      width: 100%;
      padding: 14px 24px;
      background: var(--color-brand);
      color: white;
      border: none;
      border-radius: var(--radius-lg);
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: var(--space-2);
      transition: opacity 0.15s, transform 0.15s;
      letter-spacing: 0.01em;
    }
    .btn-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
    .btn-submit:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
    .btn-spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2.5px solid rgba(255,255,255,.35);
      border-top-color: white;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Order confirmation overlay */
    .confirmation-overlay {
      position: fixed; inset: 0;
      background: rgba(0,0,0,.6);
      z-index: 500;
      display: flex; align-items: center; justify-content: center;
      padding: var(--space-5);
    }
    .confirmation-card {
      background: white;
      border-radius: var(--radius-xl);
      padding: var(--space-10) var(--space-8);
      width: min(480px, 100%);
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,.25);
      display: flex; flex-direction: column; align-items: center; gap: var(--space-4);
      max-height: 90vh; overflow-y: auto;
    }
    .confirmation-icon { font-size: 3rem; }
    .confirmation-title { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); margin: 0; }
    .confirmation-subtitle { color: var(--text-muted); margin: 0; font-size: 1rem; }
    .confirmation-number {
      display: flex; flex-direction: column; gap: 4px;
      background: var(--gray-50); border-radius: var(--radius-md);
      padding: var(--space-4) var(--space-6); width: 100%;
    }
    .conf-label { font-size: 0.8125rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
    .conf-value { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); font-family: monospace; }
    .qr-section {
      display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
      width: 100%;
      border-top: 1px solid var(--border);
      padding-top: var(--space-4);
    }
    .qr-title { font-size: 1rem; font-weight: 700; color: var(--text-primary); margin: 0; }
    .qr-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .qr-canvas { border-radius: var(--radius-md); border: 4px solid white; box-shadow: 0 2px 12px rgba(0,0,0,.12); }
  `],
})
export class MenuPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly menuService = inject(MenuService)
  private readonly restaurantService = inject(RestaurantService)
  private readonly orderService = inject(OrderService)
  private readonly reservationService = inject(ReservationService)
  private readonly platformId = inject(PLATFORM_ID)

  readonly restaurant = this.restaurantService.restaurant
  readonly loading = this.menuService.loading
  readonly filters = this.menuService.filters
  readonly categoriesWithItems = this.menuService.categoriesWithItems
  readonly activeCategoryId = signal<number | null>(null)

  // Enterprise feature flag
  readonly hasOrders = signal(false)

  // Cart state
  readonly cart = signal<CartItem[]>([])
  readonly cartOpen = signal(false)
  readonly checkoutOpen = signal(false)
  readonly orderConfirmed = signal<Order | null>(null)

  // Reservation drawer
  readonly reservationOpen = signal(false)

  readonly cartCount = computed(() => this.cart().reduce((s, ci) => s + ci.quantity, 0))
  readonly cartTotal = computed(() => this.cart().reduce((s, ci) => s + ci.menuItem.price * ci.quantity, 0))

  // Checkout form fields
  ckName = ''
  ckPhone = ''
  ckEmail = ''
  ckNotes = ''
  ckIsGift = false
  ckGiftMessage = ''
  readonly orderSubmitting = signal(false)
  readonly orderError = signal<string | null>(null)

  // Reservation form fields
  resDate = ''
  resTime = ''
  resGuests = 2
  resName = ''
  resPhone = ''
  resRequests = ''
  readonly reservationSubmitting = signal(false)
  readonly reservationSuccess = signal(false)
  readonly reservationError = signal<string | null>(null)

  get todayDate(): string {
    return new Date().toISOString().split('T')[0]
  }

  readonly filterChips: { value: MenuItemBadge | 'all'; icon: string; key: string }[] = [
    { value: 'all', icon: '🍽️', key: 'filterAll' },
    { value: 'popular', icon: '⭐', key: 'filterPopular' },
    { value: 'new', icon: '✨', key: 'filterNew' },
    { value: 'vegetarian', icon: '🌿', key: 'filterVegetarian' },
    { value: 'spicy', icon: '🌶️', key: 'filterSpicy' },
  ]

  private observer?: IntersectionObserver

  ngOnInit(): void {
    this.restaurantService.loadPublic().subscribe()
    this.menuService.loadPublicMenu().subscribe()
    this.orderService.checkFeature().subscribe({
      next: (res) => this.hasOrders.set(res.ordersAndReservations),
      error: () => this.hasOrders.set(false),
    })
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return
    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting)
        if (visible) {
          const id = Number(visible.target.id.replace('cat-', ''))
          this.activeCategoryId.set(id)
        }
      },
      { threshold: 0.3, rootMargin: '-100px 0px -60% 0px' }
    )
    setTimeout(() => {
      document.querySelectorAll('.category-section').forEach((el) => this.observer!.observe(el))
    }, 500)
  }

  ngOnDestroy(): void {
    this.observer?.disconnect()
  }

  onSearch(event: Event): void {
    this.menuService.setFilter({ search: (event.target as HTMLInputElement).value })
  }

  setFilter(badge: MenuItemBadge | 'all'): void {
    this.menuService.setFilter({ badge })
  }

  scrollToCategory(id: number): void {
    const el = document.getElementById(`cat-${id}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    this.activeCategoryId.set(id)
  }

  // Cart methods
  getCartQty(menuItemId: number): number {
    return this.cart().find((ci) => ci.menuItem.id === menuItemId)?.quantity ?? 0
  }

  addToCart(item: MenuItem): void {
    this.cart.update((cart) => {
      const existing = cart.find((ci) => ci.menuItem.id === item.id)
      if (existing) {
        return cart.map((ci) =>
          ci.menuItem.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci
        )
      }
      return [...cart, { menuItem: item, quantity: 1, specialInstructions: '' }]
    })
  }

  removeFromCart(menuItemId: number): void {
    this.cart.update((cart) => {
      const existing = cart.find((ci) => ci.menuItem.id === menuItemId)
      if (!existing || existing.quantity <= 1) {
        return cart.filter((ci) => ci.menuItem.id !== menuItemId)
      }
      return cart.map((ci) =>
        ci.menuItem.id === menuItemId ? { ...ci, quantity: ci.quantity - 1 } : ci
      )
    })
  }

  removeItemFully(menuItemId: number): void {
    this.cart.update((cart) => cart.filter((ci) => ci.menuItem.id !== menuItemId))
  }

  openCheckout(): void {
    this.cartOpen.set(false)
    this.checkoutOpen.set(true)
  }

  closeCheckout(): void {
    this.checkoutOpen.set(false)
  }

  placeOrder(): void {
    if (this.orderSubmitting()) return
    this.orderSubmitting.set(true)
    this.orderError.set(null)

    this.orderService.placeOrder({
      customerName: this.ckName,
      customerPhone: this.ckPhone || null,
      customerEmail: this.ckEmail || null,
      notes: this.ckNotes || null,
      isGift: this.ckIsGift,
      giftMessage: this.ckIsGift ? (this.ckGiftMessage || null) : null,
      items: this.cart().map((ci) => ({
        menuItemId: ci.menuItem.id,
        quantity: ci.quantity,
        specialInstructions: ci.specialInstructions || null,
      })),
    }).subscribe({
      next: (order) => {
        this.orderSubmitting.set(false)
        this.checkoutOpen.set(false)
        this.cart.set([])
        this.ckName = ''; this.ckPhone = ''; this.ckEmail = ''; this.ckNotes = ''
        this.ckIsGift = false; this.ckGiftMessage = ''
        this.orderConfirmed.set(order)
        if (order.isGift && order.giftToken) {
          setTimeout(() => this.renderQr(order.giftToken!), 100)
        }
      },
      error: (err) => {
        this.orderSubmitting.set(false)
        this.orderError.set(err?.error?.message || 'An error occurred. Please try again.')
      },
    })
  }

  dismissConfirmation(): void {
    this.orderConfirmed.set(null)
  }

  private renderQr(token: string): void {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const url = `${window.location.origin}/redeem/${token}`
    QRCode.toCanvas(canvas, url, { width: 220, margin: 2 }, () => {})
  }

  downloadQr(): void {
    const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement | null
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'gift-qr.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  newReservation(): void {
    this.reservationSuccess.set(false)
    this.reservationError.set(null)
  }

  submitReservation(): void {
    if (this.reservationSubmitting()) return
    this.reservationSubmitting.set(true)
    this.reservationError.set(null)

    const payload: CreateReservationPayload = {
      reservedDate: this.resDate,
      reservedTime: this.resTime,
      guestsCount: this.resGuests,
      customerName: this.resName,
      customerPhone: this.resPhone,
      customerEmail: null,
      specialRequests: this.resRequests || null,
    }

    this.reservationService.createReservation(payload).subscribe({
      next: () => {
        this.reservationSubmitting.set(false)
        this.reservationSuccess.set(true)
        this.resDate = ''; this.resTime = ''; this.resGuests = 2
        this.resName = ''; this.resPhone = ''; this.resRequests = ''
      },
      error: (err) => {
        this.reservationSubmitting.set(false)
        this.reservationError.set(err?.error?.message || 'An error occurred. Please try again.')
      },
    })
  }

  formatPrice(euros: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(euros)
  }
}
