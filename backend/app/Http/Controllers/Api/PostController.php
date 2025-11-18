<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    /**
     * Get all posts (with pagination and filters)
     */
    public function index(Request $request)
    {
        $query = Post::with('user:id,username,first_name,last_name,profile_photo')
            ->withCount(['likes', 'comments']);

        // Filter by type
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        // Filter by visibility
        if ($request->has('visibility')) {
            $query->where('visibility', $request->visibility);
        } else {
            // Default: only show public posts for non-authenticated users
            if (!auth()->check()) {
                $query->where('visibility', 'public');
            }
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter AI-generated posts
        if ($request->has('ai_generated')) {
            $query->where('is_ai_generated', $request->boolean('ai_generated'));
        }

        // Sort by most recent by default
        $query->orderBy('created_at', 'desc');

        // Paginate results
        $posts = $query->paginate($request->get('per_page', 10));

        return response()->json($posts);
    }

    /**
     * Create a new post
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|max:5000',
            'type' => 'required|in:text,image,video,ai_generated',
            'media_urls' => 'nullable|array',
            'media_urls.*' => 'url',
            'visibility' => 'required|in:public,friends,private',
            'hashtags' => 'nullable|array',
            'hashtags.*' => 'string',
            'mentions' => 'nullable|array',
            'mentions.*' => 'integer|exists:users,id',
            'is_ai_generated' => 'boolean',
            'ai_prompt' => 'nullable|string|max:1000',
        ]);

        $post = auth()->user()->posts()->create([
            'content' => $validated['content'],
            'type' => $validated['type'],
            'media_urls' => $validated['media_urls'] ?? null,
            'visibility' => $validated['visibility'],
            'hashtags' => $validated['hashtags'] ?? null,
            'mentions' => $validated['mentions'] ?? null,
            'is_ai_generated' => $validated['is_ai_generated'] ?? false,
            'ai_prompt' => $validated['ai_prompt'] ?? null,
        ]);

        // Load user relationship
        $post->load('user:id,username,first_name,last_name,profile_photo');

        return response()->json([
            'message' => 'Post created successfully',
            'post' => $post,
        ], 201);
    }

    /**
     * Get a single post
     */
    public function show($id)
    {
        $post = Post::with('user:id,username,first_name,last_name,profile_photo')
            ->withCount(['likes', 'comments'])
            ->findOrFail($id);

        // Check visibility permissions
        if ($post->visibility === 'private' && (!auth()->check() || auth()->id() !== $post->user_id)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($post);
    }

    /**
     * Update a post
     */
    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        // Check ownership
        if (auth()->id() !== $post->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'content' => 'sometimes|string|max:5000',
            'visibility' => 'sometimes|in:public,friends,private',
            'hashtags' => 'nullable|array',
            'hashtags.*' => 'string',
        ]);

        $post->update($validated);

        return response()->json([
            'message' => 'Post updated successfully',
            'post' => $post,
        ]);
    }

    /**
     * Delete a post
     */
    public function destroy($id)
    {
        $post = Post::findOrFail($id);

        // Check ownership
        if (auth()->id() !== $post->user_id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $post->delete();

        return response()->json([
            'message' => 'Post deleted successfully',
        ]);
    }

    /**
     * Get posts from followed users (Feed)
     */
    public function feed(Request $request)
    {
        // TODO: Implement when we have followers/following system
        // For now, return all public posts
        $posts = Post::with('user:id,username,first_name,last_name,profile_photo')
            ->withCount(['likes', 'comments'])
            ->where('visibility', 'public')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 10));

        return response()->json($posts);
    }
}
