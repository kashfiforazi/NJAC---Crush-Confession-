import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { Send, BadgeCheck, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

export default function Community() {
  const { user, isAdmin, isBanned } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [authorsInfo, setAuthorsInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'community_messages'), orderBy('createdAt', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);
      setLoading(false);

      // Fetch authors info
      const uids = new Set<string>();
      msgs.forEach((m: any) => { if (m.authorUid && !authorsInfo[m.authorUid]) uids.add(m.authorUid); });
      
      if (uids.size > 0) {
        const info = { ...authorsInfo };
        await Promise.all(Array.from(uids).map(async (uid) => {
          const snap = await getDoc(doc(db, 'users', uid));
          if (snap.exists()) info[uid] = snap.data();
        }));
        setAuthorsInfo(info);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;
    if (isBanned) return toast.error('You are banned from participating in the community chat.');

    try {
      await addDoc(collection(db, 'community_messages'), {
        authorUid: user.uid,
        content: newMessage.trim(),
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'community_messages');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!isAdmin) return;
    try {
      await deleteDoc(doc(db, 'community_messages', id));
      toast.success('Message deleted');
    } catch (err) {
       handleFirestoreError(err, OperationType.DELETE, `community_messages/${id}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-200px)] flex flex-col glass-card overflow-hidden">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black font-heading tracking-tight">COMMUNITY CHAT</h1>
          <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Connect with everyone in realtime</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase text-slate-400">Live</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
        {loading ? (
           <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
           </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-30">
            <Send className="w-12 h-12 mb-4" />
            <p className="font-bold uppercase tracking-widest">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.authorUid === user?.uid;
            const author = authorsInfo[msg.authorUid];
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <div className="flex items-center gap-2 mb-1 ml-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">
                        {author?.displayName || 'Unknown User'}
                      </span>
                      {author?.isVerified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                    {!isMe && author?.photoURL && (
                      <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                         <img src={author.photoURL} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className={`relative px-4 py-2 rounded-2xl text-sm font-medium ${isMe ? 'bg-primary-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-bl-none shadow-sm'}`}>
                      {msg.content}
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id)}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">
                    {msg.createdAt?.toDate ? formatDistanceToNow(msg.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder={user ? "Type your message..." : "Please log in to chat"}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-primary-500/20 transition-all font-medium text-sm"
            value={newMessage}
            disabled={!user || isBanned}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!user || !newMessage.trim() || isBanned}
            className="bg-primary-500 text-white p-3 rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-primary-500/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
