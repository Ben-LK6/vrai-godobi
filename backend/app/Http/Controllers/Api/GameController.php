<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\GameInvitation;
use App\Models\GameAnswer;
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

    /**
     * Enregistrer la réponse d'un joueur
     */
    public function submitAnswer(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier que le joueur fait partie de cette partie
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $validator = Validator::make($request->all(), [
            'question_number' => 'required|integer|min:1|max:10',
            'question_text' => 'required|string',
            'selected_answer' => 'required|string|in:A,B,C,D',
            'correct_answer' => 'required|string|in:A,B,C,D',
            'time_taken' => 'required|integer|min:0|max:20',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Vérifier si le joueur a déjà répondu à cette question
        $existingAnswer = GameAnswer::where('game_id', $gameId)
            ->where('user_id', $userId)
            ->where('question_number', $request->question_number)
            ->first();

        if ($existingAnswer) {
            return response()->json(['success' => false, 'message' => 'Already answered this question'], 400);
        }

        $isCorrect = $request->selected_answer === $request->correct_answer;
        
        // Calcul des points : 10 points base + bonus vitesse (max 10 points)
        $basePoints = 10;
        $speedBonus = $isCorrect ? max(0, (20 - $request->time_taken) / 2) : 0;
        $pointsEarned = $isCorrect ? $basePoints + $speedBonus : 0;

        $answer = GameAnswer::create([
            'game_id' => $gameId,
            'user_id' => $userId,
            'question_number' => $request->question_number,
            'question_text' => $request->question_text,
            'selected_answer' => $request->selected_answer,
            'correct_answer' => $request->correct_answer,
            'is_correct' => $isCorrect,
            'points_earned' => round($pointsEarned),
            'time_taken' => $request->time_taken,
            'answered_at' => now(),
        ]);

        // Broadcast que le joueur a répondu
        broadcast(new \App\Events\PlayerAnswered($game, $userId, $request->question_number))->toOthers();

        return response()->json([
            'success' => true,
            'answer' => $answer,
            'is_correct' => $isCorrect,
            'points_earned' => round($pointsEarned),
        ], 201);
    }

    /**
     * Obtenir l'état actuel du jeu (pour polling)
     */
    public function getGameState(Request $request, $gameId)
    {
        $game = Game::with(['creator', 'opponent'])->findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier autorisation
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $currentQuestion = $request->query('current_question', 1);

        // Récupérer les réponses des deux joueurs pour la question actuelle
        $answers = GameAnswer::where('game_id', $gameId)
            ->where('question_number', $currentQuestion)
            ->with('user:id,first_name,last_name')
            ->get();

        // Déterminer l'ID de l'adversaire
        $opponentId = $game->creator_id === $userId ? $game->opponent_id : $game->creator_id;

        // Vérifier si les deux joueurs ont répondu
        $userAnswered = $answers->where('user_id', $userId)->isNotEmpty();
        $opponentAnswered = $answers->where('user_id', $opponentId)->isNotEmpty();
        $bothAnswered = $userAnswered && $opponentAnswered;

        // Calculer les scores totaux
        $userTotalScore = GameAnswer::where('game_id', $gameId)
            ->where('user_id', $userId)
            ->sum('points_earned');

        $opponentTotalScore = GameAnswer::where('game_id', $gameId)
            ->where('user_id', $opponentId)
            ->sum('points_earned');

        return response()->json([
            'success' => true,
            'data' => [
                'game' => $game,
                'current_question' => $currentQuestion,
                'user_answered' => $userAnswered,
                'opponent_answered' => $opponentAnswered,
                'both_answered' => $bothAnswered,
                'answers' => $bothAnswered ? $answers : [], // Révéler seulement si les deux ont répondu
                'scores' => [
                    'user' => $userTotalScore,
                    'opponent' => $opponentTotalScore,
                ],
            ],
        ]);
    }

    /**
     * Obtenir tous les résultats de la partie
     */
    public function getGameResults(Request $request, $gameId)
    {
        $game = Game::with(['creator', 'opponent'])->findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier autorisation
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Récupérer toutes les réponses
        $allAnswers = GameAnswer::where('game_id', $gameId)
            ->with('user:id,first_name,last_name')
            ->orderBy('question_number')
            ->orderBy('user_id')
            ->get();

        // Grouper par question
        $questionResults = $allAnswers->groupBy('question_number')->map(function ($answers) {
            return $answers->map(function ($answer) {
                return [
                    'user_id' => $answer->user_id,
                    'user_name' => $answer->user->first_name . ' ' . $answer->user->last_name,
                    'selected_answer' => $answer->selected_answer,
                    'is_correct' => $answer->is_correct,
                    'points_earned' => $answer->points_earned,
                    'time_taken' => $answer->time_taken,
                ];
            });
        });

        // Calculer les statistiques
        $userStats = $allAnswers->where('user_id', $userId);
        $opponentId = $game->creator_id === $userId ? $game->opponent_id : $game->creator_id;
        $opponentStats = $allAnswers->where('user_id', $opponentId);

        return response()->json([
            'success' => true,
            'data' => [
                'game' => $game,
                'question_results' => $questionResults,
                'user_stats' => [
                    'total_score' => $userStats->sum('points_earned'),
                    'correct_answers' => $userStats->where('is_correct', true)->count(),
                    'total_answers' => $userStats->count(),
                    'accuracy' => $userStats->count() > 0 ? ($userStats->where('is_correct', true)->count() / $userStats->count()) * 100 : 0,
                ],
                'opponent_stats' => [
                    'total_score' => $opponentStats->sum('points_earned'),
                    'correct_answers' => $opponentStats->where('is_correct', true)->count(),
                    'total_answers' => $opponentStats->count(),
                    'accuracy' => $opponentStats->count() > 0 ? ($opponentStats->where('is_correct', true)->count() / $opponentStats->count()) * 100 : 0,
                ],
            ],
        ]);
    }

    /**
     * Vérifier si l'utilisateur a des jeux actifs en attente
     */
    public function checkPendingGames(Request $request)
    {
        $userId = $request->user()->id;
        
        // Récupérer les jeux actifs où l'utilisateur est créateur ou adversaire
        $activeGames = Game::where(function($query) use ($userId) {
            $query->where('creator_id', $userId)
                  ->orWhere('opponent_id', $userId);
        })
        ->where('status', 'active')
        ->with(['creator', 'opponent'])
        ->orderBy('created_at', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $activeGames,
        ]);
    }

    /**
     * Demander l'abandon de la partie
     */
    public function requestForfeit(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier que le joueur fait partie de cette partie
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Vérifier si le jeu est actif
        if ($game->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Game is not active'], 400);
        }

        // Vérifier s'il n'y a pas déjà une demande en attente
        if ($game->forfeit_status === 'pending') {
            return response()->json(['success' => false, 'message' => 'Forfeit request already pending'], 400);
        }

        $game->update([
            'forfeit_requested_by' => $userId,
            'forfeit_requested_at' => now(),
            'forfeit_status' => 'pending',
        ]);

        // Broadcast l'événement
        broadcast(new \App\Events\ForfeitRequested($game, $userId))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Forfeit request sent',
            'game' => $game,
        ]);
    }

    /**
     * Répondre à une demande d'abandon
     */
    public function respondToForfeit(Request $request, $gameId)
    {
        $validator = Validator::make($request->all(), [
            'accepted' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $game = Game::findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier que le joueur fait partie de cette partie
        if ($game->creator_id !== $userId && $game->opponent_id !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        // Vérifier qu'il y a une demande en attente
        if ($game->forfeit_status !== 'pending') {
            return response()->json(['success' => false, 'message' => 'No pending forfeit request'], 400);
        }

        // Vérifier que l'utilisateur n'est pas celui qui a demandé l'abandon
        if ($game->forfeit_requested_by === $userId) {
            return response()->json(['success' => false, 'message' => 'Cannot respond to your own forfeit request'], 400);
        }

        if ($request->accepted) {
            // L'abandon est accepté : celui qui a demandé perd
            $game->update([
                'status' => 'finished',
                'forfeit_status' => 'accepted',
                'winner_id' => $userId, // L'adversaire gagne par forfait
                'finished_at' => now(),
            ]);

            $message = 'Forfeit accepted. You win!';
        } else {
            // L'abandon est refusé : on continue le jeu
            $game->update([
                'forfeit_status' => 'rejected',
                'forfeit_requested_by' => null,
                'forfeit_requested_at' => null,
            ]);

            $message = 'Forfeit rejected. Game continues.';
        }

        // Broadcast l'événement
        broadcast(new \App\Events\ForfeitResponded($game, $request->accepted))->toOthers();

        return response()->json([
            'success' => true,
            'message' => $message,
            'game' => $game,
        ]);
    }

    /**
     * Annuler une demande d'abandon
     */
    public function cancelForfeit(Request $request, $gameId)
    {
        $game = Game::findOrFail($gameId);
        $userId = $request->user()->id;

        // Vérifier que c'est bien l'utilisateur qui a demandé l'abandon
        if ($game->forfeit_requested_by !== $userId) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $game->update([
            'forfeit_status' => 'none',
            'forfeit_requested_by' => null,
            'forfeit_requested_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Forfeit request cancelled',
            'game' => $game,
        ]);
    }
}
