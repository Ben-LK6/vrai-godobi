<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Conversation extends Model
{
    protected $fillable = [
        'user1_id',
        'user2_id',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    /**
     * Premier utilisateur de la conversation
     */
    public function user1()
    {
        return $this->belongsTo(User::class, 'user1_id');
    }

    /**
     * Deuxième utilisateur de la conversation
     */
    public function user2()
    {
        return $this->belongsTo(User::class, 'user2_id');
    }

    /**
     * Messages de la conversation
     */
    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    /**
     * Dernier message de la conversation
     */
    public function lastMessage()
    {
        return $this->hasOne(Message::class)->latestOfMany();
    }

    /**
     * Obtenir l'autre utilisateur dans la conversation
     */
    public function getOtherUser($currentUserId)
    {
        return $this->user1_id == $currentUserId ? $this->user2 : $this->user1;
    }

    /**
     * Compter les messages non lus pour un utilisateur
     */
    public function unreadCount($userId)
    {
        return $this->messages()
            ->where('receiver_id', $userId)
            ->where('is_read', false)
            ->count();
    }
}
