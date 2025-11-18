# GODOBI - Guide de démarrage rapide

## 🚀 Installation rapide

### Prérequis
- **PHP** >= 8.1
- **Composer**
- **Node.js** >= 18
- **MySQL** 8
- **Redis** (optionnel mais recommandé)

### Option 1 : Installation automatique (Recommandé)

#### Backend (Laravel)
```bash
cd /home/ben/Pictures/Godobi
./scripts/setup-backend.sh
```

#### Mobile (React Native + Expo)
```bash
cd /home/ben/Pictures/Godobi
./scripts/setup-mobile.sh
```

#### Web (Next.js)
```bash
cd /home/ben/Pictures/Godobi
./scripts/setup-web.sh
```

### Option 2 : Installation manuelle

#### 1. Backend Laravel

```bash
cd backend

# Installer Laravel
composer create-project --prefer-dist laravel/laravel . "11.*"

# Installer les dépendances
composer require laravel/sanctum
composer require pusher/pusher-php-server
composer require intervention/image
composer require predis/predis

# Configuration
cp .env.example .env
php artisan key:generate

# Configurer la base de données dans .env
# DB_DATABASE=godobi
# DB_USERNAME=root
# DB_PASSWORD=

# Créer la base de données
mysql -u root -p -e "CREATE DATABASE godobi;"

# Lancer les migrations
php artisan migrate

# Publier les configurations
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Lancer le serveur
php artisan serve
```

#### 2. Mobile React Native

```bash
cd mobile

# Installer les dépendances
npm install

# Installer Expo CLI globalement
npm install -g expo-cli

# Créer le fichier .env
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://localhost:8000/api
EXPO_PUBLIC_WS_URL=ws://localhost:6001
EOF

# Lancer l'application
npx expo start
```

#### 3. Web Next.js

```bash
cd web

# Installer les dépendances
npm install

# Créer le fichier .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:6001
EOF

# Lancer le serveur de développement
npm run dev
```

---

## 📱 Tester l'application

### Backend
URL: http://localhost:8000
API: http://localhost:8000/api

### Mobile
Utilisez l'application **Expo Go** sur votre téléphone et scannez le QR code

### Web
URL: http://localhost:3000

---

## 🗄️ Base de données

### Créer la base de données
```bash
mysql -u root -p
CREATE DATABASE godobi;
exit
```

### Importer le schéma
```bash
cd /home/ben/Pictures/Godobi
mysql -u root -p godobi < database/schema.sql
```

Ou utiliser les migrations Laravel :
```bash
cd backend
php artisan migrate
```

---

## 🔧 Configuration

### Backend (.env)
```env
APP_NAME="GODOBI"
APP_URL=http://localhost:8000

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=godobi
DB_USERNAME=root
DB_PASSWORD=

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# API IA (à configurer plus tard)
AI_API_ENDPOINT=
AI_API_KEY=

# Cloudinary (à configurer plus tard)
CLOUDINARY_URL=
```

### Mobile (.env)
```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:8000/api
EXPO_PUBLIC_WS_URL=ws://YOUR_LOCAL_IP:6001
```

**Note:** Remplacez `YOUR_LOCAL_IP` par votre adresse IP locale (ex: 192.168.1.x) pour tester sur téléphone réel.

### Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:6001
```

---

## 🐛 Résolution de problèmes

### Erreur de connexion MySQL
```bash
# Vérifier que MySQL est lancé
sudo systemctl status mysql

# Démarrer MySQL si nécessaire
sudo systemctl start mysql
```

### Erreur de permissions Laravel
```bash
cd backend
sudo chmod -R 775 storage bootstrap/cache
sudo chown -R $USER:www-data storage bootstrap/cache
```

### Expo ne se lance pas
```bash
# Nettoyer le cache
cd mobile
npx expo start -c
```

### Erreur "Cannot connect to API"
1. Vérifiez que le backend Laravel tourne (php artisan serve)
2. Vérifiez l'URL API dans les fichiers .env
3. Sur mobile réel, utilisez votre IP locale au lieu de localhost

---

## 📚 Prochaines étapes

1. **Lire la documentation complète** dans `/docs`
2. **Suivre le plan de développement** dans `/docs/development-plan.md`
3. **Commencer par le Module 1** : Authentification
4. **Consulter l'architecture** dans `/docs/architecture.md`

---

## 🤝 Structure du projet

```
Godobi/
├── backend/          # Laravel API
├── mobile/           # React Native (Expo)
├── web/              # Next.js
├── database/         # Schéma SQL
├── docs/             # Documentation
├── scripts/          # Scripts d'installation
└── README.md         # Ce fichier
```

---

## 💡 Conseils

- **Développement par modules** : Suivez l'ordre du plan de développement
- **Tests fréquents** : Testez chaque module avant de passer au suivant
- **Git commits réguliers** : Commitez après chaque module terminé
- **Documentation** : Documentez vos APIs au fur et à mesure

---

## 📞 Support

Pour toute question ou problème :
1. Consultez d'abord `/docs`
2. Vérifiez le cahier des charges
3. Relisez le plan de développement

---

**Bon développement ! 🚀**

*GODOBI - Là où la créativité rencontre l'intelligence artificielle*
