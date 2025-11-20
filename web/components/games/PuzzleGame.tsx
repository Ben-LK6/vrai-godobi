'use client';

interface PuzzleGameProps {
  game: any;
  currentUser: any;
  opponent: any;
  onGameEnd: (winnerId: number, gameData: any) => void;
}

export default function PuzzleGame({ game, currentUser, opponent }: PuzzleGameProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">🧩</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Puzzle</h2>
        <p className="text-gray-600 mb-6">
          Ce jeu est en cours de développement.
        </p>
        <p className="text-sm text-gray-500">
          Bientôt disponible : Reconstituez l'image le plus rapidement possible !
        </p>
        <button
          onClick={() => window.location.href = '/notifications'}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition"
        >
          Retour aux notifications
        </button>
      </div>
    </div>
  );
}
