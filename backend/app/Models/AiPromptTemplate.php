<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AiPromptTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'prompt',
        'negative_prompt',
        'category',
        'style',
        'thumbnail_url',
        'usage_count',
        'is_featured',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
    ];

    /**
     * Scope pour les templates en vedette
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope par catégorie
     */
    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Incrémenter le compteur d'utilisation
     */
    public function incrementUsage()
    {
        $this->increment('usage_count');
    }
}
