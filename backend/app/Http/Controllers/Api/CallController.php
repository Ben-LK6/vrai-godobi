<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Call;
use App\Models\CallParticipant;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CallController extends Controller
{
    /**
     * Initier un appel (1-à-1 ou groupe)
     */
    public function initiateCall(Request $request)
    {
        $user = Auth::user();
        
        $validator = Validator::make($request->all(), [
            'receiver_id' => 'required_without:group_id|exists:users,id',
            'group_id' => 'required_without:receiver_id|exists:groups,id',
            'type' => 'required|in:audio,video',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $receiverId = $request->input('receiver_id');
        $groupId = $request->input('group_id');
        $type = $request->input('type');
        
        // Vérifier si le destinataire n'est pas en appel
        if ($receiverId) {
            $activeCall = Call::where('receiver_id', $receiverId)
                ->whereIn('status', ['calling', 'ringing', 'connected'])
                ->first();
            
            if ($activeCall) {
                return response()->json(['message' => 'L\'utilisateur est déjà en appel.'], 422);
            }
        }
        
        // Créer le nom du channel unique
        $channelName = 'call_' . Str::uuid();
        
        // Générer le token Agora (pour l'instant null, à implémenter avec SDK Agora)
        $agoraToken = $this->generateAgoraToken($channelName, $user->id);
        
        // Créer l'appel
        $call = Call::create([
            'caller_id' => $user->id,
            'receiver_id' => $receiverId,
            'group_id' => $groupId,
            'type' => $type,
            'call_type' => $groupId ? 'group' : 'one_to_one',
            'status' => 'calling',
            'channel_name' => $channelName,
            'agora_token' => $agoraToken,
        ]);
        
        // Ajouter l'appelant comme participant
        CallParticipant::create([
            'call_id' => $call->id,
            'user_id' => $user->id,
            'status' => 'joined',
            'joined_at' => now(),
        ]);
        
        // Envoyer les notifications
        if ($receiverId) {
            // Appel 1-à-1
            $this->sendCallNotification($call, $receiverId);
        } else {
            // Appel de groupe
            $group = $call->group;
            foreach ($group->members as $member) {
                if ($member->id !== $user->id) {
                    // Ajouter comme participant
                    CallParticipant::create([
                        'call_id' => $call->id,
                        'user_id' => $member->id,
                        'status' => 'invited',
                    ]);
                    
                    $this->sendCallNotification($call, $member->id);
                }
            }
        }
        
        return response()->json([
            'message' => 'Appel initié avec succès.',
            'call' => [
                'id' => $call->id,
                'type' => $call->type,
                'call_type' => $call->call_type,
                'status' => $call->status,
                'channel_name' => $call->channel_name,
                'agora_token' => $call->agora_token,
                'caller' => [
                    'id' => $user->id,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'username' => $user->username,
                    'profile_photo' => $user->profile_photo,
                ],
                'receiver' => $call->receiver ? [
                    'id' => $call->receiver->id,
                    'first_name' => $call->receiver->first_name,
                    'last_name' => $call->receiver->last_name,
                    'username' => $call->receiver->username,
                    'profile_photo' => $call->receiver->profile_photo,
                ] : null,
            ],
        ], 201);
    }

    /**
     * Répondre à un appel
     */
    public function answerCall(Request $request, $id)
    {
        $user = Auth::user();
        $call = Call::findOrFail($id);
        
        // Vérifier que l'utilisateur est le destinataire ou un participant
        if ($call->call_type === 'one_to_one' && $call->receiver_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à répondre à cet appel.'], 403);
        }
        
        if ($call->call_type === 'group') {
            $participant = $call->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Vous n\'êtes pas invité à cet appel.'], 403);
            }
        }
        
        // Mettre à jour le statut de l'appel
        if ($call->status === 'calling' || $call->status === 'ringing') {
            $call->status = 'connected';
            $call->started_at = now();
            $call->save();
        }
        
        // Mettre à jour le participant
        $participant = $call->participants()->where('user_id', $user->id)->first();
        if ($participant) {
            $participant->status = 'joined';
            $participant->joined_at = now();
            $participant->save();
        } else {
            CallParticipant::create([
                'call_id' => $call->id,
                'user_id' => $user->id,
                'status' => 'joined',
                'joined_at' => now(),
            ]);
        }
        
        return response()->json([
            'message' => 'Vous avez rejoint l\'appel.',
            'call' => [
                'id' => $call->id,
                'type' => $call->type,
                'status' => $call->status,
                'channel_name' => $call->channel_name,
                'agora_token' => $call->agora_token,
            ],
        ], 200);
    }

    /**
     * Rejeter un appel
     */
    public function declineCall($id)
    {
        $user = Auth::user();
        $call = Call::findOrFail($id);
        
        // Vérifier que l'utilisateur est le destinataire
        if ($call->receiver_id !== $user->id) {
            return response()->json(['message' => 'Vous n\'êtes pas autorisé à rejeter cet appel.'], 403);
        }
        
        // Mettre à jour le statut
        $call->status = 'declined';
        $call->ended_at = now();
        $call->save();
        
        // Mettre à jour le participant
        $participant = $call->participants()->where('user_id', $user->id)->first();
        if ($participant) {
            $participant->status = 'declined';
            $participant->save();
        }
        
        // Notifier l'appelant
        Notification::create([
            'user_id' => $call->caller_id,
            'actor_id' => $user->id,
            'call_id' => $call->id,
            'type' => 'call_declined',
            'message' => $user->first_name . ' a refusé votre appel',
            'data' => ['call_id' => $call->id],
        ]);
        
        return response()->json(['message' => 'Appel refusé.'], 200);
    }

    /**
     * Terminer un appel
     */
    public function endCall($id)
    {
        $user = Auth::user();
        $call = Call::findOrFail($id);
        
        // Vérifier que l'utilisateur participe à l'appel
        $participant = $call->participants()->where('user_id', $user->id)->first();
        if (!$participant && $call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            return response()->json(['message' => 'Vous ne participez pas à cet appel.'], 403);
        }
        
        // Si c'est un appel 1-à-1, terminer complètement
        if ($call->call_type === 'one_to_one') {
            $call->status = 'ended';
            $call->ended_at = now();
            $call->duration = $call->calculateDuration();
            $call->save();
            
            // Mettre à jour tous les participants
            foreach ($call->participants as $p) {
                if ($p->status === 'joined') {
                    $p->status = 'left';
                    $p->left_at = now();
                    $p->duration = $p->calculateDuration();
                    $p->save();
                }
            }
        } else {
            // Appel de groupe : juste retirer l'utilisateur
            if ($participant) {
                $participant->status = 'left';
                $participant->left_at = now();
                $participant->duration = $participant->calculateDuration();
                $participant->save();
            }
            
            // Si tous les participants sont partis, terminer l'appel
            $activeParticipants = $call->participants()->where('status', 'joined')->count();
            if ($activeParticipants === 0) {
                $call->status = 'ended';
                $call->ended_at = now();
                $call->duration = $call->calculateDuration();
                $call->save();
            }
        }
        
        return response()->json(['message' => 'Appel terminé.'], 200);
    }

    /**
     * Obtenir l'historique des appels
     */
    public function callHistory(Request $request)
    {
        $user = Auth::user();
        $type = $request->get('type', 'all'); // all, missed, outgoing, incoming
        
        $query = Call::with(['caller:id,first_name,last_name,username,profile_photo', 'receiver:id,first_name,last_name,username,profile_photo'])
            ->where(function($q) use ($user) {
                $q->where('caller_id', $user->id)
                  ->orWhere('receiver_id', $user->id);
            })
            ->whereIn('status', ['ended', 'missed', 'declined']);
        
        switch ($type) {
            case 'missed':
                $query->where('receiver_id', $user->id)
                    ->where('status', 'missed');
                break;
            case 'outgoing':
                $query->where('caller_id', $user->id);
                break;
            case 'incoming':
                $query->where('receiver_id', $user->id);
                break;
        }
        
        $calls = $query->orderBy('created_at', 'desc')->paginate(20);
        
        return response()->json([
            'data' => $calls->map(function ($call) use ($user) {
                return [
                    'id' => $call->id,
                    'type' => $call->type,
                    'call_type' => $call->call_type,
                    'status' => $call->status,
                    'duration' => $call->duration,
                    'direction' => $call->caller_id === $user->id ? 'outgoing' : 'incoming',
                    'caller' => $call->caller,
                    'receiver' => $call->receiver,
                    'created_at' => $call->created_at->toISOString(),
                ];
            }),
            'meta' => [
                'current_page' => $calls->currentPage(),
                'last_page' => $calls->lastPage(),
                'per_page' => $calls->perPage(),
                'total' => $calls->total(),
            ],
        ]);
    }

    /**
     * Obtenir les détails d'un appel en cours
     */
    public function getCallDetails($id)
    {
        $user = Auth::user();
        $call = Call::with(['caller', 'receiver', 'participants.user'])->findOrFail($id);
        
        // Vérifier que l'utilisateur participe à l'appel
        if ($call->caller_id !== $user->id && $call->receiver_id !== $user->id) {
            $participant = $call->participants()->where('user_id', $user->id)->first();
            if (!$participant) {
                return response()->json(['message' => 'Vous ne participez pas à cet appel.'], 403);
            }
        }
        
        return response()->json([
            'id' => $call->id,
            'type' => $call->type,
            'call_type' => $call->call_type,
            'status' => $call->status,
            'channel_name' => $call->channel_name,
            'agora_token' => $call->agora_token,
            'duration' => $call->duration,
            'caller' => $call->caller,
            'receiver' => $call->receiver,
            'participants' => $call->participants->map(function ($p) {
                return [
                    'id' => $p->id,
                    'user' => $p->user,
                    'status' => $p->status,
                    'joined_at' => $p->joined_at ? $p->joined_at->toISOString() : null,
                ];
            }),
            'started_at' => $call->started_at ? $call->started_at->toISOString() : null,
            'created_at' => $call->created_at->toISOString(),
        ]);
    }

    /**
     * Envoyer une notification d'appel
     */
    private function sendCallNotification($call, $userId)
    {
        $caller = $call->caller;
        $type = $call->type === 'audio' ? '📞' : '📹';
        
        Notification::create([
            'user_id' => $userId,
            'actor_id' => $caller->id,
            'call_id' => $call->id,
            'type' => 'call_incoming',
            'message' => $type . ' ' . $caller->first_name . ' vous appelle...',
            'data' => [
                'call_id' => $call->id,
                'call_type' => $call->type,
                'channel_name' => $call->channel_name,
            ],
        ]);
    }

    /**
     * Générer un token Agora (à implémenter avec le SDK Agora)
     */
    private function generateAgoraToken($channelName, $userId)
    {
        // TODO: Implémenter la génération de token Agora
        // Pour l'instant, retourner null (on utilisera le mode test sans token)
        return null;
        
        /*
        // Exemple avec Agora SDK (à installer via composer)
        $appId = env('AGORA_APP_ID');
        $appCertificate = env('AGORA_APP_CERTIFICATE');
        $uid = $userId;
        $role = RtcTokenBuilder::RolePublisher;
        $expireTimeInSeconds = 3600;
        $currentTimestamp = time();
        $privilegeExpiredTs = $currentTimestamp + $expireTimeInSeconds;

        return RtcTokenBuilder::buildTokenWithUid($appId, $appCertificate, $channelName, $uid, $role, $privilegeExpiredTs);
        */
    }
}
