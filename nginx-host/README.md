# Configuration nginx hôte

Ces fichiers sont à placer sur le serveur (en dehors de Docker) pour faire office de reverse proxy.

## Installation sur le serveur

```bash
# 1. Copier les fichiers
scp nginx-host/*.conf root@72.62.21.77:/etc/nginx/sites-available/

# 2. Sur le serveur — activer les sites
ln -s /etc/nginx/sites-available/saemenus.com.conf  /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/backend.saemenus.com.conf /etc/nginx/sites-enabled/

# 3. Vérifier la syntaxe
nginx -t

# 4. Recharger nginx
systemctl reload nginx
```

## Ajouter HTTPS avec Certbot (recommandé)

```bash
# Installer certbot
apt install certbot python3-certbot-nginx -y

# Générer les certificats (remplace automatiquement les blocs HTTP par HTTPS)
certbot --nginx -d saemenus.com -d "*.saemenus.com" -d backend.saemenus.com

# Pour *.saemenus.com (wildcard) il faut le challenge DNS — suivre les instructions certbot
```

## DNS à configurer chez votre registrar

| Enregistrement | Type | Valeur       |
|----------------|------|--------------|
| saemenus.com   | A    | 72.62.21.77  |
| *.saemenus.com | A    | 72.62.21.77  |
| backend.saemenus.com | A | 72.62.21.77 |
