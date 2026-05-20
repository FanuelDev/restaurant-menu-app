# frontend/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Build Angular en mode production + Nginx pour servir les fichiers statiques
# ─────────────────────────────────────────────────────────────────────────────

# ── Étape 1 : Build Angular ───────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build:prod

# ── Étape 2 : Nginx ──────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Copie les fichiers buildés
COPY --from=builder /app/dist/restaurant-menu/browser /usr/share/nginx/html

# Configuration Nginx : SPA routing + proxy API
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]