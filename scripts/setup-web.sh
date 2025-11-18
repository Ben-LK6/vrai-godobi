#!/bin/bash

# Script de setup rapide pour GODOBI Web (Next.js)

echo "🌐 Setup GODOBI Web..."

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Node.js détecté"
echo "Version: $(node -v)"

# Aller dans le dossier web et installer les dépendances
echo "📦 Installation des dépendances..."
cd web || exit
npm install

# Créer la structure de dossiers
echo "📁 Création de la structure de dossiers..."
mkdir -p app/\(auth\)/login
mkdir -p app/\(auth\)/register
mkdir -p app/\(main\)
mkdir -p app/api
mkdir -p components/Feed
mkdir -p components/Post
mkdir -p components/Editor
mkdir -p components/Games
mkdir -p components/UI
mkdir -p lib
mkdir -p store/slices
mkdir -p styles
mkdir -p public/images

# Créer le fichier de configuration
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_WS_URL=ws://localhost:6001
NEXT_PUBLIC_APP_NAME=GODOBI
EOF

# Créer le fichier globals.css
cat > styles/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-rgb: 255, 255, 255;
}

@media (prefers-color-scheme: dark) {
  :root {
    --foreground-rgb: 255, 255, 255;
    --background-rgb: 15, 23, 42;
  }
}

body {
  color: rgb(var(--foreground-rgb));
  background: rgb(var(--background-rgb));
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
EOF

# Créer postcss.config.js
cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

echo ""
echo "✅ Application web configurée avec succès!"
echo ""
echo "📝 Prochaines étapes:"
echo "1. Lancez: cd web && npm run dev"
echo "2. Ouvrez http://localhost:3000 dans votre navigateur"
echo ""
