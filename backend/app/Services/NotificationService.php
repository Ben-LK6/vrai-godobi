<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for a user
     */
    public static function create(
        int $userId,
        string $type,
        string $message,
        ?int $actorId = null,
        ?array $data = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'actor_id' => $actorId,
            'type' => $type,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Create a notification when someone likes a post
     */
    public static function likePost(int $postOwnerId, User $liker, int $postId): void
    {
        // Don't notify if user likes their own post
        if ($postOwnerId === $liker->id) {
            return;
        }

        self::create(
            userId: $postOwnerId,
            type: 'like',
            message: "{$liker->name} a aimé votre publication",
            actorId: $liker->id,
            data: ['post_id' => $postId]
        );
    }

    /**
     * Create a notification when someone comments on a post
     */
    public static function commentPost(int $postOwnerId, User $commenter, int $postId, int $commentId): void
    {
        // Don't notify if user comments on their own post
        if ($postOwnerId === $commenter->id) {
            return;
        }

        self::create(
            userId: $postOwnerId,
            type: 'comment',
            message: "{$commenter->name} a commenté votre publication",
            actorId: $commenter->id,
            data: [
                'post_id' => $postId,
                'comment_id' => $commentId
            ]
        );
    }

    /**
     * Create a notification when someone follows a user
     */
    public static function follow(int $followedUserId, User $follower): void
    {
        self::create(
            userId: $followedUserId,
            type: 'follow',
            message: "{$follower->name} a commencé à vous suivre",
            actorId: $follower->id,
            data: ['follower_id' => $follower->id]
        );
    }

    /**
     * Create a notification when someone sends a message
     */
    public static function message(int $receiverId, User $sender, int $conversationId): void
    {
        self::create(
            userId: $receiverId,
            type: 'message',
            message: "{$sender->name} vous a envoyé un message",
            actorId: $sender->id,
            data: ['conversation_id' => $conversationId]
        );
    }

    /**
     * Create a notification for game invite
     */
    public static function gameInvite(int $invitedUserId, User $inviter, string $gameName, int $gameId): void
    {
        self::create(
            userId: $invitedUserId,
            type: 'game_invite',
            message: "{$inviter->name} vous invite à jouer à {$gameName}",
            actorId: $inviter->id,
            data: ['game_id' => $gameId]
        );
    }

    /**
     * Create a notification when AI image generation is complete
     */
    public static function aiImageReady(int $userId, string $imageUrl, int $postId): void
    {
        self::create(
            userId: $userId,
            type: 'ai_image_ready',
            message: "Votre image générée par IA est prête !",
            actorId: null,
            data: [
                'image_url' => $imageUrl,
                'post_id' => $postId
            ]
        );
    }
}
