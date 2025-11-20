'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { eventsApi, api, type Event, type User } from '@/lib/api';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = parseInt(params.id as string);

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedInvites, setSelectedInvites] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadEvent();
    loadFriends();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await eventsApi.getEvent(token, eventId);
      setEvent(data);
    } catch (error) {
      console.error('Failed to load event:', error);
    } finally {
      setLoading(false);
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

  const handleRespond = async (status: 'going' | 'maybe' | 'not_going') => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await eventsApi.respond(token, eventId, status);
      await loadEvent(); // Reload to get updated counts
    } catch (error) {
      console.error('Failed to respond:', error);
      alert('Erreur lors de la réponse');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) return;

    setSendingComment(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      await eventsApi.addComment(token, eventId, comment);
      setComment('');
      await loadEvent(); // Reload to get new comments
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Erreur lors de l\'ajout du commentaire');
    } finally {
      setSendingComment(false);
    }
  };

  const handleInvite = async () => {
    if (selectedInvites.length === 0) {
      alert('Veuillez sélectionner au moins un ami');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await eventsApi.invite(token, eventId, selectedInvites);
      setShowInviteModal(false);
      setSelectedInvites([]);
      alert('Invitations envoyées avec succès');
    } catch (error) {
      console.error('Failed to send invites:', error);
      alert('Erreur lors de l\'envoi des invitations');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await eventsApi.deleteEvent(token, eventId);
      router.push('/events');
    } catch (error) {
      console.error('Failed to delete event:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const getCoverPhotoUrl = (photo: string | null) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${photo}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusButton = (status: 'going' | 'maybe' | 'not_going', label: string, icon: string) => {
    const isSelected = event?.my_status === status;
    return (
      <button
        onClick={() => handleRespond(status)}
        className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
          isSelected
            ? 'bg-purple-600 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        {icon} {label}
      </button>
    );
  };

  const filteredFriends = Array.isArray(friends) ? friends.filter(
    friend =>
      !event?.attendees?.going.some(a => a.id === friend.id) &&
      !event?.attendees?.maybe.some(a => a.id === friend.id) &&
      !event?.attendees?.invited.some(a => a.id === friend.id) &&
      (`${friend.first_name} ${friend.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Événement introuvable</p>
          <button
            onClick={() => router.push('/events')}
            className="text-purple-600 hover:text-purple-700"
          >
            Retour aux événements
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div className="relative h-80 bg-gradient-to-br from-purple-400 to-pink-400">
        {event.cover_photo && (
          <img
            src={getCoverPhotoUrl(event.cover_photo)!}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-30" />

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 bg-white bg-opacity-90 text-gray-900 p-2 rounded-full hover:bg-opacity-100 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Badges */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {event.is_online && (
            <span className="bg-blue-500 text-white text-sm px-3 py-1 rounded-full font-medium">
              En ligne
            </span>
          )}
          {event.is_private && (
            <span className="bg-gray-900 bg-opacity-70 text-white text-sm px-3 py-1 rounded-full font-medium">
              🔒 Privé
            </span>
          )}
          {event.is_full && (
            <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-medium">
              Complet
            </span>
          )}
        </div>

        {/* Title on cover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
          <h1 className="text-3xl font-bold text-white mb-2">{event.title}</h1>
          <div className="flex items-center space-x-4 text-white text-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDate(event.start_time)}
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {event.going_count} {event.going_count > 1 ? 'participants' : 'participant'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* RSVP Buttons */}
            {!event.is_past && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Vous participez ?</h2>
                <div className="grid grid-cols-3 gap-3">
                  {getStatusButton('going', 'J\'y vais', '✓')}
                  {getStatusButton('maybe', 'Peut-être', '?')}
                  {getStatusButton('not_going', 'Non', '✗')}
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails</h2>

              {event.description && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Début : {formatDate(event.start_time)}</div>
                    <div className="font-medium text-gray-900">Fin : {formatDate(event.end_time)}</div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="font-medium text-gray-900">{event.location}</div>
                  </div>
                )}

                {event.meeting_link && (
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    <a
                      href={event.meeting_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-700 font-medium break-all"
                    >
                      Rejoindre la réunion →
                    </a>
                  </div>
                )}

                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <div className="font-medium text-gray-900">Organisé par</div>
                    <div className="text-gray-600">
                      {event.creator.first_name} {event.creator.last_name}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Commentaires ({event.comments?.length || 0})
              </h2>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Ajouter un commentaire..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-2"
                />
                <button
                  type="submit"
                  disabled={sendingComment || !comment.trim()}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {sendingComment ? 'Envoi...' : 'Commenter'}
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-4">
                {event.comments && event.comments.length > 0 ? (
                  event.comments.map((c) => (
                    <div key={c.id} className="flex space-x-3">
                      <img
                        src={c.user.profile_photo || '/default-avatar.png'}
                        alt={c.user.username}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-900 text-sm">
                            {c.user.first_name} {c.user.last_name}
                          </div>
                          <p className="text-gray-700 text-sm mt-1">{c.comment}</p>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {formatDate(c.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun commentaire pour le moment</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
                {event.is_creator && (
                  <button
                    onClick={() => setShowInviteModal(true)}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    + Inviter
                  </button>
                )}
              </div>

              {/* Going */}
              {event.attendees?.going && event.attendees.going.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    ✓ Participe ({event.attendees.going.length})
                  </h3>
                  <div className="space-y-2">
                    {event.attendees.going.slice(0, 5).map((attendee) => (
                      <div key={attendee.id} className="flex items-center space-x-2">
                        <img
                          src={attendee.profile_photo || '/default-avatar.png'}
                          alt={attendee.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-900">
                          {attendee.first_name} {attendee.last_name}
                        </span>
                      </div>
                    ))}
                    {event.attendees.going.length > 5 && (
                      <p className="text-sm text-gray-500">
                        +{event.attendees.going.length - 5} autres
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Maybe */}
              {event.attendees?.maybe && event.attendees.maybe.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    ? Peut-être ({event.attendees.maybe.length})
                  </h3>
                  <div className="space-y-2">
                    {event.attendees.maybe.slice(0, 3).map((attendee) => (
                      <div key={attendee.id} className="flex items-center space-x-2">
                        <img
                          src={attendee.profile_photo || '/default-avatar.png'}
                          alt={attendee.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span className="text-sm text-gray-900">
                          {attendee.first_name} {attendee.last_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            {event.is_creator && (
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-3">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                <button
                  onClick={() => router.push(`/events/${eventId}/edit`)}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition"
                >
                  ✏️ Modifier l'événement
                </button>
                <button
                  onClick={handleDelete}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  🗑️ Supprimer l'événement
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Inviter des amis</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un ami..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent mb-4"
              />
              <div className="space-y-2 mb-4">
                {filteredFriends.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    {searchQuery ? 'Aucun ami trouvé' : 'Tous vos amis sont déjà invités'}
                  </p>
                ) : (
                  filteredFriends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() =>
                        setSelectedInvites(prev =>
                          prev.includes(friend.id)
                            ? prev.filter(id => id !== friend.id)
                            : [...prev, friend.id]
                        )
                      }
                      className={`w-full flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition ${
                        selectedInvites.includes(friend.id) ? 'bg-purple-50' : ''
                      }`}
                    >
                      <img
                        src={friend.profile_photo || '/default-avatar.png'}
                        alt={friend.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900">
                          {friend.first_name} {friend.last_name}
                        </div>
                        <div className="text-sm text-gray-500">@{friend.username}</div>
                      </div>
                      {selectedInvites.includes(friend.id) && (
                        <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={handleInvite}
                disabled={selectedInvites.length === 0}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Envoyer {selectedInvites.length > 0 && `(${selectedInvites.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
