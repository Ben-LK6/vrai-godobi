<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'username',
        'email',
        'phone',
        'password',
        'first_name',
        'last_name',
        'birth_date',
        'age',
        'gender',
        'profile_photo',
        'bio',
        'ultra_light_mode',
        'ai_credits',
        'xp_points',
        'level',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'is_verified' => 'boolean',
            'is_active' => 'boolean',
            'ultra_light_mode' => 'boolean',
            'last_active_at' => 'datetime',
        ];
    }

    /**
     * Get the posts for the user
     */
    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    /**
     * Les utilisateurs que cet utilisateur suit
     */
    public function following()
    {
        return $this->belongsToMany(User::class, 'followers', 'follower_id', 'following_id')
            ->withTimestamps()
            ->withPivot('status');
    }

    /**
     * Les utilisateurs qui suivent cet utilisateur
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'followers', 'following_id', 'follower_id')
            ->withTimestamps()
            ->withPivot('status');
    }

    /**
     * Vérifier si cet utilisateur suit un autre utilisateur
     */
    public function isFollowing($userId)
    {
        return $this->following()->where('following_id', $userId)->exists();
    }

    /**
     * Vérifier si cet utilisateur est suivi par un autre utilisateur
     */
    public function isFollowedBy($userId)
    {
        return $this->followers()->where('follower_id', $userId)->exists();
    }

    /**
     * Les groupes de l'utilisateur
     */
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_members')
            ->withPivot('role', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Les événements créés par l'utilisateur
     */
    public function createdEvents()
    {
        return $this->hasMany(Event::class);
    }

    /**
     * Les événements auxquels l'utilisateur participe
     */
    public function events()
    {
        return $this->belongsToMany(Event::class, 'event_attendees')
            ->withPivot('status')
            ->withTimestamps();
    }
}
