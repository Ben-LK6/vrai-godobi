<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\LikeController;
use App\Http\Controllers\Api\FollowerController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\Api\StoryController;
use App\Http\Controllers\Api\GroupController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\CallController;
use App\Http\Controllers\Api\AiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/profile', [AuthController::class, 'profile']);
    
    // Posts routes
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::get('/posts/{id}', [PostController::class, 'show']);
    Route::put('/posts/{id}', [PostController::class, 'update']);
    Route::delete('/posts/{id}', [PostController::class, 'destroy']);
    Route::get('/feed', [PostController::class, 'feed']);
    
    // Comments routes
    Route::get('/posts/{postId}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{postId}/comments', [CommentController::class, 'store']);
    Route::put('/posts/{postId}/comments/{commentId}', [CommentController::class, 'update']);
    Route::delete('/posts/{postId}/comments/{commentId}', [CommentController::class, 'destroy']);
    
    // Likes routes
    Route::post('/posts/{postId}/like', [LikeController::class, 'togglePostLike']);
    Route::post('/comments/{commentId}/like', [LikeController::class, 'toggleCommentLike']);
    Route::get('/posts/{postId}/like/check', [LikeController::class, 'checkPostLike']);
    
    // Followers routes
    Route::post('/users/{userId}/follow', [FollowerController::class, 'toggle']);
    Route::get('/users/{userId}/follow/check', [FollowerController::class, 'checkFollowing']);
    Route::get('/following', [FollowerController::class, 'following']);
    Route::get('/followers', [FollowerController::class, 'followers']);
    Route::get('/users/{userId}/following', [FollowerController::class, 'userFollowing']);
    Route::get('/users/{userId}/followers', [FollowerController::class, 'userFollowers']);
    Route::get('/users/suggestions', [FollowerController::class, 'suggestions']);
    
    // Messages routes
    Route::get('/conversations', [MessageController::class, 'conversations']);
    Route::post('/conversations/{userId}', [MessageController::class, 'getOrCreateConversation']);
    Route::get('/conversations/{conversationId}/messages', [MessageController::class, 'messages']);
    Route::post('/conversations/{conversationId}/messages', [MessageController::class, 'sendMessage']);
    Route::delete('/conversations/{conversationId}/messages/{messageId}', [MessageController::class, 'deleteMessage']);
    Route::get('/messages/unread-count', [MessageController::class, 'unreadCount']);
    
    // Notifications routes
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/clear-read', [NotificationController::class, 'clearRead']);
    Route::delete('/notifications/{notificationId}', [NotificationController::class, 'destroy']);
    
    // Stories routes
    Route::get('/stories', [StoryController::class, 'index']);
    Route::post('/stories', [StoryController::class, 'store']);
    Route::get('/stories/{id}', [StoryController::class, 'show']);
    Route::get('/stories/{id}/viewers', [StoryController::class, 'viewers']);
    Route::delete('/stories/{id}', [StoryController::class, 'destroy']);
    Route::post('/stories/clean-expired', [StoryController::class, 'cleanExpired']);
    
    // Groups routes
    Route::get('/groups', [GroupController::class, 'index']);
    Route::post('/groups', [GroupController::class, 'store']);
    Route::get('/groups/{id}', [GroupController::class, 'show']);
    Route::put('/groups/{id}', [GroupController::class, 'update']);
    Route::delete('/groups/{id}', [GroupController::class, 'destroy']);
    Route::post('/groups/{id}/members', [GroupController::class, 'addMember']);
    Route::delete('/groups/{id}/members', [GroupController::class, 'removeMember']);
    Route::post('/groups/{id}/leave', [GroupController::class, 'leave']);
    Route::get('/groups/{id}/messages', [GroupController::class, 'messages']);
    Route::post('/groups/{id}/messages', [GroupController::class, 'sendMessage']);
    
    // Events routes
    Route::get('/events', [EventController::class, 'index']);
    Route::post('/events', [EventController::class, 'store']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::put('/events/{id}', [EventController::class, 'update']);
    Route::delete('/events/{id}', [EventController::class, 'destroy']);
    Route::post('/events/{id}/respond', [EventController::class, 'respond']);
    Route::post('/events/{id}/invite', [EventController::class, 'invite']);
    Route::post('/events/{id}/comments', [EventController::class, 'addComment']);
    
    // Calls routes
    Route::post('/calls/initiate', [CallController::class, 'initiateCall']);
    Route::post('/calls/{id}/answer', [CallController::class, 'answerCall']);
    Route::post('/calls/{id}/decline', [CallController::class, 'declineCall']);
    Route::post('/calls/{id}/end', [CallController::class, 'endCall']);
    Route::get('/calls/history', [CallController::class, 'callHistory']);
    Route::get('/calls/{id}', [CallController::class, 'getCallDetails']);
    
    // AI Generation routes
    Route::post('/ai/generate', [AiController::class, 'generateImage']);
    Route::get('/ai/generations', [AiController::class, 'getGenerations']);
    Route::get('/ai/gallery', [AiController::class, 'publicGallery']);
    Route::get('/ai/generations/{id}', [AiController::class, 'getGenerationDetails']);
    Route::post('/ai/generations/{id}/favorite', [AiController::class, 'toggleFavorite']);
    Route::delete('/ai/generations/{id}', [AiController::class, 'deleteGeneration']);
    Route::post('/ai/generations/{id}/variation', [AiController::class, 'createVariation']);
    Route::get('/ai/prompts/templates', [AiController::class, 'getPromptTemplates']);
    Route::post('/ai/prompts/templates/{id}/use', [AiController::class, 'useTemplate']);
    Route::get('/ai/stats', [AiController::class, 'getUserStats']);
    
    // Games routes
    Route::post('/games/invite', [\App\Http\Controllers\Api\GameController::class, 'invite']);
    Route::post('/games/invitations/{id}/accept', [\App\Http\Controllers\Api\GameController::class, 'accept']);
    Route::post('/games/invitations/{id}/decline', [\App\Http\Controllers\Api\GameController::class, 'decline']);
    Route::get('/games/invitations', [\App\Http\Controllers\Api\GameController::class, 'getInvitations']);
    Route::get('/games/{id}', [\App\Http\Controllers\Api\GameController::class, 'show']);
    Route::post('/games/{id}/cancel', [\App\Http\Controllers\Api\GameController::class, 'cancel']);
    Route::post('/games/{id}/finish', [\App\Http\Controllers\Api\GameController::class, 'finish']);
    
    // Legacy route for compatibility
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
