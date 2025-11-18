<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Like;
use App\Models\Post;
use App\Models\Comment;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    /**
     * Toggle like on a post
     */
    public function togglePostLike($postId)
    {
        $post = Post::findOrFail($postId);
        
        $like = Like::where('user_id', auth()->id())
            ->where('likeable_type', Post::class)
            ->where('likeable_id', $postId)
            ->first();

        if ($like) {
            // Unlike
            $like->delete();
            $post->decrement('likes_count');
            
            return response()->json([
                'message' => 'Post unliked',
                'liked' => false,
                'likes_count' => $post->likes_count,
            ]);
        } else {
            // Like
            Like::create([
                'user_id' => auth()->id(),
                'likeable_type' => Post::class,
                'likeable_id' => $postId,
            ]);
            $post->increment('likes_count');
            
            // Create notification for post owner
            NotificationService::likePost($post->user_id, auth()->user(), $post->id);
            
            return response()->json([
                'message' => 'Post liked',
                'liked' => true,
                'likes_count' => $post->likes_count,
            ]);
        }
    }

    /**
     * Toggle like on a comment
     */
    public function toggleCommentLike($commentId)
    {
        $comment = Comment::findOrFail($commentId);
        
        $like = Like::where('user_id', auth()->id())
            ->where('likeable_type', Comment::class)
            ->where('likeable_id', $commentId)
            ->first();

        if ($like) {
            // Unlike
            $like->delete();
            $comment->decrement('likes_count');
            
            return response()->json([
                'message' => 'Comment unliked',
                'liked' => false,
                'likes_count' => $comment->likes_count,
            ]);
        } else {
            // Like
            Like::create([
                'user_id' => auth()->id(),
                'likeable_type' => Comment::class,
                'likeable_id' => $commentId,
            ]);
            $comment->increment('likes_count');
            
            return response()->json([
                'message' => 'Comment liked',
                'liked' => true,
                'likes_count' => $comment->likes_count,
            ]);
        }
    }

    /**
     * Check if user has liked a post
     */
    public function checkPostLike($postId)
    {
        $liked = Like::where('user_id', auth()->id())
            ->where('likeable_type', Post::class)
            ->where('likeable_id', $postId)
            ->exists();

        return response()->json(['liked' => $liked]);
    }
}
