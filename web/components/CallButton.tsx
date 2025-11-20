'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { callsApi } from '@/lib/api';

interface CallButtonProps {
  userId: number;
  type: 'audio' | 'video';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CallButton({ userId, type, size = 'md', className = '' }: CallButtonProps) {
  const [calling, setCalling] = useState(false);
  const router = useRouter();

  const handleCall = async () => {
    try {
      setCalling(true);
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Vous devez être connecté');
        return;
      }

      // Initier l'appel
      const response = await callsApi.initiateCall(token, {
        receiver_id: userId,
        type,
      });

      // Rediriger vers la page d'appel
      router.push(`/calls/${response.call.id}`);
    } catch (error: any) {
      console.error('Error initiating call:', error);
      alert(error.message || 'Erreur lors de l\'appel');
    } finally {
      setCalling(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-xl',
    lg: 'w-16 h-16 text-2xl',
  };

  const icon = type === 'video' ? '📹' : '📞';

  return (
    <button
      onClick={handleCall}
      disabled={calling}
      className={`
        ${sizeClasses[size]}
        rounded-full
        ${type === 'video' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
        text-white
        flex items-center justify-center
        transition
        disabled:opacity-50 disabled:cursor-not-allowed
        shadow-lg hover:shadow-xl
        ${className}
      `}
      title={`Appeler ${type === 'video' ? 'en vidéo' : 'en audio'}`}
    >
      {calling ? '⏳' : icon}
    </button>
  );
}
