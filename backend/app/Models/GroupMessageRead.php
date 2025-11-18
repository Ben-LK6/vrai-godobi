<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GroupMessageRead extends Model
{
    use HasFactory;

    protected $fillable = [
        'group_message_id',
        'user_id',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    /**
     * Relation : Une lecture appartient à un message
     */
    public function message()
    {
        return $this->belongsTo(GroupMessage::class, 'group_message_id');
    }

    /**
     * Relation : Une lecture appartient à un utilisateur
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
