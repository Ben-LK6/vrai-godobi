'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { aiApi } from '@/lib/api';

export default function AiCreativePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [dimension, setDimension] = useState('512x512');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  const [credits, setCredits] = useState(0);
  const [error, setError] = useState('');
  
  // 🆕 Nouveaux states
  const [isPublishing, setIsPublishing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [imageAppeared, setImageAppeared] = useState(false);

  const styles = [
    { id: 'photographic', name: 'Photo', icon: '📷' },
    { id: 'anime', name: 'Anime', icon: '🎌' },
    { id: 'cartoon', name: 'Dessin', icon: '🎨' },
    { id: 'artistic', name: 'Art', icon: '🖼️' },
    { id: 'realistic', name: 'Pro', icon: '📸' },
    { id: '3d-render', name: '3D', icon: '🎮' },
  ];

  const dimensions = [
    { id: '512x512', name: 'S', size: '512px', icon: '▪️', width: 512, height: 512 },
    { id: '768x768', name: 'M', size: '768px', icon: '◾', width: 768, height: 768 },
    { id: '1024x1024', name: 'L', size: '1024px', icon: '⬛', width: 1024, height: 1024 },
    { id: '1536x1536', name: 'XL', size: '1536px', icon: '🔲', width: 1536, height: 1536 },
  ];

  // 🆕 Suggestions de prompts IA
  const promptSuggestions = [
    "Un chat astronaute explorant l'espace",
    "Paysage futuriste avec gratte-ciels lumineux",
    "Portrait d'un robot avec des émotions humaines",
    "Forêt enchantée avec des créatures magiques",
    "Ville steampunk dans les nuages",
    "Dragon majestueux survolant des montagnes",
    "Sous-marin explorant les profondeurs océaniques",
    "Jardin japonais au coucher du soleil",
  ];

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadCredits();
  }, [router]);

  const loadCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const stats = await aiApi.getUserStats(token);
      setCredits(stats.credits_remaining || 0);
    } catch (err) {
      console.error('Erreur chargement crédits:', err);
    }
  };

  // 🆕 Fonction de génération avec retry et cache
  const handleGenerate = async (isRetry = false) => {
    if (!prompt.trim()) {
      setError('Veuillez entrer une description');
      return;
    }

    if (credits < 1) {
      setError('Crédits insuffisants');
      return;
    }

    // 📦 Vérifier le cache local (mode Ultra-Léger)
    const cacheKey = `ai_gen_${prompt.trim()}_${style}_${dimension}`;
    const cached = localStorage.getItem(cacheKey);
    
    if (cached && !isRetry) {
      try {
        const cachedData = JSON.parse(cached);
        setGeneratedImage(cachedData);
        setImageAppeared(true);
        setError('✨ Image chargée depuis le cache (0 crédit)');
        setTimeout(() => setError(''), 3000);
        return;
      } catch {
        // Cache corrompu, continuer la génération
      }
    }

    setIsGenerating(true);
    setError('');
    setImageAppeared(false);

    const maxRetries = 3;
    const currentRetry = isRetry ? retryCount + 1 : 0;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Non authentifié');
        setIsGenerating(false);
        return;
      }

      // Trouver les dimensions width/height
      const selectedDim = dimensions.find(d => d.id === dimension);
      const width = selectedDim?.width || 512;
      const height = selectedDim?.height || 512;

      const result = await aiApi.generateImage(token, {
        prompt: prompt.trim(),
        style,
        width,
        height,
        is_public: true,
      });

      setGeneratedImage(result.generation);
      setCredits(result.credits_remaining || 0);
      setRetryCount(0);
      
      // ✨ Animation d'apparition
      setTimeout(() => setImageAppeared(true), 100);

      // 📦 Sauvegarder dans le cache (mode Ultra-Léger)
      try {
        localStorage.setItem(cacheKey, JSON.stringify(result.generation));
      } catch (e) {
        console.warn('Cache local plein, nettoyage nécessaire');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur génération';
      
      // 🔄 Système de retry (mode Ultra-Léger)
      if (currentRetry < maxRetries) {
        setError(`Tentative ${currentRetry + 1}/${maxRetries}... Nouvelle tentative dans 2s`);
        setRetryCount(currentRetry);
        
        setTimeout(() => {
          handleGenerate(true);
        }, 2000);
      } else {
        setError(errorMessage);
        setRetryCount(0);
      }
    } finally {
      if (currentRetry >= maxRetries || !isRetry) {
        setIsGenerating(false);
      }
    }
  };

  // 🆕 Fonction pour publier sur le feed
  const handlePublishToFeed = async () => {
    if (!generatedImage) return;

    setIsPublishing(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Non authentifié');
        setIsPublishing(false);
        return;
      }

      const formData = new FormData();
      
      // ✅ Utiliser directement l'URL de l'image IA (pas besoin de la télécharger)
      formData.append('image_url', generatedImage.image_url);
      formData.append('content', `🎨 Créé avec l'IA : "${prompt}"`);
      formData.append('type', 'image'); // ✅ Type requis par Laravel
      formData.append('visibility', 'public');
      formData.append('is_ai_generated', '1'); // Boolean en string
      formData.append('ai_prompt', prompt);

      // ✅ Utilisation correcte de l'API URL avec Accept header
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';
      
      const result = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json', // Force Laravel à répondre en JSON
          // Ne pas mettre Content-Type avec FormData, le navigateur le gère
        },
        body: formData,
      });

      if (!result.ok) {
        const errorData = await result.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || `Erreur ${result.status}`);
      }

      // ✅ Si le statut HTTP est OK (200-299), c'est un succès
      setError('✅ Publié sur le feed avec succès !');
      setTimeout(() => {
        router.push('/feed');
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Erreur lors de la publication';
      console.error('Publish error:', err);
      setError(`❌ ${errorMsg}`);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Carte principale */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">🎨 IA Créative</h1>
              <p className="text-purple-200">Créez des images uniques avec l'IA</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-2xl">
              <div className="text-white text-sm font-medium">Crédits</div>
              <div className="text-white text-2xl font-bold">{credits}</div>
            </div>
          </div>

          {/* Layout 2 colonnes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Colonne gauche - Contrôles */}
            <div className="space-y-6">
              {/* Prompt */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-white text-sm font-medium">
                    📝 Description
                  </label>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-purple-300 hover:text-white text-xs transition-colors"
                  >
                    {showSuggestions ? '✕ Fermer' : '💡 Suggestions'}
                  </button>
                </div>
                
                {showSuggestions && (
                  <div className="mb-3 space-y-2">
                    <p className="text-purple-300 text-xs">Cliquez sur une suggestion :</p>
                    <div className="flex flex-wrap gap-2">
                      {promptSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setPrompt(suggestion);
                            setShowSuggestions(false);
                          }}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Décrivez l'image que vous voulez créer..."
                  className="w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Styles */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">
                  🎨 Style
                </label>
                <div className="grid grid-cols-6 gap-2">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        style === s.id
                          ? 'bg-purple-500 scale-110 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-white text-xs font-medium">{s.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimensions */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">
                  📐 Taille
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {dimensions.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDimension(d.id)}
                      className={`p-3 rounded-xl transition-all duration-200 ${
                        dimension === d.id
                          ? 'bg-purple-500 scale-110 shadow-lg'
                          : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">{d.icon}</div>
                      <div className="text-white text-xs font-bold">{d.name}</div>
                      <div className="text-purple-200 text-xs">{d.size}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bouton générer */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || !prompt.trim() || credits < 1}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Génération...
                  </>
                ) : (
                  <>
                    ✨ Générer l&apos;image
                  </>
                )}
              </button>

              {/* 🆕 Bouton publier sur le feed */}
              {generatedImage && (
                <button
                  onClick={handlePublishToFeed}
                  disabled={isPublishing}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-6 rounded-2xl hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Publication...
                    </>
                  ) : (
                    <>
                      📤 Publier sur le feed
                    </>
                  )}
                </button>
              )}

              {/* Erreur */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-red-200 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Colonne droite - Aperçu */}
            <div>
              <label className="block text-white text-sm font-medium mb-3">
                🖼️ Aperçu
              </label>
              <div className="bg-white/5 border-2 border-white/20 border-dashed rounded-2xl p-4 aspect-square flex items-center justify-center">
                {generatedImage ? (
                  <div className={`relative w-full h-full group transition-all duration-500 ${
                    imageAppeared ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                  }`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedImage.image_url}
                      alt={generatedImage.prompt}
                      className="w-full h-full object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <a
                        href={generatedImage.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-white text-purple-900 px-6 py-3 rounded-xl font-bold hover:bg-purple-100 transition-colors"
                      >
                        🔍 Voir en grand
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <div className="text-purple-300 text-sm">
                      Votre image apparaîtra ici
                    </div>
                  </div>
                )}
              </div>

              {/* Infos image */}
              {generatedImage && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-purple-200 text-sm">
                    <span>⏱️</span>
                    <span>{new Date(generatedImage.created_at).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200 text-sm">
                    <span>📐</span>
                    <span>{generatedImage.width}x{generatedImage.height}</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-200 text-sm">
                    <span>🎨</span>
                    <span className="capitalize">{generatedImage.style.replace('-', ' ')}</span>
                  </div>
                  {generatedImage.generation_time && (
                    <div className="flex items-center gap-2 text-purple-200 text-sm">
                      <span>⚡</span>
                      <span>{generatedImage.generation_time}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation bas */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <button
            onClick={() => router.push('/ai/history')}
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-2xl p-4 text-white transition-all duration-200 border border-white/20"
          >
            <div className="text-2xl mb-2">📜</div>
            <div className="font-bold">Historique</div>
          </button>

          <button
            onClick={() => router.push('/ai/gallery')}
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-2xl p-4 text-white transition-all duration-200 border border-white/20"
          >
            <div className="text-2xl mb-2">🖼️</div>
            <div className="font-bold">Galerie</div>
          </button>

          <button
            onClick={() => router.push('/feed')}
            className="bg-white/10 backdrop-blur-lg hover:bg-white/20 rounded-2xl p-4 text-white transition-all duration-200 border border-white/20"
          >
            <div className="text-2xl mb-2">🏠</div>
            <div className="font-bold">Retour Feed</div>
          </button>
        </div>
      </div>
    </div>
  );
}
