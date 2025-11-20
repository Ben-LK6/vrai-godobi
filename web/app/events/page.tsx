'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { eventsApi, type Event } from '@/lib/api';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'my_events' | 'invited'>('upcoming');

  useEffect(() => {
    loadEvents();
  }, [filter]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const data = await eventsApi.getEvents(token, filter);
      setEvents(data.data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoverPhotoUrl = (photo: string | null) => {
    if (!photo) return '/default-event.png';
    if (photo.startsWith('http')) return photo;
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${photo}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;
    
    const badges = {
      going: { text: 'J\'y vais', color: 'bg-green-100 text-green-700' },
      maybe: { text: 'Peut-être', color: 'bg-yellow-100 text-yellow-700' },
      not_going: { text: 'Je n\'y vais pas', color: 'bg-red-100 text-red-700' },
      invited: { text: 'Invité', color: 'bg-blue-100 text-blue-700' },
    };
    
    const badge = badges[status as keyof typeof badges];
    return badge ? (
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
        {badge.text}
      </span>
    ) : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Événements</h1>
            <Link
              href="/events/create"
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Créer</span>
            </Link>
          </div>
          
          {/* Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { key: 'upcoming', label: '📅 À venir', count: null },
              { key: 'invited', label: '✉️ Invitations', count: null },
              { key: 'my_events', label: '✨ Mes événements', count: null },
              { key: 'past', label: '⏰ Passés', count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                  filter === tab.key
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement</h2>
            <p className="text-gray-500 mb-6">
              {filter === 'invited' && 'Vous n\'avez aucune invitation en attente'}
              {filter === 'my_events' && 'Créez votre premier événement'}
              {filter === 'past' && 'Aucun événement passé'}
              {filter === 'upcoming' && 'Aucun événement à venir'}
            </p>
            <Link
              href="/events/create"
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Créer un événement</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition group"
              >
                {/* Cover Photo */}
                <div className="relative h-48 bg-gradient-to-br from-purple-400 to-pink-400">
                  {event.cover_photo && (
                    <img
                      src={getCoverPhotoUrl(event.cover_photo)}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex space-x-2">
                    {event.is_online && (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        En ligne
                      </span>
                    )}
                    {event.is_private && (
                      <span className="bg-gray-900 bg-opacity-70 text-white text-xs px-2 py-1 rounded-full font-medium">
                        🔒 Privé
                      </span>
                    )}
                  </div>
                  {event.is_full && (
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Complet
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-lg text-gray-900 group-hover:text-purple-600 transition flex-1">
                      {event.title}
                    </h3>
                    {event.my_status && getStatusBadge(event.my_status)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(event.start_time)}
                  </div>

                  {event.location && (
                    <div className="flex items-center text-sm text-gray-600 mb-3">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {event.location}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.going_count} {event.going_count > 1 ? 'participants' : 'participant'}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <img
                        src={event.creator.profile_photo || '/default-avatar.png'}
                        alt={event.creator.username}
                        className="w-6 h-6 rounded-full object-cover"
                        title={`Par ${event.creator.first_name} ${event.creator.last_name}`}
                      />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
