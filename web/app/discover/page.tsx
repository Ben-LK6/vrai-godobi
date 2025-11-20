'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type User } from '@/lib/api';
import NavigationHeader from '@/components/NavigationHeader';

export default function DiscoverPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<{ [key: number]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [messageLoading, setMessageLoading] = useState<{ [key: number]: boolean }>({});
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadSuggestions();
    loadNotificationCount();
  }, []);

  const loadSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getSuggestions(token);
      setSuggestions(response.data);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getNotificationsUnreadCount(token);
      setNotificationCount(response.count);
    } catch (err) {
      console.error('Failed to load notification count:', err);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setActionLoading({ ...actionLoading, [userId]: true });

      const response = await api.followUser(token, userId);
      
      setFollowingStatus({ ...followingStatus, [userId]: response.following });
      
      // Si on ne suit plus, on peut retirer de la liste des suggestions
      if (!response.following) {
        setSuggestions(suggestions.filter(u => u.id !== userId));
      }
    } catch (err) {
      console.error('Failed to follow user:', err);
    } finally {
      setActionLoading({ ...actionLoading, [userId]: false });
    }
  };

  const handleSendMessage = async (userId: number) => {
    setMessageLoading({ ...messageLoading, [userId]: true });
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getOrCreateConversation(token, userId);
      router.push(`/messages/${response.conversation.id}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert('Erreur lors de la création de la conversation');
    } finally {
      setMessageLoading({ ...messageLoading, [userId]: false });
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      await api.logout(token);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 text-white text-xl">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Découvrir</h2>
          <p className="text-white/80 text-lg">Trouvez des personnes intéressantes à suivre</p>
        </div>

        {suggestions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <p className="text-6xl mb-4">🔍</p>
            <p className="text-2xl font-semibold mb-2">Aucune suggestion disponible</p>
            <p className="text-gray-600 mb-6">Revenez plus tard pour découvrir de nouveaux utilisateurs</p>
            <Link
              href="/feed"
              className="inline-block px-8 py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors text-lg"
            >
              Retour au Feed
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suggestions.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                {/* Card Header with Profile */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-3xl mb-3">
                      {user.first_name?.[0] || 'U'}
                    </div>
                    <h3 className="text-xl font-bold text-white text-center">
                      {user.first_name} {user.last_name}
                    </h3>
                    <p className="text-white/80 text-sm">@{user.username}</p>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {user.bio && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{user.bio}</p>
                  )}

                  {/* Stats */}
                  <div className="flex justify-around mb-4 py-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">{user.followers_count || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{user.following_count || 0}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Link
                      href={`/profile/${user.id}`}
                      className="flex-1 px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-center"
                    >
                      Voir profil
                    </Link>
                    <button
                      onClick={() => handleFollow(user.id)}
                      disabled={actionLoading[user.id]}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        followingStatus[user.id]
                          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      } disabled:opacity-50`}
                    >
                      {actionLoading[user.id] ? (
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : followingStatus[user.id] ? (
                        'Ne plus suivre'
                      ) : (
                        'Suivre'
                      )}
                    </button>
                    <button
                      onClick={() => handleSendMessage(user.id)}
                      disabled={messageLoading[user.id]}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                        messageLoading[user.id]
                          ? 'bg-gray-200 text-gray-700'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      } disabled:opacity-50`}
                    >
                      {messageLoading[user.id] ? (
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        'Message'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
