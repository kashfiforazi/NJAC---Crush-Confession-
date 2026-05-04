import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Trophy, Medal, Star, Gamepad2, ScrollText, UserPlus, Clock } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import AdSlot from '../components/AdSlot';

export default function Leaderboard() {
  const [topGamers, setTopGamers] = useState<any[]>([]);
  const [topPosters, setTopPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'gamers' | 'posters'>('gamers');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setUTCHours(24, 0, 0, 0); // Reset at midnight UTC
      const diff = nextReset.getTime() - now.getTime();
      
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const gamersQ = query(collection(db, 'users'), orderBy('gamePoints', 'desc'), limit(10));
        const postersQ = query(collection(db, 'users'), orderBy('postsPoints', 'desc'), limit(10));
        
        const [gamersSnap, postersSnap] = await Promise.all([
          getDocs(gamersQ),
          getDocs(postersQ)
        ]);

        setTopGamers(gamersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTopPosters(postersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'users_leaderboard');
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  const activeList = tab === 'gamers' ? topGamers : topPosters;

  return (
    <div className="max-w-5xl mx-auto py-16 px-4">
      <Helmet>
        <title>Legendary Board | NJAC</title>
      </Helmet>
      
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block px-4 py-1 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
           Hall of Fame
        </div>
        <h1 className="text-6xl md:text-8xl font-black font-heading tracking-tighter uppercase italic leading-[0.8] drop-shadow-sm">
          Daily<br/>
          <span className="text-gradient">Legends</span>
        </h1>
        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 mt-4">
           <Clock className="w-3 h-3 text-primary-500" />
           <span>Next Era Starts in: <span className="text-primary-500">{timeLeft}</span></span>
        </div>
      </div>

      {/* Tabs - Sleek Designer Switch */}
      <div className="flex justify-center mb-12">
        <div className="bg-slate-100 dark:bg-slate-800/80 backdrop-blur-xl p-1.5 rounded-2xl flex shadow-inner border border-slate-200/50 dark:border-white/5">
           <TabButton active={tab === 'gamers'} onClick={() => setTab('gamers')} icon={<Gamepad2 className="w-4 h-4" />}>Top Gamers</TabButton>
           <TabButton active={tab === 'posters'} onClick={() => setTab('posters')} icon={<ScrollText className="w-4 h-4" />}>Top Posters</TabButton>
        </div>
      </div>

      <div className="glass-card overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-[0.2em]">
                <th className="p-8 w-24 text-center border-r border-white/5">Pos</th>
                <th className="p-8 border-r border-white/5">Legendary Name</th>
                <th className="p-8 text-right border-r border-white/5">Pulses</th>
                <th className="p-8 w-40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Trophy className="w-12 h-12 text-slate-200 animate-bounce" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Calculating glory...</span>
                    </div>
                  </td>
                </tr>
              ) : activeList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-24 text-center text-slate-400 font-black uppercase text-[10px] tracking-widest">No legends listed in this era.</td>
                </tr>
              ) : activeList.map((usr, idx) => (
                <tr key={usr.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all duration-300">
                  <td className="p-6 text-center border-r border-slate-100 dark:border-slate-800/50">
                    <span className={`text-2xl font-black ${idx === 0 ? 'text-yellow-500 scale-125 inline-block' : 'text-slate-300'}`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="p-6 border-r border-slate-100 dark:border-slate-800/50">
                    <Link to={`/user/${usr.id}`} className="flex items-center gap-6 group/user">
                       <div className="relative">
                        <img 
                          src={usr.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${usr.id}`} 
                          className={`w-16 h-16 rounded-3xl object-cover ring-4 ring-white dark:ring-slate-900 shadow-xl group-hover/user:scale-110 transition-transform ${idx === 0 ? 'ring-yellow-400/50' : 'ring-primary-500/20'}`} 
                          alt="" 
                        />
                        {idx < 3 && (
                          <div className={`absolute -top-3 -right-3 p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-slate-900 ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : 'bg-orange-400'}`}>
                            <Medal className="w-3 h-3 text-white" />
                          </div>
                        )}
                       </div>
                       <div>
                          <p className="font-black text-xl text-slate-900 dark:text-white group-hover/user:text-primary-500 transition-colors uppercase tracking-tighter italic">
                             {usr.username || 'Mysterious Pulse'}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <div className="h-1 w-12 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 transition-all" style={{ width: `${Math.min(100, (usr.totalPoints || 0) % 100)}%` }}></div>
                             </div>
                             <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Level {Math.floor((usr.totalPoints || 0) / 100) + 1}</span>
                          </div>
                       </div>
                    </Link>
                  </td>
                  <td className="p-6 text-right border-r border-slate-100 dark:border-slate-800/50">
                    <span className="text-3xl font-black font-heading tracking-tighter text-slate-900 dark:text-white tabular-nums drop-shadow-sm">
                      {tab === 'gamers' ? (usr.gamePoints || 0) : (usr.postsPoints || 0)}
                    </span>
                  </td>
                  <td className="p-6">
                    <Link to={`/user/${usr.id}`} className="px-5 py-2.5 rounded-2xl bg-primary-500 text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2 border-none">
                       <Star className="w-3 h-3" />
                       View Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <AdSlot type="native" />

      <div className="mt-8 glass-card p-6 border-l-4 border-primary-500 bg-primary-500/5">
         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
           Play games in the <Link to="/game-zone" className="text-primary-500 hover:underline">Game Zone</Link> or submit high-quality <Link to="/submit" className="text-primary-500 hover:underline">Confessions</Link> to earn points and climb the leaderboard!
         </p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean, onClick: () => void, icon: any, children: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${active ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105 z-10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
    >
      {icon}
      {children}
    </button>
  );
}
