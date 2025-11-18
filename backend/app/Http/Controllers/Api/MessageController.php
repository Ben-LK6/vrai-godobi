<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    /**
     * Liste des conversations de l'utilisateur connecté
     */
    public function conversations(Request $request)
    {
        $userId = $request->user()->id;
        
        $conversations = Conversation::where('user1_id', $userId)
            ->orWhere('user2_id', $userId)
            ->with(['user1', 'user2', 'lastMessage'])
            ->orderByDesc('last_message_at')
            ->get()
            ->map(function ($conversation) use ($userId) {
                $otherUser = $conversation->getOtherUser($userId);
                return [
                    'id' => $conversation->id,
                    'other_user' => [
                        'id' => $otherUser->id,
                        'username' => $otherUser->username,
                        'first_name' => $otherUser->first_name,
                        'last_name' => $otherUser->last_name,
                        'profile_photo' => $otherUser->profile_photo,
                    ],
                    'last_message' => $conversation->lastMessage,
                    'unread_count' => $conversation->unreadCount($userId),
                    'updated_at' => $conversation->last_message_at,
                ];
            });

        return response()->json([
            'data' => $conversations,
        ]);
    }

    /**
     * Obtenir ou créer une conversation avec un utilisateur
     */
    public function getOrCreateConversation(Request $request, $userId)
    {
        $currentUserId = $request->user()->id;
        
        if ($currentUserId == $userId) {
            return response()->json([
                'message' => 'Vous ne pouvez pas créer une conversation avec vous-même'
            ], 400);
        }

        // Vérifier si l'utilisateur existe
        $otherUser = User::find($userId);
        if (!$otherUser) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        // Chercher une conversation existante
        $conversation = Conversation::where(function ($query) use ($currentUserId, $userId) {
            $query->where('user1_id', $currentUserId)->where('user2_id', $userId);
        })->orWhere(function ($query) use ($currentUserId, $userId) {
            $query->where('user1_id', $userId)->where('user2_id', $currentUserId);
        })->first();

        // Créer une nouvelle conversation si elle n'existe pas
        if (!$conversation) {
            $conversation = Conversation::create([
                'user1_id' => min($currentUserId, $userId),
                'user2_id' => max($currentUserId, $userId),
            ]);
        }

        return response()->json([
            'conversation' => $conversation,
            'other_user' => [
                'id' => $otherUser->id,
                'username' => $otherUser->username,
                'first_name' => $otherUser->first_name,
                'last_name' => $otherUser->last_name,
                'profile_photo' => $otherUser->profile_photo,
            ],
        ]);
    }

    /**
     * Messages d'une conversation
     */
    public function messages(Request $request, $conversationId)
    {
        $userId = $request->user()->id;
        
        $conversation = Conversation::find($conversationId);
        if (!$conversation) {
            return response()->json(['message' => 'Conversation non trouvée'], 404);
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        if ($conversation->user1_id != $userId && $conversation->user2_id != $userId) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $messages = Message::where('conversation_id', $conversationId)
            ->with(['sender', 'receiver'])
            ->orderBy('created_at', 'asc')
            ->get();

        // Marquer les messages comme lus
        Message::where('conversation_id', $conversationId)
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->update([
                'is_read' => true,
                'read_at' => now(),
            ]);

        return response()->json([
            'data' => $messages,
        ]);
    }

    /**
     * Envoyer un message
     */
    public function sendMessage(Request $request, $conversationId)
    {
        $request->validate([
            'content' => 'required|string|max:5000',
        ]);

        $userId = $request->user()->id;
        
        $conversation = Conversation::find($conversationId);
        if (!$conversation) {
            return response()->json(['message' => 'Conversation non trouvée'], 404);
        }

        // Vérifier que l'utilisateur fait partie de la conversation
        if ($conversation->user1_id != $userId && $conversation->user2_id != $userId) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        // Déterminer le destinataire
        $receiverId = $conversation->user1_id == $userId 
            ? $conversation->user2_id 
            : $conversation->user1_id;

        // Créer le message
        $message = Message::create([
            'conversation_id' => $conversationId,
            'sender_id' => $userId,
            'receiver_id' => $receiverId,
            'content' => $request->content,
        ]);

        // Mettre à jour la conversation
        $conversation->update([
            'last_message_at' => now(),
        ]);
        
        // Create notification for receiver
        NotificationService::message($receiverId, $request->user(), $conversationId);

        // Charger les relations
        $message->load(['sender', 'receiver']);

        return response()->json([
            'message' => $message,
        ], 201);
    }

    /**
     * Supprimer un message
     */
    public function deleteMessage(Request $request, $conversationId, $messageId)
    {
        $userId = $request->user()->id;
        
        $message = Message::where('id', $messageId)
            ->where('conversation_id', $conversationId)
            ->first();

        if (!$message) {
            return response()->json(['message' => 'Message non trouvé'], 404);
        }

        // Seul l'expéditeur peut supprimer son message
        if ($message->sender_id != $userId) {
            return response()->json(['message' => 'Accès non autorisé'], 403);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message supprimé avec succès',
        ]);
    }

    /**
     * Nombre total de messages non lus
     */
    public function unreadCount(Request $request)
    {
        $userId = $request->user()->id;
        
        $count = Message::where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'count' => $count,
        ]);
    }
}
