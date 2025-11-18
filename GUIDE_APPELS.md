# 📞 Guide d'utilisation des Appels - GODOBI

## 🎯 Où passer des appels avec vos amis ?

### 1. 📨 Depuis la page Messages (`/messages`)

**Localisation** : Liste de toutes vos conversations

**Comment appeler** :
- Deux boutons d'appel (audio 📞 et vidéo 📹) apparaissent sur **chaque conversation**
- Cliquez sur le bouton audio pour un appel vocal
- Cliquez sur le bouton vidéo pour un appel vidéo
- Vous serez redirigé vers l'interface d'appel en temps réel

**Idéal pour** : Appeler rapidement quelqu'un avec qui vous échangez souvent

---

### 2. 💬 Depuis une conversation (`/messages/[id]`)

**Localisation** : En haut de la page de conversation, à côté du nom de votre ami

**Comment appeler** :
- Deux gros boutons d'appel (audio 📞 et vidéo 📹) dans le header
- Positionnés juste avant les boutons de navigation (🏠, 👥, 🔍)
- Cliquez pour lancer immédiatement l'appel

**Idéal pour** : Transformer une conversation texte en appel vocal/vidéo

---

### 3. 👥 Depuis la liste d'amis (`/friends`)

**Localisation** : Sur chaque carte d'ami (Followers ou Following)

**Comment appeler** :
- Deux grands boutons en bas de chaque carte
- Bouton vert 📞 pour appel audio
- Bouton bleu 📹 pour appel vidéo
- Largeur complète pour faciliter le clic

**Idéal pour** : Parcourir vos amis et lancer un appel spontané

---

### 4. 📞 Depuis l'historique des appels (`/calls`)

**Localisation** : Liste de tous vos appels passés

**Comment rappeler** :
- Deux petits boutons (📞 et 📹) à droite de chaque appel
- Filtre disponible : Tous / Manqués / Sortants / Entrants
- Cliquez pour rappeler la personne

**Idéal pour** : Rappeler quelqu'un qui vous a appelé ou que vous avez manqué

---

## 🎬 Déroulement d'un appel

### Étape 1 : Lancer l'appel
1. Cliquez sur un bouton d'appel (audio ou vidéo)
2. L'appel est initié automatiquement
3. Vous êtes redirigé vers `/calls/[id]`

### Étape 2 : Interface d'appel
- **En haut** : Nom du contact + durée de l'appel
- **Au centre** : Vidéos des participants (si appel vidéo)
- **En bas** : Contrôles
  - 🎤 : Couper/Activer le micro
  - 📹 : Couper/Activer la caméra (appel vidéo)
  - 📞❌ : Raccrocher (bouton rouge)
  - ⚙️ : Paramètres

### Étape 3 : Pendant l'appel
- Le compteur de durée s'incrémente en temps réel
- Vous pouvez couper votre micro ou caméra à tout moment
- Votre vidéo locale apparaît en Picture-in-Picture (bas droite)
- Les vidéos distantes occupent l'écran principal

### Étape 4 : Terminer l'appel
- Cliquez sur le bouton rouge 📞❌
- Vous êtes automatiquement redirigé vers `/calls` (historique)
- La durée est enregistrée dans l'historique

---

## 🎨 Boutons d'appel - Composant CallButton

### Utilisation dans votre code

```tsx
import CallButton from '@/components/CallButton';

// Appel audio
<CallButton userId={2} type="audio" size="sm" />

// Appel vidéo
<CallButton userId={3} type="video" size="md" />

// Personnalisé
<CallButton 
  userId={userId} 
  type="video" 
  size="lg" 
  className="w-full"
/>
```

### Tailles disponibles
- **sm** : 32x32px (petit, pour listes compactes)
- **md** : 48x48px (moyen, pour headers)
- **lg** : 64x64px (grand, pour cartes amis)

### Couleurs
- **Audio (vert)** : `bg-green-600 hover:bg-green-700`
- **Vidéo (bleu)** : `bg-blue-600 hover:bg-blue-700`

---

## 📊 Statuts d'appel dans l'historique

| Statut | Icône | Couleur | Signification |
|--------|-------|---------|---------------|
| **Ended** | 📞 | Vert | Appel terminé normalement |
| **Missed** | 📵 | Rouge | Appel manqué (vous n'avez pas répondu) |
| **Declined** | 🚫 | Orange | Appel refusé par le destinataire |

---

## 🚀 Prochaines fonctionnalités

### À venir dans Phase 3
- [ ] **Appels de groupe** : Appeler plusieurs amis en même temps
- [ ] **Notifications push** : Recevoir une alerte sonore pour appel entrant
- [ ] **Appel depuis profil** : Bouton d'appel sur la page profil d'un ami
- [ ] **Appel depuis événements** : Lancer un appel de groupe avec les participants d'un événement
- [ ] **Partage d'écran** : Partager votre écran pendant l'appel
- [ ] **Chat pendant appel** : Envoyer des messages texte pendant l'appel vidéo

---

## 💡 Astuces

1. **Permissions requises** : La première fois que vous lancez un appel vidéo, votre navigateur vous demandera l'accès à la caméra et au micro. Cliquez sur "Autoriser".

2. **Connexion Internet** : Pour une meilleure qualité :
   - Audio : 1 Mbps minimum
   - Vidéo : 2 Mbps minimum recommandé

3. **Mode Ultra-Léger** : Si votre connexion est faible, préférez l'appel audio ou désactivez la vidéo pendant l'appel.

4. **HTTPS obligatoire** : Les appels WebRTC fonctionnent uniquement en HTTPS (ou localhost en développement).

5. **Navigateurs supportés** :
   - ✅ Chrome / Edge / Brave
   - ✅ Firefox
   - ✅ Safari (Desktop et Mobile)
   - ❌ Internet Explorer (non supporté)

---

## 🎉 Résumé

Vous pouvez maintenant appeler vos amis depuis **4 endroits différents** dans GODOBI :

1. 📨 **Liste des messages** - Appels rapides depuis vos conversations
2. 💬 **Page de conversation** - Transformer un chat en appel
3. 👥 **Liste d'amis** - Parcourir et appeler vos contacts
4. 📞 **Historique d'appels** - Rappeler facilement

**Tous les appels sont en temps réel avec Agora WebRTC !** 🚀
