import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NoticeBar() {
  const [notices, setNotices] = useState<any[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'notices'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      console.error("Notice fetch error:", error);
    });

    return () => unsubscribe();
  }, []);

  if (!visible || notices.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary-600 via-primary-500 to-orange-500 text-white py-2.5 px-4 sticky top-0 z-[60] shadow-md border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex items-center gap-2 shrink-0 mr-4 bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
          <Megaphone className="w-3.5 h-3.5 animate-pulse" />
          <span>Notice</span>
        </div>
        
        <div className="flex-1 relative h-6 overflow-hidden">
          <div className="absolute whitespace-nowrap animate-marquee flex items-center gap-12">
            {notices.map((notice) => (
              <span key={notice.id} className="text-sm font-bold tracking-wide">
                {notice.content}
              </span>
            ))}
            {notices.map((notice) => (
              <span key={`dup-${notice.id}`} className="text-sm font-bold tracking-wide">
                {notice.content}
              </span>
            ))}
          </div>
        </div>

        <button 
          onClick={() => setVisible(false)} 
          className="ml-4 p-1 hover:bg-white/20 rounded-full transition-colors shrink-0"
          title="Close notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
