'use client';

import { useState, useEffect } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  category: string;
}

interface QuizGameProps {
  game: any;
  currentUser: any;
  opponent: any;
  onGameEnd: (winnerId: number, gameData: any) => void;
}

// Base de questions (sera remplacée par une API plus tard)
const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "Quelle est la capitale de la France ?",
    options: ["Londres", "Paris", "Berlin", "Madrid"],
    correct_answer: 1,
    category: "Géographie"
  },
  {
    id: 2,
    question: "Combien font 7 x 8 ?",
    options: ["54", "56", "58", "62"],
    correct_answer: 1,
    category: "Mathématiques"
  },
  {
    id: 3,
    question: "Qui a peint la Joconde ?",
    options: ["Picasso", "Van Gogh", "Leonardo da Vinci", "Michel-Ange"],
    correct_answer: 2,
    category: "Art"
  },
  {
    id: 4,
    question: "Quel est le plus grand océan du monde ?",
    options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
    correct_answer: 3,
    category: "Géographie"
  },
  {
    id: 5,
    question: "En quelle année a eu lieu la Révolution française ?",
    options: ["1789", "1799", "1804", "1815"],
    correct_answer: 0,
    category: "Histoire"
  },
  {
    id: 6,
    question: "Quelle planète est la plus proche du Soleil ?",
    options: ["Vénus", "Mercure", "Mars", "Terre"],
    correct_answer: 1,
    category: "Science"
  },
  {
    id: 7,
    question: "Combien de continents y a-t-il sur Terre ?",
    options: ["5", "6", "7", "8"],
    correct_answer: 2,
    category: "Géographie"
  },
  {
    id: 8,
    question: "Qui a écrit 'Les Misérables' ?",
    options: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Honoré de Balzac"],
    correct_answer: 0,
    category: "Littérature"
  },
  {
    id: 9,
    question: "Quel est le symbole chimique de l'or ?",
    options: ["Go", "Au", "Or", "Gd"],
    correct_answer: 1,
    category: "Science"
  },
  {
    id: 10,
    question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
    options: ["1965", "1967", "1969", "1971"],
    correct_answer: 2,
    category: "Histoire"
  },
];

export default function QuizGame({ game, currentUser, opponent, onGameEnd }: QuizGameProps) {
  const [questions] = useState<QuizQuestion[]>(QUIZ_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);
  const [gameFinished, setGameFinished] = useState(false);
  const [myAnswers, setMyAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];

  // Timer countdown
  useEffect(() => {
    if (gameFinished || answered) return;

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
  }, [currentQuestionIndex, answered, gameFinished]);

  const handleTimeout = () => {
    // Si pas de réponse, on passe à la question suivante
    setAnswered(true);
    setMyAnswers([...myAnswers, -1]); // -1 = pas de réponse

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const handleAnswer = (answerIndex: number) => {
    if (answered || gameFinished) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);
    setMyAnswers([...myAnswers, answerIndex]);

    // Vérifier si la réponse est correcte
    const isCorrect = answerIndex === currentQuestion.correct_answer;
    if (isCorrect) {
      const bonusSpeed = Math.floor(timeLeft / 2); // Bonus basé sur le temps restant
      setMyScore(myScore + 10 + bonusSpeed);
    }

    // Simuler la réponse de l'adversaire (50% de chance de répondre correctement)
    setTimeout(() => {
      const opponentCorrect = Math.random() > 0.5;
      if (opponentCorrect) {
        setOpponentScore(opponentScore + 10 + Math.floor(Math.random() * 10));
      }
    }, 500);

    setTimeout(() => {
      nextQuestion();
    }, 2000);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setAnswered(false);
      setTimeLeft(20);
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameFinished(true);
    setShowResults(true);

    const winnerId = myScore > opponentScore ? currentUser.id : opponent.id;
    const gameData = {
      my_score: myScore,
      opponent_score: opponentScore,
      my_answers: myAnswers,
      total_questions: questions.length,
    };

    onGameEnd(winnerId, gameData);
  };

  const getAnswerColor = (index: number) => {
    if (!answered) return 'bg-white border-gray-300 hover:border-purple-500 hover:bg-purple-50';
    
    if (index === currentQuestion.correct_answer) {
      return 'bg-green-500 text-white border-green-500';
    }
    
    if (index === selectedAnswer && index !== currentQuestion.correct_answer) {
      return 'bg-red-500 text-white border-red-500';
    }
    
    return 'bg-gray-100 border-gray-300 text-gray-500';
  };

  if (showResults) {
    const didWin = myScore > opponentScore;
    
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          {/* Results Header */}
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

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className={`p-6 rounded-2xl text-center ${didWin ? 'bg-gradient-to-br from-green-500 to-emerald-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white`}>
              <p className="text-sm opacity-90 mb-1">Vous</p>
              <p className="text-4xl font-bold">{myScore}</p>
              <p className="text-xs opacity-75 mt-1">{currentUser?.first_name}</p>
            </div>
            <div className={`p-6 rounded-2xl text-center ${!didWin ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'} text-white`}>
              <p className="text-sm opacity-90 mb-1">Adversaire</p>
              <p className="text-4xl font-bold">{opponentScore}</p>
              <p className="text-xs opacity-75 mt-1">{opponent?.first_name}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">📊 Statistiques</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Questions répondues</span>
                <span className="font-bold">{myAnswers.filter(a => a !== -1).length} / {questions.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bonnes réponses</span>
                <span className="font-bold text-green-600">
                  {myAnswers.filter((a, i) => a === questions[i].correct_answer).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Précision</span>
                <span className="font-bold">
                  {Math.round((myAnswers.filter((a, i) => a === questions[i].correct_answer).length / questions.length) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {currentUser?.first_name?.[0]}
            </div>
            <div>
              <p className="font-bold text-gray-900">{currentUser?.first_name}</p>
              <p className="text-2xl font-bold text-purple-600">{myScore} pts</p>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">Question {currentQuestionIndex + 1}/{questions.length}</p>
            <p className="text-xs text-gray-400">{currentQuestion.category}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-bold text-gray-900">{opponent?.first_name}</p>
              <p className="text-2xl font-bold text-blue-600">{opponentScore} pts</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              {opponent?.first_name?.[0]}
            </div>
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        {/* Timer */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-600">Temps restant</span>
            <span className={`text-2xl font-bold ${timeLeft <= 5 ? 'text-red-600 animate-pulse' : 'text-purple-600'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${timeLeft <= 5 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'}`}
              style={{ width: `${(timeLeft / 20) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentQuestion.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              className={`w-full p-4 rounded-2xl border-2 text-left font-semibold transition-all transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed ${getAnswerColor(index)}`}
            >
              <span className="text-lg">{String.fromCharCode(65 + index)}.</span> {option}
            </button>
          ))}
        </div>

        {/* Feedback */}
        {answered && (
          <div className={`mt-6 p-4 rounded-2xl ${selectedAnswer === currentQuestion.correct_answer ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-bold text-center">
              {selectedAnswer === currentQuestion.correct_answer 
                ? '✅ Bonne réponse ! +' + (10 + Math.floor(timeLeft / 2)) + ' points'
                : selectedAnswer === null 
                  ? '⏱️ Temps écoulé !'
                  : '❌ Mauvaise réponse. La bonne réponse était : ' + currentQuestion.options[currentQuestion.correct_answer]
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
