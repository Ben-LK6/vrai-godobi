'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { storiesApi } from '@/lib/api';

export default function CreateStoryPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      setError('Type de fichier non supporté. Utilisez JPG, PNG, GIF, MP4 ou MOV.');
      return;
    }

    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Le fichier est trop volumineux. Maximum 10MB.');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Créer une URL de prévisualisation
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await storiesApi.createStory(token, selectedFile, caption || undefined);

      // Rediriger vers la page des stories
      router.push('/stories');
    } catch (err: any) {
      setError(err.message || 'Failed to create story');
      console.error('Failed to create story:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    router.push('/stories');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-900"
              disabled={loading}
            >
              ✕ Annuler
            </button>
            <h1 className="text-xl font-bold">Créer une Story</h1>
            <button
              onClick={handleSubmit}
              disabled={!selectedFile || loading}
              className={`px-4 py-2 rounded-lg font-semibold ${
                selectedFile && !loading
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {/* Zone de sélection de fichier */}
          {!previewUrl ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                id="media-input"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="media-input"
                className="cursor-pointer"
              >
                <div className="text-6xl mb-4">📷</div>
                <p className="text-xl font-semibold text-gray-900 mb-2">
                  Ajouter une photo ou vidéo
                </p>
                <p className="text-gray-600 mb-4">
                  JPG, PNG, GIF, MP4 ou MOV (max 10MB)
                </p>
                <span className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 inline-block">
                  Parcourir
                </span>
              </label>
            </div>
          ) : (
            <div>
              {/* Prévisualisation */}
              <div className="mb-6">
                <div className="relative bg-black rounded-lg overflow-hidden max-h-[500px] flex items-center justify-center">
                  {selectedFile?.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  ) : (
                    <video
                      src={previewUrl}
                      controls
                      className="max-w-full max-h-[500px] object-contain"
                    />
                  )}
                  
                  {/* Bouton pour changer de fichier */}
                  <button
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Légende */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ajouter une légende (optionnel)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Écrivez quelque chose..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {caption.length}/500
                </p>
              </div>

              {/* Info */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  ⏱️ Votre story sera visible pendant 24 heures
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
