<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Game;

class PlayerAnswered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $game;
    public $userId;
    public $questionNumber;

    public function __construct(Game $game, int $userId, int $questionNumber)
    {
        $this->game = $game;
        $this->userId = $userId;
        $this->questionNumber = $questionNumber;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('game.' . $this->game->id),
        ];
    }

    public function broadcastAs(): string
    {
        return 'player.answered';
    }

    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'question_number' => $this->questionNumber,
            'timestamp' => now()->toISOString(),
        ];
    }
}
