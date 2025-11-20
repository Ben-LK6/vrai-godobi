'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Game {
  id: number;
  type: string;
  status: string;
  creator_id: number;
  opponent_id: number;
}

export function useActiveGameDetection() {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const checkForActiveGames = async () => {
      if (checking) return;
      
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api'}/games/pending`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/json',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && data.data.length > 0) {
            // Il y a un jeu actif, rediriger vers le lobby
            const activeGame = data.data[0];
            console.log('🎮 Jeu actif détecté:', activeGame);
            
            // Rediriger vers le lobby du jeu
            router.push(`/games/lobby/${activeGame.id}`);
          }
        }
      } catch (error) {
        console.error('Error checking for active games:', error);
      }
    };

    // Vérifier immédiatement
    checkForActiveGames();

    // Puis vérifier toutes les 3 secondes
    const interval = setInterval(checkForActiveGames, 3000);

    return () => clearInterval(interval);
  }, [router, checking]);
}
