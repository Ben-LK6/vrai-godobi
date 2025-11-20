'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, type RegisterData } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: 'male',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 6;

  const handleNext = () => {
    setError('');
    
    // Validation par étape
    if (step === 1 && !formData.first_name) {
      setError('Veuillez entrer votre prénom');
      return;
    }
    if (step === 2 && !formData.last_name) {
      setError('Veuillez entrer votre nom');
      return;
    }
    if (step === 3 && !formData.username) {
      setError('Veuillez choisir un nom d\'utilisateur');
      return;
    }
    if (step === 4 && !formData.birth_date) {
      setError('Veuillez entrer votre date de naissance');
      return;
    }
    if (step === 5 && formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (step === 5 && formData.password !== formData.password_confirmation) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate birth_date format (YYYY-MM-DD)
      const birthDateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!birthDateRegex.test(formData.birth_date)) {
        setError('Format de date invalide. Veuillez réessayer.');
        setLoading(false);
        setStep(4); // Go back to birth date step
        return;
      }

      // Validate year is between 1900 and current year
      const year = parseInt(formData.birth_date.split('-')[0]);
      const currentYear = new Date().getFullYear();
      if (year < 1900 || year > currentYear) {
        setError('Année de naissance invalide. Veuillez entrer une date valide.');
        setLoading(false);
        setStep(4); // Go back to birth date step
        return;
      }

      const response = await api.register(formData);
      
      // Save token to localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step < totalSteps) {
      e.preventDefault();
      handleNext();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">GODOBI</h1>
          <p className="text-gray-600">Créer votre compte</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-purple-600">Étape {step} sur {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={step === totalSteps ? handleSubmit : (e) => { e.preventDefault(); handleNext(); }}>
          {/* Step 1: First Name */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quel est votre prénom ?</h2>
                <p className="text-gray-600 text-sm">C'est comme ça que vos amis vous connaîtront</p>
              </div>
              <input
                type="text"
                name="first_name"
                required
                autoFocus
                value={formData.first_name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Prénom"
              />
            </div>
          )}

          {/* Step 2: Last Name */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Et votre nom ?</h2>
                <p className="text-gray-600 text-sm">Pour compléter votre identité</p>
              </div>
              <input
                type="text"
                name="last_name"
                required
                autoFocus
                value={formData.last_name}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Nom"
              />
            </div>
          )}

          {/* Step 3: Username */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Choisissez un nom d'utilisateur</h2>
                <p className="text-gray-600 text-sm">C'est unique et les autres pourront vous trouver avec</p>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-gray-400 text-lg">@</span>
                <input
                  type="text"
                  name="username"
                  required
                  autoFocus
                  value={formData.username}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  placeholder="nomutilisateur"
                />
              </div>
              <p className="text-xs text-gray-500">Vous pourrez ajouter un email ou téléphone plus tard (optionnel)</p>
            </div>
          )}

          {/* Step 4: Birth Date & Gender */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quelle est votre date de naissance ?</h2>
                <p className="text-gray-600 text-sm">Pour vérifier que vous avez l'âge requis</p>
              </div>
              <input
                type="date"
                name="birth_date"
                required
                autoFocus
                value={formData.birth_date}
                onChange={handleChange}
                min="1900-01-01"
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              />
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Genre</label>
                <select
                  name="gender"
                  required
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                  <option value="prefer_not_to_say">Préfère ne pas dire</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 5: Password */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Créez un mot de passe</h2>
                <p className="text-gray-600 text-sm">Il doit contenir au moins 8 caractères</p>
              </div>
              <input
                type="password"
                name="password"
                required
                autoFocus
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Mot de passe"
              />
              <input
                type="password"
                name="password_confirmation"
                required
                minLength={8}
                value={formData.password_confirmation}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Confirmez le mot de passe"
              />
            </div>
          )}

          {/* Step 6: Review */}
          {step === 6 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Vérifiez vos informations</h2>
                <p className="text-gray-600 text-sm">Tout est correct ?</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom complet:</span>
                  <span className="font-semibold">{formData.first_name} {formData.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nom d'utilisateur:</span>
                  <span className="font-semibold">@{formData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date de naissance:</span>
                  <span className="font-semibold">{new Date(formData.birth_date).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Genre:</span>
                  <span className="font-semibold capitalize">
                    {formData.gender === 'male' ? 'Homme' : 
                     formData.gender === 'female' ? 'Femme' : 
                     formData.gender === 'other' ? 'Autre' : 'Préfère ne pas dire'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center mt-4">
                En cliquant sur S'inscrire, vous acceptez nos conditions et notre politique de confidentialité
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Retour
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : step === totalSteps ? "S'inscrire" : 'Continuer'}
            </button>
          </div>
        </form>

        <p className="text-center mt-6 text-gray-600">
          Vous avez déjà un compte?{' '}
          <Link href="/login" className="text-purple-600 font-semibold hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
