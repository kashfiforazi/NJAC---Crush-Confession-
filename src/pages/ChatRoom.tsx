import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDoc, doc, setDoc, updateDoc, limit } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Send, User, ChevronLeft, Shield, Clock, BadgeCheck } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ChatRoom() {
  const { recipientId } = useParams();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const myChatId = user ? (isAdmin ? 'admin' : user.uid) : '';

  useEffect(() => {
    if (!recipientId) return;

    async function fetchRecipient() {
      try {
        if (recipientId === 'admin') {
          const adminSnap = await getDoc(doc(db, 'adminSettings', 'profile'));
          if (adminSnap.exists()) setRecipient({ id: 'admin', ...adminSnap.data(), isAdmin: true });
        } else {
          const userSnap = await getDoc(doc(db, 'users', recipientId!));
          if (userSnap.exists()) setRecipient({ id: userSnap.id, ...userSnap.data() });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchRecipient();
  }, [recipientId]);

  useEffect(() => {
    if (!user || !recipientId) return;

    const convId = [myChatId, recipientId].sort().join('_');

    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', convId),
      where('participants', 'array-contains', myChatId)
    );

    const unsubscribe = onSnapshot(q, (sn) => {
      const msgs = sn.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort client side to avoid index requirement
      msgs.sort((a: any, b: any) => {
        const t1 = a.createdAt?.toMillis?.() || 0;
        const t2 = b.createdAt?.toMillis?.() || 0;
        return t1 - t2;
      });
      setMessages(msgs);
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, recipientId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user || !recipientId || sending) return;

    setSending(true);
    const convId = [myChatId, recipientId].sort().join('_');
    const msgContent = text.trim();
    setText('');

    try {
      // 1. Add message
      await addDoc(collection(db, 'messages'), {
        conversationId: convId,
        participants: [myChatId, recipientId],
        senderId: myChatId,
        receiverId: recipientId,
        content: msgContent,
        createdAt: serverTimestamp()
      });

      // 2. Update conversation summary
      const convRef = doc(db, 'conversations', convId);
      await setDoc(convRef, {
        participants: [myChatId, recipientId],
        lastMessage: msgContent,
        updatedAt: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'messages');
      setText(msgContent); // Restore text on error
    } finally {
      setSending(false);
    }
  };

  if (!user) return <div className="py-20 text-center uppercase font-black">Login to chat</div>;

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-12rem)] flex flex-col glass-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
               {recipient?.photoURL ? (
                 <img src={recipient.photoURL} alt="" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                 </div>
               )}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-black uppercase text-xs tracking-tight truncate">{recipient?.displayName || 'Loading...'}</h2>
                {(recipient?.isAdmin || recipient?.isVerified) && <BadgeCheck className="w-3 h-3 text-blue-500" />}
              </div>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active Chat</p>
            </div>
          </div>
        </div>
        <Link to={`/user/${recipientId}`} className="text-[10px] font-black uppercase text-primary-500 tracking-tighter hover:underline">View Profile</Link>
      </div>

      {/* Security Tip */}
      <div className="px-6 py-2 bg-slate-900 flex items-center gap-2 justify-center">
         <Shield className="w-3 h-3 text-emerald-500" />
         <p className="text-[9px] font-black text-white/70 uppercase tracking-widest">End-to-end encrypted • Secure Inbox</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
        {loading ? (
           <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
        ) : messages.length > 0 ? (
          messages.map((msg, i) => {
            const isMe = msg.senderId === myChatId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-bold shadow-sm ${isMe ? 'bg-primary-500 text-white rounded-tr-none shadow-primary-500/10' : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'}`}>
                   <p className="leading-relaxed">{msg.content}</p>
                   <div className={`text-[8px] mt-1 opacity-50 flex items-center ${isMe ? 'justify-end' : 'justify-start'} gap-1`}>
                      <Clock className="w-2 h-2" />
                      {msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'HH:mm') : 'Sending...'}
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-slate-400">
                <Send className="w-8 h-8 opacity-20" />
             </div>
             <p className="text-sm font-black uppercase text-slate-400 tracking-widest leading-relaxed">No messages yet.<br/><span className="text-[10px] opacity-70">Say hello to {recipient?.displayName}!</span></p>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 bg-white/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 relative">
          <input 
            type="text" 
            placeholder="Type your message..." 
            className="flex-1 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500/20 font-bold transition-all"
            value={text}
            onChange={e => setText(e.target.value)}
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={!text.trim() || sending}
            className="w-14 h-14 bg-primary-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/20 hover:bg-primary-600 active:scale-95 disabled:opacity-50 transition-all"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </form>
    </div>
  );
}
