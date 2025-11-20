'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Conversation } from '@/lib/api';
import CallButton from '@/components/CallButton';
import NavigationHeader from '@/components/NavigationHeader';

export default function MessagesPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    loadConversations(token);
    loadUnreadCount(token);
    loadNotificationCount(token);
  }, [router]);

  const loadConversations = async (token: string) => {
    try {
      const response = await api.getConversations(token);
      setConversations(response.data);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async (token: string) => {
    try {
      const response = await api.getUnreadCount(token);
      setUnreadCount(response.count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const loadNotificationCount = async (token: string) => {
    try {
      const response = await api.getNotificationsUnreadCount(token);
      setNotificationCount(response.count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}j`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      <NavigationHeader notificationCount={0} onLogout={handleLogout} />

      {/* Conversations List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Aucune conversation
              </h2>
              <p className="text-gray-500 mb-6">
                Commencez à discuter avec vos amis !
              </p>
              <Link
                href="/discover"
                className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform"
              >
                Découvrir des utilisateurs
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations.map((conversation) => (
                <Link
                  key={conversation.id}
                  href={`/messages/${conversation.id}`}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {/* Profile Photo */}
                  <div className="relative flex-shrink-0">
                    {conversation.other_user.profile_photo ? (
                      <img
                        src={conversation.other_user.profile_photo}
                        alt={conversation.other_user.username}
                        className="w-14 h-14 rounded-full object-cover border-2 border-purple-500"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold text-xl border-2 border-purple-500">
                        {conversation.other_user.first_name[0]}
                        {conversation.other_user.last_name[0]}
                      </div>
                    )}
                    {conversation.unread_count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>

                  {/* Conversation Info */}
                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className={`font-semibold text-gray-800 truncate ${
                        conversation.unread_count > 0 ? 'font-bold' : ''
                      }`}>
                        {conversation.other_user.first_name} {conversation.other_user.last_name}
                      </h3>
                      {conversation.last_message && (
                        <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                          {formatTime(conversation.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      @{conversation.other_user.username}
                    </p>
                    {conversation.last_message && (
                      <p className={`text-sm mt-1 truncate ${
                        conversation.unread_count > 0 ? 'font-semibold text-gray-800' : 'text-gray-600'
                      }`}>
                        {conversation.last_message.content}
                      </p>
                    )}
                  </div>

                  {/* Call Buttons */}
                  <div className="ml-4 flex gap-2 items-center">
                    <CallButton 
                      userId={conversation.other_user.id} 
                      type="audio" 
                      size="sm" 
                    />
                    <CallButton 
                      userId={conversation.other_user.id} 
                      type="video" 
                      size="sm" 
                    />
                  </div>

                  {/* Arrow */}
                  <div className="ml-4 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
