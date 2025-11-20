<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GameAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'game_id',
        'user_id',
        'question_number',
        'question_text',
        'selected_answer',
        'correct_answer',
        'is_correct',
        'points_earned',
        'time_taken',
        'answered_at',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'answered_at' => 'datetime',
    ];

    public function game()
    {
        return $this->belongsTo(Game::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
