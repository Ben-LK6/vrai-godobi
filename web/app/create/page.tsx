'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import NavigationHeader from '@/components/NavigationHeader';

export default function CreatePage() {
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const createOptions = [
    {
      icon: String.fromCodePoint(0x1F3A8),
      title: 'Contenu IA',
      description: 'Generer des images avec IA',
      color: 'from-purple-500 to-pink-500',
      route: '/ai',
    },
    {
      icon: String.fromCodePoint(0x1F4DD),
      title: 'Post',
      description: 'Partager un texte, image ou video',
      color: 'from-blue-500 to-cyan-500',
      route: '/posts/create',
    },
    {
      icon: String.fromCodePoint(0x1F4F8),
      title: 'Story',
      description: 'Ajouter une story (24h)',
      color: 'from-orange-500 to-red-500',
      route: '/stories/create',
    },
    {
      icon: String.fromCodePoint(0x1F465),
      title: 'Groupe',
      description: 'Creer un nouveau groupe',
      color: 'from-green-500 to-emerald-500',
      route: '/groups/create',
    },
    {
      icon: String.fromCodePoint(0x1F4C5),
      title: 'Evenement',
      description: 'Organiser un evenement',
      color: 'from-indigo-500 to-purple-500',
      route: '/events/create',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-4">
            Que voulez-vous creer ?
          </h1>
          <p className="text-gray-600 text-lg">
            Choisissez le type de contenu que vous souhaitez partager
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {createOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => router.push(option.route)}
              className="group relative overflow-hidden bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 p-8"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

              <div className="relative">
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {option.icon}
                </div>

                <h3 className="text-2xl font-bold text-gray-800 mb-2">
                  {option.title}
                </h3>

                <p className="text-gray-600">
                  {option.description}
                </p>

                <div className="mt-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-2xl">{String.fromCodePoint(0x2192)}</span>
                </div>
              </div>

              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000" />
            </button>
          ))}
        </div>

        <div className="mt-16 bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
            <span>{String.fromCodePoint(0x1F4A1)}</span>
            <span>Conseils rapides</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-3xl">{String.fromCodePoint(0x1F3A8)}</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Contenu IA</h3>
                <p className="text-gray-600 text-sm">
                  Utilisez des prompts detailles pour de meilleurs resultats
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">{String.fromCodePoint(0x1F4DD)}</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Posts</h3>
                <p className="text-gray-600 text-sm">
                  Ajoutez des hashtags pour plus de visibilite
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">{String.fromCodePoint(0x1F4F8)}</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Stories</h3>
                <p className="text-gray-600 text-sm">
                  Partagez des moments ephemeres avec vos amis
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-3xl">{String.fromCodePoint(0x1F4C5)}</div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">Evenements</h3>
                <p className="text-gray-600 text-sm">
                  Planifiez et invitez vos amis facilement
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full font-semibold transition-colors"
          >
            {String.fromCodePoint(0x2190)} Retour
          </button>
        </div>
      </main>
    </div>
  );
}
