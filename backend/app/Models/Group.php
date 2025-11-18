<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'photo',
        'created_by',
        'members_count',
        'is_private',
    ];

    protected $casts = [
        'is_private' => 'boolean',
    ];

    /**
     * Relation : Un groupe appartient à un créateur
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Relation : Les membres du groupe
     */
    public function members()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Relation : Les messages du groupe
     */
    public function messages()
    {
        return $this->hasMany(GroupMessage::class);
    }

    /**
     * Relation : Les admins du groupe
     */
    public function admins()
    {
        return $this->belongsToMany(User::class, 'group_members')
            ->wherePivot('role', 'admin')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Vérifier si un utilisateur est membre
     */
    public function hasMember($userId)
    {
        return $this->members()->where('user_id', $userId)->exists();
    }

    /**
     * Vérifier si un utilisateur est admin
     */
    public function isAdmin($userId)
    {
        return $this->members()
            ->where('user_id', $userId)
            ->wherePivot('role', 'admin')
            ->exists();
    }

    /**
     * Ajouter un membre
     */
    public function addMember($userId, $role = 'member')
    {
        if (!$this->hasMember($userId)) {
            $this->members()->attach($userId, [
                'role' => $role,
                'joined_at' => now(),
            ]);
            $this->increment('members_count');
        }
    }

    /**
     * Retirer un membre
     */
    public function removeMember($userId)
    {
        if ($this->hasMember($userId)) {
            $this->members()->detach($userId);
            $this->decrement('members_count');
        }
    }
}
