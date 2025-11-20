<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameInvitation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Broadcast;

class GameController extends Controller
{
    public function invite(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'to_user_id' => 'required|exists:users,id',
            'game_type' => 'required|string',
            'message' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        $invitation = GameInvitation::create([
            'from_user_id' => $user->id,
            'to_user_id' => $request->to_user_id,
            'game_type' => $request->game_type,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(5),
        ]);

        // Broadcast event (WebSocket) - placeholder
        broadcast(new \App\Events\GameInvitationReceived($invitation))->toOthers();

        return response()->json(['success' => true, 'invitation' => $invitation], 201);
    }

    public function accept(Request $request, $invitationId)
    {
        $invitation = GameInvitation::findOrFail($invitationId);
        if ($invitation->to_user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $game = Game::create([
            'type' => $invitation->game_type,
            'status' => 'active',
            'creator_id' => $invitation->from_user_id,
            'opponent_id' => $invitation->to_user_id,
            'started_at' => now(),
        ]);

        $invitation->update(['status' => 'accepted', 'game_id' => $game->id, 'responded_at' => now()]);

        // Broadcast game started
        broadcast(new \App\Events\GameStarted($game))->toOthers();

        return response()->json(['success' => true, 'game' => $game], 201);
    }
}
