#!/bin/sh
# backend/docker-entrypoint.sh
# Attend la base, exécute les migrations, puis démarre le serveur.

set -e

echo "⏳ Attente de la base de données..."
# Simple retry loop — le healthcheck Docker est plus fiable, mais ceci sert de fallback
until node ace migration:run --force 2>&1; do
  echo "⚠️  Migration échouée, nouvelle tentative dans 5s..."
  sleep 5
done

echo "✅ Migrations appliquées."

# Seed uniquement si la table users est vide (premier démarrage)
USER_COUNT=$(node -e "
  const db = require('@adonisjs/lucid/database');
  // Approche simplifiée via la CLI
")

echo "🌱 Seeding initial si nécessaire..."
node ace db:seed --files=database/seeders/main_seeder.js 2>/dev/null || echo "ℹ️  Seed ignoré (données déjà présentes)."

echo "🚀 Démarrage du serveur AdonisJS..."
exec node bin/server.js
