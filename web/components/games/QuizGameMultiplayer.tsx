'use client';

import { useState, useEffect } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

interface QuizGameMultiplayerProps {
  game: any;
  currentUser: any;
  opponent: any;
  onGameEnd: (winnerId: number, gameData: any) => void;
}

// Questions du quiz
const QUIZ_QUESTIONS: QuizQuestion[] = [
  { id: 1, question: "Quelle est la capitale de la France ?", options: ["Londres", "Paris", "Berlin", "Madrid"], correctIndex: 1, category: "Géographie" },
  { id: 2, question: "Combien font 7 x 8 ?", options: ["54", "56", "58", "62"], correctIndex: 1, category: "Mathématiques" },
  { id: 3, question: "Qui a peint la Joconde ?", options: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michel-Ange"], correctIndex: 2, category: "Art" },
  { id: 4, question: "Quel est le plus grand océan du monde ?", options: ["Atlantique", "Indien", "Arctique", "Pacifique"], correctIndex: 3, category: "Géographie" },
  { id: 5, question: "En quelle année a eu lieu la Révolution française ?", options: ["1789", "1799", "1804", "1815"], correctIndex: 0, category: "Histoire" },
  { id: 6, question: "Quelle planète est la plus proche du Soleil ?", options: ["Vénus", "Mercure", "Mars", "Terre"], correctIndex: 1, category: "Science" },
  { id: 7, question: "Combien de continents y a-t-il sur Terre ?", options: ["5", "6", "7", "8"], correctIndex: 2, category: "Géographie" },
  { id: 8, question: "Qui a écrit 'Les Misérables' ?", options: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Honoré de Balzac"], correctIndex: 0, category: "Littérature" },
  { id: 9, question: "Quel est le symbole chimique de l'or ?", options: ["Go", "Au", "Or", "Gd"], correctIndex: 1, category: "Science" },
  { id: 10, question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?", options: ["1965", "1967", "1969", "1971"], correctIndex: 2, category: "Histoire" },
];

const ANSWER_LETTERS = ['A', 'B', 'C', 'D'];

export default function QuizGameMultiplayer({ game, currentUser, opponent, onGameEnd }: QuizGameMultiplayerProps) {
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [opponentAnswered, setOpponentAnswered] = useState(false);
  const [showQuestionResult, setShowQuestionResult] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forfeitRequested, setForfeitRequested] = useState(false);
  const [forfeitRequestedBy, setForfeitRequestedBy] = useState<number | null>(null);
  const [showForfeitDialog, setShowForfeitDialog] = useState(false);
  
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionNumber - 1];
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001/api';

  // Timer countdown
  useEffect(() => {
    if (gameFinished || hasAnswered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleTimeout();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionNumber, hasAnswered, gameFinished]);

  // Polling pour vérifier l'état du jeu et les abandons
  useEffect(() => {
    if (gameFinished) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${apiUrl}/games/${game.id}/state?current_question=${currentQuestionNumber}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          const gameData = data.data.game;
          
          // Mettre à jour les scores en temps réel
          setMyScore(data.data.scores.user);
          setOpponentScore(data.data.scores.opponent);
          
          // Vérifier si l'adversaire a répondu
          const opponentHasAnswered = data.data.opponent_answered;
          setOpponentAnswered(opponentHasAnswered);
          
          // Vérifier les demandes d'abandon
          if (gameData.forfeit_status === 'pending' && gameData.forfeit_requested_by !== currentUser.id) {
            setForfeitRequestedBy(gameData.forfeit_requested_by);
            setShowForfeitDialog(true);
          }
          
          // Vérifier si l'abandon a été accepté
          if (gameData.status === 'finished' && gameData.forfeit_status === 'accepted') {
            alert(gameData.winner_id === currentUser.id 
              ? `${opponent?.first_name} a abandonné. Vous gagnez !` 
              : 'Vous avez abandonné la partie.');
            setGameFinished(true);
            onGameEnd(gameData.winner_id, { forfeit: true });
            return;
          }
          
          // Si les deux ont répondu, afficher les résultats puis passer à la question suivante
          if (hasAnswered && opponentHasAnswered && !showQuestionResult) {
            setShowQuestionResult(true);
            setTimeout(() => {
              if (currentQuestionNumber < 10) {
                nextQuestion();
              } else {
                finishGame();
              }
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error polling game state:', error);
      }
    }, 2000); // Poll toutes les 2 secondes

    return () => clearInterval(pollInterval);
  }, [hasAnswered, currentQuestionNumber, gameFinished, showQuestionResult, currentUser.id, opponent?.first_name, game.id, apiUrl]);

  const handleTimeout = () => {
    // Auto-submit en cas de timeout (pas de réponse)
    if (!hasAnswered) {
      setHasAnswered(true);
      // On ne soumet rien au backend, ça compte comme pas de réponse
    }
  };

  const requestForfeit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/games/${game.id}/forfeit/request`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setForfeitRequested(true);
        alert(`Demande d'abandon envoyée à ${opponent?.first_name}. En attente de sa réponse...`);
      }
    } catch (error) {
      console.error('Error requesting forfeit:', error);
      alert('Erreur lors de la demande d\'abandon');
    }
  };

  const respondToForfeit = async (accepted: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/games/${game.id}/forfeit/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ accepted }),
      });

      if (response.ok) {
        setShowForfeitDialog(false);
        if (accepted) {
          alert(`Vous avez accepté l'abandon. Vous gagnez !`);
          setGameFinished(true);
        } else {
          alert('Vous avez refusé l\'abandon. Le jeu continue.');
        }
      }
    } catch (error) {
      console.error('Error responding to forfeit:', error);
      alert('Erreur lors de la réponse à l\'abandon');
    }
  };

  const handleAnswer = async (answerIndex: number) => {
    if (hasAnswered || gameFinished || isSubmitting) return; // Protection contre double clic

    setIsSubmitting(true);
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);

    const timeTaken = Math.min(20, Math.max(0, 20 - timeLeft)); // Sécuriser le temps
    const correctAnswerIndex = currentQuestion.correctIndex;
    const answerLetter = ANSWER_LETTERS[answerIndex];
    const correctLetter = ANSWER_LETTERS[correctAnswerIndex];

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/games/${game.id}/answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          question_number: currentQuestionNumber,
          question_text: currentQuestion.question,
          selected_answer: answerLetter,
          correct_answer: correctLetter,
          time_taken: timeTaken,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Réponse enregistrée:', data);
      } else if (response.status === 400) {
        // Déjà répondu, continuer silencieusement
        console.log('⚠️ Réponse déjà enregistrée (ignoré)');
      } else {
        console.error('❌ Erreur lors de l\'enregistrement de la réponse');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    setCurrentQuestionNumber(currentQuestionNumber + 1);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setOpponentAnswered(false);
    setShowQuestionResult(false);
    setTimeLeft(20);
  };

  const finishGame = async () => {
    setGameFinished(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/games/${game.id}/results`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const winnerId = data.data.user_stats.total_score > data.data.opponent_stats.total_score 
          ? currentUser.id 
          : opponent.id;
        
        onGameEnd(winnerId, {
          user_stats: data.data.user_stats,
          opponent_stats: data.data.opponent_stats,
        });
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const getAnswerColor = (index: number) => {
    if (!showQuestionResult) {
      if (!hasAnswered) {
        return 'bg-white border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50';
      }
      if (index === selectedAnswer) {
        return 'bg-purple-200 border-2 border-purple-500';
      }
      return 'bg-gray-100 border-2 border-gray-300';
    }

    // Afficher les résultats
    if (index === currentQuestion.correctIndex) {
      return 'bg-green-500 text-white border-2 border-green-600';
    }
    if (index === selectedAnswer && index !== currentQuestion.correctIndex) {
      return 'bg-red-500 text-white border-2 border-red-600';
    }
    return 'bg-gray-100 border-2 border-gray-300 opacity-50';
  };

  if (gameFinished) {
    const didWin = myScore > opponentScore;
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{didWin ? '🏆' : '😔'}</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {didWin ? 'Victoire !' : 'Défaite'}
            </h2>
            <p className="text-gray-600">
              {didWin 
                ? `Bravo ! Vous avez battu ${opponent?.first_name} !`
                : `${opponent?.first_name} a gagné cette fois-ci`
              }
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-6 rounded-2xl text-center ${didWin ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white`}>
              <p className="text-sm opacity-90 mb-1">Moi</p>
              <p className="text-4xl font-bold">{myScore}</p>
              <p className="text-xs opacity-75 mt-1">{currentUser?.first_name}</p>
            </div>
            <div className={`p-6 rounded-2xl text-center ${!didWin ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white`}>
              <p className="text-sm opacity-90 mb-1">{opponent?.first_name}</p>
              <p className="text-4xl font-bold">{opponentScore}</p>
              <p className="text-xs opacity-75 mt-1">Adversaire</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => window.location.href = '/feed'}
              className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
            >
              Retour au feed
            </button>
            <button
              onClick={() => window.location.href = '/notifications'}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-700 hover:to-pink-700 transition"
            >
              Voir notifications
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Scores Header */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
              {currentUser?.first_name?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">Moi</p>
              <p className="text-2xl font-bold text-purple-600">{myScore} pts</p>
              {hasAnswered && <p className="text-xs text-green-600">✓ Répondu</p>}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">Question {currentQuestionNumber}/10</p>
            <p className="text-xs text-gray-400">{currentQuestion.category}</p>
            <div className="mt-2">
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-purple-600">{timeLeft}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-gray-900">{opponent?.first_name}</p>
              <p className="text-2xl font-bold text-pink-600">{opponentScore} pts</p>
              {opponentAnswered ? (
                <p className="text-xs text-green-600">✓ Répondu</p>
              ) : (
                <p className="text-xs text-gray-400">⏳ Réfléchit...</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {opponent?.first_name?.[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={`p-5 rounded-2xl text-left font-medium transition-all transform hover:scale-105 disabled:hover:scale-100 ${getAnswerColor(index)}`}
            >
              <span className="font-bold mr-3">{ANSWER_LETTERS[index]}.</span>
              {option}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>Progression</span>
            <span>{currentQuestionNumber}/10</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentQuestionNumber / 10) * 100}%` }}
            />
          </div>
        </div>

        {/* Waiting message */}
        {hasAnswered && !showQuestionResult && (
          <div className="mt-4 text-center p-4 bg-blue-50 rounded-xl">
            <p className="text-blue-700 font-medium">
              {opponentAnswered 
                ? "⏳ Calcul des résultats..."
                : `⏳ En attente de ${opponent?.first_name}...`
              }
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Les deux joueurs doivent répondre avant de passer à la question suivante
            </p>
          </div>
        )}

        {/* Forfeit request dialog */}
        {showForfeitDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl">
              <div className="text-center mb-4">
                <div className="text-4xl mb-2">⚠️</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Demande d'abandon
                </h3>
                <p className="text-gray-600">
                  {opponent?.first_name} souhaite abandonner la partie. 
                  Si vous acceptez, vous gagnez automatiquement.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => respondToForfeit(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-200 text-gray-700 font-bold hover:bg-gray-300 transition"
                >
                  Refuser
                </button>
                <button
                  onClick={() => respondToForfeit(true)}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition"
                >
                  Accepter
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Abandon button */}
        {!gameFinished && (
          <div className="mt-4 text-center">
            {forfeitRequested ? (
              <p className="text-orange-500 font-medium text-sm">
                ⏳ Demande d'abandon en attente...
              </p>
            ) : (
              <button
                onClick={() => {
                  if (confirm(`Voulez-vous abandonner la partie ?\n\n${opponent?.first_name} sera notifié(e) et pourra accepter ou refuser votre abandon.`)) {
                    requestForfeit();
                  }
                }}
                className="text-red-500 hover:text-red-700 font-medium text-sm underline"
              >
                🏳️ Demander l'abandon
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
