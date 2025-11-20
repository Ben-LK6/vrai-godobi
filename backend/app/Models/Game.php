<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $fillable = [
        'type',
        'status',
        'creator_id',
        'opponent_id',
        'winner_id',
        'game_data',
        'started_at',
        'finished_at',
    ];

    protected $casts = [
        'game_data' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function opponent()
    {
        return $this->belongsTo(User::class, 'opponent_id');
    }

    public function participants()
    {
        return $this->hasMany(GameParticipant::class);
    }
}
