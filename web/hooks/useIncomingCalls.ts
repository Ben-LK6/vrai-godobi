'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Call, callsApi } from '@/lib/api';

export function useIncomingCalls() {
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const router = useRouter();

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkForIncomingCalls = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Récupérer les notifications non lues
        const notificationsResponse = await api.getNotifications(token);
        const notifications = notificationsResponse.data;

        // Chercher une notification d'appel entrant non lue
        const callNotification = notifications.find(
          (n) => n.type === 'call_incoming' && !n.is_read && n.call_id
        );

        if (callNotification && callNotification.call_id) {
          // Récupérer les détails de l'appel
          const callData = await callsApi.getCallDetails(token, callNotification.call_id);
          
          // Vérifier que l'appel est toujours actif
          if (['calling', 'ringing'].includes(callData.status)) {
            setIncomingCall(callData);
            
            // Marquer la notification comme lue
            await api.markNotificationAsRead(token, callNotification.id);
          }
        }
      } catch (error) {
        console.error('Error checking for incoming calls:', error);
      }
    };

    // Vérifier toutes les 2 secondes
    checkForIncomingCalls();
    intervalId = setInterval(checkForIncomingCalls, 2000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  const answerCall = async () => {
    if (!incomingCall) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await callsApi.answerCall(token, incomingCall.id);
      router.push(`/calls/${incomingCall.id}`);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
      alert('Erreur lors de la réponse à l\'appel');
      setIncomingCall(null);
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await callsApi.declineCall(token, incomingCall.id);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error declining call:', error);
      setIncomingCall(null);
    }
  };

  return {
    incomingCall,
    answerCall,
    declineCall,
  };
}
