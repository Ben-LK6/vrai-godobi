<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CallParticipant extends Model
{
    use HasFactory;

    protected $fillable = [
        'call_id',
        'user_id',
        'status',
        'joined_at',
        'left_at',
        'duration',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    /**
     * Relation avec l'appel
     */
    public function call()
    {
        return $this->belongsTo(Call::class);
    }

    /**
     * Relation avec l'utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculer la durée de participation
     */
    public function calculateDuration()
    {
        if ($this->joined_at && $this->left_at) {
            return $this->left_at->diffInSeconds($this->joined_at);
        }
        return 0;
    }
}
