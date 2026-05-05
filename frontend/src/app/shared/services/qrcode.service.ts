import { Injectable } from '@angular/core'
import QRCode from 'qrcode'
import { environment } from '../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class QrCodeService {

  /** Retourne l'URL publique du menu pour un slug donné */
  menuUrl(slug: string): string {
    return environment.publicMenuBaseUrl.replace('{slug}', slug)
  }

  /**
   * Génère un QR code sous forme de Data URL (PNG base64).
   * @param text Texte ou URL à encoder
   * @param size Taille en pixels (défaut 400)
   * @param color Couleur des modules (hex)
   */
  async generate(text: string, size = 400, color = '#111827'): Promise<string> {
    return QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: color,
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
  }

  /**
   * Génère et télécharge immédiatement le QR code en PNG.
   */
  async download(text: string, filename = 'qrcode.png', color = '#111827'): Promise<void> {
    const dataUrl = await this.generate(text, 800, color)
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    link.click()
  }
}
