import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Heart, MessageCircle, Eye, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CategoryView() {
  const { slug } = useParams();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      if (!slug) return;
      try {
        setLoading(true);
        // capitalize slug for category search
        const titleCaseCategory = slug.charAt(0).toUpperCase() + slug.slice(1);
        
        const q = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          where('category', '==', titleCaseCategory),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, [slug]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { status });
      setPosts(posts.filter(p => id !== p.id));
      toast.success(`Post ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card p-8 text-center bg-gradient-to-br from-primary-50 to-rose-100 dark:from-slate-800 dark:to-slate-900">
        <h1 className="text-3xl font-heading font-bold capitalize mb-2">{slug} Confessions</h1>
        <p className="text-slate-500">Browse all confessions in the {slug} category.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 animate-pulse">Loading...</div>
      ) : posts.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No confessions in this category yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              onUpdateStatus={handleUpdateStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostCard({ post, onUpdateStatus, onDelete }: { post: any, key?: any, onUpdateStatus?: (id:string, status:string)=>void, onDelete?: (id:string)=>void }) {
  const totalReactions = Object.values(post.reactionCounts || {}).reduce((a: any, b: any) => a + b, 0) as number;
  const isAdminPost = post.nickname === 'NJAC ADMIN';
  const { isAdmin } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleAdminAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAdminMenu(false);
    if (action === 'delete') {
      if (onDelete && window.confirm('Delete this post?')) onDelete(post.id);
    } else if (action === 'reject') {
      if (onUpdateStatus && window.confirm('Reject this post?')) onUpdateStatus(post.id, 'rejected');
    }
  };

  return (
    <Link to={`/post/${post.id}`} className="block relative glass-card p-6 border-l-4 border-l-primary-500 hover:shadow-xl transition-all overflow-visible">
      <div className="flex justify-between items-start mb-3 relative z-20">
        {post.title ? (
          <h3 className="text-xl font-bold font-heading">{post.title}</h3>
        ) : (
          <div className="h-6"></div> /* spacer */
        )}
        
        <div className="flex items-center space-x-3 ml-4">
          <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
          </span>
          {isAdmin && (
            <div className="relative">
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdminMenu(!showAdminMenu); }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              {showAdminMenu && (
                <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                  <button onClick={(e) => handleAdminAction(e, 'reject')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600">Reject</button>
                  <button onClick={(e) => handleAdminAction(e, 'delete')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600">Delete</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden max-h-48 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <img src={post.imageUrl} alt="Confession context" className="w-full h-auto object-cover" loading="lazy" />
        </div>
      )}

      <p className="text-slate-800 font-medium dark:text-slate-200 line-clamp-2 mb-4">{post.content}</p>

      {isAdminPost && (
        <div className="flex items-center space-x-1.5 text-blue-500 font-bold text-sm mb-4">
           <span>NJAC ADMIN</span>
           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17l-4.17-4.17-1.42 1.41 5.59 5.59 12-12-1.41-1.41z"></path></svg>
        </div>
      )}

      <div className="flex items-center space-x-6 text-sm text-slate-700 font-bold dark:text-slate-400">
        <div className="flex items-center space-x-1.5"><Heart className="w-4 h-4 text-rose-500" /><span>{totalReactions}</span></div>
        <div className="flex items-center space-x-1.5"><Eye className="w-4 h-4" /><span>{post.viewsCount || 0}</span></div>
      </div>
    </Link>
  );
}
