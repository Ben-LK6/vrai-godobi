'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storiesApi, StoryGroup } from '@/lib/api';

export default function StoriesPage() {
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      const data = await storiesApi.getStories(token);
      setStoryGroups(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load stories');
      console.error('Failed to load stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryGroupClick = (group: StoryGroup) => {
    // Rediriger vers la vue détaillée des stories de cet utilisateur
    router.push(`/stories/view/${group.user_id}`);
  };

  const handleCreateStory = () => {
    router.push('/stories/create');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des stories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/feed')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Retour
            </button>
            <h1 className="text-xl font-bold">Stories</h1>
            <button
              onClick={handleCreateStory}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              + Créer
            </button>
          </div>
        </div>
      </div>

      {/* Stories horizontales (comme Instagram) */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {storyGroups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📷</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Aucune story disponible
            </h2>
            <p className="text-gray-600 mb-6">
              Soyez le premier à partager une story !
            </p>
            <button
              onClick={handleCreateStory}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Créer une story
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto pb-4">
            <div className="flex space-x-4">
              {storyGroups.map((group) => (
                <button
                  key={group.user_id}
                  onClick={() => handleStoryGroupClick(group)}
                  className="flex-shrink-0 text-center"
                >
                  <div
                    className={`relative w-20 h-20 rounded-full p-1 ${
                      group.has_unviewed
                        ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500'
                        : 'bg-gray-300'
                    }`}
                  >
                    <img
                      src={group.user.profile_photo || '/default-avatar.png'}
                      alt={group.user.username}
                      className="w-full h-full rounded-full object-cover bg-white"
                    />
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                      {group.stories.length}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-700 font-medium truncate w-20">
                    {group.user.first_name}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Liste détaillée des stories */}
        {storyGroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4">Toutes les stories</h2>
            <div className="space-y-4">
              {storyGroups.map((group) => (
                <div
                  key={group.user_id}
                  className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                  onClick={() => handleStoryGroupClick(group)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={group.user.profile_photo || '/default-avatar.png'}
                        alt={group.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold">
                          {group.user.first_name} {group.user.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {group.stories.length} story{group.stories.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    {group.has_unviewed && (
                      <span className="px-3 py-1 bg-blue-500 text-white text-xs rounded-full">
                        Nouveau
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
