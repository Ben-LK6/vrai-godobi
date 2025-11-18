# 🎨 MODULE 12 - IA Créative

## Vue d'ensemble

Module de génération d'images par intelligence artificielle intégré au réseau social GODOBI.

**Version actuelle** : API de test (mock) avec Picsum Photos  
**Version future** : Intégration Stability AI, DALL-E 3, ou Midjourney

---

## 📊 Base de Données

### Table: `ai_generations`

Stocke toutes les générations d'images IA.

```sql
id                  BIGINT (PK)
user_id             BIGINT (FK → users)
prompt              VARCHAR(1000)          -- Texte de génération
negative_prompt     VARCHAR(500)           -- Ce qu'on ne veut PAS
image_url           VARCHAR                -- URL de l'image
thumbnail_url       VARCHAR                -- Miniature
status              ENUM                   -- pending, generating, completed, failed
model               ENUM                   -- stable-diffusion, dalle-3, midjourney, test
parameters          JSON                   -- Configuration (style, seed, etc.)
width               INT (default: 1024)
height              INT (default: 1024)
style               VARCHAR                -- realistic, anime, cartoon, artistic
credits_used        INT (default: 1)
generation_time     VARCHAR                -- Ex: "5s"
is_public           BOOLEAN (default: true)
is_favorite         BOOLEAN (default: false)
post_id             BIGINT (FK → posts, nullable)
likes_count         INT (default: 0)
downloads_count     INT (default: 0)
created_at          TIMESTAMP
updated_at          TIMESTAMP
deleted_at          TIMESTAMP (soft delete)
```

### Table: `ai_prompt_templates`

Templates de prompts prédéfinis.

```sql
id              BIGINT (PK)
title           VARCHAR(100)
prompt          VARCHAR(1000)
negative_prompt VARCHAR(500)
category        VARCHAR              -- portrait, landscape, abstract, etc.
style           VARCHAR
thumbnail_url   VARCHAR
usage_count     INT (default: 0)
is_featured     BOOLEAN (default: false)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

---

## 🚀 API Endpoints

### 1. Générer une Image

```http
POST /api/ai/generate
Authorization: Bearer {token}
Content-Type: application/json
```

**Body** :
```json
{
  "prompt": "A beautiful sunset over mountains",
  "negative_prompt": "ugly, blurry, low quality",
  "style": "photographic",
  "width": 1024,
  "height": 1024,
  "is_public": true
}
```

**Response 201** :
```json
{
  "message": "Image générée avec succès !",
  "generation": {
    "id": 15,
    "prompt": "A beautiful sunset over mountains",
    "image_url": "https://picsum.photos/seed/abc123/1024/1024",
    "thumbnail_url": "https://picsum.photos/seed/abc123/1024/1024",
    "status": "completed",
    "style": "photographic",
    "width": 1024,
    "height": 1024,
    "generation_time": "5s",
    "created_at": "2025-11-18T04:30:00Z"
  },
  "credits_remaining": 2
}
```

**Response 403** (Pas de crédits) :
```json
{
  "message": "Crédits IA insuffisants. Rechargez vos crédits.",
  "credits_remaining": 0
}
```

---

### 2. Récupérer l'Historique

```http
GET /api/ai/generations?per_page=20&status=completed
Authorization: Bearer {token}
```

**Query Parameters** :
- `per_page` (optional): Nombre par page (default: 20)
- `status` (optional): all, completed, failed, generating

**Response 200** :
```json
{
  "generations": [
    {
      "id": 15,
      "user_id": 1,
      "prompt": "A beautiful sunset over mountains",
      "image_url": "https://...",
      "status": "completed",
      "style": "photographic",
      "created_at": "2025-11-18T04:30:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 95
  },
  "credits_remaining": 2
}
```

---

### 3. Galerie Publique

```http
GET /api/ai/gallery?per_page=24&style=photographic
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "generations": [
    {
      "id": 42,
      "prompt": "Epic dragon in fantasy landscape",
      "image_url": "https://...",
      "user": {
        "id": 3,
        "username": "artlover",
        "first_name": "John",
        "last_name": "Doe",
        "profile_photo": "..."
      },
      "created_at": "2025-11-18T03:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

---

### 4. Détails d'une Génération

```http
GET /api/ai/generations/{id}
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "generation": {
    "id": 15,
    "user_id": 1,
    "prompt": "...",
    "negative_prompt": "...",
    "image_url": "https://...",
    "thumbnail_url": "https://...",
    "status": "completed",
    "model": "test",
    "parameters": {
      "style": "photographic",
      "seed": 4567
    },
    "width": 1024,
    "height": 1024,
    "style": "photographic",
    "credits_used": 1,
    "generation_time": "5s",
    "is_public": true,
    "is_favorite": false,
    "post_id": null,
    "user": { ... },
    "created_at": "2025-11-18T04:30:00Z"
  }
}
```

---

### 5. Toggle Favori

```http
POST /api/ai/generations/{id}/favorite
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "message": "Ajouté aux favoris",
  "is_favorite": true
}
```

---

### 6. Supprimer une Génération

```http
DELETE /api/ai/generations/{id}
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "message": "Génération supprimée avec succès"
}
```

---

### 7. Créer une Variation

```http
POST /api/ai/generations/{id}/variation
Authorization: Bearer {token}
Content-Type: application/json
```

**Body** :
```json
{
  "variation_prompt": "add more clouds in the sky"
}
```

**Response 201** :
```json
{
  "message": "Variation créée avec succès !",
  "generation": { ... },
  "credits_remaining": 1
}
```

---

### 8. Templates de Prompts

```http
GET /api/ai/prompts/templates?category=portrait&featured=true
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "templates": [
    {
      "id": 1,
      "title": "Portrait Réaliste Professionnel",
      "prompt": "professional headshot portrait...",
      "negative_prompt": "blurry, low quality...",
      "category": "portrait",
      "style": "photographic",
      "usage_count": 127,
      "is_featured": true
    }
  ]
}
```

---

### 9. Utiliser un Template

```http
POST /api/ai/prompts/templates/{id}/use
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "template": {
    "id": 1,
    "title": "Portrait Réaliste Professionnel",
    "prompt": "...",
    "usage_count": 128
  }
}
```

---

### 10. Statistiques Utilisateur

```http
GET /api/ai/stats
Authorization: Bearer {token}
```

**Response 200** :
```json
{
  "total_generations": 45,
  "completed_generations": 42,
  "failed_generations": 3,
  "favorites_count": 12,
  "public_generations": 38,
  "total_credits_used": 45,
  "credits_remaining": 5,
  "styles_used": [
    { "style": "photographic", "count": 25 },
    { "style": "anime", "count": 15 },
    { "style": "artistic", "count": 5 }
  ]
}
```

---

## 🎨 Styles Disponibles

- **realistic** : Photo réaliste
- **anime** : Style anime/manga japonais
- **cartoon** : Style cartoon occidental
- **artistic** : Art artistique/peinture
- **photographic** : Style photographique professionnel
- **3d-render** : Rendu 3D

---

## 📐 Dimensions Supportées

- 512x512 (petit, rapide)
- 768x768 (moyen)
- 1024x1024 (standard, recommandé)
- 1536x1536 (grand, lent)

---

## 💳 Système de Crédits

- **Génération standard** : 1 crédit
- **Variation** : 1 crédit
- **Crédits initiaux** : 3 crédits par utilisateur (dans la table `users`)
- **Recharge** : À implémenter (boutique, abonnement)

---

## 🔧 Mode Test (Actuel)

**API utilisée** : Picsum Photos (https://picsum.photos)

```php
private function generateTestImage($prompt, $style, $width, $height)
{
    $seed = md5($prompt . $style . time());
    return "https://picsum.photos/seed/{$seed}/{$width}/{$height}";
}
```

**Avantages** :
- ✅ Gratuit
- ✅ Pas de clé API nécessaire
- ✅ Images aléatoires basées sur un seed
- ✅ Parfait pour tester l'interface

**Limitations** :
- ❌ Images aléatoires (pas de rapport avec le prompt)
- ❌ Pas de contrôle sur le style
- ❌ Pas de vraie génération IA

---

## 🚀 Intégration API Réelle (Future)

### Option A : Stability AI (Stable Diffusion)

```bash
composer require guzzlehttp/guzzle
```

```php
use GuzzleHttp\Client;

private function generateRealImage($prompt, $style, $width, $height)
{
    $client = new Client();
    $apiKey = env('STABILITY_API_KEY');
    
    $response = $client->post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', [
        'headers' => [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ],
        'json' => [
            'text_prompts' => [
                [
                    'text' => $prompt,
                    'weight' => 1
                ],
                [
                    'text' => $negativePrompt ?? 'ugly, blurry',
                    'weight' => -1
                ]
            ],
            'cfg_scale' => 7,
            'height' => $height,
            'width' => $width,
            'samples' => 1,
            'steps' => 30,
        ]
    ]);
    
    $data = json_decode($response->getBody(), true);
    $base64Image = $data['artifacts'][0]['base64'];
    
    // Sauvegarder l'image
    $imageData = base64_decode($base64Image);
    $filename = 'ai_' . Str::uuid() . '.png';
    Storage::disk('public')->put('ai-generations/' . $filename, $imageData);
    
    return Storage::url('ai-generations/' . $filename);
}
```

**Coût** : ~$0.002 par image

---

### Option B : OpenAI DALL-E 3

```bash
composer require openai-php/client
```

```php
use OpenAI;

private function generateWithDallE($prompt, $size)
{
    $client = OpenAI::client(env('OPENAI_API_KEY'));
    
    $response = $client->images()->create([
        'model' => 'dall-e-3',
        'prompt' => $prompt,
        'size' => $size, // 1024x1024, 1792x1024, 1024x1792
        'quality' => 'standard', // standard ou hd
        'n' => 1,
    ]);
    
    return $response->data[0]->url;
}
```

**Coût** : ~$0.04 par image (standard), ~$0.08 (HD)

---

## 📱 Frontend (À Créer - Phase 2)

### Pages nécessaires :

1. **/ai** - Page principale de génération
2. **/ai/gallery** - Galerie publique
3. **/ai/history** - Historique personnel
4. **/ai/favorites** - Favoris

### Composants :

- `AiGenerator.tsx` - Interface de génération
- `PromptInput.tsx` - Zone de saisie de prompt
- `StyleSelector.tsx` - Sélecteur de style
- `TemplateGallery.tsx` - Galerie de templates
- `GenerationCard.tsx` - Carte d'affichage d'une génération
- `ImagePreview.tsx` - Prévisualisation d'image
- `CreditsDisplay.tsx` - Affichage des crédits

---

## 🎯 Catégories de Prompts

- **portrait** - Portraits et visages
- **landscape** - Paysages et nature
- **abstract** - Art abstrait
- **scifi** - Science-fiction
- **fantasy** - Fantasy et magie
- **nature** - Nature et animaux
- **architecture** - Bâtiments et structures
- **animal** - Animaux
- **food** - Nourriture
- **character** - Personnages et avatars

---

## ✅ Backend Phase 1 - TERMINÉE

- ✅ Migration `ai_generations`
- ✅ Migration `ai_prompt_templates`
- ✅ Modèle `AiGeneration`
- ✅ Modèle `AiPromptTemplate`
- ✅ Controller `AiController` (10 endpoints)
- ✅ Routes API configurées
- ✅ Seeder avec 15 templates de prompts
- ✅ API de test (Picsum Photos)

---

## 🚧 TODO - Phase 2 (Frontend)

- [ ] Page `/ai` - Interface de génération
- [ ] Composant `AiGenerator`
- [ ] Composant `PromptInput`
- [ ] Composant `StyleSelector`
- [ ] Composant `TemplateGallery`
- [ ] Page `/ai/gallery` - Galerie publique
- [ ] Page `/ai/history` - Historique
- [ ] Intégration dans les posts (attacher image IA)
- [ ] Système de likes pour les générations
- [ ] Téléchargement d'images

---

## 🔮 TODO - Phase 3 (Avancé)

- [ ] Intégration Stability AI ou DALL-E
- [ ] Upscaling d'images (agrandir)
- [ ] Inpainting (éditer des parties)
- [ ] Outpainting (étendre l'image)
- [ ] Remix d'images existantes
- [ ] Génération par image de référence
- [ ] Système d'achat de crédits
- [ ] Abonnement premium (crédits illimités)
- [ ] Marketplace d'images IA
- [ ] Collaboration (générations en groupe)

---

## 📝 Exemples de Prompts

### Portrait Réaliste
```
professional portrait photo, 35mm lens, natural lighting, 
detailed skin texture, shallow depth of field, bokeh background
```

### Paysage Fantasy
```
epic fantasy landscape, mystical mountains, glowing crystals,
magical atmosphere, dramatic sunset, volumetric lighting,
highly detailed, artstation trending
```

### Style Anime
```
anime character, detailed eyes, colorful hair, studio ghibli style,
soft lighting, vibrant colors, cel shading, high quality animation
```

### Cyberpunk
```
cyberpunk city street, neon signs, rain reflections, night scene,
futuristic technology, flying cars, detailed architecture,
blade runner aesthetic
```

---

## 🎉 Prochaine Étape

Créer le frontend Next.js pour l'interface de génération !

Voulez-vous que je continue avec **Phase 2 - Frontend** ?
