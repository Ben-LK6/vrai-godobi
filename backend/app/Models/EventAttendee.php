<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventAttendee extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'user_id',
        'status',
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
