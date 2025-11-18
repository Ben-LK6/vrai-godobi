#!/bin/bash

# Script de setup rapide pour GODOBI Backend (Laravel)

echo "🚀 Setup GODOBI Backend..."

# Vérifier si composer est installé
if ! command -v composer &> /dev/null; then
    echo "❌ Composer n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si PHP est installé
if ! command -v php &> /dev/null; then
    echo "❌ PHP n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Composer et PHP détectés"

# Installer Laravel
echo "📦 Installation de Laravel 11..."
cd backend || exit
composer create-project --prefer-dist laravel/laravel . "11.*"

# Copier le .env.example personnalisé
echo "⚙️ Configuration de l'environnement..."
cp ../.env.example .env

# Générer la clé d'application
php artisan key:generate

# Installer les dépendances supplémentaires
echo "📦 Installation des packages supplémentaires..."
composer require laravel/sanctum
composer require pusher/pusher-php-server
composer require intervention/image
composer require predis/predis

# Publier les configurations
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# Créer le fichier de migration de base
echo "🗄️ Préparation de la base de données..."
echo "⚠️ N'oubliez pas de configurer MySQL dans le .env"
echo "⚠️ Puis lancez: php artisan migrate"

echo ""
echo "✅ Backend Laravel installé avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Configurez votre base de données MySQL dans backend/.env"
echo "2. Lancez: cd backend && php artisan migrate"
echo "3. Lancez le serveur: php artisan serve"
echo ""
