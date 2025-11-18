<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventComment extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'content',
        'comment', // Alias pour compatibilité
    ];

    /**
     * Relation : Appartient à un événement
     */
    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    /**
     * Relation : Appartient à un utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
