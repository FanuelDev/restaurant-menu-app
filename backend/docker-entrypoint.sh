#!/bin/sh
# backend/docker-entrypoint.sh
# Attend la base, exécute les migrations, puis démarre le serveur.

set -e

echo "⏳ Attente de la base de données..."
until node ace migration:run --force 2>&1; do
  echo "⚠️  Migration échouée, nouvelle tentative dans 5s..."
  sleep 5
done

echo "✅ Migrations appliquées."

if [ "$NODE_ENV" = "production" ]; then
  echo "🚀 Mode production — seed automatique désactivé."
  echo "   (Lancer manuellement si 1ère installation :)"
  echo "   docker compose exec backend node ace db:seed --files database/seeders/production_seeder.js"
else
  echo "🌱 Seeding de développement..."
  node ace db:seed --files=database/seeders/main_seeder.js 2>/dev/null || echo "ℹ️  Seed ignoré (données déjà présentes)."
fi

echo "🚀 Démarrage du serveur AdonisJS..."
exec node bin/server.js
