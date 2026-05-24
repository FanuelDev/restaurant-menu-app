// frontend/src/app/shared/services/offline.service.ts
// Détecte l'état de la connexion réseau de manière réactive (signal Angular).
// Le service worker (@angular/service-worker) gère le cache des assets et de
// l'API publique (/api/public/**) avec une stratégie "freshness" :
//   • En ligne  → données fraîches depuis le serveur (cache mis à jour)
//   • Hors ligne → données servies depuis le cache SW (menu visible sans internet)

import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core'
import { isPlatformBrowser } from '@angular/common'

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private readonly platformId = inject(PLATFORM_ID)

  /** `true` si le navigateur a une connexion réseau active. */
  readonly isOnline = signal<boolean>(true)

  constructor() {
    if (!isPlatformBrowser(this.platformId)) return

    // Initialise avec l'état actuel
    this.isOnline.set(navigator.onLine)

    // Écoute les changements réseau
    window.addEventListener('online',  () => this.isOnline.set(true))
    window.addEventListener('offline', () => this.isOnline.set(false))
  }
}
