# 📲 Comment Recevoir et Décrocher un Appel

## 🎯 Fonctionnement Automatique

Le modal d'appel entrant **s'affiche automatiquement** ! Vous n'avez RIEN à faire.

### ✨ Scénario Complet

#### **UTILISATEUR A** (Appelant)
1. Se connecte sur son navigateur
2. Va dans **Messages** ou **Amis**
3. Clique sur le bouton **📞** (audio) ou **📹** (vidéo)
4. Est redirigé vers l'interface d'appel

#### **UTILISATEUR B** (Receveur) - **VOUS**
1. Doit être connecté quelque part (n'importe quelle page)
2. **UN MODAL APPARAÎT AUTOMATIQUEMENT** après 2 secondes max
3. Le modal affiche :
   - 📹 ou 📞 (icône animée qui pulse)
   - Photo et nom de l'appelant
   - **2 boutons** :
     - 🔴 **Refuser** (gauche, rouge)
     - 🟢 **Répondre** (droite, vert)

### 🔔 Notifications

Quand un appel arrive, vous recevez **3 signaux** :

1. **Modal visuel** : Grande fenêtre au centre de l'écran
2. **Notification navigateur** : Notification système (si autorisée)
3. **Sonnerie audio** : `/sounds/ringtone.mp3` (si fichier présent)

---

## 🧪 Test en Direct

### Étape 1 : Préparer 2 Comptes

```bash
# Compte 1 (Appelant)
Utilisateur : John Doe
Email     : john@example.com
```

```bash
# Compte 2 (Receveur)
Utilisateur : Jane Smith
Email     : jane@example.com
```

### Étape 2 : Ouvrir 2 Fenêtres

1. **Fenêtre 1** : Connectez-vous avec John
2. **Fenêtre 2** : Connectez-vous avec Jane

### Étape 3 : S'ajouter en Amis

- John va sur le profil de Jane et clique **Suivre**
- Jane va sur le profil de John et clique **Suivre**
- Ils sont maintenant amis

### Étape 4 : Lancer l'Appel

**Dans la fenêtre de John** :
1. Cliquez sur **📬 Messages** dans le menu
2. Trouvez **Jane Smith** dans la liste
3. Cliquez sur le bouton **📞** (appel audio) ou **📹** (appel vidéo)

### Étape 5 : Décrocher l'Appel

**Dans la fenêtre de Jane** :
- ✨ **Après 2 secondes maximum**, un modal apparaît automatiquement
- Le modal affiche l'appel de John
- Cliquez sur **🟢 Répondre** (bouton vert à droite)

### Étape 6 : Appel Connecté !

Les deux utilisateurs sont maintenant en appel vidéo/audio.

---

## ❓ Dépannage

### Le modal n'apparaît pas ?

#### Vérification 1 : Console Développeur
Ouvrez la console (F12) et cherchez :
```
Checking for incoming calls...
Found incoming call: { id: 3, caller: { ... } }
```

#### Vérification 2 : Notification Créée ?
Dans la BDD, vérifiez :
```bash
cd /home/ben/Pictures/Godobi/backend
php artisan tinker
```

```php
// Vérifier les notifications d'appel
DB::table('notifications')
  ->where('type', 'call_incoming')
  ->where('is_read', false)
  ->get();

// Vérifier les appels actifs
DB::table('calls')
  ->whereIn('status', ['calling', 'ringing'])
  ->get();
```

#### Vérification 3 : Polling Actif ?
Le hook vérifie toutes les **2 secondes** :
- Ouvrez la console (F12)
- Allez dans l'onglet **Network**
- Filtrez par "notifications"
- Vous devez voir des requêtes toutes les 2 secondes :
  ```
  GET /api/notifications
  Status: 200 OK
  ```

### J'ai cliqué sur Répondre mais rien ne se passe ?

#### Vérifiez dans la console :
```javascript
Error answering call: ...
```

#### Solution :
```bash
# Vérifier que l'appel existe toujours
cd /home/ben/Pictures/Godobi/backend
php artisan tinker
```

```php
Call::find(3); // Remplacez 3 par l'ID de votre appel
```

### Le modal ne disparaît jamais ?

#### Appel zombie détecté !
```bash
cd /home/ben/Pictures/Godobi/backend
php artisan calls:cleanup
```

Ou manuellement :
```php
DB::table('calls')
  ->whereIn('status', ['calling', 'ringing'])
  ->update([
    'status' => 'ended',
    'ended_at' => now()
  ]);
```

---

## 🎨 Apparence du Modal

```
╔══════════════════════════════════════╗
║                                      ║
║           📹 (animation)             ║
║                                      ║
║         Appel entrant                ║
║                                      ║
║        John Doe                      ║
║        Appel vidéo                   ║
║                                      ║
║  ┌──────────────────────────────┐  ║
║  │   👤 JD                      │  ║
║  │   John Doe                   │  ║
║  │   @johndoe                   │  ║
║  └──────────────────────────────┘  ║
║                                      ║
║  [📞❌ Refuser]  [📹✅ Répondre]   ║
║                                      ║
╚══════════════════════════════════════╝
```

---

## 📍 Où Décrocher ?

**Réponse :** PARTOUT !

Le modal s'affiche **sur n'importe quelle page** tant que vous êtes connecté :
- ✅ Page d'accueil (Feed)
- ✅ Messages
- ✅ Notifications
- ✅ Profil
- ✅ Amis
- ✅ Événements
- ✅ Groupes
- ✅ TOUTES les pages !

Le système utilise le `CallProvider` global dans `/web/app/layout.tsx`.

---

## 🔧 Architecture Technique

### 1. Provider Global
```tsx
// /web/app/layout.tsx
<CallProvider>
  {children}
</CallProvider>
```

### 2. Hook de Détection
```tsx
// /web/hooks/useIncomingCalls.ts
useEffect(() => {
  const checkForIncomingCalls = async () => {
    // Vérifie /api/notifications toutes les 2 secondes
    const notifications = await api.getNotifications(token);
    
    // Cherche notification type "call_incoming"
    const callNotification = notifications.find(
      n => n.type === 'call_incoming' && !n.is_read
    );
    
    if (callNotification) {
      // Récupère détails de l'appel
      const call = await callsApi.getCallDetails(token, callNotification.call_id);
      
      // Affiche le modal
      setIncomingCall(call);
    }
  };
  
  // Polling toutes les 2 secondes
  const interval = setInterval(checkForIncomingCalls, 2000);
}, []);
```

### 3. Modal d'Affichage
```tsx
// /web/components/IncomingCallModal.tsx
export default function IncomingCallModal({ call, onAnswer, onDecline }) {
  if (!call) return null; // Pas d'appel = pas de modal
  
  return (
    <div className="fixed inset-0 z-50 ...">
      {/* Contenu du modal */}
      <button onClick={onDecline}>Refuser</button>
      <button onClick={onAnswer}>Répondre</button>
    </div>
  );
}
```

---

## ✅ Résumé

1. **Vous n'avez RIEN à faire** pour décrocher - le modal apparaît automatiquement
2. **Le modal s'affiche sur TOUTES les pages** (grâce au provider global)
3. **Délai maximum : 2 secondes** (intervalle du polling)
4. **3 signaux** : Modal visuel + Notification navigateur + Sonnerie
5. **2 boutons** : Refuser (rouge) ou Répondre (vert)

**C'est automatique !** 🎉

---

## 🚀 Prochaines Étapes

Si vous voulez des notifications **instantanées** (0 seconde de délai) :
- Option A : WebSockets (temps réel)
- Option B : Server-Sent Events (SSE)
- Option C : React Native + Firebase Cloud Messaging (mobile)

Pour l'instant, **2 secondes de délai** est un bon compromis pour le web ! 📱
