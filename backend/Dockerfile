# backend/Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Build multi-stage : compilation TypeScript puis image de prod allégée
# ─────────────────────────────────────────────────────────────────────────────

# ── Étape 1 : Build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN node --import=tsx/esm ace.js build

# ── Étape 2 : Production ─────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

# Installe uniquement les dépendances de production depuis le build
COPY --from=builder /app/build/package*.json ./
RUN npm ci --omit=dev --prefer-offline

COPY --from=builder /app/build .

# Crée le dossier d'uploads locaux (si DRIVE_DISK=local)
RUN mkdir -p public/uploads

# Script de démarrage : migrations + seed si première exécution, puis serveur
COPY --from=builder /app/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3333

CMD ["./docker-entrypoint.sh"]
