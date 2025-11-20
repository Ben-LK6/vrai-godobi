'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { callsApi, Call } from '@/lib/api';

interface IncomingCallModalProps {
  call: Call | null;
  onAnswer: () => void;
  onDecline: () => void;
}

export default function IncomingCallModal({ call, onAnswer, onDecline }: IncomingCallModalProps) {
  const [ringing, setRinging] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (call) {
      setRinging(true);
      // Jouer la sonnerie
      playRingtone();
      
      // Notification navigateur
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`Appel ${call.type === 'video' ? 'vidéo' : 'audio'} entrant`, {
          body: `${call.caller?.first_name} ${call.caller?.last_name}`,
          icon: call.caller?.profile_photo || '/default-avatar.png',
          requireInteraction: true,
        });
      }
    } else {
      setRinging(false);
      stopRingtone();
    }

    return () => {
      stopRingtone();
    };
  }, [call]);

  const playRingtone = () => {
    // Créer élément audio pour sonnerie
    if (!audioRef.current) {
      audioRef.current = new Audio('/sounds/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
    }
    
    audioRef.current.play().catch((err: Error) => {
      console.warn('Could not play ringtone:', err);
    });
  };

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (!call || !ringing) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-bounce-slow">
        {/* Icon */}
        <div className="text-center mb-6">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-5xl animate-pulse">
            {call.type === 'video' ? '📹' : '📞'}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Appel entrant</h2>
          <p className="text-lg text-gray-600">
            {call.caller?.first_name} {call.caller?.last_name}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {call.type === 'video' ? 'Appel vidéo' : 'Appel audio'}
          </p>
        </div>

        {/* Caller Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl">
              {call.caller?.first_name?.[0]}{call.caller?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800">
                {call.caller?.first_name} {call.caller?.last_name}
              </p>
              <p className="text-sm text-gray-500">@{call.caller?.username}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={onDecline}
            className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 text-lg"
          >
            <span className="text-2xl">📞❌</span>
            Refuser
          </button>
          <button
            onClick={onAnswer}
            className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition flex items-center justify-center gap-2 text-lg"
          >
            <span className="text-2xl">{call.type === 'video' ? '📹' : '📞'}✅</span>
            Répondre
          </button>
        </div>
      </div>
    </div>
  );
}
