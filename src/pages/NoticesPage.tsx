import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Bell, Calendar, ChevronRight, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'notices');
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
     <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Syncing Announcements...</p>
     </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-16 px-4">
      <Helmet>
        <title>Notices | NJAC - Official Portal</title>
      </Helmet>
      
      <div className="flex flex-col items-center text-center mb-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary-500/5 blur-[100px] rounded-full pointer-events-none -z-10"></div>
        <motion.div 
            initial={{ scale: 0 }} 
            animate={{ scale: 1 }} 
            className="w-20 h-20 bg-gradient-to-br from-primary-400 to-orange-500 text-white rounded-[2rem] shadow-2xl shadow-primary-500/30 flex items-center justify-center mb-8 rotate-12"
        >
           <Bell className="w-10 h-10" />
        </motion.div>
        <h1 className="text-4xl md:text-7xl font-black font-heading tracking-tight uppercase leading-none">
            The <span className="text-primary-500">Notice</span> <br className="hidden md:block" /> Board
        </h1>
        <div className="w-24 h-1.5 bg-primary-500 rounded-full mt-6 mb-4"></div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Official updates from the NJAC Admin Team</p>
      </div>

      <div className="relative space-y-8">
        {/* Timeline Path */}
        <div className="absolute left-[30px] md:left-1/2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 -z-10"></div>

        {notices.map((notice, index) => (
          <motion.div 
            key={notice.id}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            className={`flex flex-col md:flex-row items-center gap-8 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
          >
            <div className={`flex-1 w-full ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
               <div className="inline-block px-4 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                 <Calendar className="w-3 h-3 inline mr-1 -mt-0.5" />
                 {notice.createdAt?.toDate ? formatDistanceToNow(notice.createdAt.toDate(), { addSuffix: true }) : 'Active'}
               </div>
            </div>

            <div className="relative z-10 w-16 h-16 flex items-center justify-center">
               <div className="absolute inset-0 bg-white dark:bg-slate-900 border-2 border-primary-500 rounded-2xl rotate-45 group-hover:rotate-90 transition-transform"></div>
               <span className="relative font-black text-primary-500">{index + 1}</span>
            </div>

            <div className={`flex-1 w-full`}>
               <div className="glass-card p-8 border-b-8 border-primary-500/10 hover:border-primary-500 transition-all hover:shadow-2xl hover:shadow-primary-500/5 group">
                  <div className="flex items-center gap-2 text-[10px] font-black text-primary-500 uppercase tracking-widest mb-4">
                     <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                     Live Update
                  </div>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed group-hover:text-primary-600 transition-colors">
                    {notice.content}
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-[9px] font-black uppercase text-slate-400 tracking-tighter">
                     <Info className="w-3 h-3" />
                     Verified by Admin
                  </div>
               </div>
            </div>
          </motion.div>
        ))}

        {notices.length === 0 && (
          <div className="text-center py-32 glass-card">
            <Bell className="w-16 h-16 mx-auto mb-6 text-slate-200" />
            <p className="text-xl font-black uppercase text-slate-300 tracking-widest italic outline-text">
              No new transmissions
            </p>
          </div>
        )}
      </div>

      <div className="mt-24 p-12 bg-primary-500 dark:bg-primary-900/10 rounded-[3rem] text-center relative overflow-hidden group">
         <div className="absolute inset-0 bg-primary-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
         <p className="text-[10px] font-black text-white dark:text-primary-500 uppercase tracking-[0.4em] mb-4">STAY CONNECTED</p>
         <h3 className="text-2xl font-black text-white dark:text-slate-100 uppercase mb-8">Follow for instant notifications</h3>
         <div className="flex justify-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-white"><ChevronRight className="w-6 h-6" /></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-white"><ChevronRight className="w-6 h-6" /></div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl backdrop-blur-md flex items-center justify-center text-white"><ChevronRight className="w-6 h-6" /></div>
         </div>
      </div>
    </div>
  );
}
