<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_id',
        'user_id',
        'content',
        'media_url',
        'media_type',
        'mentions',
    ];

    protected $casts = [
        'mentions' => 'array',
    ];

    /**
     * Relation : Un message appartient à un groupe
     */
    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    /**
     * Relation : Un message appartient à un utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relation : Les lectures du message
     */
    public function reads()
    {
        return $this->hasMany(GroupMessageRead::class);
    }

    /**
     * Vérifier si un utilisateur a lu le message
     */
    public function isReadBy($userId)
    {
        return $this->reads()->where('user_id', $userId)->exists();
    }

    /**
     * Marquer comme lu par un utilisateur
     */
    public function markAsReadBy($userId)
    {
        if (!$this->isReadBy($userId)) {
            $this->reads()->create([
                'user_id' => $userId,
                'read_at' => now(),
            ]);
        }
    }
}
