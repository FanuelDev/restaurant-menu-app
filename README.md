# 🍽️ Restaurant Menu App

Application complète de gestion de menu pour restaurant — backoffice admin + vitrine client.

**Stack :** Angular 18 · AdonisJS v6 · MySQL · MinIO · Docker

---

## Architecture

```
restaurant-menu-app/
├── backend/                  # API REST — AdonisJS v6
│   ├── app/
│   │   ├── controllers/      # AuthController, RestaurantController, CategoriesController, MenuItemsController
│   │   ├── models/           # User, Restaurant, Category, MenuItem (Lucid ORM)
│   │   ├── validators/       # Validation VineJS
│   │   ├── services/         # ImageUploadService
│   │   └── middleware/       # AuthMiddleware
│   ├── config/               # app, auth, cors, database, drive, hash
│   ├── database/
│   │   ├── migrations/       # 5 migrations MySQL
│   │   └── seeders/          # Données de démo réalistes
│   └── start/
│       ├── routes.ts         # Toutes les routes API
│       └── kernel.ts         # Middleware global
│
├── frontend/                 # Angular 18 — Standalone components + Signals
│   └── src/app/
│       ├── admin/            # Login, Layout, Dashboard, Categories, MenuItems, Restaurant
│       ├── public/           # MenuPage, Hero, CategoryTabs, DishCard
│       └── shared/           # Services, Guards, Interceptors, Models
│
└── docker-compose.yml        # MySQL + MinIO + Backend + Frontend
```

### Schéma de base de données

```
users                    restaurants
─────────────────        ──────────────────────────
id (PK)                  id (PK)
full_name                name
email (unique)           slogan
password                 brand_color
role                     logo_key
                         opening_hours (JSON)
                         address, phone, email

auth_access_tokens       categories              menu_items
──────────────────       ──────────────────────  ──────────────────────────
id (PK)                  id (PK)                 id (PK)
tokenable_id (FK users)  name                    category_id (FK)
type                     description             name
hash                     sort_order              description
abilities                is_visible              price_in_cents
expires_at                                       image_key
                                                 is_available
                                                 badge
                                                 sort_order
```

---

## Installation

### Prérequis

- [Node.js](https://nodejs.org) v22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

### Option A — Développement local (recommandé)

#### 1. Lancer MySQL + MinIO via Docker

```bash
# Depuis la racine du projet
docker compose up db minio minio-init -d
```

#### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Copier et configurer l'environnement
cp .env.example .env
# Éditer .env si nécessaire (les valeurs par défaut fonctionnent avec docker compose)

# Créer la clé applicative
node ace generate:key
# Copier la valeur générée dans APP_KEY dans .env

# Appliquer les migrations
node ace migration:run

# Injecter les données de démonstration
node ace db:seed

# Démarrer le serveur de développement (hot reload)
node ace serve --watch
# → http://localhost:3333
```

#### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Démarrer Angular (proxy automatique vers le backend)
npm start
# → http://localhost:4200
```

#### 4. Accès admin

| Champ    | Valeur                     |
|----------|----------------------------|
| URL      | http://localhost:4200/admin |
| Email    | admin@restaurant.fr        |
| Password | Admin1234!                 |

#### 5. Console MinIO (optionnel)

- URL : http://localhost:9001
- Login : `minioadmin` / `minioadmin`

---

### Option B — Tout via Docker (production)

```bash
# Depuis la racine du projet

# 1. Générer une APP_KEY sécurisée
openssl rand -base64 32
# Copier la valeur et l'insérer dans docker-compose.yml (variable APP_KEY du service backend)

# 2. Lancer la stack complète
docker compose up --build -d

# 3. Vérifier les logs
docker compose logs -f backend

# 4. Accéder à l'application
# Vitrine   : http://localhost:4200
# Admin     : http://localhost:4200/admin
# API       : http://localhost:3333
# MinIO UI  : http://localhost:9001
```

---

## Routes API

### Publiques (sans authentification)

| Méthode | Route                          | Description                        |
|---------|--------------------------------|------------------------------------|
| GET     | `/api/public/restaurant`       | Infos du restaurant                |
| GET     | `/api/public/categories`       | Catégories visibles + plats dispos |
| GET     | `/api/public/menu-items`       | Tous les plats disponibles         |

### Authentification

| Méthode | Route              | Description                  |
|---------|--------------------|------------------------------|
| POST    | `/api/auth/login`  | Connexion → retourne un token |
| DELETE  | `/api/auth/logout` | Révoque le token              |
| GET     | `/api/auth/me`     | Profil de l'utilisateur       |

### Admin (Bearer Token requis)

| Méthode | Route                                          | Description                   |
|---------|------------------------------------------------|-------------------------------|
| GET/PUT | `/api/admin/restaurant`                        | Lire/mettre à jour le restaurant |
| POST    | `/api/admin/restaurant/logo`                   | Uploader le logo              |
| GET/POST| `/api/admin/categories`                        | Lister/créer des catégories   |
| PUT/DEL | `/api/admin/categories/:id`                    | Modifier/supprimer            |
| PATCH   | `/api/admin/categories/reorder`                | Réordonner (drag-and-drop)    |
| GET/POST| `/api/admin/menu-items`                        | Lister/créer des plats        |
| GET/PUT/DEL | `/api/admin/menu-items/:id`               | Gérer un plat                 |
| PATCH   | `/api/admin/menu-items/:id/toggle-availability`| Basculer disponibilité        |

---

## Fonctionnalités

### Backoffice Admin

- ✅ Authentification JWT (Bearer Token)
- ✅ Dashboard avec statistiques en temps réel
- ✅ Gestion CRUD des catégories (avec toggle visibilité)
- ✅ Réordonnancement des catégories (préparé pour drag-and-drop)
- ✅ Gestion CRUD des plats avec upload d'image et prévisualisation
- ✅ Badges configurables par plat (Nouveau, Populaire, Végétarien, Épicé)
- ✅ Toggle disponibilité par plat
- ✅ Gestion des infos restaurant (nom, logo, slogan, brandColor, horaires)
- ✅ Sidebar rétractable avec navigation complète

### Vitrine Client

- ✅ Affichage du menu complet en temps réel
- ✅ Navigation sticky par catégories avec scrollspy actif
- ✅ Filtres rapides (Populaires, Nouveautés, Végétarien, Épicé)
- ✅ Barre de recherche instantanée
- ✅ Hero section animée avec overlay typographique
- ✅ Cards des plats avec micro-animations hover
- ✅ Palette de couleurs dynamique depuis `brandColor`
- ✅ Dark mode automatique (`prefers-color-scheme`)
- ✅ Design responsive mobile-first
- ✅ Skeleton loading animé
- ✅ Animations Angular avec View Transitions API

---

## Variables d'environnement importantes

Voir `backend/.env.example` pour la liste complète documentée.

| Variable       | Défaut          | Description                         |
|----------------|-----------------|-------------------------------------|
| `APP_KEY`      | —               | Clé secrète (générer avec `node ace generate:key`) |
| `DRIVE_DISK`   | `local`         | `local` ou `s3` (MinIO)             |
| `DB_HOST`      | `127.0.0.1`     | Hôte MySQL                          |
| `CORS_ORIGIN`  | `http://localhost:4200` | Origines autorisées          |

---

## Commandes utiles

```bash
# Backend — migrations
node ace migration:run          # Appliquer les migrations
node ace migration:rollback     # Annuler la dernière migration
node ace migration:status       # Statut des migrations

# Backend — base de données
node ace db:seed                # Seeder de démo

# Backend — générer des fichiers
node ace make:controller nom    # Nouveau controller
node ace make:model nom         # Nouveau modèle
node ace make:migration nom     # Nouvelle migration

# Docker — nettoyage
docker compose down -v          # Arrêter et supprimer les volumes
docker compose logs backend     # Logs du backend
```

---

## Design System

Le design utilise deux niveaux de personnalisation :

1. **Tokens CSS statiques** — définis dans `styles.scss` (espacements, rayons, ombres, typographie)
2. **Couleur de marque dynamique** — injectée via `RestaurantService.applyBrandColor()` sur la variable CSS `--color-brand`

Changer la `brandColor` dans l'admin met à jour l'ensemble du frontend **sans rechargement**.

---

## Credentials de démo

| Rôle  | Email               | Mot de passe |
|-------|---------------------|--------------|
| Admin | admin@restaurant.fr | Admin1234!   |
