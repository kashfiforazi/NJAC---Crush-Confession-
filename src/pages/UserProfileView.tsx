import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, setDoc, deleteDoc, serverTimestamp, increment, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { User as UserIcon, Heart, BadgeCheck, MessageCircle, Calendar, MapPin, Hash, Phone, FileText, Edit3 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function UserProfileView() {
  const { uid } = useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [followsLoading, setFollowsLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (!uid) return;
      try {
        setLoading(true);
        if (uid === 'admin') {
          const adminSnap = await getDoc(doc(db, 'adminSettings', 'profile'));
          if (adminSnap.exists()) {
             setProfile({ id: 'admin', ...adminSnap.data(), isAdmin: true, isVerified: true });
             // Admin doesn't have regular posts in 'posts' usually, but maybe they do.
             // For now we show no posts or maybe fetch by 'isAdmin' field
             const postsSnap = await getDocs(query(collection(db, 'posts'), where('isAdmin', '==', true), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(10)));
             setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        } else {
          const [userSnap, postsSnap] = await Promise.all([
            getDoc(doc(db, 'users', uid)),
            getDocs(query(collection(db, 'posts'), where('authorUid', '==', uid), where('status', '==', 'published'), orderBy('createdAt', 'desc')))
          ]);

          if (userSnap.exists()) {
            setProfile({ id: userSnap.id, ...userSnap.data() });
          }
          setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }

        if (user && uid !== user.uid) {
          const followSnap = await getDoc(doc(db, 'follows', `${user.uid}_${uid}`));
          setIsFollowing(followSnap.exists());

          const followsMeSnap = await getDoc(doc(db, 'follows', `${uid}_${user.uid}`));
          setFollowsMe(followsMeSnap.exists());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'user_profile');
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [uid, user]);

  const toggleFollow = async () => {
    if (!user) return toast.error('Please login to follow users');
    if (!profile || followsLoading) return;

    setFollowsLoading(true);
    const followId = `${user.uid}_${profile.id}`;
    try {
      if (isFollowing) {
        await deleteDoc(doc(db, 'follows', followId));
        if (profile.id === 'admin') {
          await updateDoc(doc(db, 'adminSettings', 'profile'), { followersCount: increment(-1) });
        } else {
          await updateDoc(doc(db, 'users', profile.id), { followersCount: increment(-1) });
        }
        if (user.uid) await updateDoc(doc(db, 'users', user.uid), { followingCount: increment(-1) });
        setIsFollowing(false);
        setProfile((p: any) => ({ ...p, followersCount: (p.followersCount || 1) - 1 }));
        toast.success('Unfollowed');
      } else {
        await setDoc(doc(db, 'follows', followId), {
          followerId: user.uid,
          followingId: profile.id,
          createdAt: serverTimestamp()
        });
        if (profile.id === 'admin') {
          await updateDoc(doc(db, 'adminSettings', 'profile'), { followersCount: increment(1) });
        } else {
          await updateDoc(doc(db, 'users', profile.id), { followersCount: increment(1) });
        }
        if (user.uid) await updateDoc(doc(db, 'users', user.uid), { followingCount: increment(1) });
        setIsFollowing(true);
        setProfile((p: any) => ({ ...p, followersCount: (p.followersCount || 0) + 1 }));
        toast.success('Following');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'follows');
    } finally {
      setFollowsLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading profile...</div>;
  if (!profile) return <div className="py-20 text-center text-xl">User not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-card overflow-hidden">
        <div className="h-48 bg-gradient-to-r from-primary-500 to-indigo-600 relative">
          {profile.coverURL && (
            <img src={profile.coverURL} alt="Cover" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="px-8 pb-8">
          <div className="relative -mt-20 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
             <div className="w-40 h-40 rounded-3xl border-8 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 overflow-hidden shadow-2xl shrink-0">
               {profile.photoURL ? (
                 <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                   <UserIcon className="w-16 h-16" />
                 </div>
               )}
             </div>
             <div className="flex-1 pb-4 text-center md:text-left">
               <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                 <h1 className="text-3xl font-black font-heading tracking-tight text-slate-900 dark:text-white uppercase">{profile.displayName}</h1>
                 {profile.isVerified && <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10" />}
                 {user && user.uid !== profile.id && isFollowing && followsMe && (
                   <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-tighter rounded ml-2 shadow-lg shadow-emerald-500/20">Friends</span>
                 )}
               </div>
               <p className="text-slate-500 font-bold tracking-widest text-xs uppercase mb-4">@{uid === 'admin' ? 'njac_official' : (profile.username || 'njac_user')}</p>
               
               <div className="flex flex-wrap justify-center md:justify-start gap-6">
                 <div className="text-center group cursor-pointer">
                   <p className="text-xl font-black text-slate-900 dark:text-white">{profile.followersCount || 0}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary-500">Followers</p>
                 </div>
                 <div className="text-center group cursor-pointer">
                   <p className="text-xl font-black text-slate-900 dark:text-white">{profile.followingCount || 0}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary-500">Following</p>
                 </div>
                 <div className="text-center">
                   <p className="text-xl font-black text-slate-900 dark:text-white">{posts.length}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Posts</p>
                 </div>
               </div>
             </div>
             <div className="pb-4 flex flex-col sm:flex-row gap-3">
               {user && user.uid !== (profile.id === 'admin' ? 'admin' : profile.id) ? (
                 <>
                   <button 
                    onClick={toggleFollow}
                    disabled={followsLoading}
                    className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg ${isFollowing ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 'bg-primary-500 text-white shadow-primary-500/20 hover:bg-primary-600 hover:-translate-y-0.5'}`}
                   >
                     {isFollowing ? 'Unfollow' : 'Follow User'}
                   </button>
                   <Link 
                    to={`/chat/${profile.id}`}
                    className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-xl"
                   >
                    <MessageCircle className="w-4 h-4" />
                    Message
                   </Link>
                 </>
               ) : user?.uid === profile.id && (
                 <div className="flex flex-wrap gap-3">
                   <Link to="/profile" className="px-8 py-3 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-primary-500" />
                      Edit Profile
                   </Link>
                   <Link to={`/chat/${profile.id}`} className="px-8 py-3 bg-primary-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all shadow-xl shadow-primary-500/20">
                     <MessageCircle className="w-4 h-4" />
                     Send Message
                   </Link>
                 </div>
               )}
             </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1 space-y-6">
               <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-slate-400 mb-4">About User</h3>
                  <div className="space-y-4">
                    {profile.bio && (
                       <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-4 italic">"{profile.bio}"</p>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                       <MapPin className="w-4 h-4 text-slate-400" />
                       <span className="font-bold text-slate-600 dark:text-slate-400 truncate">{profile.address || 'Location Unknown'}</span>
                    </div>
                    {profile.rollNumber && (
                      <div className="flex items-center gap-3 text-sm">
                         <Hash className="w-4 h-4 text-slate-400" />
                         <span className="font-bold text-slate-600 dark:text-slate-400">Roll: {profile.rollNumber}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                       <Calendar className="w-4 h-4 text-slate-400" />
                       <span className="font-bold text-slate-600 dark:text-slate-400">Joined {profile.createdAt?.toDate ? format(profile.createdAt.toDate(), 'MMMM yyyy') : 'Recently'}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="md:col-span-2">
               <h3 className="font-black font-heading uppercase text-xl mb-6 tracking-tight">Recent Confessions</h3>
               <div className="space-y-4">
                 {posts.length > 0 ? posts.map(post => (
                    <Link key={post.id} to={`/post/${post.slug || post.id}`} className="block p-6 glass-card hover:border-primary-500/50 transition-all group">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{post.category}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{post.createdAt?.toDate ? format(post.createdAt.toDate(), 'MMM d, yyyy') : ''}</span>
                       </div>
                       <h4 className="font-bold mb-2 group-hover:text-primary-500 transition-colors uppercase">{post.title || 'Untitled Confession'}</h4>
                       <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{post.content}</p>
                    </Link>
                 )) : (
                    <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                       <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                       <p className="font-bold uppercase tracking-widest text-xs">This user hasn't posted anything yet.</p>
                    </div>
                 )}
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
