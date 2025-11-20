'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Post } from '@/lib/api';
import NavigationHeader from '@/components/NavigationHeader';

type SafePost = Post & {
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  is_liked?: boolean;
  user?: {
    first_name?: string;
    last_name?: string;
    username?: string;
  };
};

type Comment = {
  id: number;
  content: string;
  user: {
    id: number;
    first_name: string;
    last_name: string;
    username: string;
  };
  created_at: string;
};

export default function FeedPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<SafePost[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [commentPostId, setCommentPostId] = useState<number | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Charger user et feed au montage (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    try {
      setCurrentUser(JSON.parse(userStr));
    } catch {
      router.push('/login');
      return;
    }

    const loadFeed = async () => {
      try {
        const response = await api.getFeed(token);
        console.log('Feed response:', response); // Debug
        // Laravel wraps response in { success: true, data: PaginatedData }
        // PaginatedData = { data: Post[], current_page, ... }
        const paginatedData = (response as any).data || response;
        const feedData = paginatedData.data || paginatedData;
        setPosts(Array.isArray(feedData) ? feedData : []);
        setCurrentIndex(0);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Impossible de charger le feed';
        setError(message);
        console.error('Feed load error:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadNotificationCount = async () => {
      try {
        const response = await api.getNotificationsUnreadCount(token);
        setNotificationCount(response.count || 0);
      } catch (err) {
        console.error('Failed to load notification count:', err);
      }
    };

    loadFeed();
    loadNotificationCount();
  }, [router]);

  const handleLogout = useCallback(() => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  }, [router]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(i => (i > 0 ? i - 1 : i));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(i => (i < posts.length - 1 ? i + 1 : i));
  }, [posts.length]);

  const goToIndex = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const keyHandler = useCallback(
    (e: KeyboardEvent) => {
      if (showComments) return;
      if (e.key === 'ArrowLeft') goToPrevious();
      else if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'Escape') setError('');
    },
    [showComments, goToPrevious, goToNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', keyHandler);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [keyHandler]);

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (diff > 60) goToPrevious();
    else if (diff < -60) goToNext();
    setTouchStartX(null);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Date invalide';
    }
  };

  const handleLike = async (postId: number) => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (!token) return;

    const previousState = posts;

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              is_liked: !p.is_liked,
              likes_count: p.is_liked
                ? Math.max((p.likes_count || 1) - 1, 0)
                : (p.likes_count || 0) + 1
            }
          : p
      )
    );

    try {
      await api.togglePostLike(token, postId);
    } catch (err) {
      console.error('Like error:', err);
      setPosts(previousState);
    }
  };

  const loadComments = async (postId: number, signal?: AbortSignal) => {
    if (typeof window === 'undefined') return;
    
    try {
      setCommentsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No token');

      const data = await api.getComments(token, postId);
      
      if (!signal?.aborted) {
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error loading comments:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setCommentsLoading(false);
      }
    }
  };

  const openComments = async (postId: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setCommentPostId(postId);
    setShowComments(true);
    setComments([]);

    await loadComments(postId, abortControllerRef.current.signal);
  };

  const closeComments = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setShowComments(false);
    setCommentPostId(null);
    setComments([]);
    setNewComment('');
  }, []);

  useEffect(() => {
    if (showComments && modalRef.current) {
      const firstInput = modalRef.current.querySelector('input');
      firstInput?.focus();
    }
  }, [showComments]);

  const handlePostComment = async () => {
    if (typeof window === 'undefined') return;
    
    const trimmedComment = newComment.trim();
    
    if (!trimmedComment || !commentPostId || postingComment) return;
    if (trimmedComment.length > 1000) {
      alert('Commentaire trop long (max 1000 caractères)');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const optimisticComment: Comment = {
      id: Date.now(),
      content: trimmedComment,
      user: {
        id: currentUser?.id || 0,
        first_name: currentUser?.first_name || 'Vous',
        last_name: currentUser?.last_name || '',
        username: currentUser?.username || 'you'
      },
      created_at: new Date().toISOString()
    };

    const previousComments = comments;
    const previousPosts = posts;

    setComments(prev => [...prev, optimisticComment]);
    setNewComment('');
    setPostingComment(true);

    setPosts(prev =>
      prev.map(p =>
        p.id === commentPostId
          ? { ...p, comments_count: (p.comments_count || 0) + 1 }
          : p
      )
    );

    try {
      const result = await api.createComment(token, commentPostId, { content: trimmedComment });

      if (result?.comment) {
        setComments(prev =>
          prev.map(c => (c.id === optimisticComment.id ? result.comment : c))
        );
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      } else {
        throw new Error('Invalid comment response');
      }
    } catch (err) {
      console.error('Error posting comment:', err);
      setComments(previousComments);
      setPosts(previousPosts);
      alert('Erreur lors de l\'ajout du commentaire. Réessayez.');
    } finally {
      setPostingComment(false);
    }
  };

  const handleShare = async (post: SafePost) => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const url = `${window.location.origin}/post/${post.id}`;
      
      if (navigator.share) {
        await navigator.share({
          title: `Post de ${post.user?.first_name || 'Utilisateur'}`,
          text: post.content?.substring(0, 100) || '',
          url
        });
        
        setPosts(prev =>
          prev.map(p =>
            p.id === post.id
              ? { ...p, shares_count: (p.shares_count || 0) + 1 }
              : p
          )
        );
      } else {
        await navigator.clipboard.writeText(url);
        alert('Lien copié dans le presse-papier');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Share error:', err);
      }
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient-x">
        <div className="text-center text-white">
          <div className="relative">
            <div className="animate-spin h-20 w-20 border-4 border-white/30 border-t-white rounded-full mx-auto" />
            <div className="absolute inset-0 animate-ping h-20 w-20 border-4 border-white/20 rounded-full mx-auto" />
          </div>
          <p className="mt-6 text-xl font-semibold animate-pulse">Chargement du feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-pink-600 text-white">
        <div className="text-center max-w-md mx-auto p-8 backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl border border-white/20">
          <div className="text-7xl mb-6 animate-bounce">⚠️</div>
          <h2 className="text-3xl font-bold mb-3">Oups !</h2>
          <p className="text-white/90 mb-8 text-lg">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-8 py-4 bg-white text-red-600 rounded-full font-bold hover:bg-red-50 transition-all transform hover:scale-105 active:scale-95 shadow-xl"
          >
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient-x">
        <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />
        <div className="flex items-center justify-center h-[calc(100vh-80px)] px-4">
          <div className="text-center text-white backdrop-blur-xl bg-white/10 rounded-3xl p-12 shadow-2xl border border-white/20 max-w-md">
            <div className="text-8xl mb-6 animate-bounce">📭</div>
            <h2 className="text-3xl font-bold mb-4">Feed vide</h2>
            <p className="text-white/90 mb-8 text-lg">Soyez le premier à partager votre créativité !</p>
            <button
              onClick={() => router.push('/ai')}
              className="px-10 py-4 bg-white text-purple-600 rounded-full font-bold hover:bg-purple-50 transition-all transform hover:scale-105 active:scale-95 shadow-2xl"
            >
              ✨ Créer du contenu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const post = posts[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === posts.length - 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 animate-gradient-x">
      <NavigationHeader notificationCount={notificationCount} onLogout={handleLogout} />
      
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 py-6 gap-6">
        {/* Carte post avec hauteur fixe optimale */}
        <div
          className="relative w-full max-w-md h-[600px] backdrop-blur-2xl bg-white/95 rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-white/20 transition-all duration-300"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* En-tête utilisateur avec dégradé premium */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 p-4 text-white flex-shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center font-bold text-lg shadow-lg border-2 border-white/30">
                {post.user?.first_name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base truncate drop-shadow-lg">
                    {post.user?.first_name} {post.user?.last_name}
                  </span>
                  <span className="text-xl shrink-0 drop-shadow-lg" title={post.visibility}>
                    {post.visibility === 'public' ? '🌍' : post.visibility === 'friends' ? '👥' : '🔒'}
                  </span>
                </div>
                <p className="text-xs text-white/90 truncate">@{post.user?.username}</p>
              </div>
            </div>
            <p className="text-xs text-white/80 mt-2">{formatDate(post.created_at)}</p>
          </div>

          {/* Contenu avec hauteur fixe et scrollbar stylisée */}
          <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-transparent hover:scrollbar-thumb-purple-500 min-h-0">
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>

            {/* Affichage de l'image générée par IA */}
            {post.image_url && (
              <div className="mt-4 rounded-2xl overflow-hidden shadow-xl">
                <img 
                  src={post.image_url} 
                  alt={post.ai_prompt || 'Image générée par IA'}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}
            
            {post.is_ai_generated && (
              <div className="mt-4 p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow">
                <span className="text-2xl animate-pulse" role="img" aria-label="IA">🤖</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-purple-900">Généré par IA</p>
                  {post.ai_prompt && (
                    <p className="text-xs text-purple-700 mt-1 line-clamp-2" title={post.ai_prompt}>
                      &quot;{post.ai_prompt}&quot;
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Actions avec effets glassmorphism */}
          <div className="p-4 backdrop-blur-xl bg-gradient-to-t from-white via-white to-white/90 border-t border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-around gap-2">
              <button
                onClick={() => handleLike(post.id)}
                className={`group flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg ${
                  post.is_liked 
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-red-200' 
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-red-50 hover:to-pink-50'
                }`}
                aria-label={post.is_liked ? 'Retirer le like' : 'Aimer'}
              >
                <span className={`text-lg ${post.is_liked ? 'animate-pulse' : 'group-hover:scale-125 transition-transform'}`}>
                  {post.is_liked ? '❤️' : '🤍'}
                </span>
                <span>{post.likes_count || 0}</span>
              </button>
              
              <button
                onClick={() => openComments(post.id)}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700 text-sm font-bold hover:from-blue-200 hover:to-purple-200 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
                aria-label="Voir les commentaires"
              >
                <span className="text-lg group-hover:scale-125 transition-transform">💬</span>
                <span>{post.comments_count || 0}</span>
              </button>
              
              <button
                onClick={() => handleShare(post)}
                disabled={isSharing}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-green-100 to-emerald-100 text-gray-700 text-sm font-bold hover:from-green-200 hover:to-emerald-200 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                aria-label="Partager"
              >
                <span className={`text-lg ${isSharing ? 'animate-spin' : 'group-hover:scale-125 transition-transform'}`}>
                  {isSharing ? '⏳' : '🔄'}
                </span>
                <span>{post.shares_count || 0}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Gros boutons de navigation */}
        <div className="flex gap-4 w-full max-w-md">
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className={`flex-1 py-6 rounded-3xl font-bold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
              currentIndex === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
            }`}
            aria-label="Post précédent"
          >
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl">←</span>
              <span>Précédent</span>
            </div>
          </button>

          <button
            onClick={goToNext}
            disabled={currentIndex === posts.length - 1}
            className={`flex-1 py-6 rounded-3xl font-bold text-xl transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
              currentIndex === posts.length - 1
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
            }`}
            aria-label="Post suivant"
          >
            <div className="flex items-center justify-center gap-3">
              <span>Suivant</span>
              <span className="text-3xl">→</span>
            </div>
          </button>
        </div>

        {/* Indicateur position */}
        <div className="text-white text-lg font-bold backdrop-blur-xl bg-white/20 px-6 py-3 rounded-full shadow-lg border border-white/30">
          {currentIndex + 1} / {posts.length}
        </div>
      </div>

      {/* Modal commentaires premium */}
      {showComments && commentPostId != null && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={closeComments}
          role="dialog"
          aria-modal="true"
          aria-labelledby="comments-title"
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[85vh] border-2 border-purple-200 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b-2 border-purple-100 flex-shrink-0 bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 id="comments-title" className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                💬 Commentaires
              </h2>
              <button
                onClick={closeComments}
                className="w-10 h-10 rounded-full hover:bg-red-100 flex items-center justify-center transition-all text-2xl text-gray-600 hover:text-red-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
              {commentsLoading ? (
                <div className="text-center py-16">
                  <div className="relative">
                    <div className="animate-spin h-12 w-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto" />
                    <div className="absolute inset-0 animate-ping h-12 w-12 border-4 border-purple-100 rounded-full mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500 mt-4">Chargement...</p>
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="font-bold text-lg">Aucun commentaire</p>
                </div>
              ) : (
                <>
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 p-3 rounded-2xl hover:bg-purple-50">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center font-bold text-white text-sm">
                        {comment.user.first_name[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-sm">
                            {comment.user.first_name} {comment.user.last_name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={commentsEndRef} />
                </>
              )}
            </div>

            <div className="p-5 border-t-2 border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handlePostComment()}
                  placeholder="Ajouter un commentaire..."
                  maxLength={1000}
                  className="flex-1 px-5 py-3 border-2 border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  disabled={postingComment}
                />
                <button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || postingComment}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
                >
                  {postingComment ? '⏳' : '📤'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 15s ease infinite;
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thumb-purple-400::-webkit-scrollbar-thumb {
          background: rgb(192 132 252);
          border-radius: 9999px;
        }
      `}</style>
    </div>
  );
}