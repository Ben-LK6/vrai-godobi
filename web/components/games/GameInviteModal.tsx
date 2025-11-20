'use client';

import { useState } from 'react';

interface GameInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  recipientId: number;
  onInvite: (gameType: string) => void;
}

const games = [
  {
    id: 'quiz',
    name: 'Quiz',
    icon: '🧠',
    description: '10 questions à choix multiples',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    icon: '🧩',
    description: 'Reconstituez l\'image le plus vite',
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'challenge',
    name: 'Challenge',
    icon: '🎯',
    description: 'Calcul mental, logique et mémoire',
    color: 'from-green-600 to-emerald-600',
  },
];

export default function GameInviteModal({
  isOpen,
  onClose,
  recipientName,
  onInvite,
}: GameInviteModalProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInvite = () => {
    if (selectedGame) {
      onInvite(selectedGame);
      onClose();
      setSelectedGame(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            🎮 Défier {recipientName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Choisissez un jeu pour commencer la bataille !
        </p>

        <div className="space-y-3">
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 ${
                selectedGame === game.id
                  ? `bg-gradient-to-r ${game.color} text-white border-transparent shadow-lg`
                  : 'bg-white text-gray-800 border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{game.icon}</div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-lg">{game.name}</h3>
                  <p
                    className={`text-sm ${
                      selectedGame === game.id
                        ? 'text-white/90'
                        : 'text-gray-500'
                    }`}
                  >
                    {game.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleInvite}
            disabled={!selectedGame}
            className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
              selectedGame
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Envoyer défi
          </button>
        </div>
      </div>
    </div>
  );
}
