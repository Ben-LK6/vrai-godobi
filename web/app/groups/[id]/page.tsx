'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { groupsApi, api, type Group, type GroupMessage, type User } from '@/lib/api';

export default function GroupChatPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.id ? parseInt(params.id as string) : null;
  
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [friends, setFriends] = useState<User[]>([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionCursorPos, setMentionCursorPos] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!groupId) return;
    
    loadGroup();
    loadMessages();
    loadFriends();
    
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadGroup = async () => {
    if (!groupId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await groupsApi.getGroup(token, groupId);
      setGroup(data);
    } catch (error) {
      console.error('Failed to load group:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!groupId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const data = await groupsApi.getMessages(token, groupId);
      setMessages(data.data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getFollowing(token);
      const friendsList = Array.isArray(response) ? response : (response.data || []);
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!groupId || !newMessage.trim() && !selectedMedia) return;

    setSending(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await groupsApi.sendMessage(token, groupId, newMessage, selectedMedia || undefined);
      setNewMessage('');
      setSelectedMedia(null);
      setShowMentionMenu(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  const handleAddMember = async (userId: number) => {
    if (!groupId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await groupsApi.addMember(token, groupId, userId);
      await loadGroup();
      setShowAddMember(false);
      alert('Membre ajouté avec succès');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('Erreur lors de l\'ajout du membre');
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!groupId || !confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await groupsApi.removeMember(token, groupId, userId);
      await loadGroup();
      alert('Membre retiré avec succès');
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('Erreur lors du retrait du membre');
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId || !confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await groupsApi.leaveGroup(token, groupId);
      router.push('/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Erreur lors de la sortie du groupe');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId || !confirm('Êtes-vous sûr de vouloir supprimer ce groupe ? Cette action est irréversible.')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await groupsApi.deleteGroup(token, groupId);
      router.push('/groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Erreur lors de la suppression du groupe');
    }
  };

  const getGroupPhotoUrl = (photo: string | null) => {
    if (!photo) return '/default-group.png';
    if (photo.startsWith('http')) return photo;
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${photo}`;
  };

  const getMediaUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${url}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessageContent = (content: string) => {
    // Remplacer les mentions @username par des spans stylisés
    return content.split(/(@\w+)/g).map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-purple-600 font-semibold bg-purple-50 px-1 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const availableFriends = friends.filter(
    friend => !group?.members?.some(member => member.id === friend.id)
  );

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setNewMessage(value);
    
    // Détecter si on tape @ pour afficher le menu de mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1 && lastAtIndex === textBeforeCursor.length - 1) {
      // On vient de taper @
      setShowMentionMenu(true);
      setMentionSearch('');
      setMentionCursorPos(cursorPos);
    } else if (lastAtIndex !== -1) {
      // Il y a un @ et on continue de taper
      const searchText = textBeforeCursor.substring(lastAtIndex + 1);
      if (!/\s/.test(searchText)) {
        // Pas d'espace après @, on continue la recherche
        setShowMentionMenu(true);
        setMentionSearch(searchText);
        setMentionCursorPos(cursorPos);
      } else {
        setShowMentionMenu(false);
      }
    } else {
      setShowMentionMenu(false);
    }
  };

  const handleSelectMention = (username: string) => {
    const textBeforeCursor = newMessage.substring(0, mentionCursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = newMessage.substring(mentionCursorPos);
    
    const newText = newMessage.substring(0, lastAtIndex) + '@' + username + ' ' + textAfterCursor;
    setNewMessage(newText);
    setShowMentionMenu(false);
    
    // Remettre le focus sur l'input
    messageInputRef.current?.focus();
  };

  const filteredMentionMembers = group?.members?.filter(member =>
    member.username.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.first_name.toLowerCase().includes(mentionSearch.toLowerCase()) ||
    member.last_name.toLowerCase().includes(mentionSearch.toLowerCase())
  ) || [];

  if (!groupId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">ID de groupe invalide</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Groupe introuvable</p>
          <button
            onClick={() => router.push('/groups')}
            className="text-purple-600 hover:text-purple-700"
          >
            Retour aux groupes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/groups')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <img
                src={getGroupPhotoUrl(group.photo)}
                alt={group.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <h1 className="font-semibold text-gray-900">{group.name}</h1>
                <button
                  onClick={() => setShowMembers(true)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  {group.members_count} membre{group.members_count > 1 ? 's' : ''}
                </button>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const showAvatar = index === 0 || messages[index - 1].user.id !== message.user.id;
            
            return (
              <div key={message.id} className="flex items-start space-x-2">
                {showAvatar ? (
                  <img
                    src={message.user.profile_photo || '/default-avatar.png'}
                    alt={message.user.username}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8" />
                )}
                <div className="flex-1 min-w-0">
                  {showAvatar && (
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {message.user.first_name} {message.user.last_name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  {message.media_url && (
                    <div className="mb-2">
                      {message.media_type === 'image' && (
                        <img
                          src={getMediaUrl(message.media_url)}
                          alt="Message media"
                          className="rounded-lg max-w-md"
                        />
                      )}
                      {message.media_type === 'video' && (
                        <video
                          src={getMediaUrl(message.media_url)}
                          controls
                          className="rounded-lg max-w-md"
                        />
                      )}
                      {message.media_type === 'file' && (
                        <a
                          href={getMediaUrl(message.media_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span>Télécharger le fichier</span>
                        </a>
                      )}
                    </div>
                  )}
                  {message.content && (
                    <p className="text-gray-800 break-words">
                      {formatMessageContent(message.content)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {selectedMedia && (
            <div className="mb-2 flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>{selectedMedia.name}</span>
              <button
                onClick={() => {
                  setSelectedMedia(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2 relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => setSelectedMedia(e.target.files?.[0] || null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <div className="flex-1 relative">
              <input
                ref={messageInputRef}
                type="text"
                value={newMessage}
                onChange={handleMessageChange}
                placeholder="Écrire un message... (utilisez @ pour mentionner)"
                className="w-full px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {/* Menu de mentions */}
              {showMentionMenu && filteredMentionMembers.length > 0 && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                  {filteredMentionMembers.slice(0, 5).map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => handleSelectMention(member.username)}
                      className="w-full flex items-center space-x-2 p-2 hover:bg-purple-50 transition"
                    >
                      <img
                        src={member.profile_photo || '/default-avatar.png'}
                        alt={member.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-xs text-gray-500">@{member.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={sending || (!newMessage.trim() && !selectedMedia)}
              className="bg-purple-600 text-white p-2 rounded-full hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
          {showMentionMenu && (
            <div className="absolute bg-white border rounded-lg shadow-md mt-1 max-h-60 overflow-y-auto w-full z-50">
              <div className="p-2">
                {filteredMentionMembers.length === 0 ? (
                  <div className="text-gray-500 text-sm py-2 text-center">
                    Aucune correspondance
                  </div>
                ) : (
                  filteredMentionMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleSelectMention(member.username)}
                      className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-purple-50 transition"
                    >
                      <img
                        src={member.profile_photo || '/default-avatar.png'}
                        alt={member.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          @{member.username}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Members Modal */}
      {showMembers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Membres ({group.members?.length || 0})</h2>
              <button
                onClick={() => setShowMembers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {group.is_admin && (
                <button
                  onClick={() => {
                    setShowMembers(false);
                    setShowAddMember(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition mb-4"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Ajouter un membre</span>
                </button>
              )}
              {group.members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.profile_photo || '/default-avatar.png'}
                      alt={member.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-medium">{member.first_name} {member.last_name}</div>
                      <div className="text-sm text-gray-500">@{member.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {member.role === 'admin' && (
                      <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium">
                        Admin
                      </span>
                    )}
                    {group.is_admin && member.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Ajouter un membre</h2>
              <button
                onClick={() => setShowAddMember(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {availableFriends.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Tous vos amis sont déjà membres</p>
              ) : (
                availableFriends.map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => handleAddMember(friend.id)}
                    className="w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition"
                  >
                    <img
                      src={friend.profile_photo || '/default-avatar.png'}
                      alt={friend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="text-left">
                      <div className="font-medium">{friend.first_name} {friend.last_name}</div>
                      <div className="text-sm text-gray-500">@{friend.username}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-xl font-bold">Paramètres du groupe</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-2">
              {group.description && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Description</div>
                  <p className="text-gray-600">{group.description}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setShowMembers(true);
                }}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 rounded-lg transition"
              >
                Voir les membres
              </button>
              {!group.is_admin && (
                <button
                  onClick={handleLeaveGroup}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Quitter le groupe
                </button>
              )}
              {group.is_admin && (
                <button
                  onClick={handleDeleteGroup}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Supprimer le groupe
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
