<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Story extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'media_url',
        'media_type',
        'caption',
        'views_count',
        'expires_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
    ];

    protected $appends = ['is_expired'];

    /**
     * Relation : Une story appartient à un utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation : Les vues de la story
     */
    public function views()
    {
        return $this->hasMany(StoryView::class);
    }

    /**
     * Scope : Stories non expirées
     */
    public function scopeActive($query)
    {
        return $query->where('expires_at', '>', Carbon::now());
    }

    /**
     * Scope : Stories expirées
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', Carbon::now());
    }

    /**
     * Vérifier si la story est expirée
     */
    public function getIsExpiredAttribute()
    {
        return $this->expires_at->isPast();
    }

    /**
     * Vérifier si un utilisateur a vu cette story
     */
    public function hasBeenViewedBy($userId)
    {
        return $this->views()->where('user_id', $userId)->exists();
    }

    /**
     * Marquer comme vue par un utilisateur
     */
    public function markAsViewedBy($userId)
    {
        if (!$this->hasBeenViewedBy($userId)) {
            $this->views()->create([
                'user_id' => $userId,
                'viewed_at' => Carbon::now(),
            ]);
            
            $this->increment('views_count');
        }
    }
}
