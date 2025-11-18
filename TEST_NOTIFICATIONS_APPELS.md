# 🧪 GUIDE DE TEST - Notifications d'Appel Cliquables

## 🎯 Objectif du Test

Vérifier que lorsqu'un utilisateur appelle un autre, une notification apparaît automatiquement avec un modal permettant de répondre ou refuser.

## 📋 Prérequis

- [ ] 2 comptes utilisateurs créés (User A et User B)
- [ ] Backend Laravel en cours d'exécution (`php artisan serve`)
- [ ] Frontend Next.js en cours d'exécution (`npm run dev`)
- [ ] 2 navigateurs différents (ou 2 onglets en mode incognito)

## 🚀 Procédure de Test

### Étape 1 : Préparation

**Navigateur 1 (User A - L'appelant)** :
```
1. Ouvrir http://localhost:3000
2. Se connecter avec User A
3. Noter l'ID de User B (visible dans la liste d'amis ou messages)
```

**Navigateur 2 (User B - L'appelé)** :
```
1. Ouvrir http://localhost:3000 (mode incognito)
2. Se connecter avec User B
3. Naviguer vers /feed ou /messages
4. Garder cette page ouverte
```

### Étape 2 : Initier l'Appel

**Navigateur 1 (User A)** :
```
1. Aller sur /friends ou /messages
2. Trouver User B dans la liste
3. Cliquer sur le bouton 📞 (Audio) ou 📹 (Vidéo)
4. Vous devriez être redirigé vers /calls/[id]
5. Attendre sur cette page
```

**Ce qui se passe en coulisse** :
```
→ POST /api/calls/initiate
→ Création de l'appel dans la DB
→ Création de notification (type: call_incoming) pour User B
→ Redirection vers /calls/[id]
```

### Étape 3 : Vérifier la Notification

**Navigateur 2 (User B)** :
```
⏱️ Dans les 2 secondes maximum :

✅ Un modal doit apparaître automatiquement avec :
   ┌────────────────────────────────────┐
   │     📹 (animation bounce)          │
   │                                    │
   │     🔔 Appel entrant               │
   │                                    │
   │     [Nom de User A]                │
   │     Appel audio/vidéo              │
   │                                    │
   │  ┌──────────────────────────┐     │
   │  │  Avatar + @username      │     │
   │  └──────────────────────────┘     │
   │                                    │
   │  [📞❌ Refuser]  [📹✅ Répondre]  │
   └────────────────────────────────────┘
```

### Étape 4a : Test "Répondre"

**Navigateur 2 (User B)** :
```
1. Cliquer sur le bouton vert "Répondre"
2. Vous devriez être redirigé vers /calls/[id]
3. L'interface d'appel s'affiche
```

**Navigateur 1 (User A)** :
```
✅ Devrait voir "Connexion établie"
✅ Les 2 vidéos devraient se connecter (si Agora configuré)
```

### Étape 4b : Test "Refuser"

**Navigateur 2 (User B)** :
```
1. Cliquer sur le bouton rouge "Refuser"
2. Le modal devrait disparaître
3. Retour à la page normale
```

**Navigateur 1 (User A)** :
```
✅ Devrait recevoir une notification "User B a refusé votre appel"
```

## 🔍 Vérifications Techniques

### Vérifier le Polling (Console Navigateur 2)

Ouvrir la console développeur (F12) :
```javascript
// Devrait logger toutes les 2 secondes :
Checking for incoming calls...
```

### Vérifier les Notifications Backend

```bash
php artisan tinker

# Voir toutes les notifications d'appel
>>> Notification::where('type', 'call_incoming')->latest()->get()

# Dernière notification créée
>>> Notification::latest()->first()

# Appels en cours
>>> Call::where('status', 'calling')->get()
```

### Vérifier la Console Frontend

**Navigateur 1 (User A)** :
```javascript
// Après avoir cliqué sur le bouton d'appel
console.log("Initiating call...");
// Redirection vers /calls/[id]
```

**Navigateur 2 (User B)** :
```javascript
// Polling logs
"Checking for incoming calls..."
// Quand appel détecté
"Found incoming call: { id: X, caller: ... }"
```

## 🐛 Problèmes Courants

### Le modal ne s'affiche pas ?

**Checklist** :
1. [ ] Le polling fonctionne ? (Vérifier console)
2. [ ] La notification existe en DB ? (Vérifier avec tinker)
3. [ ] User B est bien connecté ? (Vérifier localStorage.token)
4. [ ] CallProvider est bien dans layout.tsx ?
5. [ ] Attendre au moins 2 secondes après l'appel

**Solution** :
```bash
# Forcer un refresh frontend
Ctrl+Shift+R (ou Cmd+Shift+R sur Mac)

# Vérifier les logs backend
tail -f storage/logs/laravel.log
```

### Le modal s'affiche mais ne répond pas aux clics ?

**Vérifier** :
```javascript
// Console navigateur
// Cliquer sur "Répondre" devrait logger :
"Answering call: [id]"

// Si rien ne se passe, vérifier les props :
<IncomingCallModal 
  call={incomingCall}     // Doit être un objet Call
  onAnswer={answerCall}   // Doit être une fonction
  onDecline={declineCall} // Doit être une fonction
/>
```

### L'appel ne se connecte pas après "Répondre" ?

**Vérifier** :
1. [ ] Agora APP_ID configuré ? (voir CALLS_MODULE.md)
2. [ ] Les 2 users sont redirigés vers /calls/[id] ?
3. [ ] Permissions caméra/micro accordées ?

**Logs Agora** :
```javascript
// Console navigateur
AgoraRTC.setLogLevel(0); // Debug mode
// Devrait logger toutes les étapes de connexion
```

## 📊 Résultats Attendus

### ✅ Test Réussi

```
Navigateur 1 (User A) :
├─ Clique sur 📞
├─ Redirigé vers /calls/[id]
├─ Voit "En attente de User B..."
└─ (si B répond) Connexion établie ✅

Navigateur 2 (User B) :
├─ Modal apparaît < 2s ✅
├─ Affiche info de User A ✅
├─ Boutons fonctionnels ✅
└─ (si clic Répondre) Redirigé vers /calls/[id] ✅
```

### ❌ Test Échoué

**Symptômes** :
- Modal ne s'affiche jamais
- Modal s'affiche mais boutons inertes
- Redirection ne fonctionne pas
- Erreurs dans console

**Actions** :
1. Vérifier les logs backend
2. Vérifier les erreurs console
3. Relire NOTIFICATIONS_APPELS.md
4. Poster l'erreur pour debug

## 🎯 Checklist Finale

Avant de conclure le test :

- [ ] Modal d'appel s'affiche automatiquement
- [ ] Animation bounce fonctionne
- [ ] Info de l'appelant visible (nom, photo, type)
- [ ] Bouton "Refuser" fonctionne
- [ ] Bouton "Répondre" fonctionne
- [ ] Redirection correcte après réponse
- [ ] Notification de refus envoyée
- [ ] Polling ne crée pas de lag
- [ ] Pas d'erreurs console
- [ ] Historique enregistré dans /calls

## 🎉 Si Tout Fonctionne

**BRAVO ! 🚀**

Vous avez maintenant un système d'appels complet avec :
- ✅ Boutons d'appel partout
- ✅ Détection automatique d'appels entrants
- ✅ Modal animé et intuitif
- ✅ Réponse/Refus instantané
- ✅ Connexion WebRTC automatique

**Prochaines étapes** :
1. Configurer Agora pour vrais appels
2. Ajouter sonnerie audio
3. Implémenter WebSocket pour notifications instantanées
4. Phase 3 : Appels de groupe avancés

---

**Temps estimé du test complet : 5 minutes**

Bonne chance ! 🍀
