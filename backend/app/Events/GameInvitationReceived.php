<?php

namespace App\Events;

use App\Models\GameInvitation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class GameInvitationReceived implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public $invitation;

    public function __construct(GameInvitation $invitation)
    {
        $this->invitation = $invitation;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->invitation->to_user_id);
    }

    public function broadcastAs()
    {
        return 'game.invitation.received';
    }
}
