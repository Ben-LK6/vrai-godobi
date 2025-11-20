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

    public function decline(Request $request, $invitationId)
    {
        $invitation = GameInvitation::findOrFail($invitationId);
        if ($invitation->to_user_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $invitation->update(['status' => 'declined', 'responded_at' => now()]);

        return response()->json(['success' => true, 'message' => 'Invitation declined']);
    }

    public function getInvitations(Request $request)
    {
        $userId = $request->user()->id;
        
        $invitations = GameInvitation::where('to_user_id', $userId)
            ->where('status', 'pending')
            ->with(['fromUser'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $invitations]);
    }

    public function show(Request $request, $gameId)
    {
        $game = Game::with(['creator', 'opponent'])->findOrFail($gameId);
        
        // Check if user is part of this game
        $userId = $request->user()->id;
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        return response()->json(['success' => true, 'data' => $game]);
    }

    public function cancel(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);
        
        // Only creator can cancel before game starts
        if ($game->creator_id !== $request->user()->id) {
            return response()->json(['success' => false, 'message' => 'Only creator can cancel'], 403);
        }

        if ($game->status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'Game already started'], 400);
        }

        $game->update(['status' => 'cancelled']);

        return response()->json(['success' => true, 'message' => 'Game cancelled']);
    }

    public function finish(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);
        
        // Check if user is part of this game
        $userId = $request->user()->id;
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'winner_id' => 'required|exists:users,id',
            'game_data' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $game->update([
            'status' => 'finished',
            'winner_id' => $request->winner_id,
            'game_data' => $request->game_data,
            'finished_at' => now(),
        ]);

        return response()->json(['success' => true, 'game' => $game]);
    }
}
