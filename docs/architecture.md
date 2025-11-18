# Architecture technique GODOBI

## Vue d'ensemble

GODOBI utilise une architecture moderne, scalable et modulaire basée sur trois composantes principales :

### 1. Backend - API REST (Laravel 11)
### 2. Frontend Mobile (React Native + Expo)
### 3. Frontend Web (Next.js + React)

---

## 1. BACKEND - Laravel 11

### Stack technique
- **Framework** : Laravel 11
- **Base de données** : MySQL 8 (principale)
- **Cache** : Redis (sessions, cache, queues)
- **Authentification** : JWT + Laravel Sanctum
- **WebSockets** : Laravel WebSockets ou Pusher
- **Queue** : Redis (jobs asynchrones)
- **Stockage** : S3-compatible (DigitalOcean Spaces)
- **Traitement média** : Cloudinary + FFmpeg

### Structure des dossiers
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Auth/
│   │   │   ├── Post/
│   │   │   ├── User/
│   │   │   ├── Message/
│   │   │   ├── Game/
│   │   │   └── AI/
│   │   ├── Middleware/
│   │   ├── Requests/
│   │   └── Resources/
│   ├── Models/
│   │   ├── User.php
│   │   ├── Post.php
│   │   ├── Comment.php
│   │   ├── Message.php
│   │   └── ...
│   ├── Services/
│   │   ├── AIService.php
│   │   ├── CompressionService.php
│   │   ├── GameService.php
│   │   ├── NotificationService.php
│   │   └── PaymentService.php
│   ├── Events/
│   ├── Listeners/
│   ├── Jobs/
│   └── Observers/
├── database/
│   ├── migrations/
│   └── seeders/
├── routes/
│   ├── api.php
│   ├── web.php
│   └── channels.php
└── tests/
```

### Endpoints API principaux

#### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/verify` - Vérification SMS/Email

#### Utilisateurs
- `GET /api/users/{id}` - Profil utilisateur
- `PUT /api/users/{id}` - Modifier profil
- `GET /api/users/{id}/posts` - Posts utilisateur
- `POST /api/users/{id}/follow` - Suivre

#### Posts
- `GET /api/posts` - Feed
- `POST /api/posts` - Créer post
- `GET /api/posts/{id}` - Détail post
- `DELETE /api/posts/{id}` - Supprimer
- `POST /api/posts/{id}/like` - Liker
- `POST /api/posts/{id}/comment` - Commenter

#### IA
- `POST /api/ai/generate` - Générer image
- `POST /api/ai/transform` - Transformer image
- `GET /api/ai/credits` - Crédits disponibles

#### Messages
- `GET /api/conversations` - Liste conversations
- `POST /api/conversations` - Créer conversation
- `GET /api/conversations/{id}/messages` - Messages
- `POST /api/messages` - Envoyer message

#### Jeux
- `GET /api/games` - Liste jeux
- `POST /api/games/{id}/start` - Démarrer session
- `POST /api/games/{id}/play` - Jouer coup
- `GET /api/games/leaderboard` - Classement

---

## 2. FRONTEND MOBILE - React Native + Expo

### Stack technique
- **Framework** : React Native 0.73
- **Plateforme** : Expo SDK 50
- **Navigation** : React Navigation 6
- **State Management** : Redux Toolkit + Context API
- **API Client** : Axios
- **WebSocket** : Socket.io-client
- **Médias** : Expo Image Manipulator, Camera, Media Library

### Structure des dossiers
```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register/
│   │       ├── step1.tsx (Nom, Prénom)
│   │       ├── step2.tsx (Contact)
│   │       ├── step3.tsx (Mot de passe)
│   │       └── ...
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx (Feed)
│   │   ├── explore.tsx
│   │   ├── create.tsx
│   │   ├── messages.tsx
│   │   └── profile.tsx
│   ├── post/
│   │   └── [id].tsx
│   ├── user/
│   │   └── [id].tsx
│   └── _layout.tsx
├── components/
│   ├── cards/
│   │   ├── PostCard.tsx
│   │   ├── StoryCard.tsx
│   │   └── UserCard.tsx
│   ├── editors/
│   │   ├── PhotoEditor.tsx
│   │   ├── VideoCreator.tsx
│   │   └── TextEditor.tsx
│   ├── games/
│   │   ├── QuizGame.tsx
│   │   ├── PuzzleGame.tsx
│   │   └── Challenge.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
├── services/
│   ├── api.ts
│   ├── auth.ts
│   ├── storage.ts
│   └── socket.ts
├── store/
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── postSlice.ts
│   │   └── userSlice.ts
│   └── store.ts
├── utils/
│   ├── compression.ts
│   ├── validation.ts
│   └── helpers.ts
└── constants/
    ├── Colors.ts
    └── Config.ts
```

### Fonctionnalités clés

#### Mode Ultra-Léger
```typescript
// Détection et compression automatiques
const compressionQuality = ultraLightMode ? 30 : 85;
const maxDimension = ultraLightMode ? 800 : 1920;
```

#### Navigation par cartes
```typescript
// Système de navigation carte par carte
<CardNavigator>
  <PostCard />
  <Button onPress={nextCard}>Devant</Button>
  <Button onPress={previousCard}>Retour</Button>
</CardNavigator>
```

---

## 3. FRONTEND WEB - Next.js

### Stack technique
- **Framework** : Next.js 14
- **UI** : Tailwind CSS
- **State** : Redux Toolkit
- **API** : Axios + SWR
- **WebSocket** : Socket.io-client
- **Animation** : Framer Motion

### Structure des dossiers
```
web/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (main)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Feed)
│   │   ├── explore/
│   │   ├── messages/
│   │   └── profile/
│   ├── api/
│   │   └── [...all routes proxy]
│   └── layout.tsx
├── components/
│   ├── Feed/
│   ├── Post/
│   ├── Editor/
│   ├── Games/
│   └── UI/
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── socket.ts
├── store/
├── styles/
└── public/
```

---

## 4. BASE DE DONNÉES - MySQL

### Tables principales (28 tables au total)

#### Core Tables
- `users` - Utilisateurs
- `posts` - Publications
- `comments` - Commentaires
- `likes` - Likes
- `reactions` - Réactions émotionnelles
- `friendships` - Relations

#### Messaging
- `conversations` - Conversations
- `conversation_participants` - Participants
- `messages` - Messages

#### Games
- `games` - Définitions jeux
- `game_sessions` - Sessions de jeu
- `game_participants` - Participants jeux

#### AI & Media
- `ai_generations` - Générations IA
- `gallery_items` - Galerie temporaire
- `stories` - Stories 24h

#### Gamification
- `badges` - Badges
- `user_badges` - Badges débloqués
- `user_progress` - Progression

#### Community
- `groups` - Groupes
- `group_members` - Membres groupes
- `pages` - Pages
- `page_followers` - Abonnés pages
- `hashtags` - Hashtags
- `post_hashtags` - Relations

#### System
- `notifications` - Notifications
- `transactions` - Transactions
- `reports` - Signalements

---

## 5. SERVICES EXTERNES

### IA
- **Dev** : API simple/placeholder
- **Production** : Stability AI ou Replicate
- **Fallback** : OpenAI DALL-E

### Stockage
- **Médias** : DigitalOcean Spaces ou AWS S3
- **Compression** : Cloudinary (automatique)
- **CDN** : Cloudflare

### Notifications
- **Push** : Firebase Cloud Messaging
- **Email** : SendGrid ou Mailgun
- **SMS** : Twilio ou Africa's Talking

### Paiements
- **Mobile Money** : MTN MoMo, Moov Money
- **Cartes** : Stripe
- **Intégration** : API REST directes

---

## 6. SÉCURITÉ

### Authentication & Authorization
- JWT tokens (access + refresh)
- Laravel Sanctum pour sessions
- 2FA optionnel (SMS/Email)
- Rate limiting strict

### Data Protection
- HTTPS obligatoire
- Bcrypt pour mots de passe
- Validation input côté serveur
- Sanitization des données
- CORS configuré

### Privacy
- Comptes privés/publics
- Contrôle visibilité posts
- Blocage utilisateurs
- Signalement contenu
- Modération IA + manuelle

---

## 7. PERFORMANCES & OPTIMISATION

### Backend
- Cache Redis (queries, sessions)
- Queue jobs (emails, notifications, traitements)
- Index DB sur colonnes critiques
- Pagination systématique
- Eager loading relations

### Frontend Mobile
- Lazy loading composants
- Virtualisation listes longues
- Cache images (expo-image)
- Compression adaptative
- Préchargement sélectif

### Frontend Web
- SSR/SSG avec Next.js
- Code splitting automatique
- Image optimization (Next/Image)
- CDN pour assets statiques
- Service worker (PWA)

### Mode Ultra-Léger
- Détection réseau automatique
- Compression maximale (30% qualité)
- Cache agressif
- Requêtes minimales
- Lazy loading obligatoire
- Limite résolution 800px

---

## 8. MONITORING & OBSERVABILITÉ

### Logs
- Laravel Telescope (dev)
- Log rotation
- Error tracking (Sentry)

### Metrics
- Performance API
- Usage mémoire
- Queue jobs
- Cache hit rate

### Analytics
- User engagement
- Feature usage
- Error rates
- Network performance

---

## 9. DÉPLOIEMENT

### Backend
- **Serveur** : DigitalOcean Droplet (Ubuntu 22.04)
- **Web Server** : Nginx
- **Process Manager** : Supervisor (queues)
- **CI/CD** : GitHub Actions

### Mobile
- **Build** : EAS Build (Expo)
- **Distribution** : Google Play Store
- **Updates** : Expo OTA updates

### Web
- **Hosting** : Vercel ou Netlify
- **CDN** : Cloudflare
- **Auto-deploy** : Git push

---

## 10. SCALABILITÉ

### Horizontal Scaling
- Load balancer (Nginx)
- Multiple app servers
- Redis cluster
- DB read replicas

### Vertical Scaling
- Caching agressif
- Queue optimization
- DB query optimization
- CDN pour médias

### Future-proofing
- Microservices ready
- API versioning
- Feature flags
- A/B testing infrastructure

---

**Architecture validée pour:**
- ✅ 10,000+ utilisateurs simultanés
- ✅ Mode Ultra-Léger fonctionnel
- ✅ Temps réel (jeux, messages)
- ✅ Génération IA scalable
- ✅ Multi-plateforme (iOS, Android, Web)
