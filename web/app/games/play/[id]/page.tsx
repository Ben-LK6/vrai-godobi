'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NavigationHeader from '@/components/NavigationHeader';
import QuizGameMultiplayer from '@/components/games/QuizGameMultiplayer';
import PuzzleGame from '@/components/games/PuzzleGame';
import ChallengeGame from '@/components/games/ChallengeGame';

interface Game {
  id: number;
  type: 'quiz' | 'puzzle' | 'challenge';
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
  game_data: any;
  winner_id: number | null;
}

export default function GamePlayPage() {
  const router = useRouter();
  const params = useParams();
  const gameId = Number(params?.id);
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

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

  const handleGameEnd = async (winnerId: number, gameData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/${gameId}/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          winner_id: winnerId,
          game_data: gameData,
        }),
      });

      // Refresh game data
      fetchGame(token);
    } catch (error) {
      console.error('Game end error:', error);
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
        <div className="text-purple-600 text-xl">Chargement du jeu...</div>
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

  const isCreator = currentUser?.id === game.creator.id;
  const opponent = isCreator ? game.opponent : game.creator;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <NavigationHeader notificationCount={0} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Game Component based on type */}
        {game.type === 'quiz' && (
          <QuizGameMultiplayer
            game={game}
            currentUser={currentUser}
            opponent={opponent}
            onGameEnd={handleGameEnd}
          />
        )}
        {game.type === 'puzzle' && (
          <PuzzleGame
            game={game}
            currentUser={currentUser}
            opponent={opponent}
            onGameEnd={handleGameEnd}
          />
        )}
        {game.type === 'challenge' && (
          <ChallengeGame
            game={game}
            currentUser={currentUser}
            opponent={opponent}
            onGameEnd={handleGameEnd}
          />
        )}
      </main>
    </div>
  );
}
