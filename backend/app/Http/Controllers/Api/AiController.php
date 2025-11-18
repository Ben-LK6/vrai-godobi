<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiGeneration;
use App\Models\AiPromptTemplate;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AiController extends Controller
{
    /**
     * Générer une image avec IA (API de test pour l'instant)
     */
    public function generateImage(Request $request)
    {
        $user = Auth::user();

        $validator = Validator::make($request->all(), [
            'prompt' => 'required|string|min:3|max:1000',
            'negative_prompt' => 'nullable|string|max:500',
            'style' => 'nullable|in:realistic,anime,cartoon,artistic,photographic,3d-render',
            'width' => 'nullable|integer|in:512,768,1024,1536',
            'height' => 'nullable|integer|in:512,768,1024,1536',
            'is_public' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérifier les crédits
        if ($user->ai_credits < 1) {
            return response()->json([
                'message' => 'Crédits IA insuffisants. Rechargez vos crédits.',
                'credits_remaining' => 0,
            ], 403);
        }

        $prompt = $request->input('prompt');
        $negativePrompt = $request->input('negative_prompt', 'ugly, blurry, low quality');
        $style = $request->input('style', 'realistic');
        $width = $request->input('width', 1024);
        $height = $request->input('height', 1024);
        $isPublic = $request->input('is_public', true);

        // Créer l'enregistrement de génération
        $generation = AiGeneration::create([
            'user_id' => $user->id,
            'prompt' => $prompt,
            'negative_prompt' => $negativePrompt,
            'image_url' => '', // Sera rempli après génération
            'status' => 'generating',
            'model' => 'test', // API de test
            'parameters' => [
                'style' => $style,
                'seed' => rand(1000, 9999),
            ],
            'width' => $width,
            'height' => $height,
            'style' => $style,
            'credits_used' => 1,
            'is_public' => $isPublic,
        ]);

        // Simuler un appel API (mode test)
        try {
            $imageUrl = $this->generateTestImage($prompt, $style, $width, $height);
            
            $generation->update([
                'image_url' => $imageUrl,
                'thumbnail_url' => $imageUrl, // Même URL pour le test
                'status' => 'completed',
                'generation_time' => rand(3, 8) . 's',
            ]);

            // Déduire les crédits
            $user->decrement('ai_credits', 1);

            return response()->json([
                'message' => 'Image générée avec succès !',
                'generation' => [
                    'id' => $generation->id,
                    'prompt' => $generation->prompt,
                    'image_url' => $generation->image_url,
                    'thumbnail_url' => $generation->thumbnail_url,
                    'status' => $generation->status,
                    'style' => $generation->style,
                    'width' => $generation->width,
                    'height' => $generation->height,
                    'generation_time' => $generation->generation_time,
                    'created_at' => $generation->created_at,
                ],
                'credits_remaining' => $user->ai_credits,
            ], 201);

        } catch (\Exception $e) {
            $generation->update([
                'status' => 'failed',
            ]);

            return response()->json([
                'message' => 'Échec de la génération : ' . $e->getMessage(),
                'generation_id' => $generation->id,
            ], 500);
        }
    }

    /**
     * Générer une image de test (API mock)
     * Utilise Picsum pour des images placeholder
     */
    private function generateTestImage($prompt, $style, $width, $height)
    {
        // Utiliser l'API Picsum Photos pour générer des images aléatoires
        // En production, remplacer par Stability AI, DALL-E, etc.
        $seed = md5($prompt . $style . time());
        return "https://picsum.photos/seed/{$seed}/{$width}/{$height}";
    }

    /**
     * Récupérer l'historique des générations de l'utilisateur
     */
    public function getGenerations(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->input('per_page', 20);
        $status = $request->input('status'); // all, completed, failed, generating

        $query = AiGeneration::where('user_id', $user->id)
            ->with('post')
            ->orderBy('created_at', 'desc');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $generations = $query->paginate($perPage);

        return response()->json([
            'generations' => $generations->items(),
            'pagination' => [
                'current_page' => $generations->currentPage(),
                'last_page' => $generations->lastPage(),
                'per_page' => $generations->perPage(),
                'total' => $generations->total(),
            ],
            'credits_remaining' => $user->ai_credits,
        ]);
    }

    /**
     * Galerie publique d'images IA
     */
    public function publicGallery(Request $request)
    {
        $perPage = $request->input('per_page', 24);
        $style = $request->input('style'); // Filter par style

        $query = AiGeneration::public()
            ->completed()
            ->with('user:id,username,first_name,last_name,profile_photo')
            ->orderBy('created_at', 'desc');

        if ($style) {
            $query->where('style', $style);
        }

        $generations = $query->paginate($perPage);

        return response()->json([
            'generations' => $generations->items(),
            'pagination' => [
                'current_page' => $generations->currentPage(),
                'last_page' => $generations->lastPage(),
                'per_page' => $generations->perPage(),
                'total' => $generations->total(),
            ],
        ]);
    }

    /**
     * Récupérer les détails d'une génération
     */
    public function getGenerationDetails($id)
    {
        $generation = AiGeneration::with('user:id,username,first_name,last_name,profile_photo', 'post')
            ->findOrFail($id);

        // Vérifier la visibilité
        if (!$generation->is_public && $generation->user_id !== Auth::id()) {
            return response()->json(['message' => 'Génération privée.'], 403);
        }

        return response()->json([
            'generation' => $generation,
        ]);
    }

    /**
     * Marquer une génération comme favorite
     */
    public function toggleFavorite($id)
    {
        $user = Auth::user();
        $generation = AiGeneration::where('user_id', $user->id)->findOrFail($id);

        $generation->is_favorite = !$generation->is_favorite;
        $generation->save();

        return response()->json([
            'message' => $generation->is_favorite ? 'Ajouté aux favoris' : 'Retiré des favoris',
            'is_favorite' => $generation->is_favorite,
        ]);
    }

    /**
     * Supprimer une génération
     */
    public function deleteGeneration($id)
    {
        $user = Auth::user();
        $generation = AiGeneration::where('user_id', $user->id)->findOrFail($id);

        $generation->delete();

        return response()->json([
            'message' => 'Génération supprimée avec succès',
        ]);
    }

    /**
     * Créer une variation d'une image existante
     */
    public function createVariation(Request $request, $id)
    {
        $user = Auth::user();
        $originalGeneration = AiGeneration::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'variation_prompt' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Vérifier les crédits
        if ($user->ai_credits < 1) {
            return response()->json([
                'message' => 'Crédits IA insuffisants.',
            ], 403);
        }

        $variationPrompt = $request->input('variation_prompt');
        $newPrompt = $variationPrompt 
            ? $originalGeneration->prompt . ', ' . $variationPrompt
            : $originalGeneration->prompt;

        // Créer une nouvelle génération basée sur l'originale
        $generation = AiGeneration::create([
            'user_id' => $user->id,
            'prompt' => $newPrompt,
            'negative_prompt' => $originalGeneration->negative_prompt,
            'image_url' => '',
            'status' => 'generating',
            'model' => 'test',
            'parameters' => array_merge(
                $originalGeneration->parameters ?? [],
                ['variation_of' => $originalGeneration->id]
            ),
            'width' => $originalGeneration->width,
            'height' => $originalGeneration->height,
            'style' => $originalGeneration->style,
            'credits_used' => 1,
            'is_public' => $originalGeneration->is_public,
        ]);

        try {
            $imageUrl = $this->generateTestImage(
                $newPrompt,
                $generation->style,
                $generation->width,
                $generation->height
            );
            
            $generation->update([
                'image_url' => $imageUrl,
                'thumbnail_url' => $imageUrl,
                'status' => 'completed',
                'generation_time' => rand(3, 8) . 's',
            ]);

            $user->decrement('ai_credits', 1);

            return response()->json([
                'message' => 'Variation créée avec succès !',
                'generation' => $generation,
                'credits_remaining' => $user->ai_credits,
            ], 201);

        } catch (\Exception $e) {
            $generation->update(['status' => 'failed']);
            return response()->json([
                'message' => 'Échec de la variation : ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Récupérer les templates de prompts
     */
    public function getPromptTemplates(Request $request)
    {
        $category = $request->input('category');
        $featured = $request->input('featured', false);

        $query = AiPromptTemplate::query();

        if ($category) {
            $query->byCategory($category);
        }

        if ($featured) {
            $query->featured();
        }

        $templates = $query->orderBy('usage_count', 'desc')->get();

        return response()->json([
            'templates' => $templates,
        ]);
    }

    /**
     * Utiliser un template de prompt
     */
    public function useTemplate($id)
    {
        $template = AiPromptTemplate::findOrFail($id);
        $template->incrementUsage();

        return response()->json([
            'template' => $template,
        ]);
    }

    /**
     * Statistiques IA de l'utilisateur
     */
    public function getUserStats()
    {
        $user = Auth::user();

        $stats = [
            'total_generations' => AiGeneration::where('user_id', $user->id)->count(),
            'completed_generations' => AiGeneration::where('user_id', $user->id)
                ->where('status', 'completed')->count(),
            'failed_generations' => AiGeneration::where('user_id', $user->id)
                ->where('status', 'failed')->count(),
            'favorites_count' => AiGeneration::where('user_id', $user->id)
                ->where('is_favorite', true)->count(),
            'public_generations' => AiGeneration::where('user_id', $user->id)
                ->where('is_public', true)->count(),
            'total_credits_used' => AiGeneration::where('user_id', $user->id)
                ->sum('credits_used'),
            'credits_remaining' => $user->ai_credits,
            'styles_used' => AiGeneration::where('user_id', $user->id)
                ->select('style', \DB::raw('count(*) as count'))
                ->groupBy('style')
                ->get(),
        ];

        return response()->json($stats);
    }
}
