<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Follower extends Model
{
    protected $fillable = [
        'follower_id',
        'following_id',
        'status',
    ];

    /**
     * Relation: L'utilisateur qui suit
     */
    public function follower()
    {
        return $this->belongsTo(User::class, 'follower_id');
    }

    /**
     * Relation: L'utilisateur qui est suivi
     */
    public function following()
    {
        return $this->belongsTo(User::class, 'following_id');
    }
}
