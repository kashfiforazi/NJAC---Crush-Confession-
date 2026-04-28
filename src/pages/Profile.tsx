import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { LogOut, User as UserIcon, Heart, MessageCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Profile() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(
          collection(db, 'posts'),
          where('authorUid', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const snaps = await getDocs(q);
        setUserPosts(snaps.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Helmet>
        <title>Your Profile | NJAC</title>
      </Helmet>
      
      <div className="glass-card p-8 rounded-3xl mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 overflow-hidden shadow-lg border-4 border-white dark:border-slate-800">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'Profile'} className="w-full h-full object-cover" />
          ) : (
            <UserIcon className="w-10 h-10" />
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-2xl font-bold font-heading">{user.displayName || 'Anonymous User'}</h1>
          <p className="text-slate-500">{user.email}</p>
          <div className="mt-4 flex flex-wrap gap-3 justify-center md:justify-start">
            {isAdmin && (
              <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-bold uppercase tracking-wide">
                Admin
              </span>
            )}
            <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-bold uppercase tracking-wide">
              {userPosts.length} Posts
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={handleLogout} className="flex items-center gap-2 px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold font-heading mb-6 border-b border-slate-200 dark:border-slate-800 pb-2">Your Submissions</h2>
        {loading ? (
          <div className="text-center py-10 animate-pulse text-slate-500">Loading your posts...</div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl text-slate-500">
            You haven't posted any confessions yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userPosts.map(post => (
              <div key={post.id} className="glass-card p-6 rounded-2xl relative">
                <span className={`absolute top-4 right-4 px-2 py-0.5 text-xs font-bold uppercase rounded ${
                  post.status === 'published' ? 'bg-green-100 text-green-700' :
                  post.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {post.status}
                </span>
                <p className="mt-4 text-slate-800 dark:text-slate-200 line-clamp-3">{post.content}</p>
                <div className="mt-4 flex gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1"><Heart className="w-4 h-4" /> {post.likesCount || 0}</div>
                  <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /> {post.commentsCount || 0}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
