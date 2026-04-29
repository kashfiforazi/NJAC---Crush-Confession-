import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { MessageCircle, Search, User, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Inbox() {
  const { user, isAdmin } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) return;

    // Use my real UID and also 'admin' if I am an admin
    const myIds = [user.uid];
    if (isAdmin) myIds.push('admin');

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains-any', myIds)
    );

    const unsubscribe = onSnapshot(q, async (sn) => {
      const convs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort client side
      convs.sort((a: any, b: any) => {
        const t1 = a.updatedAt?.toMillis?.() || 0;
        const t2 = b.updatedAt?.toMillis?.() || 0;
        return t2 - t1;
      });
      
      // Fetch details of other participants
      const convsWithDetails = await Promise.all(convs.map(async (c: any) => {
        // Find the "other" participant. If I'm an admin, I might be either 'admin' or my real UID.
        // We want to find the ID that's NOT one of mine.
        const otherId = c.participants.find((p: string) => !myIds.includes(p));
        if (!otherId) return { ...c, otherId: c.participants.find((p: string) => p !== user.uid) || 'unknown' };
        
        let otherProfile: any = null;
        if (otherId === 'admin') {
           const adminSnap = await getDoc(doc(db, 'adminSettings', 'profile'));
           if (adminSnap.exists()) otherProfile = adminSnap.data();
        } else {
           const userSnap = await getDoc(doc(db, 'users', otherId));
           if (userSnap.exists()) otherProfile = userSnap.data();
        }
        
        return { ...c, otherProfile, otherId };
      }));

      setConversations(convsWithDetails);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'conversations');
    });

    return () => unsubscribe();
  }, [user]);

  const filteredConvs = conversations.filter(c => 
    c.otherProfile?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.otherProfile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">Messages</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Chat history disappears after 24 hours</p>
        </div>
        <div className="w-12 h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary-500/20">
           <MessageCircle className="w-6 h-6" />
        </div>
      </div>

      <div className="glass-card p-4 flex items-center gap-4 mb-6">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search conversations..." 
          className="flex-1 bg-transparent outline-none font-bold text-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-6 animate-pulse flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-2">
                 <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                 <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              </div>
            </div>
          ))
        ) : filteredConvs.length > 0 ? (
          filteredConvs.map(conv => (
            <Link key={conv.id} to={`/chat/${conv.otherId}`} className="block glass-card p-5 hover:border-primary-500/50 transition-all active:scale-[0.98] group">
              <div className="flex gap-4">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 overflow-hidden relative">
                  {conv.otherProfile?.photoURL ? (
                    <img src={conv.otherProfile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                    </div>
                  )}
                  {conv.otherId === 'admin' && (
                    <div className="absolute top-0 right-0 p-1 bg-primary-500 rounded-bl-lg">
                       <MessageCircle className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-black uppercase text-sm tracking-tight truncate group-hover:text-primary-500 transition-colors">
                      {conv.otherProfile?.displayName || 'Anonymous'}
                    </h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1">
                       <Clock className="w-3 h-3" />
                       {conv.updatedAt?.toDate ? formatDistanceToNow(conv.updatedAt.toDate(), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs font-medium truncate mb-2">{conv.lastMessage}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="py-20 text-center glass-card border-dashed">
            <MessageCircle className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No active chats found</p>
            <p className="text-[10px] text-slate-400 mt-2">Start a conversation from someone's profile!</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-slate-900 text-white rounded-2xl flex items-center gap-4">
         <Clock className="w-6 h-6 text-primary-400 shrink-0" />
         <p className="text-[10px] font-bold uppercase tracking-[0.15em] leading-relaxed">
           Security Note: All messages are automatically purged from our servers 24 hours after being sent. Your privacy is our priority.
         </p>
      </div>
    </div>
  );
}
