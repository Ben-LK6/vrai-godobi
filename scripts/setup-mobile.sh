#!/bin/bash

# Script de setup rapide pour GODOBI Mobile (React Native + Expo)

echo "📱 Setup GODOBI Mobile..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    echo "❌ npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Node.js et npm détectés"
echo "Version Node: $(node -v)"
echo "Version npm: $(npm -v)"

# Installer Expo CLI globalement
echo "📦 Installation de Expo CLI..."
npm install -g expo-cli

# Aller dans le dossier mobile et installer les dépendances
echo "📦 Installation des dépendances..."
cd mobile || exit
npm install

# Créer les dossiers nécessaires
echo "📁 Création de la structure de dossiers..."
mkdir -p assets/images
mkdir -p assets/fonts
mkdir -p components/cards
mkdir -p components/editors
mkdir -p components/games
mkdir -p components/ui
mkdir -p services
mkdir -p store/slices
mkdir -p utils
mkdir -p constants

# Créer un fichier de configuration API
cat > constants/Config.ts << 'EOF'
export const Config = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:6001',
  AI_CREDITS_FREE: 3,
  AI_CREDITS_PREMIUM: 10,
  ULTRA_LIGHT_MODE: {
    COMPRESSION_QUALITY: 30,
    MAX_DIMENSION: 800,
    CACHE_SIZE_MB: 50,
  },
  NORMAL_MODE: {
    COMPRESSION_QUALITY: 85,
    MAX_DIMENSION: 1920,
    CACHE_SIZE_MB: 200,
  },
};
EOF

echo ""
echo "✅ Application mobile configurée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Configurez votre API_URL dans mobile/.env"
echo "2. Lancez: cd mobile && npx expo start"
echo "3. Scannez le QR code avec Expo Go sur votre téléphone"
echo ""
