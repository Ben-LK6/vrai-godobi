<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Like extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'likeable_id',
        'likeable_type',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user that owns the like
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the likeable model (post, comment, etc.)
     */
    public function likeable()
    {
        return $this->morphTo();
    }
}
