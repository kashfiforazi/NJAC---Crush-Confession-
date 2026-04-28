import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Trophy, Medal, Star, Gamepad2, ScrollText, UserPlus } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export default function Leaderboard() {
  const [topGamers, setTopGamers] = useState<any[]>([]);
  const [topPosters, setTopPosters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'gamers' | 'posters'>('gamers');

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
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Helmet>
        <title>Leaderboard | NJAC</title>
      </Helmet>
      
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-heading font-black tracking-tight flex items-center justify-center gap-4 uppercase">
          <Trophy className="w-12 h-12 text-yellow-500 animate-pulse" />
          Leaderboard
        </h1>
        <p className="text-slate-500 mt-4 font-bold uppercase tracking-[0.2em] text-xs">The Hall of Fame</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-fit mx-auto shadow-inner">
         <button 
          onClick={() => setTab('gamers')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${tab === 'gamers' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-500' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
         >
           <Gamepad2 className="w-4 h-4" />
           Top Gamers
         </button>
         <button 
          onClick={() => setTab('posters')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-widest transition-all ${tab === 'posters' ? 'bg-white dark:bg-slate-700 shadow-md text-primary-500' : 'text-slate-400 opacity-60 hover:opacity-100'}`}
         >
           <ScrollText className="w-4 h-4" />
           Top Posters
         </button>
      </div>

      <div className="glass-card rounded-[2.5rem] overflow-hidden shadow-2xl border-white/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                <th className="p-6 w-20 text-center">Rank</th>
                <th className="p-6">User</th>
                <th className="p-6 text-right">Points</th>
                <th className="p-6 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 animate-pulse font-bold uppercase tracking-widest">Compiling rankings...</td>
                </tr>
              ) : activeList.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-500 font-bold uppercase tracking-widest">No legends yet.</td>
                </tr>
              ) : activeList.map((usr, idx) => (
                <tr key={usr.id} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                  <td className="p-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`text-xl font-black ${idx < 3 ? 'text-primary-500' : 'text-slate-300'}`}>
                        {idx + 1}
                      </span>
                    </div>
                  </td>
                  <td className="p-6">
                    <Link to={`/user/${usr.id}`} className="flex items-center gap-4 group/user">
                      <div className="relative">
                        {usr.photoURL ? (
                          <img src={usr.photoURL} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-primary-500/10 group-hover/user:ring-primary-500 transition-all border-2 border-white dark:border-slate-800 shadow-md" alt="" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-orange-400 text-white flex items-center justify-center font-black text-lg shadow-md">
                            {(usr.username || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        {idx === 0 && <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1"><Star className="w-3 h-3 text-white fill-current" /></div>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover/user:text-primary-500 transition-colors">
                          {usr.username || 'Elite User'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Level {Math.floor((usr.totalPoints || 0) / 100) + 1}
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="p-6 text-right font-black text-xl tracking-tighter text-slate-900 dark:text-white">
                    {tab === 'gamers' ? (usr.gamePoints || 0) : (usr.postsPoints || 0)}
                  </td>
                  <td className="p-6 text-center">
                    <Link to={`/user/${usr.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/10 text-primary-500 hover:bg-primary-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      <UserPlus className="w-3 h-3" />
                      Follow
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 glass-card p-6 border-l-4 border-primary-500 bg-primary-500/5">
         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
           Play games in the <Link to="/game-zone" className="text-primary-500 hover:underline">Game Zone</Link> or submit high-quality <Link to="/submit" className="text-primary-500 hover:underline">Confessions</Link> to earn points and climb the leaderboard!
         </p>
      </div>
    </div>
  );
}
