'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type User, storiesApi, type StoryGroup } from '@/lib/api';
import CallButton from '@/components/CallButton';
import NavigationHeader from '@/components/NavigationHeader';

export default function FriendsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'discover'>('followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingStatus, setFollowingStatus] = useState<{ [key: number]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const [messageLoading, setMessageLoading] = useState<{ [key: number]: boolean }>({});
  const [notificationCount, setNotificationCount] = useState(0);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadData();
    loadNotificationCount();
    loadStories();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const [followersRes, followingRes, suggestionsRes] = await Promise.all([
        api.getFollowers(token),
        api.getFollowing(token),
        api.getSuggestions(token),
      ]);

      setFollowers(followersRes.data);
      setFollowing(followingRes.data);
      setSuggestions(suggestionsRes.data);

      // Initialiser le statut de suivi
      const status: { [key: number]: boolean } = {};
      followingRes.data.forEach((user: User) => {
        status[user.id] = true;
      });
      setFollowingStatus(status);
    } catch (err) {
      console.error('Failed to load friends data:', err);
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

  const loadStories = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await storiesApi.getStories(token);
      setStoryGroups(data);
    } catch (err) {
      console.error('Failed to load stories:', err);
    }
  };

  const handleFollow = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setActionLoading({ ...actionLoading, [userId]: true });

      const response = await api.followUser(token, userId);
      
      setFollowingStatus({ ...followingStatus, [userId]: response.following });

      // Si on ne suit plus un utilisateur de la section découvrir, on le retire
      if (!response.following && activeTab === 'discover') {
        setSuggestions(suggestions.filter(u => u.id !== userId));
      }

      // Recharger les données
      await loadData();
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

  const currentList = activeTab === 'followers' ? followers : activeTab === 'following' ? following : suggestions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />

      {/* Stories Bar - Toujours visible */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4 overflow-x-auto scrollbar-hidden">
            {/* Ajouter ma story */}
            <button
              onClick={() => router.push('/stories/create')}
              className="flex-shrink-0 text-center"
            >
              <div className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-dashed border-white flex items-center justify-center hover:bg-white/30 transition-all">
                <span className="text-3xl text-white">+</span>
              </div>
              <p className="mt-1 text-xs text-white font-medium">Ma story</p>
            </button>

            {/* Stories des amis */}
            {storyGroups.map((group) => (
              <button
                key={group.user_id}
                onClick={() => router.push(`/stories/view/${group.user_id}`)}
                className="flex-shrink-0 text-center"
              >
                <div
                  className={`relative w-16 h-16 rounded-full p-0.5 ${
                    group.has_unviewed
                      ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
                      : 'bg-white/30'
                  }`}
                >
                  <img
                    src={group.user.profile_photo || '/default-avatar.png'}
                    alt={group.user.username}
                    className="w-full h-full rounded-full object-cover bg-white border-2 border-purple-600"
                  />
                </div>
                <p className="mt-1 text-xs text-white font-medium truncate w-16">
                  {group.user.first_name}
                </p>
              </button>
            ))}

            {/* Message si aucune story */}
            {storyGroups.length === 0 && (
              <p className="text-white/70 text-sm italic ml-4">
                Soyez le premier à partager une story ! 📸
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">Mes Amis</h2>
          <p className="text-white/80 text-lg">Gérez vos followers et abonnements</p>
        </div>

        {/* Tabs */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 mb-8 flex gap-2">
          <button
            onClick={() => setActiveTab('followers')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'followers'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            👥 Followers ({followers.length})
          </button>
          <button
            onClick={() => setActiveTab('following')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'following'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            ➕ Abonnements ({following.length})
          </button>
          <button
            onClick={() => setActiveTab('discover')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'discover'
                ? 'bg-white text-purple-600 shadow-lg'
                : 'text-white hover:bg-white/10'
            }`}
          >
            🔍 Découvrir ({suggestions.length})
          </button>
        </div>

        {/* List */}
        {currentList.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-2xl p-12 text-center">
            <p className="text-6xl mb-4">
              {activeTab === 'followers' ? '👤' : activeTab === 'following' ? '➕' : '🔍'}
            </p>
            <p className="text-2xl font-semibold mb-2">
              {activeTab === 'followers'
                ? 'Aucun follower pour le moment'
                : activeTab === 'following'
                ? 'Vous ne suivez personne'
                : 'Aucune suggestion disponible'}
            </p>
            <p className="text-gray-600 mb-6">
              {activeTab === 'followers'
                ? 'Partagez votre profil pour gagner des followers'
                : activeTab === 'following'
                ? 'Découvrez des personnes intéressantes à suivre'
                : 'Revenez plus tard pour découvrir de nouveaux utilisateurs'}
            </p>
            {activeTab === 'following' && (
              <button
                onClick={() => setActiveTab('discover')}
                className="inline-block px-8 py-4 bg-purple-600 text-white rounded-full font-semibold hover:bg-purple-700 transition-colors text-lg"
              >
                Découvrir des utilisateurs
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentList.map((user) => (
              <div key={user.id} className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                {/* Card Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                      {user.first_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-white/80 text-sm truncate">@{user.username}</p>
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {/* Stats */}
                  <div className="flex justify-around mb-4 py-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <p className="text-xl font-bold text-purple-600">{user.followers_count || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{user.following_count || 0}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Link
                        href={`/profile/${user.id}`}
                        className="flex-1 px-4 py-2 border-2 border-purple-600 text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-center text-sm"
                      >
                        Voir profil
                      </Link>
                      
                      {((activeTab === 'followers' && !followingStatus[user.id]) || activeTab === 'discover') && (
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={actionLoading[user.id]}
                          className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm ${
                            followingStatus[user.id]
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {actionLoading[user.id] ? (
                            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          ) : followingStatus[user.id] ? (
                            'Ne plus suivre'
                          ) : (
                            'Suivre'
                          )}
                        </button>
                      )}

                      {activeTab === 'following' && (
                        <button
                          onClick={() => handleFollow(user.id)}
                          disabled={actionLoading[user.id]}
                          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
                        >
                          {actionLoading[user.id] ? (
                            <span className="inline-block w-4 h-4 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></span>
                          ) : (
                            'Ne plus suivre'
                          )}
                        </button>
                      )}
                    </div>
                    
                    {/* Message Button */}
                    <button
                      onClick={() => handleSendMessage(user.id)}
                      disabled={messageLoading[user.id]}
                      className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 text-sm"
                    >
                      {messageLoading[user.id] ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      ) : (
                        '💬 Envoyer un message'
                      )}
                    </button>

                    {/* Call Buttons */}
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <CallButton 
                          userId={user.id} 
                          type="audio" 
                          size="lg" 
                          className="w-full h-12"
                        />
                      </div>
                      <div className="flex-1">
                        <CallButton 
                          userId={user.id} 
                          type="video" 
                          size="lg" 
                          className="w-full h-12"
                        />
                      </div>
                    </div>
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
