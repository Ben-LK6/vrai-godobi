<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GameInvitation extends Model
{
    protected $fillable = [
        'game_id',
        'from_user_id',
        'to_user_id',
        'game_type',
        'status',
        'expires_at',
        'responded_at',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'responded_at' => 'datetime',
    ];

    public function fromUser()
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }

    public function toUser()
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }
}
