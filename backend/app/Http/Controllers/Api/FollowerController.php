<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Follower;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class FollowerController extends Controller
{
    /**
     * Suivre ou ne plus suivre un utilisateur
     */
    public function toggle(Request $request, $userId)
    {
        $currentUser = $request->user();
        
        // On ne peut pas se suivre soi-même
        if ($currentUser->id == $userId) {
            return response()->json([
                'message' => 'Vous ne pouvez pas vous suivre vous-même'
            ], 400);
        }

        // Vérifier si l'utilisateur existe
        $userToFollow = User::find($userId);
        if (!$userToFollow) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        // Vérifier si on suit déjà cet utilisateur
        $existingFollow = Follower::where('follower_id', $currentUser->id)
            ->where('following_id', $userId)
            ->first();

        if ($existingFollow) {
            // Ne plus suivre
            $existingFollow->delete();
            
            // Décrémenter les compteurs
            $currentUser->decrement('following_count');
            $userToFollow->decrement('followers_count');

            return response()->json([
                'message' => 'Vous ne suivez plus cet utilisateur',
                'following' => false,
            ]);
        } else {
            // Suivre
            Follower::create([
                'follower_id' => $currentUser->id,
                'following_id' => $userId,
                'status' => 'accepted',
            ]);

            // Incrémenter les compteurs
            $currentUser->increment('following_count');
            $userToFollow->increment('followers_count');
            
            // Create notification for followed user
            NotificationService::follow($userId, $currentUser);

            return response()->json([
                'message' => 'Vous suivez maintenant cet utilisateur',
                'following' => true,
            ]);
        }
    }

    /**
     * Liste des utilisateurs suivis par l'utilisateur connecté
     */
    public function following(Request $request)
    {
        $user = $request->user();
        
        $following = $user->following()
            ->select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.profile_photo', 'users.followers_count', 'users.following_count')
            ->get();

        return response()->json([
            'data' => $following,
            'count' => $following->count(),
        ]);
    }

    /**
     * Liste des followers de l'utilisateur connecté
     */
    public function followers(Request $request)
    {
        $user = $request->user();
        
        $followers = $user->followers()
            ->select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.profile_photo', 'users.followers_count', 'users.following_count')
            ->get();

        return response()->json([
            'data' => $followers,
            'count' => $followers->count(),
        ]);
    }

    /**
     * Liste des utilisateurs suivis par un utilisateur spécifique
     */
    public function userFollowing($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
        
        $following = $user->following()
            ->select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.profile_photo', 'users.followers_count', 'users.following_count')
            ->get();

        return response()->json([
            'data' => $following,
            'count' => $following->count(),
        ]);
    }

    /**
     * Liste des followers d'un utilisateur spécifique
     */
    public function userFollowers($userId)
    {
        $user = User::find($userId);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
        
        $followers = $user->followers()
            ->select('users.id', 'users.username', 'users.first_name', 'users.last_name', 'users.profile_photo', 'users.followers_count', 'users.following_count')
            ->get();

        return response()->json([
            'data' => $followers,
            'count' => $followers->count(),
        ]);
    }

    /**
     * Vérifier si l'utilisateur connecté suit un utilisateur spécifique
     */
    public function checkFollowing(Request $request, $userId)
    {
        $currentUser = $request->user();
        
        $isFollowing = Follower::where('follower_id', $currentUser->id)
            ->where('following_id', $userId)
            ->exists();

        return response()->json([
            'following' => $isFollowing,
        ]);
    }

    /**
     * Suggestions d'utilisateurs à suivre
     */
    public function suggestions(Request $request)
    {
        $currentUser = $request->user();
        
        // Utilisateurs que l'utilisateur connecté ne suit pas encore
        $suggestions = User::where('id', '!=', $currentUser->id)
            ->whereNotIn('id', function($query) use ($currentUser) {
                $query->select('following_id')
                    ->from('followers')
                    ->where('follower_id', $currentUser->id);
            })
            ->select('id', 'username', 'first_name', 'last_name', 'profile_photo', 'bio', 'followers_count', 'following_count')
            ->orderByDesc('followers_count')
            ->limit(10)
            ->get();

        return response()->json([
            'data' => $suggestions,
        ]);
    }
}
