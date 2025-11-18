<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'content',
        'type',
        'media_urls',
        'visibility',
        'hashtags',
        'mentions',
        'likes_count',
        'comments_count',
        'shares_count',
        'is_ai_generated',
        'ai_prompt',
    ];

    protected $casts = [
        'media_urls' => 'array',
        'hashtags' => 'array',
        'mentions' => 'array',
        'is_ai_generated' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the user that owns the post
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the comments for the post
     */
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the likes for the post
     */
    public function likes()
    {
        return $this->morphMany(Like::class, 'likeable');
    }
}
