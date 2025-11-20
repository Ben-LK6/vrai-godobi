<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $game;

    public function __construct(Game $game)
    {
        $this->game = $game;
    }

    public function broadcastOn()
    {
        // Notify both participants
        return [
            new PrivateChannel('user.' . $this->game->creator_id),
            new PrivateChannel('user.' . $this->game->opponent_id),
        ];
    }

    public function broadcastAs()
    {
        return 'game.started';
    }
}
