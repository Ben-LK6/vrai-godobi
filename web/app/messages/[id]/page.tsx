'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Message, Conversation } from '@/lib/api';
import CallButton from '@/components/CallButton';
import GameInviteModal from '@/components/games/GameInviteModal';

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = Number(params.id);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showGameModal, setShowGameModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      setCurrentUserId(user.id);
    } catch (error) {
      console.error('Error parsing user:', error);
      router.push('/login');
      return;
    }

    loadMessages(token);
  }, [conversationId, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (token: string) => {
    try {
      const response = await api.getMessages(token, conversationId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    setSending(true);
    try {
      const response = await api.sendMessage(token, conversationId, {
        content: newMessage.trim(),
      });
      setMessages([...messages, response.message]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm('Voulez-vous vraiment supprimer ce message ?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await api.deleteMessage(token, conversationId, messageId);
      setMessages(messages.filter((m) => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((message) => {
      const date = new Date(message.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  const handleGameInvite = async (gameType: string) => {
    const token = localStorage.getItem('token');
    if (!token || !otherUser) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/games/invite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_user_id: otherUser.id,
          game_type: gameType,
        }),
      });

      if (response.ok) {
        alert(`✅ Invitation envoyée à ${otherUser.first_name} !`);
      } else {
        alert('❌ Erreur lors de l\'envoi de l\'invitation');
      }
    } catch (error) {
      console.error('Game invite error:', error);
      alert('❌ Erreur lors de l\'envoi de l\'invitation');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
        <div className="text-white text-2xl">Chargement...</div>
      </div>
    );
  }

  const otherUser = messages.length > 0 ? 
    (messages[0].sender_id === currentUserId ? messages[0].receiver : messages[0].sender) : null;

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400">
      {/* Header */}
      <div className="bg-white shadow-md flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/messages"
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            {otherUser && (
              <div className="flex items-center gap-3">
                {otherUser.profile_photo ? (
                  <img
                    src={otherUser.profile_photo}
                    alt={otherUser.username}
                    className="w-10 h-10 rounded-full object-cover border-2 border-purple-500"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold border-2 border-purple-500">
                    {otherUser.first_name[0]}{otherUser.last_name[0]}
                  </div>
                )}
                <div>
                  <h2 className="font-bold text-gray-800">
                    {otherUser.first_name} {otherUser.last_name}
                  </h2>
                  <p className="text-sm text-gray-500">@{otherUser.username}</p>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            {/* Call buttons for the other user */}
            {otherUser && (
              <>
                <CallButton 
                  userId={otherUser.id} 
                  type="audio" 
                  size="md" 
                />
                <CallButton 
                  userId={otherUser.id} 
                  type="video" 
                  size="md" 
                />
              </>
            )}
            <Link
              href="/feed"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              🏠
            </Link>
            <Link
              href="/friends"
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              👥
            </Link>
            <Link
              href="/discover"
              className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              🔍
            </Link>
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              👤
            </Link>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-2 rounded-full text-sm font-semibold hover:scale-105 transition-transform"
            >
              🚪
            </button>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Aucun message
              </h2>
              <p className="text-white opacity-80">
                Commencez la conversation !
              </p>
            </div>
          ) : (
            Object.entries(messageGroups).map(([date, msgs]) => (
              <div key={date} className="mb-6">
                {/* Date Divider */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-white bg-opacity-90 px-4 py-1 rounded-full text-sm text-gray-600 font-medium shadow-sm">
                    {formatDate(msgs[0].created_at)}
                  </div>
                </div>

                {/* Messages */}
                {msgs.map((message) => {
                  const isCurrentUser = message.sender_id === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`flex mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md ${
                          isCurrentUser
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                            : 'bg-white text-gray-800'
                        } rounded-2xl px-4 py-2 shadow-md relative group`}
                      >
                        <p className="break-words">{message.content}</p>
                        <div className={`flex items-center justify-between mt-1 gap-2 ${
                          isCurrentUser ? 'text-white opacity-70' : 'text-gray-500'
                        } text-xs`}>
                          <span>{formatTime(message.created_at)}</span>
                          {isCurrentUser && message.is_read && (
                            <span className="flex items-center gap-1">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Lu
                            </span>
                          )}
                        </div>
                        {isCurrentUser && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                            title="Supprimer"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 flex-shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Écrivez votre message..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={5000}
              disabled={sending}
            />
            <button
              type="button"
              onClick={() => setShowGameModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-full font-semibold hover:scale-105 transition-transform"
              title="Défier à un jeu"
            >
              🎮
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {sending ? '...' : '📤'}
            </button>
          </form>
        </div>
      </div>

      {/* Game Invite Modal */}
      {otherUser && (
        <GameInviteModal
          isOpen={showGameModal}
          onClose={() => setShowGameModal(false)}
          recipientName={otherUser.first_name}
          recipientId={otherUser.id}
          onInvite={handleGameInvite}
        />
      )}
    </div>
  );
}
