# 🔔 Sonneries pour Appels

## Fichiers nécessaires

Placez vos fichiers audio dans ce dossier :

### `ringtone.mp3` (Obligatoire)
Sonnerie pour appel entrant

**Format** : MP3  
**Durée** : 5-10 secondes (sera joué en boucle)  
**Volume** : Normalisé (sera réduit à 50% dans le code)

### Où trouver des sonneries gratuites ?

1. **Zedge** : https://www.zedge.net/find/ringtones
2. **FreeSoundEffects** : https://www.freesoundeffects.com/free-sounds/phone-10041/
3. **YouTube Audio Library** : https://studio.youtube.com/
4. **Pixabay** : https://pixabay.com/sound-effects/search/phone%20ring/

### Créer votre propre sonnerie

**Option 1 - En ligne** :
1. Aller sur https://audiotrimmer.com/
2. Uploader votre fichier audio
3. Couper 5-10 secondes
4. Télécharger en MP3

**Option 2 - Avec Audacity (gratuit)** :
```bash
# Installer Audacity
sudo apt install audacity  # Linux
brew install audacity      # Mac

# Ouvrir fichier → Exporter → MP3
```

### Format optimal

```
Codec: MP3
Bitrate: 128 kbps
Sample Rate: 44.1 kHz
Channels: Stereo
Durée: 5-10 secondes
Volume: -3dB (normalisé)
```

### Recommandations

**Sons appropriés** :
- ✅ Sonnerie de téléphone classique
- ✅ Bip-bip court et répétitif
- ✅ Mélodie simple et reconnaissable

**À éviter** :
- ❌ Musique complète (trop longue)
- ❌ Voix ou dialogues
- ❌ Sons trop forts ou stridents

### Fichier par défaut

Si aucun fichier n'est fourni, l'application fonctionnera sans sonnerie (juste notification visuelle).

### Test

Pour tester votre sonnerie :
```javascript
const audio = new Audio('/sounds/ringtone.mp3');
audio.play();
```

### Sonneries Libres de Droits

**Sonnerie iPhone-like** (Creative Commons) :
- https://freesound.org/people/InspectorJ/sounds/448227/

**Sonnerie Android-like** (Creative Commons) :
- https://freesound.org/people/Kastenfrosch/sounds/521996/

**Sonnerie Vintage** (Public Domain) :
- https://freesound.org/people/RH_sfx/sounds/423559/

---

**Note** : Assurez-vous d'avoir les droits d'utilisation de tout fichier audio que vous utilisez !
