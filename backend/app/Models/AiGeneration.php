<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class AiGeneration extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'prompt',
        'negative_prompt',
        'image_url',
        'thumbnail_url',
        'status',
        'model',
        'parameters',
        'width',
        'height',
        'style',
        'credits_used',
        'generation_time',
        'is_public',
        'is_favorite',
        'post_id',
        'likes_count',
        'downloads_count',
    ];

    protected $casts = [
        'parameters' => 'array',
        'is_public' => 'boolean',
        'is_favorite' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relation avec l'utilisateur créateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation avec le post (si l'image est utilisée dans un post)
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }

    /**
     * Scope pour les générations publiques
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope pour les générations complétées
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope pour les favoris
     */
    public function scopeFavorite($query)
    {
        return $query->where('is_favorite', true);
    }
}
