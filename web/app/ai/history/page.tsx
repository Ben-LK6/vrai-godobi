'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi, AiGeneration } from '@/lib/api';

export default function AiHistoryPage() {
  const router = useRouter();
  const [generations, setGenerations] = useState<AiGeneration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed' | 'generating'>('all');
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadGenerations();
    }
  }, [filter]);

  const loadGenerations = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await aiApi.getGenerations(token, {
        status: filter,
        per_page: 50,
      });

      setGenerations(response.generations);
      setCredits(response.credits_remaining);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await aiApi.toggleFavorite(token, id);
      
      // Mettre à jour localement
      setGenerations(prev => prev.map(gen => 
        gen.id === id ? { ...gen, is_favorite: !gen.is_favorite } : gen
      ));
    } catch (error) {
      console.error('Erreur toggle favori:', error);
    }
  };

  const deleteGeneration = async (id: number) => {
    if (!confirm('Supprimer cette génération ?')) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await aiApi.deleteGeneration(token, id);
      setGenerations(prev => prev.filter(gen => gen.id !== id));
      alert('✅ Génération supprimée');
    } catch (error) {
      console.error('Erreur suppression:', error);
      alert('❌ Erreur lors de la suppression');
    }
  };

  const createVariation = async (id: number) => {
    const variationPrompt = prompt('Modifier le prompt (optionnel):');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await aiApi.createVariation(token, id, {
        variation_prompt: variationPrompt || undefined,
      });

      alert('✨ Variation créée ! Rechargement...');
      loadGenerations();
    } catch (error: any) {
      console.error('Erreur variation:', error);
      alert(error.message || '❌ Erreur lors de la variation');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      completed: { color: 'bg-green-100 text-green-700', icon: '✅', label: 'Complété' },
      generating: { color: 'bg-blue-100 text-blue-700', icon: '⚙️', label: 'En cours' },
      failed: { color: 'bg-red-100 text-red-700', icon: '❌', label: 'Échoué' },
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: '⏳', label: 'En attente' },
    };

    const badge = badges[status as keyof typeof badges] || badges.pending;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <span>{badge.icon}</span>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-spin mb-4">⚙️</div>
          <p className="text-gray-600">Chargement de l&apos;historique...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">📚 Mon Historique IA</h1>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow">
              <span className="text-xl">⚡</span>
              <span className="font-bold text-purple-600">{credits}</span>
              <span className="text-gray-600 text-sm">crédits</span>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex gap-2 flex-wrap">
            {[
              { value: 'all', label: '🌐 Toutes', count: generations.length },
              { value: 'completed', label: '✅ Complétées', count: 0 },
              { value: 'generating', label: '⚙️ En cours', count: 0 },
              { value: 'failed', label: '❌ Échouées', count: 0 },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value as any)}
                className={`px-4 py-2 rounded-full font-medium transition ${
                  filter === f.value
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => router.push('/ai')}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition"
            >
              ✨ Nouvelle génération
            </button>
            <button
              onClick={() => router.push('/ai/gallery')}
              className="px-4 py-2 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition border border-gray-200"
            >
              🌟 Galerie publique
            </button>
          </div>
        </div>

        {/* Grid des générations */}
        {generations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-bold text-gray-700 mb-2">
              Aucune génération pour le moment
            </h3>
            <p className="text-gray-500 mb-6">
              Créez votre première image avec l&apos;IA !
            </p>
            <button
              onClick={() => router.push('/ai')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transition"
            >
              ✨ Commencer à générer
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {generations.map((gen) => (
              <div
                key={gen.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition group"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  {gen.status === 'completed' ? (
                    <img
                      src={gen.image_url}
                      alt={gen.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-4xl animate-spin">⚙️</div>
                    </div>
                  )}

                  {/* Badge favori */}
                  <button
                    onClick={() => toggleFavorite(gen.id)}
                    className={`absolute top-3 right-3 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-xl transition ${
                      gen.is_favorite
                        ? 'bg-yellow-400 hover:bg-yellow-500'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    {gen.is_favorite ? '⭐' : '☆'}
                  </button>

                  {/* Status badge */}
                  <div className="absolute bottom-3 left-3">
                    {getStatusBadge(gen.status)}
                  </div>

                  {/* Time badge */}
                  {gen.generation_time && (
                    <div className="absolute bottom-3 right-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {gen.generation_time}
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">
                    {gen.prompt}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {gen.style}
                    </span>
                    <span>📐 {gen.width}×{gen.height}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(gen.image_url, '_blank')}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                      disabled={gen.status !== 'completed'}
                    >
                      👁️ Voir
                    </button>
                    <button
                      onClick={() => createVariation(gen.id)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition"
                      disabled={gen.status !== 'completed'}
                      title="Créer une variation"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => deleteGeneration(gen.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Métadonnées */}
                  <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
                    {new Date(gen.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
