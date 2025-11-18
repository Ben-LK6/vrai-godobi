# 📱 Mobile vs Desktop - Appels GODOBI

## 🎯 Comparaison

| Fonctionnalité | Desktop Web (Actuel) | Mobile Web | React Native (Futur) |
|----------------|---------------------|------------|---------------------|
| **Détection appel** | Polling 2s ⚠️ | Polling 2s ⚠️ | Push instantané ✅ |
| **App fermée** | ❌ Ne fonctionne pas | ❌ Ne fonctionne pas | ✅ Fonctionne |
| **Sonnerie** | ✅ Audio HTML5 | ✅ Audio HTML5 | ✅ Sonnerie système |
| **Notification** | ✅ Navigateur | ✅ Navigateur | ✅ Native OS |
| **Vibration** | ❌ Non disponible | ✅ Vibration API | ✅ Native |
| **Écran verrouillé** | ❌ | ❌ | ✅ Fonctionne |
| **UX** | Moyen | Moyen | Excellent ✅ |

## 🚀 État Actuel (Version Web)

### ✅ Ce qui fonctionne

1. **Desktop** :
   - Modal d'appel avec animation
   - Sonnerie audio (si fichier `/sounds/ringtone.mp3` présent)
   - Notification navigateur
   - Interface d'appel complète
   - Historique et rappels

2. **Mobile Web** :
   - Tout pareil que desktop
   - Notification navigateur si autorisée
   - Fonctionne en PWA

### ⚠️ Limitations

1. **Polling obligatoire** :
   - Vérifie toutes les 2 secondes
   - Consomme batterie sur mobile
   - Délai de 0-2 secondes

2. **App doit être ouverte** :
   - Ne fonctionne pas si navigateur fermé
   - Ne fonctionne pas en arrière-plan

3. **Pas de sonnerie système** :
   - Juste audio HTML5
   - Volume limité
   - Pas de vibration

## 💡 Améliorations Déjà Faites

### 1. Notification Navigateur Native ✅

```typescript
// Demande automatique de permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Affichage notification lors d'appel entrant
new Notification('Appel vidéo entrant', {
  body: 'Ben LK',
  icon: '/avatar.png',
  requireInteraction: true, // Ne disparaît pas auto
});
```

**Avantages** :
- ✅ Visible même si autre onglet actif
- ✅ Reste affichée jusqu'à interaction
- ✅ Cliquable pour focus sur app

### 2. Sonnerie Audio HTML5 ✅

```typescript
// Lecture sonnerie en boucle
const audio = new Audio('/sounds/ringtone.mp3');
audio.loop = true;
audio.volume = 0.5;
audio.play();
```

**Prérequis** :
- Fichier `/public/sounds/ringtone.mp3` à ajouter
- Format MP3 compatible tous navigateurs

## 🎨 Pour Mobile Web (PWA)

### Installer comme PWA

Créer `/public/manifest.json` :
```json
{
  "name": "GODOBI",
  "short_name": "GODOBI",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#8B5CF6",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

Ajouter dans `layout.tsx` :
```typescript
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#8B5CF6" />
```

**Avantages PWA** :
- ✅ Installable sur écran d'accueil
- ✅ Fonctionne offline (avec service worker)
- ✅ UX proche d'une app native
- ✅ Notifications persistantes

## 🚀 Phase Future : React Native

### Pourquoi React Native ?

1. **Notifications Push natives** :
   - Firebase Cloud Messaging (FCM)
   - Apple Push Notifications (APNs)
   - Instantané (0 délai)
   - Fonctionne app fermée

2. **Écran d'appel système** :
   - Overlay plein écran
   - Boutons natifs iOS/Android
   - Vibration + sonnerie système
   - Fonctionne écran verrouillé

3. **Performances** :
   - WebRTC natif optimisé
   - Pas de polling (économie batterie)
   - Gestion mémoire native

### Stack Recommandée

```bash
# Installation
npx create-expo-app godobi-mobile
cd godobi-mobile

# Dépendances
npm install expo-notifications
npm install react-native-agora
npm install @react-navigation/native
npm install expo-av # Pour audio/vidéo
```

### Exemple Code React Native

```typescript
// notifications/IncomingCallScreen.tsx
import { Vibration, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Recevoir notification push
Notifications.addNotificationReceivedListener(notification => {
  const { type, callId, caller } = notification.request.content.data;
  
  if (type === 'call_incoming') {
    // Vibrer
    Vibration.vibrate([0, 1000, 500, 1000], true);
    
    // Afficher écran d'appel
    navigation.navigate('IncomingCall', { callId, caller });
  }
});

// Écran d'appel
function IncomingCallScreen({ route }) {
  const { callId, caller } = route.params;
  
  return (
    <View style={styles.fullScreen}>
      <Image source={{ uri: caller.photo }} style={styles.avatar} />
      <Text style={styles.name}>{caller.name}</Text>
      <Text style={styles.label}>Appel vidéo entrant</Text>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={[styles.button, styles.decline]}
          onPress={() => declineCall(callId)}
        >
          <Text>Refuser</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.answer]}
          onPress={() => answerCall(callId)}
        >
          <Text>Répondre</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

### Backend : Envoyer Push

```php
// app/Services/PushNotificationService.php
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;

class PushNotificationService
{
    public function sendCallNotification($userId, $callData)
    {
        $firebase = (new Factory)->withServiceAccount(__DIR__.'/firebase-credentials.json');
        $messaging = $firebase->createMessaging();
        
        // Récupérer le token FCM de l'utilisateur
        $user = User::find($userId);
        $fcmToken = $user->fcm_token;
        
        if (!$fcmToken) return;
        
        $message = CloudMessage::withTarget('token', $fcmToken)
            ->withNotification([
                'title' => 'Appel entrant',
                'body' => $callData['caller_name'] . ' vous appelle',
            ])
            ->withData([
                'type' => 'call_incoming',
                'call_id' => $callData['call_id'],
                'caller' => json_encode($callData['caller']),
            ]);
        
        $messaging->send($message);
    }
}
```

## 📊 Résumé

### Version Actuelle (Web) ✅
- **Desktop** : Fonctionne bien avec polling
- **Mobile Web** : Fonctionne mais limité
- **PWA** : Améliore l'expérience mobile
- **Délai** : 0-2 secondes (polling)

### Améliorations Faites ✅
- ✅ Notification navigateur native
- ✅ Sonnerie audio HTML5
- ✅ Modal animé professionnel
- ✅ Hook `useBrowserNotifications`

### Version Future (React Native) 🚀
- **Push instantané** : 0 délai
- **App fermée** : Fonctionne
- **Écran verrouillé** : Fonctionne
- **UX native** : Comme WhatsApp

## 🎯 Recommandation

Pour **GODOBI** en production :

1. **Court terme** (maintenant) :
   - ✅ Version web actuelle suffit
   - ✅ Ajouter fichier sonnerie
   - ✅ Activer Agora pour vrais appels

2. **Moyen terme** (1-2 mois) :
   - 🔄 Implémenter PWA complète
   - 🔄 Ajouter Service Worker
   - 🔄 WebSocket pour notifications instantanées

3. **Long terme** (3-6 mois) :
   - 🚀 App React Native
   - 🚀 Notifications push FCM/APNs
   - 🚀 Écran d'appel natif

---

**La version actuelle fonctionne bien ! 🎉**

Sur mobile, l'expérience sera similaire à desktop web. Pour une expérience vraiment native (comme WhatsApp), il faudra React Native + Push Notifications.
