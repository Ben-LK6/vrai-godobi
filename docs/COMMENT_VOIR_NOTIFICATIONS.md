# 🔔 COMMENT VOIR LES NOTIFICATIONS

## Où voir les notifications ?

### 1. **Badge de notifications** (visible partout) 🔴

Le badge **🔔** avec un compteur rouge apparaît dans le header de **TOUTES les pages** :
- ✅ **/feed** - En haut à droite
- ✅ **/friends** - En haut à droite  
- ✅ **/discover** - En haut à droite
- ✅ **/messages** - En haut à droite
- ✅ **/dashboard** - En haut à droite

**Le badge affiche :**
- 🔔 (sans badge) = Aucune notification non lue
- 🔔 **3** = 3 notifications non lues
- 🔔 **9+** = Plus de 9 notifications non lues

### 2. **Page Notifications** (/notifications)

**Comment y accéder :**
1. Cliquer sur le badge 🔔 dans n'importe quelle page
2. Ou aller directement sur `http://localhost:3000/notifications`

**Ce que tu verras :**
- Liste de toutes tes notifications
- Badge violet sur les non lues
- Icônes adaptées par type :
  - ❤️ = Like sur ton post
  - 💬 = Commentaire sur ton post
  - 👥 = Nouveau follower
  - 📨 = Nouveau message privé
  - 🎮 = Invitation à un jeu
  - 🎨 = Image IA prête

**Actions disponibles :**
- ✓ Marquer une notification comme lue
- ✓ Tout marquer comme lu
- × Supprimer une notification
- 🗑️ Effacer toutes les lues
- 🔄 Actualiser

**Liens intelligents :**
- Cliquer sur une notification te redirige vers le contenu concerné :
  - Like/Comment → le post
  - Follow → le profil de la personne
  - Message → la conversation
  - Game → le jeu
  - AI → le post avec l'image

## Comment ça marche automatiquement ?

### Notifications créées automatiquement quand :

1. **Quelqu'un like ton post** ❤️
   - Tu reçois : "Alice Dupont a aimé votre publication"
   - Clique → va sur le post

2. **Quelqu'un commente ton post** 💬
   - Tu reçois : "Bob Martin a commenté votre publication"
   - Clique → va sur le post

3. **Quelqu'un te follow** 👥
   - Tu reçois : "Charlie Leroy a commencé à vous suivre"
   - Clique → va sur son profil

4. **Quelqu'un t'envoie un message** 📨
   - Tu reçois : "David Dubois vous a envoyé un message"
   - Clique → ouvre la conversation

5. **Invitation à un jeu** 🎮 (futur module)
   - Tu recevras : "Eve t'invite à jouer à Devinette"
   - Clique → ouvre le jeu

6. **Image IA générée** 🎨 (futur module)
   - Tu recevras : "Votre image générée par IA est prête !"
   - Clique → va sur le post avec l'image

## Test rapide 🧪

**Pour tester dès maintenant :**

1. **Ouvre 2 comptes** (navigateur normal + incognito)
   - Compte A : ton compte principal
   - Compte B : un autre compte

2. **Depuis Compte B, fais des actions sur Compte A :**
   - Like un post de Compte A
   - Commente un post de Compte A
   - Follow Compte A
   - Envoie un message à Compte A

3. **Depuis Compte A :**
   - Regarde le badge 🔔 (devrait afficher **4**)
   - Clique dessus
   - Vois les 4 notifications avec icônes
   - Clique sur chaque notification pour tester les redirections

4. **Actions sur les notifications :**
   - Clique sur ✓ pour marquer une comme lue
   - Badge passe à **3**
   - Clique sur "Tout marquer comme lu"
   - Badge disparaît (aucune non lue)
   - Clique sur "🗑️ Effacer les lues"
   - Liste devient vide

## Actualisation automatique

Le compteur de notifications se charge **automatiquement** :
- À l'ouverture de chaque page
- Mais ne se met **PAS** à jour en temps réel (il faut rafraîchir)

**Pour voir de nouvelles notifications :**
- Rafraîchis la page (F5)
- Ou clique sur le bouton 🔄 dans /notifications

### Future amélioration possible
- WebSockets pour mise à jour en temps réel (push instantané)
- Notification push du navigateur
- Son de notification

## Résumé

✅ Badge 🔔 visible partout
✅ Compteur rouge avec le nombre
✅ Page dédiée /notifications
✅ 4 types de notifications actifs (like, comment, follow, message)
✅ Liens intelligents vers le contenu
✅ Actions complètes (lire, supprimer, nettoyer)

**C'est prêt à tester !** 🎉
