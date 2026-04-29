import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, updateDoc, limit } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { LogOut, User as UserIcon, Heart, MessageCircle, Edit2, Check, X, BadgeCheck, MapPin, Phone, Hash, FileText, Search as SearchIcon, AtSign as AtIcon, Bell } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { updateProfile } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, isAdmin, isBanned } = useAuth();
  const navigate = useNavigate();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [dbUser, setDbUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    rollNumber: '',
    phoneNumber: '',
    address: '',
    bio: '',
    photoURL: '',
    coverURL: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return;
      setLoading(true);
      try {
        const [postsSnaps, profileSnap] = await Promise.all([
           getDocs(query(
            collection(db, 'posts'),
            where('authorUid', '==', user.uid),
            orderBy('createdAt', 'desc')
          )),
          getDoc(doc(db, 'users', user.uid))
        ]);
        setUserPosts(postsSnaps.docs.map(d => ({ id: d.id, ...d.data() })));
        if (profileSnap.exists()) {
          const data = profileSnap.data();
          setDbUser(data);
          setEditForm({
            displayName: data.displayName || '',
            username: data.username || '',
            rollNumber: data.rollNumber || '',
            phoneNumber: data.phoneNumber || '',
            address: data.address || '',
            bio: data.bio || '',
            photoURL: data.photoURL || '',
            coverURL: data.coverURL || ''
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'user_data');
      } finally {
        setLoading(false);
      }
    }
    fetchUserData();
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!user || !editForm.displayName.trim()) return;
    setSaving(true);
    try {
      if (editForm.displayName !== user.displayName || editForm.photoURL !== user.photoURL) {
        await updateProfile(auth.currentUser!, { 
          displayName: editForm.displayName.trim(),
          photoURL: editForm.photoURL.trim()
        });
      }
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: editForm.displayName.trim(),
        username: editForm.username.trim(),
        rollNumber: editForm.rollNumber.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        address: editForm.address.trim(),
        bio: editForm.bio.trim(),
        photoURL: editForm.photoURL.trim(),
        coverURL: editForm.coverURL.trim()
      });
      setDbUser({ ...dbUser, ...editForm });
      toast.success('Profile updated!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // First try searching by rollNumber specifically if it looks like a number
      if (/^\d+$/.test(searchQuery)) {
        const qRoll = query(collection(db, 'users'), where('rollNumber', '==', searchQuery), limit(10));
        const snRoll = await getDocs(qRoll);
        if (snRoll.size > 0) {
          setSearchResults(snRoll.docs.map(d => ({ id: d.id, ...d.data() })));
          return;
        }
      }

      // Fallback to name/username search
      const q = query(
        collection(db, 'users'), 
        where('displayName', '>=', searchQuery),
        where('displayName', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const sn = await getDocs(q);
      let results = sn.docs.map(d => ({ id: d.id, ...d.data() }));

      // Include Official Admin in results if matches
      try {
        const adminSnap = await getDoc(doc(db, 'adminSettings', 'profile'));
        if (adminSnap.exists()) {
          const ad = adminSnap.data();
          if (
            ad.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            ad.username?.toLowerCase().includes(searchQuery.toLowerCase())
          ) {
            results = [{ id: 'admin', ...ad }, ...results];
          }
        }
      } catch (e) { /* Non-critical */ }

      // Client side filter refinement or second query for username
      if (results.length < 5) {
        const qUser = query(collection(db, 'users'), where('username', '==', searchQuery), limit(5));
        const snUser = await getDocs(qUser);
        const userResults = snUser.docs.map(d => ({ id: d.id, ...d.data() }));
        // Merge without duplicates
        results = [...results, ...userResults.filter(ur => !results.find(re => re.id === ur.id))];
      }

      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (!user) return null;
  if (loading) return <div className="py-20 text-center animate-pulse font-black uppercase text-slate-400">Loading your profile...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 py-10 px-4 animate-in fade-in duration-500">
      <Helmet>
        <title>{user.displayName} | My Account</title>
      </Helmet>

      <div className="grid lg:grid-cols-3 gap-10">
        {/* Left Column: Stats & Profile */}
        <div className="lg:col-span-1 space-y-8">
          <div className="glass-card relative overflow-hidden flex flex-col items-center text-center">
            <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 overflow-hidden">
               {dbUser?.coverURL ? (
                  <img src={dbUser.coverURL} alt="Cover" className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary-500/20 to-indigo-600/20"></div>
               )}
            </div>
            <div className="px-10 pb-10">
              <div className="w-32 h-32 rounded-3xl border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800 overflow-hidden -mt-16 mb-6 shadow-xl relative z-10 mx-auto">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-slate-400 text-3xl">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2 mb-1">
                 <h1 className="text-2xl font-black font-heading uppercase tracking-tight">{user.displayName}</h1>
                 {dbUser?.isVerified && <BadgeCheck className="w-5 h-5 text-blue-500" />}
              </div>
              <p className="text-slate-500 font-bold tracking-widest text-[10px] uppercase mb-4">@{dbUser?.username || 'njac_user'}</p>
              
              <div className="flex justify-center gap-8 mb-8">
                 <div className="text-center group">
                   <p className="text-xl font-black">{dbUser?.followersCount || 0}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary-500 transition-colors">Followers</p>
                 </div>
                 <div className="text-center group">
                   <p className="text-xl font-black">{dbUser?.followingCount || 0}</p>
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-primary-500 transition-colors">Following</p>
                 </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-3">
                <button onClick={() => setIsEditing(true)} className="col-span-2 py-3 bg-primary-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-primary-600 transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Edit Profile
                </button>
                <Link to="/inbox" className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-all">
                  <MessageCircle className="w-4 h-4" />
                  Inbox
                </Link>
                <Link to="/notices" className="py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-all">
                  <Bell className="w-4 h-4" />
                  Notices
                </Link>
                <button onClick={handleLogout} className="col-span-2 py-3 bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 rounded-xl font-bold uppercase tracking-widest text-xs border border-dashed border-slate-200 dark:border-slate-800 hover:border-red-500/50 hover:text-red-500 transition-all flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Logout Account
                </button>
              </div>
            </div>
          </div>

          {/* User Search Card */}
          <div className="glass-card p-6">
            <h3 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-4">Find Others</h3>
            <div className="flex gap-2 mb-4">
               <input 
                 type="text" 
                 placeholder="Search name..." 
                 className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-2 text-sm outline-none"
                 value={searchQuery}
                 onChange={e=>setSearchQuery(e.target.value)}
                 onKeyDown={e=>e.key === 'Enter' && handleSearch()}
               />
               <button onClick={handleSearch} className="p-2 bg-primary-500 text-white rounded-xl"><SearchIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
               {searchResults.map(res => (
                 <div key={res.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors group">
                    <Link to={`/user/${res.id}`} className="flex items-center gap-3 overflow-hidden">
                       <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden shrink-0">
                          {res.photoURL && <img src={res.photoURL} alt="" className="w-full h-full object-cover" />}
                       </div>
                       <div className="overflow-hidden">
                         <p className="text-xs font-bold uppercase truncate">{res.displayName}</p>
                         <p className="text-[9px] font-bold text-slate-400">@{res.username || 'user'}</p>
                       </div>
                    </Link>
                    {res.id !== user.uid && (
                      <Link to={`/chat/${res.id}`} className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
                        <MessageCircle className="w-4 h-4" />
                      </Link>
                    )}
                 </div>
               ))}
               {searchQuery && searchResults.length === 0 && !isSearching && <p className="text-[10px] text-center text-slate-400 uppercase font-bold">No results Found</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Content & Editing */}
        <div className="lg:col-span-2 space-y-10">
          {isEditing ? (
             <div className="glass-card p-8 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-8">
                   <h2 className="text-2xl font-black font-heading uppercase tracking-tight">Public Profile Settings</h2>
                   <button onClick={()=>setIsEditing(false)} className="text-slate-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                </div>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Profile Photo URL</label>
                      <input type="url" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.photoURL} onChange={e=>setEditForm({...editForm, photoURL: e.target.value})} placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Cover Photo URL</label>
                      <input type="url" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.coverURL} onChange={e=>setEditForm({...editForm, coverURL: e.target.value})} placeholder="https://..." />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                      <input type="text" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.displayName} onChange={e=>setEditForm({...editForm, displayName: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Username</label>
                      <div className="relative">
                        <AtIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input type="text" className="w-full p-4 pl-10 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.username} onChange={e=>setEditForm({...editForm, username: e.target.value})} />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Roll Number</label>
                      <input type="text" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.rollNumber} onChange={e=>setEditForm({...editForm, rollNumber: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                      <input type="text" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.phoneNumber} onChange={e=>setEditForm({...editForm, phoneNumber: e.target.value})} />
                   </div>
                </div>
                <div className="space-y-2 mb-6">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Address / Hometown</label>
                   <input type="text" className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium" value={editForm.address} onChange={e=>setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="space-y-2 mb-8">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Short Bio</label>
                   <textarea rows={3} className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 ring-primary-500/20 font-medium resize-none" value={editForm.bio} onChange={e=>setEditForm({...editForm, bio: e.target.value})} placeholder="Tell us something about yourself..." />
                </div>
                <div className="flex gap-4">
                   <button onClick={handleUpdateProfile} disabled={saving} className="flex-1 py-4 bg-primary-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary-500/20">
                     {saving ? 'Saving...' : 'Save Changes'}
                   </button>
                   <button onClick={()=>setIsEditing(false)} className="px-8 py-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold uppercase tracking-widest text-xs text-slate-500">Cancel</button>
                </div>
             </div>
          ) : (
            <>
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                 <h2 className="text-xl font-black font-heading uppercase tracking-tight mb-6">Detailed Bio Data</h2>
                 <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800 flex items-center justify-center text-primary-500 shrink-0"><AtIcon className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Username</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">@{dbUser?.username || 'Not set'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800 flex items-center justify-center text-primary-500 shrink-0"><Hash className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Roll Number</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{dbUser?.rollNumber || 'Not set'}</p>
                          </div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800 flex items-center justify-center text-primary-500 shrink-0"><Phone className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Phone Number</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{dbUser?.phoneNumber || 'Private'}</p>
                          </div>
                       </div>
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100/50 dark:bg-slate-800 flex items-center justify-center text-primary-500 shrink-0"><MapPin className="w-5 h-5" /></div>
                          <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Address</p>
                            <p className="font-bold text-slate-700 dark:text-slate-300">{dbUser?.address || 'Not set'}</p>
                          </div>
                       </div>
                    </div>
                 </div>
                 {dbUser?.bio && (
                   <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
                      <p className="font-serif italic text-lg text-slate-600 dark:text-slate-400 leading-relaxed">"{dbUser.bio}"</p>
                   </div>
                 )}
              </div>

              <div>
                <h3 className="text-2xl font-black font-heading uppercase mb-8 tracking-tight">Your Published Confessions</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {userPosts.map(post => (
                    <Link key={post.id} to={`/post/${post.slug || post.id}`} className="glass-card p-6 border-b-4 border-primary-500/0 hover:border-primary-500 transition-all group">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">{post.category}</span>
                        <div className="flex items-center gap-3 text-slate-400">
                          <div className="flex items-center gap-1"><Heart className="w-3 h-3" /><span className="text-[10px] font-bold">{post.likesCount || 0}</span></div>
                          <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /><span className="text-[10px] font-bold">{post.commentsCount || 0}</span></div>
                        </div>
                      </div>
                      <h4 className="font-bold uppercase tracking-tight mb-2 group-hover:text-primary-500 transition-colors">{post.title || 'Untitled Confession'}</h4>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{post.content}</p>
                    </Link>
                  ))}
                  {userPosts.length === 0 && (
                    <div className="md:col-span-2 p-12 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase tracking-widest text-xs italic">You haven't posted any confessions yet.</p>
                      <Link to="/submit" className="mt-4 inline-block text-primary-500 font-bold border-b-2 border-primary-500">Share something now</Link>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
