'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { storiesApi, StoryGroup, Story, StoryViewer } from '@/lib/api';

export default function ViewStoryPage() {
  const params = useParams();
  const userId = parseInt(params.userId as string);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<StoryViewer[]>([]);
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
      const data = await storiesApi.getStories(token);
      setStoryGroups(data);

      // Trouver l'index du groupe de l'utilisateur
      const index = data.findIndex((g) => g.user_id === userId);
      if (index !== -1) {
        setCurrentGroupIndex(index);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to load stories:', err);
      setLoading(false);
    }
  };

  const loadViewers = async (storyId: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const data = await storiesApi.getStoryViewers(token, storyId);
      setViewers(data);
      setShowViewers(true);
    } catch (err) {
      console.error('Failed to load viewers:', err);
    }
  };

  const handleNext = () => {
    const currentGroup = storyGroups[currentGroupIndex];
    if (!currentGroup) return;

    // Si ce n'est pas la dernière story du groupe actuel
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    }
    // Sinon, passer au groupe suivant
    else if (currentGroupIndex < storyGroups.length - 1) {
      setCurrentGroupIndex(currentGroupIndex + 1);
      setCurrentStoryIndex(0);
    }
    // Sinon, retourner à la liste
    else {
      router.push('/stories');
    }
  };

  const handlePrevious = () => {
    // Si ce n'est pas la première story du groupe actuel
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    }
    // Sinon, passer au groupe précédent
    else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(currentGroupIndex - 1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setCurrentStoryIndex(prevGroup.stories.length - 1);
    }
  };

  const handleDelete = async (storyId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette story ?')) {
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await storiesApi.deleteStory(token, storyId);
      // Recharger les stories
      await loadStories();
      // Si c'était la dernière story, retourner à la liste
      const currentGroup = storyGroups[currentGroupIndex];
      if (currentGroup.stories.length === 1) {
        router.push('/stories');
      }
    } catch (err) {
      console.error('Failed to delete story:', err);
      alert('Impossible de supprimer la story');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (storyGroups.length === 0) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="mb-4">Aucune story disponible</p>
          <button
            onClick={() => router.push('/stories')}
            className="px-6 py-2 bg-white text-black rounded-lg"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const currentGroup = storyGroups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isMyStory = currentGroup?.user_id === currentUser.id;

  if (!currentStory) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Barres de progression */}
      <div className="absolute top-0 left-0 right-0 z-20 flex space-x-1 p-2">
        {currentGroup.stories.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-white bg-opacity-30 rounded-full overflow-hidden"
          >
            <div
              className={`h-full bg-white transition-all duration-300 ${
                index < currentStoryIndex
                  ? 'w-full'
                  : index === currentStoryIndex
                  ? 'w-full'
                  : 'w-0'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-4 left-0 right-0 z-20 px-4">
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <img
              src={currentGroup.user.profile_photo || '/default-avatar.png'}
              alt={currentGroup.user.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-white"
            />
            <div>
              <p className="font-semibold">
                {currentGroup.user.first_name} {currentGroup.user.last_name}
              </p>
              <p className="text-xs text-gray-300">
                {new Date(currentStory.created_at).toLocaleString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isMyStory && (
              <>
                <button
                  onClick={() => loadViewers(currentStory.id)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  👁️ {currentStory.views_count}
                </button>
                <button
                  onClick={() => handleDelete(currentStory.id)}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full"
                >
                  🗑️
                </button>
              </>
            )}
            <button
              onClick={() => router.push('/stories')}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Contenu de la story */}
      <div className="h-screen flex items-center justify-center">
        {currentStory.media_type === 'image' ? (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="max-h-screen max-w-full object-contain"
          />
        ) : (
          <video
            src={currentStory.media_url}
            autoPlay
            loop
            className="max-h-screen max-w-full object-contain"
          />
        )}

        {/* Légende */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-0 right-0 px-6">
            <p className="text-white text-center bg-black bg-opacity-50 p-4 rounded-lg">
              {currentStory.caption}
            </p>
          </div>
        )}
      </div>

      {/* Zones de navigation (gauche/droite) */}
      <button
        onClick={handlePrevious}
        className="absolute left-0 top-0 bottom-0 w-1/3 cursor-pointer"
        style={{ background: 'transparent' }}
      />
      <button
        onClick={handleNext}
        className="absolute right-0 top-0 bottom-0 w-1/3 cursor-pointer"
        style={{ background: 'transparent' }}
      />

      {/* Modal des viewers */}
      {showViewers && (
        <div className="absolute inset-0 bg-black bg-opacity-75 z-30 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                Vues ({viewers.length})
              </h3>
              <button
                onClick={() => setShowViewers(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {viewers.map((viewer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={viewer.user.profile_photo || '/default-avatar.png'}
                      alt={viewer.user.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold">
                        {viewer.user.first_name} {viewer.user.last_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        @{viewer.user.username}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(viewer.viewed_at).toLocaleString('fr-FR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
