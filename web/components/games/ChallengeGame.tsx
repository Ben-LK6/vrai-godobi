'use client';

interface ChallengeGameProps {
  game: any;
  currentUser: any;
  opponent: any;
  onGameEnd: (winnerId: number, gameData: any) => void;
}

export default function ChallengeGame({ game, currentUser, opponent }: ChallengeGameProps) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Challenge</h2>
        <p className="text-gray-600 mb-6">
          Ce jeu est en cours de développement.
        </p>
        <p className="text-sm text-gray-500">
          Bientôt disponible : Calcul mental, logique et mémoire !
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
