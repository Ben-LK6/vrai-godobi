'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { callsApi, Call } from '@/lib/api';
import Link from 'next/link';
import NavigationHeader from '@/components/NavigationHeader';

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missed' | 'outgoing' | 'incoming'>('all');
  const router = useRouter();

  // Protection SSR
  if (typeof window === 'undefined') {
    return <div>Chargement...</div>;
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      fetchCallHistory();
    }
  }, [router, filter]);

  const fetchCallHistory = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await callsApi.getCallHistory(token, filter);
      setCalls(response.data);
    } catch (error) {
      console.error('Error fetching call history:', error);
      alert('Erreur lors du chargement de l\'historique des appels');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays < 7) {
      return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const getCallIcon = (call: Call) => {
    if (call.status === 'missed') return '📵';
    if (call.status === 'declined') return '🚫';
    return call.type === 'video' ? '📹' : '📞';
  };

  const getCallStatusText = (status: string) => {
    switch (status) {
      case 'ended': return 'Terminé';
      case 'missed': return 'Manqué';
      case 'declined': return 'Refusé';
      default: return status;
    }
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      // api.logout(token);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const currentUser = getCurrentUser();

  if (loading && calls.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <NavigationHeader notificationCount={0} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📋 Tous
          </button>
          <button
            onClick={() => setFilter('missed')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'missed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📵 Manqués
          </button>
          <button
            onClick={() => setFilter('outgoing')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'outgoing'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📤 Sortants
          </button>
          <button
            onClick={() => setFilter('incoming')}
            className={`px-4 py-2 rounded-lg transition ${
              filter === 'incoming'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📥 Entrants
          </button>
        </div>

        {/* Call List */}
        {calls.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📞</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucun appel</h2>
            <p className="text-gray-600 mb-6">
              Votre historique d&apos;appels apparaîtra ici
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {calls.map((call) => {
              const isOutgoing = call.caller_id === currentUser?.id;
              const contact = isOutgoing ? call.receiver : call.caller;

              return (
                <div
                  key={call.id}
                  className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition ${
                    call.status === 'missed' && !isOutgoing ? 'border-l-4 border-red-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                      {contact?.first_name?.[0]}{contact?.last_name?.[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getCallIcon(call)}</span>
                        <h3 className="font-semibold text-gray-800 truncate">
                          {contact?.first_name} {contact?.last_name}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded ${
                          call.status === 'missed' ? 'bg-red-100 text-red-700' :
                          call.status === 'declined' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getCallStatusText(call.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span>{isOutgoing ? '📤 Sortant' : '📥 Entrant'}</span>
                        <span>•</span>
                        <span>{formatDate(call.created_at)}</span>
                        {call.duration > 0 && (
                          <>
                            <span>•</span>
                            <span>{formatDuration(call.duration)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {contact && (
                        <>
                          <button
                            onClick={() => {
                              // TODO: Initier appel audio
                              alert('Fonctionnalité en développement');
                            }}
                            className="p-3 text-green-600 hover:bg-green-50 rounded-full transition"
                            title="Rappeler (audio)"
                          >
                            📞
                          </button>
                          <button
                            onClick={() => {
                              // TODO: Initier appel vidéo
                              alert('Fonctionnalité en développement');
                            }}
                            className="p-3 text-blue-600 hover:bg-blue-50 rounded-full transition"
                            title="Rappeler (vidéo)"
                          >
                            📹
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
