/**
 * Service de détection et d'intégration Electron.
 *
 * Permet à l'application Angular de détecter si elle tourne dans
 * l'application desktop Electron, et d'utiliser les APIs natives.
 *
 * Usage :
 *   private readonly desktop = inject(DesktopService)
 *
 *   // Vérifier si on est dans Electron
 *   if (this.desktop.isDesktop) { ... }
 *
 *   // Notification native OS (meilleure intégration que l'API browser)
 *   this.desktop.notify('⏰ Réservation', 'Table 4 dans 5 minutes')
 *
 *   // Badge sur l'icône
 *   this.desktop.setBadge(3)
 */

import { Injectable, OnDestroy } from '@angular/core'

/** Interface exposée par le preload Electron */
interface ElectronAPI {
  isDesktop: boolean
  platform: 'win32' | 'darwin' | 'linux'
  notify: (title: string, body: string) => void
  setBadge: (count: number) => void
  openExternal: (url: string) => void
  reload: () => void
  retry: () => void
  openSettings: () => void
  on: (channel: string, callback: (...args: any[]) => void) => void
  off: (channel: string) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}

@Injectable({ providedIn: 'root' })
export class DesktopService implements OnDestroy {
  /** true si l'app tourne dans Electron */
  readonly isDesktop: boolean = !!window.electronAPI?.isDesktop

  /** Plateforme native (win32 | darwin | linux | null si web) */
  readonly platform: string | null = window.electronAPI?.platform ?? null

  private readonly api = window.electronAPI ?? null

  constructor() {
    if (this.isDesktop) {
      this.listenForNewVersion()
    }
  }

  /**
   * Envoie une notification native OS.
   * Fonctionne aussi bien dans Electron (via IPC) que dans le navigateur
   * (via l'API Notification standard).
   */
  notify(title: string, body: string): void {
    if (this.api) {
      // Notification native Electron — plus fiable, toujours visible
      this.api.notify(title, body)
    } else if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' })
    }
  }

  /**
   * Met à jour le badge sur l'icône de l'application.
   * (Dock macOS, barre des tâches Windows)
   * @param count — 0 pour effacer
   */
  setBadge(count: number): void {
    this.api?.setBadge(count)
  }

  /**
   * Ouvre une URL dans le navigateur système.
   * En mode desktop, évite d'ouvrir dans Electron lui-même.
   */
  openExternal(url: string): void {
    if (this.api) {
      this.api.openExternal(url)
    } else {
      window.open(url, '_blank', 'noopener')
    }
  }

  /**
   * Recharge l'application (récupère la dernière version déployée).
   */
  reload(): void {
    if (this.api) {
      this.api.reload()
    } else {
      window.location.reload()
    }
  }

  /**
   * Écoute l'événement "nouvelle version disponible" envoyé par le watcher
   * du processus principal Electron. En mode web, non applicable.
   */
  private listenForNewVersion(): void {
    this.api?.on('new-version-available', () => {
      console.log('[Desktop] Nouvelle version détectée — rechargement automatique')
      // Le rechargement est géré côté Electron si la fenêtre n'est pas focus.
      // Ici on peut afficher une bannière si on veut notifier l'utilisateur.
    })
  }

  ngOnDestroy(): void {
    this.api?.off('new-version-available')
    this.api?.off('network-status')
  }
}
