'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavigationHeader from '@/components/NavigationHeader';

interface Game {
  id: number;
  type: string;
  status: string;
  creator: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  opponent: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  } | null;
  started_at: string | null;
  created_at: string;
}

const GAME_INFO: Record<string, { icon: string; name: string; color: string; description: string }> = {
  quiz: {
    icon: '🧠',
    name: 'Quiz',
    color: 'from-blue-500 to-cyan-500',
    description: '10 questions à choix multiples, qui sera le plus rapide ?',
  },
  puzzle: {
    icon: '�',
    name: 'Puzzle',
    color: 'from-purple-500 to-pink-500',
    description: 'Reconstituez l\'image le plus vite possible !',
  },
  challenge: {
    icon: '�',
    name: 'Challenge',
    color: 'from-green-500 to-emerald-500',
    description: 'Calcul mental, logique et mémoire pour gagner !',
  },
};

export default function GameLobbyPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = params?.id as string;
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(userStr));
      fetchGame(token);
    } catch {
      router.push('/login');
    }
  }, [gameId, router]);

  const fetchGame = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/${gameId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setGame(data.data || data);

        // If game is active and both players ready, start countdown
        if ((data.data || data).status === 'active' && (data.data || data).opponent) {
          startCountdown();
        }

        // Poll for updates every 2 seconds
        setTimeout(() => fetchGame(token), 2000);
      } else {
        alert('❌ Erreur lors du chargement de la partie');
        router.push('/notifications');
      }
    } catch (error) {
      console.error('Fetch game error:', error);
    } finally {
      setLoading(false);
    }
  };

  const startCountdown = () => {
    let count = 3;
    setCountdown(count);

    const interval = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(interval);
        // Redirect to game
        router.push(`/games/play/${gameId}`);
      } else {
        setCountdown(count);
      }
    }, 1000);
  };

  const handleCancel = async () => {
    if (!confirm('Annuler cette partie ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/${gameId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        router.push('/notifications');
      } else {
        alert('❌ Erreur lors de l\'annulation');
      }
    } catch (error) {
      console.error('Cancel game error:', error);
      alert('❌ Erreur lors de l\'annulation');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">Partie introuvable</div>
      </div>
    );
  }

  const gameInfo = GAME_INFO[game.type] || { icon: '🎮', name: game.type, color: 'from-purple-500 to-pink-500', description: 'Partie en cours' };
  const isCreator = currentUser?.id === game.creator.id;
  const opponent = isCreator ? game.opponent : game.creator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <NavigationHeader notificationCount={0} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header with game type */}
          <div className={`bg-gradient-to-r ${gameInfo.color} p-8 text-white text-center`}>
            <div className="text-6xl mb-4">{gameInfo.icon}</div>
            <h1 className="text-3xl font-bold mb-2">{gameInfo.name}</h1>
            <p className="text-white/90">{gameInfo.description}</p>
          </div>

          {/* Players */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Creator */}
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-6 text-center">
                <div className="text-4xl mb-3">👤</div>
                <p className="text-lg font-bold text-gray-900">
                  {game.creator.first_name} {game.creator.last_name}
                </p>
                <p className="text-sm text-gray-600">@{game.creator.username}</p>
                {isCreator && (
                  <div className="mt-2 inline-block bg-purple-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Vous
                  </div>
                )}
              </div>

              {/* Opponent */}
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl p-6 text-center">
                {opponent ? (
                  <>
                    <div className="text-4xl mb-3">👤</div>
                    <p className="text-lg font-bold text-gray-900">
                      {opponent.first_name} {opponent.last_name}
                    </p>
                    <p className="text-sm text-gray-600">@{opponent.username}</p>
                    {!isCreator && (
                      <div className="mt-2 inline-block bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                        Vous
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-3 opacity-50">❓</div>
                    <p className="text-lg font-bold text-gray-500">En attente...</p>
                    <p className="text-sm text-gray-400">L'adversaire n'a pas encore rejoint</p>
                  </>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="text-center">
              {countdown !== null ? (
                <>
                  <div className="text-8xl font-bold text-purple-600 mb-4 animate-pulse">
                    {countdown}
                  </div>
                  <p className="text-xl text-gray-700">La partie commence...</p>
                </>
              ) : game.status === 'pending' ? (
                <>
                  <div className="text-5xl mb-4">⏳</div>
                  <p className="text-2xl font-bold text-gray-700 mb-2">En attente de l'adversaire</p>
                  <p className="text-gray-600">La partie commencera dès que votre adversaire acceptera l'invitation</p>
                  
                  {isCreator && (
                    <button
                      onClick={handleCancel}
                      className="mt-6 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                    >
                      ❌ Annuler la partie
                    </button>
                  )}
                </>
              ) : game.status === 'active' && game.opponent ? (
                <>
                  <div className="text-5xl mb-4">🎮</div>
                  <p className="text-2xl font-bold text-gray-700 mb-2">Les deux joueurs sont prêts !</p>
                  <p className="text-gray-600">Préparation du jeu...</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">⏳</div>
                  <p className="text-2xl font-bold text-gray-700">Chargement...</p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
