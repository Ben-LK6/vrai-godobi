<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Instructions Copilot pour GODOBI

## Contexte du projet
GODOBI est un réseau social créatif avec IA intégrée, développé avec :
- **Backend** : Laravel 11 (API REST) + MySQL + Redis
- **Mobile** : React Native (Expo)
- **Web** : Next.js + React
- **IA** : Génération d'images par prompts
- **Temps réel** : WebSockets pour messagerie et jeux

## Architecture et bonnes pratiques

### Backend Laravel
- Utiliser Laravel 11 avec les dernières conventions
- API REST avec JWT authentication via Laravel Sanctum
- Queue jobs pour traitement asynchrone (images, notifications)
- Rate limiting pour protection contre abus
- Validation stricte des inputs
- Utiliser Eloquent ORM avec relations appropriées
- Migrations pour structure DB évolutive

### Frontend React Native
- Utiliser Expo pour développement simplifié
- React Navigation pour navigation native
- Context API ou Redux pour state management
- Composants réutilisables et modulaires
- Optimisation pour mode Ultra-Léger (compression, cache)
- Gestion offline avec cache intelligent

### Frontend Next.js
- SSR/SSG selon les besoins
- API routes pour communication backend
- Responsive design mobile-first
- Optimisation images avec Next/Image
- PWA capabilities pour expérience native

### Base de données
- Tables relationnelles avec foreign keys
- Index sur colonnes fréquemment requêtées
- Soft deletes pour audit trail
- Timestamps automatiques
- Pagination pour grandes collections

### Sécurité
- Validation input côté client ET serveur
- HTTPS obligatoire
- Chiffrement mots de passe (bcrypt)
- Protection CSRF
- Rate limiting sur APIs sensibles
- Sanitization des données utilisateur

### Fonctionnalités spéciales
- **Mode Ultra-Léger** : Compression auto, cache agressif, détection réseau
- **IA intégrée** : API calls avec gestion erreurs et retry
- **Jeux multijoueurs** : WebSocket temps réel avec synchronisation état
- **Gamification** : Système XP calculé côté serveur, badges automatiques

### Patterns de développement
- Repository pattern pour accès données
- Service layer pour logique métier
- Event/Listener pour actions asynchrones
- Factory pattern pour création entités
- Observer pattern pour notifications temps réel

### Tests
- Tests unitaires pour services critiques
- Tests d'intégration pour APIs
- Tests end-to-end pour parcours utilisateur
- Tests performance pour mode Ultra-Léger

Lors de la génération de code, prioriser :
1. Sécurité et validation
2. Performance et optimisation
3. Maintenabilité et lisibilité
4. Compatibilité mode Ultra-Léger
5. Expérience utilisateur fluide
