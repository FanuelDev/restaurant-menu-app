// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  // URL relative : nginx proxy /api/ → backend (même domaine)
  // Si l'API est sur un sous-domaine séparé : 'https://api.votredomaine.com/api'
  apiUrl: '/api',
  // Remplacer votredomaine.com par votre vrai domaine avant de builder
  publicMenuBaseUrl: 'https://{slug}.votredomaine.com/menu',
}
