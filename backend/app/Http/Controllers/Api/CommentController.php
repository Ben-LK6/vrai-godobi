<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Post;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Get all comments for a post
     */
    public function index($postId)
    {
        $post = Post::findOrFail($postId);
        
        $comments = Comment::with('user:id,username,first_name,last_name,profile_photo')
            ->with('replies.user:id,username,first_name,last_name,profile_photo')
            ->where('post_id', $postId)
            ->whereNull('parent_id') // Only get top-level comments
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($comments);
    }

    /**
     * Create a new comment
     */
    public function store(Request $request, $postId)
    {
        $post = Post::findOrFail($postId);

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
            'parent_id' => 'nullable|exists:comments,id',
        ]);

        $comment = Comment::create([
            'post_id' => $postId,
            'user_id' => auth()->id(),
            'parent_id' => $validated['parent_id'] ?? null,
            'content' => $validated['content'],
        ]);

        // Increment post comments count
        $post->increment('comments_count');
        
        // Create notification for post owner
        NotificationService::commentPost($post->user_id, auth()->user(), $post->id, $comment->id);

        // Load user relationship
        $comment->load('user:id,username,first_name,last_name,profile_photo');

        return response()->json([
            'message' => 'Comment created successfully',
            'comment' => $comment,
        ], 201);
    }

    /**
     * Update a comment
     */
    public function update(Request $request, $postId, $commentId)
    {
        $comment = Comment::where('post_id', $postId)->findOrFail($commentId);

        // Check ownership
        if (auth()->id() !== $comment->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $comment->update($validated);

        return response()->json([
            'message' => 'Comment updated successfully',
            'comment' => $comment,
        ]);
    }

    /**
     * Delete a comment
     */
    public function destroy($postId, $commentId)
    {
        $comment = Comment::where('post_id', $postId)->findOrFail($commentId);

        // Check ownership
        if (auth()->id() !== $comment->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Decrement post comments count
        $post = Post::find($postId);
        if ($post) {
            $post->decrement('comments_count');
        }

        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }
}
