<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\EventComment;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EventController extends Controller
{
    /**
     * Liste des événements (à venir, publics ou où l'utilisateur est invité)
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $filter = $request->get('filter', 'upcoming'); // upcoming, past, my_events, invited
        
        $query = Event::with(['creator:id,first_name,last_name,username,profile_photo']);
        
        switch ($filter) {
            case 'past':
                $query->where('end_time', '<', now())
                    ->where(function($q) use ($user) {
                        $q->where('is_private', false)
                          ->orWhereHas('attendees', function($q2) use ($user) {
                              $q2->where('users.id', $user->id);
                          });
                    })
                    ->orderBy('end_time', 'desc');
                break;
                
            case 'my_events':
                $query->where('user_id', $user->id)
                    ->orderBy('start_time', 'asc');
                break;
                
            case 'invited':
                $query->whereHas('attendees', function($q) use ($user) {
                    $q->where('users.id', $user->id)
                      ->where('status', 'invited');
                })
                ->where('start_time', '>', now())
                ->orderBy('start_time', 'asc');
                break;
                
            case 'upcoming':
            default:
                $query->where('start_time', '>', now())
                    ->where(function($q) use ($user) {
                        $q->where('is_private', false)
                          ->orWhereHas('attendees', function($q2) use ($user) {
                              $q2->where('users.id', $user->id);
                          });
                    })
                    ->orderBy('start_time', 'asc');
                break;
        }
        
        $events = $query->paginate(20);
        
        return response()->json([
            'data' => $events->map(function ($event) use ($user) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'description' => $event->description,
                    'location' => $event->location,
                    'cover_photo' => $event->cover_photo,
                    'start_time' => $event->start_time->toISOString(),
                    'end_time' => $event->end_time->toISOString(),
                    'is_online' => $event->is_online,
                    'meeting_link' => $event->meeting_link,
                    'max_attendees' => $event->max_attendees,
                    'is_private' => $event->is_private,
                    'creator' => $event->creator,
                    'going_count' => $event->attendees()->wherePivot('status', 'going')->count(),
                    'my_status' => $event->getAttendeeStatus($user->id),
                    'is_full' => $event->isFull(),
                    'is_past' => $event->isPast(),
                    'created_at' => $event->created_at->toISOString(),
                ];
            }),
            'meta' => [
                'current_page' => $events->currentPage(),
                'last_page' => $events->lastPage(),
                'per_page' => $events->perPage(),
                'total' => $events->total(),
            ],
        ]);
    }

    /**
     * Créer un nouvel événement
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'cover_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after:start_time',
            'is_online' => 'required|boolean',
            'meeting_link' => 'nullable|url',
            'max_attendees' => 'nullable|integer',
            'is_private' => 'required|boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $event = new Event();
        $event->title = $request->input('title');
        $event->description = $request->input('description');
        $event->location = $request->input('location');
        $event->start_time = $request->input('start_time');
        $event->end_time = $request->input('end_time');
        $event->is_online = $request->input('is_online');
        $event->meeting_link = $request->input('meeting_link');
        $event->max_attendees = $request->input('max_attendees');
        $event->is_private = $request->input('is_private');
        $event->user_id = $user->id;
        
        // Gestion de la photo de couverture
        if ($request->hasFile('cover_photo')) {
            $file = $request->file('cover_photo');
            $path = $file->store('event_covers', 'public');
            $event->cover_photo = $path;
        }
        
        $event->save();
        
        // Ajouter le créateur automatiquement comme participant "going"
        $event->attendees()->attach($user->id, ['status' => 'going']);
        
        // Envoyer les invitations aux utilisateurs sélectionnés
        if ($request->has('invited_users') && is_array($request->invited_users)) {
            foreach ($request->invited_users as $invitedUserId) {
                // Ajouter comme invité dans la table pivot
                $event->attendees()->attach($invitedUserId, ['status' => 'invited']);
                
                // Créer une notification
                Notification::create([
                    'user_id' => $invitedUserId,
                    'actor_id' => $user->id,
                    'event_id' => $event->id,
                    'type' => 'event_invitation',
                    'message' => $user->first_name . ' vous a invité à "' . $event->title . '"',
                    'data' => [
                        'event_title' => $event->title,
                    ],
                ]);
            }
        }
        
        return response()->json([
            'message' => 'Événement créé avec succès.',
            'data' => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'location' => $event->location,
                'cover_photo' => $event->cover_photo,
                'start_time' => $event->start_time->toISOString(),
                'end_time' => $event->end_time->toISOString(),
                'is_online' => $event->is_online,
                'meeting_link' => $event->meeting_link,
                'max_attendees' => $event->max_attendees,
                'is_private' => $event->is_private,
                'created_at' => $event->created_at->toISOString(),
            ]
        ], 201);
    }

    /**
     * Détails d'un événement
     */
    public function show($id)
    {
        $user = Auth::user();
        
        $event = Event::with(['creator:id,first_name,last_name,username,profile_photo', 'attendees', 'comments.user:id,first_name,last_name,username,profile_photo'])
            ->findOrFail($id);
        
        $is_attending = $event->attendees()->where('user_id', $user->id)->exists();
        $my_status = $event->getAttendeeStatus($user->id);
        
        // Grouper les participants par statut
        $attendeesByStatus = [
            'going' => [],
            'maybe' => [],
            'not_going' => [],
            'invited' => [],
        ];
        
        foreach ($event->attendees as $attendee) {
            $status = $attendee->pivot->status;
            $attendeesByStatus[$status][] = [
                'id' => $attendee->id,
                'first_name' => $attendee->first_name,
                'last_name' => $attendee->last_name,
                'username' => $attendee->username,
                'profile_photo' => $attendee->profile_photo,
            ];
        }
        
        return response()->json([
            'id' => $event->id,
            'title' => $event->title,
            'description' => $event->description,
            'location' => $event->location,
            'cover_photo' => $event->cover_photo,
            'start_time' => $event->start_time->toISOString(),
            'end_time' => $event->end_time->toISOString(),
            'is_online' => $event->is_online,
            'meeting_link' => $event->meeting_link,
            'max_attendees' => $event->max_attendees,
            'is_private' => $event->is_private,
            'creator' => $event->creator,
            'attendees' => $attendeesByStatus,
            'going_count' => $event->attendees()->wherePivot('status', 'going')->count(),
            'my_status' => $my_status,
            'is_full' => $event->isFull(),
            'is_past' => $event->isPast(),
            'created_at' => $event->created_at->toISOString(),
            'comments' => $event->comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'user' => $comment->user,
                    'user_id' => $comment->user_id,
                    'event_id' => $comment->event_id,
                    'comment' => $comment->content,
                    'created_at' => $comment->created_at->toISOString(),
                ];
            }),
        ]);
    }

    /**
     * Mettre à jour un événement
     */
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $event = Event::findOrFail($id);
        
        // Vérifier si l'utilisateur est le créateur de l'événement
        if ($event->user_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à modifier cet événement.'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string',
            'cover_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'start_time' => 'sometimes|required|date',
            'end_time' => 'sometimes|required|date|after:start_time',
            'is_online' => 'sometimes|required|boolean',
            'meeting_link' => 'nullable|url',
            'max_attendees' => 'nullable|integer',
            'is_private' => 'sometimes|required|boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $event->title = $request->input('title', $event->title);
        $event->description = $request->input('description', $event->description);
        $event->location = $request->input('location', $event->location);
        $event->start_time = $request->input('start_time', $event->start_time);
        $event->end_time = $request->input('end_time', $event->end_time);
        $event->is_online = $request->input('is_online', $event->is_online);
        $event->meeting_link = $request->input('meeting_link', $event->meeting_link);
        $event->max_attendees = $request->input('max_attendees', $event->max_attendees);
        $event->is_private = $request->input('is_private', $event->is_private);
        
        // Gestion de la photo de couverture
        if ($request->hasFile('cover_photo')) {
            // Supprimer l'ancienne photo si elle existe
            if ($event->cover_photo) {
                Storage::disk('public')->delete($event->cover_photo);
            }
            
            $file = $request->file('cover_photo');
            $path = $file->store('event_covers', 'public');
            $event->cover_photo = $path;
        }
        
        $event->save();
        
        return response()->json(['message' => 'Événement mis à jour avec succès.', 'event' => $event], 200);
    }

    /**
     * Supprimer un événement
     */
    public function destroy($id)
    {
        $user = Auth::user();
        $event = Event::findOrFail($id);
        
        // Vérifier si l'utilisateur est le créateur de l'événement
        if ($event->user_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à supprimer cet événement.'], 403);
        }
        
        // Supprimer les participants associés
        EventAttendee::where('event_id', $id)->delete();
        
        // Supprimer les commentaires associés
        EventComment::where('event_id', $id)->delete();
        
        // Supprimer la notification associée
        Notification::where('event_id', $id)->delete();
        
        // Supprimer l'événement
        $event->delete();
        
        return response()->json(['message' => 'Événement supprimé avec succès.'], 200);
    }

    /**
     * Répondre à un événement (participer ou s'excuser)
     */
    public function respond(Request $request, $id)
    {
        $user = Auth::user();
        $event = Event::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:going,not_going,maybe',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        // Vérifier si l'utilisateur a déjà répondu à cet événement
        $attendance = $event->attendees()->where('user_id', $user->id)->first();
        
        $status = $request->input('status');
        
        if ($attendance) {
            // Mettre à jour la réponse
            $event->attendees()->updateExistingPivot($user->id, ['status' => $status]);
        } else {
            // Vérifier si l'événement est plein (seulement pour "going")
            if ($status === 'going' && $event->isFull()) {
                return response()->json([
                    'message' => 'Désolé, cet événement est complet.'
                ], 422);
            }
            
            // Ajouter une nouvelle réponse
            $event->attendees()->attach($user->id, ['status' => $status]);
        }
        
        // Notifier le créateur si l'utilisateur participe
        if ($status === 'going' && $event->user_id !== $user->id) {
            Notification::create([
                'user_id' => $event->user_id,
                'actor_id' => $user->id,
                'event_id' => $event->id,
                'type' => 'event_response',
                'message' => $user->first_name . ' participera à "' . $event->title . '"',
                'data' => [
                    'event_title' => $event->title,
                    'response' => $status,
                ],
            ]);
        }
        
        return response()->json(['message' => 'Votre réponse a été enregistrée.', 'status' => $status], 200);
    }

    /**
     * Inviter des utilisateurs à un événement
     */
    public function invite(Request $request, $id)
    {
        $user = Auth::user();
        $event = Event::findOrFail($id);
        
        // Vérifier si l'utilisateur est le créateur de l'événement
        if ($event->user_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à inviter des utilisateurs à cet événement.'], 403);
        }
        
        $validator = Validator::make($request->all(), [
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        foreach ($request->input('user_ids') as $user_id) {
            // Ajouter comme invité dans la table pivot si pas déjà présent
            if (!$event->attendees()->where('users.id', $user_id)->exists()) {
                $event->attendees()->attach($user_id, ['status' => 'invited']);
            }
            
            // Créer une notification
            Notification::create([
                'user_id' => $user_id,
                'actor_id' => $user->id,
                'event_id' => $event->id,
                'type' => 'event_invitation',
                'message' => $user->first_name . ' vous a invité à "' . $event->title . '"',
                'data' => [
                    'event_title' => $event->title,
                ],
            ]);
        }
        
        return response()->json(['message' => 'Utilisateurs invités avec succès.'], 200);
    }

    /**
     * Ajouter un commentaire à un événement
     */
    public function addComment(Request $request, $id)
    {
        $user = Auth::user();
        $event = Event::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'comment' => 'required|string',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $comment = new EventComment();
        $comment->event_id = $event->id;
        $comment->user_id = $user->id;
        $comment->content = $request->input('comment');
        $comment->save();
        
        return response()->json(['message' => 'Commentaire ajouté avec succès.', 'comment' => $comment], 201);
    }
}
