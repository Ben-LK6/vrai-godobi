<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Event extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'location',
        'cover_photo',
        'start_time',
        'end_time',
        'is_online',
        'meeting_link',
        'max_attendees',
        'is_private',
    ];

    protected $casts = [
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'is_online' => 'boolean',
        'is_private' => 'boolean',
    ];

    /**
     * Relation : Un événement appartient à un créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Relation : Les participants de l'événement
     */
    public function attendees()
    {
        return $this->belongsToMany(User::class, 'event_attendees')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Relation : Les participants qui vont à l'événement
     */
    public function goingAttendees()
    {
        return $this->belongsToMany(User::class, 'event_attendees')
            ->wherePivot('status', 'going')
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Relation : Les commentaires de l'événement
     */
    public function comments()
    {
        return $this->hasMany(EventComment::class);
    }

    /**
     * Vérifier si un utilisateur est invité ou participe
     */
    public function hasAttendee($userId)
    {
        return $this->attendees()->where('users.id', $userId)->exists();
    }

    /**
     * Obtenir le statut d'un utilisateur pour cet événement
     */
    public function getAttendeeStatus($userId)
    {
        $attendee = $this->attendees()->where('users.id', $userId)->first();
        return $attendee ? $attendee->pivot->status : null;
    }

    /**
     * Vérifier si l'événement est complet
     */
    public function isFull()
    {
        if (!$this->max_attendees) {
            return false;
        }
        $goingCount = $this->attendees()->wherePivot('status', 'going')->count();
        return $goingCount >= $this->max_attendees;
    }

    /**
     * Vérifier si l'événement est passé
     */
    public function isPast()
    {
        return $this->end_time < now();
    }

    /**
     * Obtenir le nombre de participants confirmés
     */
    public function getGoingCountAttribute()
    {
        return $this->attendees()->wherePivot('status', 'going')->count();
    }
}
