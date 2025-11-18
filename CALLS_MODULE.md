# 📞 MODULE 11 : Appels Audio & Vidéo - GODOBI

## 🎯 Fonctionnalités Implémentées

### ✅ Phase 1 : Backend (COMPLÉTÉ)
- **Base de données** : Tables `calls` et `call_participants`
- **API REST** : 6 endpoints pour gérer les appels
- **Notifications** : 4 types de notifications d'appel
- **Support** : Appels 1-à-1 et appels de groupe

### ✅ Phase 2 : Frontend (COMPLÉTÉ)
- **Interface d'appel** : Page temps réel avec vidéo/audio
- **Contrôles** : Mute audio, désactiver vidéo, raccrocher
- **Historique** : Page listant tous les appels passés
- **Notifications** : Modal d'appel entrant avec sonnerie
- **Intégration Agora** : SDK WebRTC configuré

## 📋 Routes API

### POST /api/calls/initiate
Initier un appel 1-à-1 ou de groupe
```json
{
  "receiver_id": 2,  // ou "group_id": 1
  "type": "video"    // "audio" | "video"
}
```

### POST /api/calls/{id}/answer
Répondre à un appel entrant

### POST /api/calls/{id}/decline
Refuser un appel

### POST /api/calls/{id}/end
Terminer un appel en cours

### GET /api/calls/history?type=all
Historique des appels
- Types: `all`, `missed`, `outgoing`, `incoming`

### GET /api/calls/{id}
Détails d'un appel spécifique

## 🎨 Pages Frontend

### /calls
Liste de l'historique des appels avec filtres

### /calls/[id]
Interface d'appel en temps réel avec :
- Vidéo locale (PiP en bas à droite)
- Vidéos distantes (grille principale)
- Contrôles (mute, vidéo, raccrocher)
- Compteur de durée en temps réel

## 🔧 Configuration Agora

### Mode Test (Actuel)
L'application fonctionne en mode test sans APP_ID Agora valide. Les fonctionnalités de base sont démontrées mais sans connexion WebRTC réelle.

### Mode Production

1. **Créer un compte Agora.io**
   - Aller sur https://console.agora.io
   - Créer un projet
   - Obtenir l'APP ID et l'APP Certificate

2. **Configuration Backend Laravel**
   
   Ajouter dans `.env` :
   ```env
   AGORA_APP_ID=votre_app_id
   AGORA_APP_CERTIFICATE=votre_app_certificate
   ```

3. **Configuration Frontend Next.js**
   
   Ajouter dans `.env.local` :
   ```env
   NEXT_PUBLIC_AGORA_APP_ID=votre_app_id
   ```

4. **Générer les tokens Agora**
   
   Installer le SDK Agora côté backend :
   ```bash
   cd backend
   composer require agora/rtc-token-builder
   ```
   
   Mettre à jour `CallController::generateAgoraToken()` :
   ```php
   use Agora\RtcTokenBuilder;
   
   private function generateAgoraToken($channelName, $userId)
   {
       $appId = env('AGORA_APP_ID');
       $appCertificate = env('AGORA_APP_CERTIFICATE');
       $uid = $userId;
       $role = RtcTokenBuilder::RolePublisher;
       $expireTimeInSeconds = 3600;
       $currentTimestamp = time();
       $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;

       return RtcTokenBuilder::buildTokenWithUid(
           $appId, 
           $appCertificate, 
           $channelName, 
           $uid, 
           $role, 
           $privilegeExpiredTs
       );
   }
   ```

## 🚀 Utilisation

### Initier un appel depuis le code

```typescript
import { callsApi } from '@/lib/api';

// Appel vidéo
const response = await callsApi.initiateCall(token, {
  receiver_id: userId,
  type: 'video'
});

// Rediriger vers la page d'appel
router.push(`/calls/${response.call.id}`);
```

### Utiliser le composant CallButton

```tsx
import CallButton from '@/components/CallButton';

<CallButton userId={2} type="audio" size="md" />
<CallButton userId={2} type="video" size="lg" />
```

## 📊 Statuts d'appel

- **calling** : Appel en cours d'établissement
- **ringing** : Sonnerie chez le destinataire
- **connected** : Appel connecté
- **ended** : Appel terminé normalement
- **missed** : Appel manqué
- **declined** : Appel refusé
- **busy** : Destinataire occupé
- **failed** : Échec technique

## 🎮 Fonctionnalités à venir (Phase 3)

- [ ] Appels de groupe avec vidéo multi-participants
- [ ] Partage d'écran
- [ ] Chat pendant l'appel
- [ ] Enregistrement des appels
- [ ] Effets de fond virtuels
- [ ] Réduction de bruit IA
- [ ] Statistiques de qualité réseau
- [ ] Notifications push pour appels manqués
- [ ] Support React Native (mobile)

## 🐛 Mode Debug

Pour tester sans Agora en production, le mode test est activé par défaut. Les vidéos ne seront pas transmises mais l'interface est fonctionnelle.

Pour activer les logs Agora :
```typescript
AgoraRTC.setLogLevel(0); // 0 = debug, 4 = none
```

## 📱 Compatibilité

- **Desktop** : Chrome, Firefox, Safari, Edge
- **Mobile Web** : Chrome Mobile, Safari Mobile
- **Mobile App** : React Native (à implémenter)

## 💡 Conseils

1. **Permissions** : Les appels vidéo/audio nécessitent l'autorisation caméra/micro
2. **HTTPS** : WebRTC nécessite HTTPS en production (ou localhost)
3. **Bande passante** : Recommandé 1 Mbps minimum pour audio, 2 Mbps pour vidéo
4. **Mode Ultra-Léger** : Désactiver la vidéo automatiquement si connexion faible

## 🎉 Résumé

**MODULE 11 PHASE 1 + 2 : COMPLÉTÉ** ✅

Le système d'appels audio/vidéo est maintenant fonctionnel avec :
- Backend complet avec API REST
- Frontend avec interface temps réel
- Support Agora WebRTC
- Historique et notifications
- Mode test et production

**Prochaine étape** : Phase 3 (appels de groupe avancés) ou passer au MODULE 12 ! 🚀
