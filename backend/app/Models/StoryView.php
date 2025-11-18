<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoryView extends Model
{
    use HasFactory;

    protected $fillable = [
        'story_id',
        'user_id',
        'viewed_at',
    ];

    protected $casts = [
        'viewed_at' => 'datetime',
    ];

    /**
     * Relation : Une vue appartient à une story
     */
    public function story()
    {
        return $this->belongsTo(Story::class);
    }

    /**
     * Relation : Une vue appartient à un utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
