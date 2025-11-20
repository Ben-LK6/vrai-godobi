'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi, AiGeneration } from '@/lib/api';

export default function AiGalleryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<AiGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [styleFilter, setStyleFilter] = useState<string>('');

  const styles = [
    { value: '', label: '🌐 Tous les styles' },
    { value: 'photographic', label: '📸 Photographique' },
    { value: 'realistic', label: '🎨 Réaliste' },
    { value: 'anime', label: '🌸 Anime' },
    { value: 'cartoon', label: '🎭 Cartoon' },
    { value: 'artistic', label: '🖼️ Artistique' },
    { value: '3d-render', label: '🎮 3D Render' },
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadGallery();
    }
  }, [styleFilter]);

  const loadGallery = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await aiApi.getPublicGallery(token, {
        per_page: 50,
        style: styleFilter || undefined,
      });

      setGenerations(response.generations);
    } catch (error) {
      console.error('Erreur chargement galerie:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">⚙️</div>
          <p className="text-gray-600">Chargement de la galerie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🌟 Galerie Publique IA
          </h1>
          <p className="text-gray-600 mb-6">
            Découvrez les créations de la communauté GODOBI
          </p>

          {/* Filtres de style */}
          <div className="flex gap-2 flex-wrap mb-4">
            {styles.map((style) => (
              <button
                key={style.value}
                onClick={() => setStyleFilter(style.value)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  styleFilter === style.value
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/ai')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition"
            >
              ✨ Créer ma propre image
            </button>
            <button
              onClick={() => router.push('/ai/history')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition border border-gray-200"
            >
              📚 Mon historique
            </button>
          </div>
        </div>

        {/* Grid des images */}
        {generations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Aucune image publique pour le moment
            </h3>
            <p className="text-gray-500">
              Soyez le premier à partager vos créations !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group cursor-pointer"
                onClick={() => window.open(gen.image_url, '_blank')}
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={gen.image_url}
                    alt={gen.prompt}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />

                  {/* Overlay au hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center px-4">
                      <p className="text-sm line-clamp-3">{gen.prompt}</p>
                    </div>
                  </div>

                  {/* Style badge */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-white bg-opacity-90 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">
                      {gen.style}
                    </span>
                  </div>

                  {/* Dimensions badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      📐 {gen.width}×{gen.height}
                    </span>
                  </div>
                </div>

                {/* Infos créateur */}
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white font-bold text-sm">
                      {gen.user?.first_name?.[0]}{gen.user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">
                        {gen.user?.first_name} {gen.user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        @{gen.user?.username}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                    {gen.prompt}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span className="flex items-center gap-1">
                      ❤️ {gen.likes_count}
                    </span>
                    <span className="flex items-center gap-1">
                      ⬇️ {gen.downloads_count}
                    </span>
                    <span className="flex-1 text-right">
                      {new Date(gen.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to action */}
        <div className="mt-12 text-center bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            ✨ Envie de créer vos propres images ?
          </h2>
          <p className="text-gray-600 mb-6">
            Transformez vos idées en réalité avec notre générateur IA
          </p>
          <button
            onClick={() => router.push('/ai')}
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition shadow-lg"
          >
            🎨 Commencer à générer
          </button>
        </div>
      </div>
    </div>
  );
}
