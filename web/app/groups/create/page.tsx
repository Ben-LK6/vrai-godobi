'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { groupsApi, api, type User } from '@/lib/api';

export default function CreateGroupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await api.getFollowing(token);
      // Vérifier si c'est un tableau ou un objet avec data
      const friendsList = Array.isArray(response) ? response : (response.data || []);
      setFriends(friendsList);
    } catch (error) {
      console.error('Failed to load friends:', error);
      setFriends([]);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleMember = (userId: number) => {
    setSelectedMembers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Veuillez entrer un nom de groupe');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('is_private', isPrivate ? '1' : '0');
      if (photo) {
        formData.append('photo', photo);
      }
      selectedMembers.forEach(userId => {
        formData.append('member_ids[]', userId.toString());
      });

      const group = await groupsApi.createGroup(token, formData);
      router.push(`/groups/${group.id}`);
    } catch (error) {
      console.error('Failed to create group:', error);
      alert('Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = Array.isArray(friends) ? friends.filter(friend =>
    `${friend.first_name} ${friend.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Créer un groupe</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Group preview"
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                )}
                <span className="text-sm text-purple-600 mt-2 font-medium">Ajouter une photo</span>
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom du groupe *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Équipe de foot, Famille..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre groupe..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Groupe privé</div>
              <div className="text-sm text-gray-500">Seuls les membres peuvent voir le groupe</div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                isPrivate ? 'bg-purple-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  isPrivate ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Members Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ajouter des membres ({selectedMembers.length} sélectionné{selectedMembers.length > 1 ? 's' : ''})
            </label>
            
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un ami..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Friends List */}
            <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
              {filteredFriends.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami à ajouter'}
                </div>
              ) : (
                filteredFriends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleMember(friend.id)}
                    className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0 ${
                      selectedMembers.includes(friend.id) ? 'bg-purple-50' : ''
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
                    {selectedMembers.includes(friend.id) && (
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'Création...' : 'Créer le groupe'}
          </button>
        </form>
      </div>
    </div>
  );
}
