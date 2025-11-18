# GODOBI
## Réseau social créatif avec IA intégrée

**GODOBI** est une plateforme de réseau social innovante combinant les fonctionnalités classiques d'un réseau social avec des outils de création assistés par IA.

### 🚀 Fonctionnalités clés
- **Génération d'images IA** - Création d'images originales par prompts textuels
- **Éditeur photo complet** - Bulles BD, filtres, texte, stickers
- **Création de vidéos** - Assembly de photos avec musique et animations
- **Réseau social** - Posts, likes, commentaires, stories, messagerie
- **Jeux multijoueurs** - Quiz, puzzle, challenges intégrés dans le chat
- **Mode Ultra-Léger** - Optimisé pour économie de données (~10-50 MB/mois)
- **Gamification** - Système XP, badges, défis, classements

### 🏗️ Architecture technique

#### Backend
- **Framework** : Laravel 11 (API REST)
- **Base de données** : MySQL 8 + Redis (cache)
- **Authentification** : JWT + Laravel Sanctum
- **Temps réel** : Laravel WebSockets/Pusher
- **Stockage** : DigitalOcean Spaces/AWS S3 + Cloudinary

#### Frontend Mobile
- **Framework** : React Native (Expo)
- **Plateforme** : Android priorité, iOS futur
- **Navigation** : React Navigation
- **State** : Redux/Context API

#### Frontend Web
- **Framework** : Next.js + React
- **Responsive** : Desktop/Tablette

### 📱 Modes d'utilisation
- **Mode Ultra-Léger** : Toutes fonctionnalités avec compression maximale
- **Mode Normal** : Qualité maximale, expérience optimale

### 🎯 Objectifs
1. Démocratiser l'accès aux outils de création IA
2. Fonctionner efficacement même avec connexion limitée
3. Créer une communauté active via la gamification
4. Modèle économique viable
5. Architecture scalable

### 📋 Plan de développement
Développement agile en 28 modules progressifs :
- **MODULE 1-2** : Authentification (Semaines 1-2)
- **MODULE 3** : Profil utilisateur (Semaine 3) 
- **MODULE 4-5** : Posts basiques (Semaines 4-5)
- **MODULE 6** : Likes (Semaine 6)
- **MODULE 7-8** : Commentaires (Semaines 7-8)
- ... et plus

### 🚀 Démarrage rapide

#### Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

#### Mobile (React Native)
```bash
cd mobile
npm install
npx expo start
```

#### Web (Next.js)
```bash
cd web
npm install
npm run dev
```

### 📄 Documentation
- Cahier des charges complet disponible dans `/docs`
- Architecture détaillée dans `/docs/architecture.md`
- API documentation dans `/docs/api.md`

### 🤝 Contribution
Ce projet suit une approche de développement modulaire. Chaque module est développé et testé de manière indépendante.

---
**GODOBI** - Là où la créativité rencontre l'intelligence artificielle

Document créé le 17 novembre 2025
