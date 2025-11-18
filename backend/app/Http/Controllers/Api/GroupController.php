<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\GroupMessage;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class GroupController extends Controller
{
    /**
     * Liste des groupes de l'utilisateur
     */
    public function index()
    {
        $user = Auth::user();
        
        $groups = $user->groups()
            ->with(['creator:id,first_name,last_name,username,profile_photo'])
            ->withCount('members')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($group) use ($user) {
                // Dernier message
                $lastMessage = $group->messages()
                    ->with('user:id,first_name,last_name')
                    ->latest()
                    ->first();
                
                // Messages non lus
                $unreadCount = $group->messages()
                    ->whereDoesntHave('reads', function ($query) use ($user) {
                        $query->where('user_id', $user->id);
                    })
                    ->where('user_id', '!=', $user->id)
                    ->count();
                
                return [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'photo' => $group->photo,
                    'members_count' => $group->members_count,
                    'is_private' => $group->is_private,
                    'is_admin' => $group->isAdmin($user->id),
                    'created_by' => $group->creator,
                    'last_message' => $lastMessage ? [
                        'content' => $lastMessage->content,
                        'user' => $lastMessage->user,
                        'created_at' => $lastMessage->created_at->toISOString(),
                    ] : null,
                    'unread_count' => $unreadCount,
                    'created_at' => $group->created_at->toISOString(),
                    'updated_at' => $group->updated_at->toISOString(),
                ];
            });
        
        return response()->json($groups);
    }

    /**
     * Créer un nouveau groupe
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'member_ids' => 'nullable|array',
            'member_ids.*' => 'exists:users,id',
            'is_private' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = Auth::user();
        
        // Upload photo si présente
        $photoUrl = null;
        if ($request->hasFile('photo')) {
            $path = $request->file('photo')->store('groups', 'public');
            $photoUrl = Storage::url($path);
        }
        
        // Créer le groupe
        $group = Group::create([
            'name' => $request->name,
            'description' => $request->description,
            'photo' => $photoUrl,
            'created_by' => $user->id,
            'is_private' => $request->is_private ?? false,
            'members_count' => 1, // Le créateur
        ]);
        
        // Ajouter le créateur comme admin
        $group->addMember($user->id, 'admin');
        
        // Ajouter les autres membres avec notifications
        if ($request->has('member_ids')) {
            foreach ($request->member_ids as $memberId) {
                if ($memberId != $user->id) {
                    $group->addMember($memberId);
                    
                    // Notification pour chaque nouveau membre
                    Notification::create([
                        'user_id' => $memberId,
                        'actor_id' => $user->id,
                        'group_id' => $group->id,
                        'type' => 'group_invitation',
                        'message' => $user->first_name . ' vous a ajouté au groupe "' . $group->name . '"',
                        'data' => [
                            'group_name' => $group->name,
                        ],
                    ]);
                }
            }
        }
        
        // Rafraîchir le groupe pour obtenir le members_count mis à jour
        $group->refresh();
        
        return response()->json([
            'message' => 'Group created successfully',
            'group' => [
                'id' => $group->id,
                'name' => $group->name,
                'description' => $group->description,
                'photo' => $group->photo,
                'members_count' => $group->members_count,
                'is_private' => $group->is_private,
                'created_at' => $group->created_at->toISOString(),
            ]
        ], 201);
    }

    /**
     * Détails d'un groupe
     */
    public function show($id)
    {
        $group = Group::with([
            'creator:id,first_name,last_name,username,profile_photo',
            'members' => function ($query) {
                $query->select('users.id', 'first_name', 'last_name', 'username', 'profile_photo')
                    ->withPivot('role', 'joined_at');
            }
        ])->findOrFail($id);
        
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est membre
        if (!$group->hasMember($user->id)) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }
        
        return response()->json([
            'id' => $group->id,
            'name' => $group->name,
            'description' => $group->description,
            'photo' => $group->photo,
            'members_count' => $group->members_count,
            'is_private' => $group->is_private,
            'is_admin' => $group->isAdmin($user->id),
            'created_by' => $group->creator,
            'members' => $group->members->map(function ($member) {
                return [
                    'id' => $member->id,
                    'first_name' => $member->first_name,
                    'last_name' => $member->last_name,
                    'username' => $member->username,
                    'profile_photo' => $member->profile_photo,
                    'role' => $member->pivot->role,
                    'joined_at' => $member->pivot->joined_at,
                ];
            }),
            'created_at' => $group->created_at->toISOString(),
            'updated_at' => $group->updated_at->toISOString(),
        ]);
    }

    /**
     * Modifier un groupe (admin seulement)
     */
    public function update(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est admin
        if (!$group->isAdmin($user->id)) {
            return response()->json([
                'message' => 'Only admins can update the group'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'string|max:100',
            'description' => 'nullable|string|max:500',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg|max:2048',
            'is_private' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Upload nouvelle photo si présente
        if ($request->hasFile('photo')) {
            // Supprimer ancienne photo
            if ($group->photo) {
                $oldPath = str_replace('/storage/', '', $group->photo);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }
            
            $path = $request->file('photo')->store('groups', 'public');
            $group->photo = Storage::url($path);
        }
        
        $group->update($request->only(['name', 'description', 'is_private']));
        
        return response()->json([
            'message' => 'Group updated successfully',
            'group' => $group
        ]);
    }

    /**
     * Supprimer un groupe (admin seulement)
     */
    public function destroy($id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est admin
        if (!$group->isAdmin($user->id)) {
            return response()->json([
                'message' => 'Only admins can delete the group'
            ], 403);
        }
        
        // Supprimer la photo
        if ($group->photo) {
            $path = str_replace('/storage/', '', $group->photo);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
        
        $group->delete();
        
        return response()->json([
            'message' => 'Group deleted successfully'
        ]);
    }

    /**
     * Ajouter un membre au groupe (admin seulement)
     */
    public function addMember(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est admin
        if (!$group->isAdmin($user->id)) {
            return response()->json([
                'message' => 'Only admins can add members'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        $group->addMember($request->user_id);
        
        // Créer une notification pour le nouveau membre
        Notification::create([
            'user_id' => $request->user_id,
            'actor_id' => $user->id,
            'group_id' => $group->id,
            'type' => 'group_invitation',
            'message' => $user->first_name . ' vous a ajouté au groupe "' . $group->name . '"',
            'data' => [
                'group_name' => $group->name,
            ],
        ]);
        
        return response()->json([
            'message' => 'Member added successfully'
        ]);
    }

    /**
     * Retirer un membre du groupe (admin seulement)
     */
    public function removeMember(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est admin
        if (!$group->isAdmin($user->id)) {
            return response()->json([
                'message' => 'Only admins can remove members'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Ne pas permettre de retirer le créateur
        if ($request->user_id == $group->created_by) {
            return response()->json([
                'message' => 'Cannot remove the group creator'
            ], 403);
        }
        
        $group->removeMember($request->user_id);
        
        return response()->json([
            'message' => 'Member removed successfully'
        ]);
    }

    /**
     * Quitter le groupe
     */
    public function leave($id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Ne pas permettre au créateur de quitter
        if ($user->id == $group->created_by) {
            return response()->json([
                'message' => 'The group creator cannot leave. Transfer ownership or delete the group instead.'
            ], 403);
        }
        
        $group->removeMember($user->id);
        
        return response()->json([
            'message' => 'You left the group successfully'
        ]);
    }

    /**
     * Messages du groupe
     */
    public function messages($id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est membre
        if (!$group->hasMember($user->id)) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }
        
        $messages = $group->messages()
            ->with('user:id,first_name,last_name,username,profile_photo')
            ->orderBy('created_at', 'desc')
            ->paginate(50);
        
        // Marquer les messages comme lus
        foreach ($messages as $message) {
            if ($message->user_id != $user->id) {
                $message->markAsReadBy($user->id);
            }
        }
        
        return response()->json($messages);
    }

    /**
     * Envoyer un message dans le groupe
     */
    public function sendMessage(Request $request, $id)
    {
        $group = Group::findOrFail($id);
        $user = Auth::user();
        
        // Vérifier que l'utilisateur est membre
        if (!$group->hasMember($user->id)) {
            return response()->json([
                'message' => 'You are not a member of this group'
            ], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'content' => 'required|string|max:5000',
            'media' => 'nullable|file|mimes:jpeg,png,jpg,gif,mp4,pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }
        
        // Détecter les mentions (@username)
        $mentions = [];
        preg_match_all('/@(\w+)/', $request->content, $matches);
        if (!empty($matches[1])) {
            $usernames = $matches[1];
            $mentionedUsers = \App\Models\User::whereIn('username', $usernames)->get();
            $mentions = $mentionedUsers->pluck('id')->toArray();
        }
        
        // Upload média si présent
        $mediaUrl = null;
        $mediaType = null;
        if ($request->hasFile('media')) {
            $file = $request->file('media');
            $path = $file->store('group_media', 'public');
            $mediaUrl = Storage::url($path);
            
            $extension = $file->extension();
            if (in_array($extension, ['jpg', 'jpeg', 'png', 'gif'])) {
                $mediaType = 'image';
            } elseif (in_array($extension, ['mp4', 'mov'])) {
                $mediaType = 'video';
            } else {
                $mediaType = 'file';
            }
        }
        
        $message = GroupMessage::create([
            'group_id' => $group->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'media_url' => $mediaUrl,
            'media_type' => $mediaType,
            'mentions' => $mentions,
        ]);
        
        // Marquer comme lu par l'expéditeur
        $message->markAsReadBy($user->id);
        
        // Mettre à jour la date du groupe
        $group->touch();
        
        // Créer des notifications spéciales pour les utilisateurs mentionnés
        foreach ($mentions as $mentionedUserId) {
            if ($mentionedUserId != $user->id) {
                Notification::create([
                    'user_id' => $mentionedUserId,
                    'actor_id' => $user->id,
                    'group_id' => $group->id,
                    'type' => 'group_mention',
                    'message' => $user->first_name . ' vous a mentionné dans "' . $group->name . '"',
                    'data' => [
                        'group_name' => $group->name,
                    ],
                ]);
            }
        }
        
        // Créer des notifications pour tous les autres membres
        $members = $group->members()->where('users.id', '!=', $user->id)->get();
        foreach ($members as $member) {
            Notification::create([
                'user_id' => $member->id,
                'actor_id' => $user->id,
                'group_id' => $group->id,
                'type' => 'group_message',
                'message' => $user->first_name . ': ' . substr($request->content, 0, 100),
                'data' => [
                    'group_name' => $group->name,
                ],
            ]);
        }
        
        return response()->json([
            'message' => 'Message sent successfully',
            'data' => [
                'id' => $message->id,
                'content' => $message->content,
                'media_url' => $message->media_url,
                'media_type' => $message->media_type,
                'user' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'profile_photo' => $user->profile_photo,
                ],
                'created_at' => $message->created_at->toISOString(),
            ]
        ], 201);
    }
}
