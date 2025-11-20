import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="text-center px-4">
        <h1 className="text-6xl md:text-8xl font-bold text-white mb-6 drop-shadow-2xl">
          GODOBI
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto">
          Le réseau social créatif avec IA intégrée 🎨✨
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-xl"
          >
            Créer un compte
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-purple-800/30 text-white rounded-full font-bold text-lg hover:bg-purple-800/50 transition-all transform hover:scale-105 border-2 border-white/30 backdrop-blur-sm"
          >
            Se connecter
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="font-bold text-lg mb-2">Génération IA</h3>
            <p className="text-white/80 text-sm">Créez des images uniques avec l'intelligence artificielle</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="font-bold text-lg mb-2">Jeux multijoueurs</h3>
            <p className="text-white/80 text-sm">Défiez vos amis dans des jeux passionnants</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-white">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-bold text-lg mb-2">Mode Ultra-Léger</h3>
            <p className="text-white/80 text-sm">Optimisé pour les connexions lentes</p>
          </div>
        </div>
      </div>
    </div>
  );
}
