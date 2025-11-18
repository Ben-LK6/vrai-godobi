<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Story;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class StoryController extends Controller
{
    /**
     * Liste des stories des amis (suivis) + mes stories
     * Groupées par utilisateur, triées par date
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // IDs des utilisateurs suivis + moi-même
        $followingIds = $user->following()->pluck('users.id')->toArray();
        $followingIds[] = $user->id;
        
        // Récupérer toutes les stories actives de ces utilisateurs
        $stories = Story::with(['user:id,first_name,last_name,username,profile_photo'])
            ->whereIn('user_id', $followingIds)
            ->active()
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Grouper par utilisateur
        $groupedStories = $stories->groupBy('user_id')->map(function ($userStories, $userId) use ($user) {
            $storyUser = $userStories->first()->user;
            
            return [
                'user_id' => $userId,
                'user' => [
                    'id' => $storyUser->id,
                    'first_name' => $storyUser->first_name,
                    'last_name' => $storyUser->last_name,
                    'username' => $storyUser->username,
                    'profile_photo' => $storyUser->profile_photo,
                ],
                'stories' => $userStories->map(function ($story) use ($user) {
                    return [
                        'id' => $story->id,
                        'media_url' => $story->media_url,
                        'media_type' => $story->media_type,
                        'caption' => $story->caption,
                        'views_count' => $story->views_count,
                        'created_at' => $story->created_at->toISOString(),
                        'expires_at' => $story->expires_at->toISOString(),
                        'is_viewed' => $story->hasBeenViewedBy($user->id),
                    ];
                })->values(),
                'has_unviewed' => $userStories->filter(function ($story) use ($user) {
                    return !$story->hasBeenViewedBy($user->id);
                })->isNotEmpty(),
            ];
        })->values();
        
        return response()->json($groupedStories);
    }

    /**
     * Créer une nouvelle story
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'media' => 'required|file|mimes:jpeg,png,jpg,gif,mp4,mov|max:10240', // 10MB max
            'caption' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Upload du média
        $file = $request->file('media');
        $mediaType = in_array($file->extension(), ['mp4', 'mov']) ? 'video' : 'image';
        $path = $file->store('stories', 'public');
        $mediaUrl = Storage::url($path);
        
        // Créer la story avec expiration à 24h
        $story = Story::create([
            'user_id' => $user->id,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'caption' => $request->caption,
            'expires_at' => Carbon::now()->addHours(24),
        ]);

        return response()->json([
            'message' => 'Story created successfully',
            'story' => [
                'id' => $story->id,
                'media_url' => $story->media_url,
                'media_type' => $story->media_type,
                'caption' => $story->caption,
                'views_count' => $story->views_count,
                'created_at' => $story->created_at->toISOString(),
                'expires_at' => $story->expires_at->toISOString(),
            ]
        ], 201);
    }

    /**
     * Voir une story spécifique (et marquer comme vue)
     */
    public function show($id)
    {
        $story = Story::with(['user:id,first_name,last_name,username,profile_photo'])
            ->active()
            ->findOrFail($id);
        
        $user = Auth::user();
        
        // Marquer comme vue (sauf si c'est ma propre story)
        if ($story->user_id !== $user->id) {
            $story->markAsViewedBy($user->id);
        }
        
        return response()->json([
            'id' => $story->id,
            'user' => [
                'id' => $story->user->id,
                'first_name' => $story->user->first_name,
                'last_name' => $story->user->last_name,
                'username' => $story->user->username,
                'profile_photo' => $story->user->profile_photo,
            ],
            'media_url' => $story->media_url,
            'media_type' => $story->media_type,
            'caption' => $story->caption,
            'views_count' => $story->views_count,
            'created_at' => $story->created_at->toISOString(),
            'expires_at' => $story->expires_at->toISOString(),
            'is_viewed' => $story->hasBeenViewedBy($user->id),
        ]);
    }

    /**
     * Liste des utilisateurs qui ont vu ma story
     */
    public function viewers($id)
    {
        $story = Story::findOrFail($id);
        
        // Vérifier que c'est bien ma story
        if ($story->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }
        
        $viewers = $story->views()
            ->with('user:id,first_name,last_name,username,profile_photo')
            ->orderBy('viewed_at', 'desc')
            ->get()
            ->map(function ($view) {
                return [
                    'user' => [
                        'id' => $view->user->id,
                        'first_name' => $view->user->first_name,
                        'last_name' => $view->user->last_name,
                        'username' => $view->user->username,
                        'profile_photo' => $view->user->profile_photo,
                    ],
                    'viewed_at' => $view->viewed_at->toISOString(),
                ];
            });
        
        return response()->json($viewers);
    }

    /**
     * Supprimer une story
     */
    public function destroy($id)
    {
        $story = Story::findOrFail($id);
        
        // Vérifier que c'est bien ma story
        if ($story->user_id !== Auth::id()) {
            return response()->json([
                'message' => 'Unauthorized'
            ], 403);
        }
        
        // Supprimer le fichier média
        $path = str_replace('/storage/', '', $story->media_url);
        if (Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
        
        $story->delete();
        
        return response()->json([
            'message' => 'Story deleted successfully'
        ]);
    }

    /**
     * Nettoyer les stories expirées (à appeler via un cron job)
     */
    public function cleanExpired()
    {
        $expiredStories = Story::expired()->get();
        
        foreach ($expiredStories as $story) {
            // Supprimer le fichier média
            $path = str_replace('/storage/', '', $story->media_url);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
            
            $story->delete();
        }
        
        return response()->json([
            'message' => 'Expired stories cleaned',
            'count' => $expiredStories->count()
        ]);
    }
}
