'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, Notification } from '@/lib/api';
import Link from 'next/link';
import NavigationHeader from '@/components/NavigationHeader';
import GameInvitationNotification from '@/components/games/GameInvitationNotification';

interface GameInvitation {
  id: number;
  from_user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  game_type: string;
  status: string;
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [gameInvitations, setGameInvitations] = useState<GameInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetchNotifications();
  }, [router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getNotifications(token);
      setNotifications(response.data);

      // Fetch game invitations
      const invitationsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/invitations`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (invitationsResponse.ok) {
        const invitationsData = await invitationsResponse.json();
        setGameInvitations(invitationsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      alert('Erreur lors du chargement des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setActionLoading({ ...actionLoading, [notificationId]: true });
      await api.markNotificationAsRead(token, notificationId);
      
      // Update local state
      setNotifications(notifications.map(notif =>
        notif.id === notificationId
          ? { ...notif, is_read: true, read_at: new Date().toISOString() }
          : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setActionLoading({ ...actionLoading, [notificationId]: false });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      await api.markAllNotificationsAsRead(token);
      
      // Update local state
      setNotifications(notifications.map(notif => ({
        ...notif,
        is_read: true,
        read_at: new Date().toISOString()
      })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert('Erreur lors du marquage des notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (notificationId: number) => {
    if (!confirm('Supprimer cette notification ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setActionLoading({ ...actionLoading, [notificationId]: true });
      await api.deleteNotification(token, notificationId);
      
      // Remove from local state
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setActionLoading({ ...actionLoading, [notificationId]: false });
    }
  };

  const handleClearRead = async () => {
    if (!confirm('Supprimer toutes les notifications lues ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      await api.clearReadNotifications(token);
      
      // Remove read notifications from local state
      setNotifications(notifications.filter(notif => !notif.is_read));
    } catch (error) {
      console.error('Error clearing read notifications:', error);
      alert('Erreur lors du nettoyage');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👥';
      case 'message':
        return '📨';
      case 'game_invite':
        return '🎮';
      case 'ai_image_ready':
        return '🎨';
      case 'group_invitation':
      case 'group_message':
      case 'group_mention':
        return '👥';
      case 'event_invitation':
      case 'event_response':
      case 'event_created':
      case 'event_invite':
        return '📅';
      case 'call_incoming':
      case 'call_missed':
        return '📞';
      case 'call_declined':
        return '🚫';
      case 'call_ended':
        return '📞✅';
      default:
        return '🔔';
    }
  };

  const getNotificationLink = (notif: Notification) => {
    switch (notif.type) {
      case 'like':
      case 'comment':
        return notif.data?.post_id ? `/posts/${notif.data.post_id}` : null;
      case 'follow':
        return notif.actor ? `/profile/${notif.actor.username}` : null;
      case 'message':
        return notif.data?.conversation_id ? `/messages/${notif.data.conversation_id}` : null;
      case 'game_invite':
        return notif.data?.game_id ? `/games/${notif.data.game_id}` : null;
      case 'ai_image_ready':
        return notif.data?.post_id ? `/posts/${notif.data.post_id}` : null;
      case 'group_invitation':
      case 'group_message':
      case 'group_mention':
        return notif.group_id ? `/groups/${notif.group_id}` : null;
      case 'event_invitation':
      case 'event_response':
      case 'event_created':
      case 'event_invite':
        return notif.event_id ? `/events/${notif.event_id}` : null;
      case 'call_incoming':
      case 'call_missed':
      case 'call_declined':
      case 'call_ended':
        return notif.call_id ? `/calls/${notif.call_id}` : '/calls';
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  };

  const handleLogout = () => {
    const token = localStorage.getItem('token');
    if (token) {
      api.logout(token);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Remove accepted invitation
        setGameInvitations(gameInvitations.filter(inv => inv.id !== invitationId));
        // Redirect to game
        if (data.game && data.game.id) {
          router.push(`/games/lobby/${data.game.id}`);
        }
      } else {
        alert('❌ Erreur lors de l\'acceptation de l\'invitation');
      }
    } catch (error) {
      console.error('Accept invitation error:', error);
      alert('❌ Erreur lors de l\'acceptation de l\'invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/invitations/${invitationId}/decline`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        // Remove declined invitation
        setGameInvitations(gameInvitations.filter(inv => inv.id !== invitationId));
        alert('✅ Invitation refusée');
      } else {
        alert('❌ Erreur lors du refus de l\'invitation');
      }
    } catch (error) {
      console.error('Decline invitation error:', error);
      alert('❌ Erreur lors du refus de l\'invitation');
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-purple-600 text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <NavigationHeader notificationCount={unreadCount} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Game Invitations Section */}
        {gameInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              🎮 Invitations de jeux
              <span className="bg-purple-500 text-white text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {gameInvitations.length}
              </span>
            </h2>
            <div className="space-y-3">
              {gameInvitations.map((invitation) => (
                <GameInvitationNotification
                  key={invitation.id}
                  invitation={invitation}
                  onAccept={handleAcceptInvitation}
                  onDecline={handleDeclineInvitation}
                />
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex flex-wrap gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                ✓ Tout marquer comme lu
              </button>
            )}
            <button
              onClick={handleClearRead}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
            >
              🗑️ Effacer les lues
            </button>
            <button
              onClick={fetchNotifications}
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
            >
              🔄 Actualiser
            </button>
          </div>
        )}

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Aucune notification</h2>
            <p className="text-gray-600 mb-6">
              Vous serez notifié ici lors de nouvelles activités
            </p>
            <Link
              href="/feed"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
            >
              📱 Voir le Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => {
              const link = getNotificationLink(notif);
              const NotifContent = (
                <div
                  className={`bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition ${
                    !notif.is_read ? 'border-l-4 border-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-3xl flex-shrink-0">
                      {getNotificationIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-gray-800 ${!notif.is_read ? 'font-semibold' : ''}`}>
                          {notif.message}
                        </p>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(notif.created_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0">
                      {!notif.is_read && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleMarkAsRead(notif.id);
                          }}
                          disabled={actionLoading[notif.id]}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                          title="Marquer comme lu"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(notif.id);
                        }}
                        disabled={actionLoading[notif.id]}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              );

              return link ? (
                <Link key={notif.id} href={link}>
                  {NotifContent}
                </Link>
              ) : (
                <div key={notif.id}>{NotifContent}</div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
