// backend/app/services/image_upload_service.ts
import { MultipartFile } from '@adonisjs/core/bodyparser'
import drive from '@adonisjs/drive/services/main'
import { cuid } from '@adonisjs/core/helpers'
import env from '#start/env'

/** Types MIME acceptés pour les images */
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Taille maximale en octets (configurable via MAX_IMAGE_SIZE_MB) */
function getMaxSizeBytes(): number {
  const maxMb = env.get('MAX_IMAGE_SIZE_MB', 5)
  return maxMb * 1024 * 1024
}

export interface UploadResult {
  key: string
  url: string
}

export class ImageUploadError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 422
  ) {
    super(message)
    this.name = 'ImageUploadError'
  }
}

export default class ImageUploadService {
  /**
   * Valide et enregistre un fichier image uploadé.
   * @param file - Fichier provenant de request.file()
   * @param folder - Sous-dossier de destination (ex: "logos", "menu-items")
   * @returns Clé de stockage et URL publique
   */
  async upload(file: MultipartFile, folder: string = 'uploads'): Promise<UploadResult> {
    this.validate(file)

    const ext = file.extname ?? 'jpg'
    const key = `${folder}/${cuid()}.${ext}`

    // Déplace le fichier vers le disk configuré (local ou S3)
    await file.moveToDisk(key)

    const url = await drive.use().getUrl(key)

    return { key, url }
  }

  /**
   * Supprime un fichier du disk de stockage.
   * Ne lève pas d'erreur si le fichier n'existe pas.
   */
  async delete(key: string | null): Promise<void> {
    if (!key) return
    try {
      await drive.use().delete(key)
    } catch {
      // Fichier déjà supprimé ou inexistant — pas bloquant
    }
  }

  /**
   * Retourne l'URL publique d'une clé de stockage.
   */
  async getUrl(key: string | null): Promise<string | null> {
    if (!key) return null
    try {
      return await drive.use().getUrl(key)
    } catch {
      return null
    }
  }

  /** Validation du type MIME et de la taille */
  private validate(file: MultipartFile): void {
    if (!file || !file.isValid) {
      throw new ImageUploadError('Fichier invalide ou absent.')
    }

    if (!file.type || !ALLOWED_MIME_TYPES.includes(`${file.type}/${file.subtype}`)) {
      throw new ImageUploadError(
        `Type de fichier non accepté. Formats valides : JPEG, PNG, WebP, GIF.`
      )
    }

    const maxBytes = getMaxSizeBytes()
    if (file.size && file.size > maxBytes) {
      const maxMb = env.get('MAX_IMAGE_SIZE_MB', 5)
      throw new ImageUploadError(`L'image ne doit pas dépasser ${maxMb} Mo.`)
    }
  }
}
