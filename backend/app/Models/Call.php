<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Call extends Model
{
    use HasFactory;

    protected $fillable = [
        'caller_id',
        'receiver_id',
        'group_id',
        'type',
        'call_type',
        'status',
        'channel_name',
        'agora_token',
        'duration',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
    ];

    /**
     * Relation avec l'appelant
     */
    public function caller()
    {
        return $this->belongsTo(User::class, 'caller_id');
    }

    /**
     * Relation avec le destinataire (appel 1-à-1)
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    /**
     * Relation avec le groupe (appel de groupe)
     */
    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }

    /**
     * Relation avec les participants (appel de groupe)
     */
    public function participants()
    {
        return $this->hasMany(CallParticipant::class);
    }

    /**
     * Vérifier si l'appel est actif
     */
    public function isActive()
    {
        return in_array($this->status, ['calling', 'ringing', 'connected']);
    }

    /**
     * Calculer la durée de l'appel
     */
    public function calculateDuration()
    {
        if ($this->started_at && $this->ended_at) {
            return $this->ended_at->diffInSeconds($this->started_at);
        }
        return 0;
    }
}
