'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User } from '@/lib/api';
import NavigationHeader from '@/components/NavigationHeader';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    setLoading(false);
    loadNotificationCount();
  }, [router]);

  const loadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await api.getNotificationsUnreadCount(token);
      setNotificationCount(response.count);
    } catch (error) {
      console.error('Error loading notification count:', error);
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await api.logout(token);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getLevelColor = (level: string) => {
    const colors = {
      bronze: 'bg-amber-700',
      silver: 'bg-gray-400',
      gold: 'bg-yellow-500',
      platinum: 'bg-cyan-400',
      diamond: 'bg-blue-500',
      legend: 'bg-purple-600',
    };
    return colors[level as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-lg p-8 text-white mb-8">
          <h2 className="text-3xl font-bold mb-2">
            Bienvenue, {user.first_name} {user.last_name}! 👋
          </h2>
          <p className="text-purple-100">@{user.username}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Level Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Niveau</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">{user.level || 'bronze'}</p>
              </div>
              <div className={`w-16 h-16 ${getLevelColor(user.level || 'bronze')} rounded-full flex items-center justify-center text-white text-2xl font-bold`}>
                {(user.level || 'bronze')[0].toUpperCase()}
              </div>
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Points XP</p>
                <p className="text-2xl font-bold text-gray-900">{user.xp_points}</p>
              </div>
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                ⚡
              </div>
            </div>
          </div>

          {/* AI Credits Card */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Crédits IA</p>
                <p className="text-2xl font-bold text-gray-900">{user.ai_credits}</p>
              </div>
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                🤖
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Informations du profil</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Nom d'utilisateur</p>
              <p className="text-lg text-gray-900">@{user.username}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Email</p>
              <p className="text-lg text-gray-900">{user.email || 'Non renseigné'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Téléphone</p>
              <p className="text-lg text-gray-900">{user.phone || 'Non renseigné'}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Âge</p>
              <p className="text-lg text-gray-900">{user.age} ans</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Genre</p>
              <p className="text-lg text-gray-900 capitalize">
                {user.gender === 'male' ? 'Homme' : 
                 user.gender === 'female' ? 'Femme' : 
                 user.gender === 'other' ? 'Autre' : 'Préfère ne pas dire'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Compte créé le</p>
              <p className="text-lg text-gray-900">
                {new Date(user.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Compte actif</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Actif' : 'Inactif'}
              </span>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Mode ultra-léger</p>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
                user.ultra_light_mode ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.ultra_light_mode ? 'Activé' : 'Désactivé'}
              </span>
            </div>
          </div>

          {user.bio && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-gray-600 mb-1">Bio</p>
              <p className="text-lg text-gray-900">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Feature Coming Soon */}
        <div className="mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-8 text-center">
          <p className="text-2xl font-bold text-gray-900 mb-2">🚀 Plus de fonctionnalités à venir!</p>
          <p className="text-gray-600">Posts, Stories, Messagerie, Jeux multijoueurs, Génération IA...</p>
        </div>
      </main>
    </div>
  );
}
