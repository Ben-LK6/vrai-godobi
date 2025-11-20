<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PostController extends Controller
{
    /**
     * Display a listing of posts (feed)
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $posts = Post::with(['user', 'comments.user', 'likes'])
            ->where('visibility', 'public')
            ->orWhere(function($query) use ($user) {
                $query->where('user_id', $user->id);
            })
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Add is_liked flag for each post
        $posts->getCollection()->transform(function ($post) use ($user) {
            $post->is_liked = $post->likes()->where('user_id', $user->id)->exists();
            return $post;
        });

        return response()->json([
            'success' => true,
            'data' => $posts
        ]);
    }

    /**
     * Store a newly created post
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
            'type' => 'required|in:text,image,video,audio',
            'image' => 'nullable|image|max:10240', // File upload
            'image_url' => 'nullable|string|url', // External URL (IA)
            'visibility' => 'required|in:public,friends,private',
            'is_ai_generated' => 'nullable|boolean',
            'ai_prompt' => 'nullable|string',
            'hashtags' => 'nullable|array',
            'mentions' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $data = $validator->validated();
        $data['user_id'] = $user->id;

        // Handle file upload if present
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('posts', 'public');
            $data['media_urls'] = [Storage::url($path)];
        }

        // Handle external image URL (for AI generated images)
        if ($request->has('image_url')) {
            $data['image_url'] = $request->input('image_url');
        }

        $post = Post::create($data);
        $post->load(['user', 'comments', 'likes']);

        return response()->json([
            'success' => true,
            'message' => 'Post created successfully',
            'data' => $post
        ], 201);
    }

    /**
     * Display the specified post
     */
    public function show(Request $request, $id)
    {
        $user = $request->user();
        
        $post = Post::with(['user', 'comments.user', 'likes'])->find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        // Check visibility
        if ($post->visibility !== 'public' && $post->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        $post->is_liked = $post->likes()->where('user_id', $user->id)->exists();

        return response()->json([
            'success' => true,
            'data' => $post
        ]);
    }

    /**
     * Remove the specified post
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $post = Post::find($id);

        if (!$post) {
            return response()->json([
                'success' => false,
                'message' => 'Post not found'
            ], 404);
        }

        if ($post->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Delete associated media files if they exist
        if ($post->media_urls && is_array($post->media_urls)) {
            foreach ($post->media_urls as $url) {
                $path = str_replace('/storage/', '', parse_url($url, PHP_URL_PATH));
                Storage::disk('public')->delete($path);
            }
        }

        $post->delete();

        return response()->json([
            'success' => true,
            'message' => 'Post deleted successfully'
        ]);
    }
}
