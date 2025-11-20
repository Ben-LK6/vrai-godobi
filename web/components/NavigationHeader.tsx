'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface NavigationHeaderProps {
  notificationCount: number;
  onLogout: () => void;
}

export default function NavigationHeader({ notificationCount, onLogout }: NavigationHeaderProps) {
  const router = useRouter();

  const handleCreateAction = () => {
    console.log('✨ Navigation vers /create - timestamp:', Date.now());
    router.push('/create');
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/feed" className="text-2xl font-bold hover:text-purple-200 transition-colors cursor-pointer">
            🌟 GODOBI
          </Link>
          <Link href="/messages" className="text-white hover:text-purple-200 transition-colors">
            💬 Messages
          </Link>
          <Link href="/calls" className="text-white hover:text-purple-200 transition-colors">
            📞 Appels
          </Link>
          <Link href="/groups" className="text-white hover:text-purple-200 transition-colors">
            👥 Groupes
          </Link>
          <Link href="/events" className="text-white hover:text-purple-200 transition-colors">
            📅 Événements
          </Link>
          <Link href="/friends" className="text-white hover:text-purple-200 transition-colors">
            🤝 Amis
          </Link>
          <Link href="/notifications" className="relative text-white hover:text-purple-200 transition-colors">
            🔔 Notifications
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </Link>
          <Link href="/dashboard" className="text-white hover:text-purple-200 transition-colors">
            👤 Profil
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleCreateAction}
            className="px-6 py-2 bg-white text-purple-600 rounded-full hover:bg-purple-100 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            ✨ Créer
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="text-white hover:text-red-300 transition-colors"
            title="Se déconnecter"
          >
            🚪
          </button>
        </div>
      </div>
    </nav>
  );
}
