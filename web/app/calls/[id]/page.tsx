'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { callsApi, Call } from '@/lib/api';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
} from 'agora-rtc-sdk-ng';

export default function CallPage() {
  const params = useParams();
  const callId = params?.id as string;
  const router = useRouter();

  const [call, setCall] = useState<Call | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoContainerRef = useRef<HTMLDivElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, [callId, router]);

  const initializeCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !callId) return;

      // Récupérer les détails de l'appel
      const callData = await callsApi.getCallDetails(token, parseInt(callId));
      setCall(callData);
      setLoading(false);

      // Initialiser Agora
      await initializeAgora(callData);

      // Démarrer le compteur de durée
      startDurationCounter();
    } catch (error) {
      console.error('Error initializing call:', error);
      alert('Erreur lors de l\'initialisation de l\'appel');
      router.push('/calls');
    }
  };

  const initializeAgora = async (callData: Call) => {
    try {
      // Créer le client Agora
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Mode test sans APP ID (pour développement local)
      // En production, vous devrez configurer votre Agora APP ID
      const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || 'test';
      const CHANNEL_NAME = callData.channel_name;
      const TOKEN = callData.agora_token || null;
      const UID = null; // Agora génère automatiquement un UID

      // Gérer les événements utilisateurs
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        console.log('User published:', user.uid, mediaType);

        if (mediaType === 'video') {
          setRemoteUsers((prev) => {
            const exists = prev.find((u) => u.uid === user.uid);
            if (exists) return prev;
            return [...prev, user];
          });
        }

        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        console.log('User unpublished:', user.uid, mediaType);
        if (mediaType === 'video') {
          setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
        }
      });

      client.on('user-left', (user) => {
        console.log('User left:', user.uid);
        setRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
      });

      // Rejoindre le channel (en mode test sans APP_ID valide, cela échouera gracieusement)
      try {
        await client.join(APP_ID, CHANNEL_NAME, TOKEN, UID);
        console.log('Joined channel successfully');
      } catch (error) {
        console.warn('Failed to join channel (normal in test mode):', error);
      }

      // Créer les pistes audio/vidéo locales
      if (callData.type === 'video') {
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localAudioTrackRef.current = audioTrack;
        localVideoTrackRef.current = videoTrack;

        // Afficher la vidéo locale
        if (localVideoRef.current) {
          videoTrack.play(localVideoRef.current);
        }

        // Publier les pistes
        try {
          await client.publish([audioTrack, videoTrack]);
          console.log('Published audio and video tracks');
        } catch (error) {
          console.warn('Failed to publish tracks (normal in test mode):', error);
        }
      } else {
        // Appel audio uniquement
        const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = audioTrack;

        try {
          await client.publish([audioTrack]);
          console.log('Published audio track');
        } catch (error) {
          console.warn('Failed to publish track (normal in test mode):', error);
        }
      }
    } catch (error) {
      console.error('Agora initialization error:', error);
      // En mode test, continuer malgré l'erreur
    }
  };

  const startDurationCounter = () => {
    durationIntervalRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const toggleAudio = async () => {
    if (localAudioTrackRef.current) {
      if (isAudioMuted) {
        await localAudioTrackRef.current.setEnabled(true);
      } else {
        await localAudioTrackRef.current.setEnabled(false);
      }
      setIsAudioMuted(!isAudioMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      if (isVideoMuted) {
        await localVideoTrackRef.current.setEnabled(true);
      } else {
        await localVideoTrackRef.current.setEnabled(false);
      }
      setIsVideoMuted(!isVideoMuted);
    }
  };

  const endCall = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !callId) return;

      await callsApi.endCall(token, parseInt(callId));
      cleanup();
      router.push('/calls');
    } catch (error) {
      console.error('Error ending call:', error);
      cleanup();
      router.push('/calls');
    }
  };

  const cleanup = async () => {
    // Arrêter le compteur
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Arrêter les pistes locales
    if (localAudioTrackRef.current) {
      localAudioTrackRef.current.stop();
      localAudioTrackRef.current.close();
    }
    if (localVideoTrackRef.current) {
      localVideoTrackRef.current.stop();
      localVideoTrackRef.current.close();
    }

    // Quitter le channel et détruire le client
    if (clientRef.current) {
      await clientRef.current.leave();
      clientRef.current.removeAllListeners();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Rendre les vidéos distantes
    remoteUsers.forEach((user) => {
      if (user.videoTrack && remoteVideoContainerRef.current) {
        const playerId = `remote-player-${user.uid}`;
        let playerContainer = document.getElementById(playerId);
        
        if (!playerContainer) {
          playerContainer = document.createElement('div');
          playerContainer.id = playerId;
          playerContainer.className = 'remote-video';
          remoteVideoContainerRef.current.appendChild(playerContainer);
        }
        
        user.videoTrack.play(playerContainer);
      }
    });

    // Nettoyage des conteneurs vidéo obsolètes
    if (remoteVideoContainerRef.current) {
      const containers = remoteVideoContainerRef.current.querySelectorAll('.remote-video');
      containers.forEach((container) => {
        const uid = container.id.replace('remote-player-', '');
        const userExists = remoteUsers.find((u) => u.uid.toString() === uid);
        if (!userExists) {
          container.remove();
        }
      });
    }
  }, [remoteUsers]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Connexion en cours...</div>
      </div>
    );
  }

  if (!call) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Appel introuvable</div>
      </div>
    );
  }

  const contact = call.caller_id === JSON.parse(localStorage.getItem('user') || '{}').id 
    ? call.receiver 
    : call.caller;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="text-white">
          <h1 className="text-xl font-bold">
            {call.type === 'video' ? '📹' : '📞'} {contact?.first_name} {contact?.last_name}
          </h1>
          <p className="text-sm text-gray-400">{formatDuration(callDuration)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            call.status === 'connected' ? 'bg-green-500' : 'bg-yellow-500'
          } text-white`}>
            {call.status === 'connected' ? 'En cours' : 'Connexion...'}
          </span>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {/* Remote videos */}
        <div 
          ref={remoteVideoContainerRef}
          className="absolute inset-0 grid grid-cols-1 md:grid-cols-2 gap-2 p-4"
        >
          {remoteUsers.length === 0 && (
            <div className="flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-6xl mb-4">👤</div>
                <p>En attente de {contact?.first_name}...</p>
              </div>
            </div>
          )}
        </div>

        {/* Local video (Picture-in-Picture) */}
        {call.type === 'video' && (
          <div className="absolute bottom-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-white">
            <div 
              ref={localVideoRef}
              className="w-full h-full"
            />
            {isVideoMuted && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-4xl">📷❌</div>
              </div>
            )}
          </div>
        )}

        {/* Audio-only indicator */}
        {call.type === 'audio' && remoteUsers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-5xl">
                {contact?.first_name?.[0]}{contact?.last_name?.[0]}
              </div>
              <p className="text-2xl font-bold">{contact?.first_name} {contact?.last_name}</p>
              <p className="text-gray-400">Appel audio</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-6">
          {/* Mute Audio */}
          <button
            onClick={toggleAudio}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
              isAudioMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            } text-white`}
            title={isAudioMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isAudioMuted ? '🎤❌' : '🎤'}
          </button>

          {/* Toggle Video (si appel vidéo) */}
          {call.type === 'video' && (
            <button
              onClick={toggleVideo}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition ${
                isVideoMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              } text-white`}
              title={isVideoMuted ? 'Activer la caméra' : 'Désactiver la caméra'}
            >
              {isVideoMuted ? '📷❌' : '📹'}
            </button>
          )}

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center text-3xl text-white transition shadow-lg"
            title="Raccrocher"
          >
            📞❌
          </button>

          {/* Settings placeholder */}
          <button
            className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-2xl text-white transition"
            title="Paramètres"
            onClick={() => alert('Paramètres audio/vidéo (à implémenter)')}
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
}
