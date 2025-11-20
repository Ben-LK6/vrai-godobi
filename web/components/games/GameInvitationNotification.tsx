'use client';

import { useState } from 'react';

interface GameInvitation {
  id: number;
  from_user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  game_type: string;
  created_at: string;
}

interface GameInvitationNotificationProps {
  invitation: GameInvitation;
  onAccept: (invitationId: number) => void;
  onDecline: (invitationId: number) => void;
}

const GAME_INFO: Record<string, { icon: string; name: string; color: string }> = {
  quiz: { icon: '🧠', name: 'Quiz', color: 'from-blue-500 to-cyan-500' },
  puzzle: { icon: '�', name: 'Puzzle', color: 'from-purple-500 to-pink-500' },
  challenge: { icon: '�', name: 'Challenge', color: 'from-green-500 to-emerald-500' },
};

export default function GameInvitationNotification({
  invitation,
  onAccept,
  onDecline,
}: GameInvitationNotificationProps) {
  const [responding, setResponding] = useState(false);
  
  const gameInfo = GAME_INFO[invitation.game_type] || { icon: '🎮', name: invitation.game_type, color: 'from-purple-500 to-pink-500' };

  const handleAccept = async () => {
    setResponding(true);
    await onAccept(invitation.id);
    setResponding(false);
  };

  const handleDecline = async () => {
    setResponding(true);
    await onDecline(invitation.id);
    setResponding(false);
  };

  return (
    <div className="bg-white border-l-4 border-blue-500 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{gameInfo.icon}</span>
            <div>
              <p className="font-semibold text-gray-900">
                {invitation.from_user.first_name} {invitation.from_user.last_name}
              </p>
              <p className="text-sm text-gray-600">
                vous défie à <span className="font-semibold">{gameInfo.name}</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAccept}
              disabled={responding}
              className={`flex-1 bg-gradient-to-r ${gameInfo.color} text-white px-4 py-2 rounded-lg font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {responding ? '⏳' : '✅ Accepter'}
            </button>
            <button
              onClick={handleDecline}
              disabled={responding}
              className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {responding ? '⏳' : '❌ Refuser'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
