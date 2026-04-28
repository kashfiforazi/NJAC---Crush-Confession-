import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Trophy, Medal, Star } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function Leaderboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      // Fetch published posts and compute likes across the user's posts
      try {
        const q = query(collection(db, 'posts'), where('status', '==', 'published'), orderBy('createdAt', 'desc'), limit(1000));
        const snaps = await getDocs(q);
        
        const userStats: Record<string, { uid: string, nickname: string, likes: number, posts: number }> = {};
        
        snaps.docs.forEach(d => {
          const data = d.data();
          const uid = data.authorUid || 'anonymous';
          if (!userStats[uid]) {
            userStats[uid] = { 
              uid, 
              nickname: data.nickname || 'Anonymous', 
              likes: 0, 
              posts: 0 
            };
          }
          const likeCount = data.reactionCounts?.like || 0;
          const loveCount = data.reactionCounts?.love || 0;
          userStats[uid].likes += (likeCount + loveCount);
          userStats[uid].posts += 1;
        });

        const sortedUsers = Object.values(userStats).sort((a, b) => b.likes - a.likes).slice(0, 50);
        setUsers(sortedUsers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Helmet>
        <title>Leaderboard | NJAC</title>
      </Helmet>
      
      <div className="text-center mb-10">
        <h1 className="text-4xl font-heading font-extrabold flex items-center justify-center gap-3">
          <Trophy className="w-10 h-10 text-yellow-500" />
          Leaderboard
        </h1>
        <p className="text-slate-500 mt-4">Top contributors based on confession likes.</p>
      </div>

      <div className="glass-card rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-xs tracking-wider">
                <th className="p-4 w-16 text-center">Rank</th>
                <th className="p-4">User</th>
                <th className="p-4 text-center">Posts</th>
                <th className="p-4 text-right">Total Likes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 animate-pulse">Loading ranking...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">No data available yet.</td>
                </tr>
              ) : users.map((user, idx) => (
                <tr key={user.uid} className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-center">
                    {idx === 0 ? <Medal className="w-6 h-6 text-yellow-500 mx-auto" /> :
                     idx === 1 ? <Medal className="w-6 h-6 text-slate-400 mx-auto" /> :
                     idx === 2 ? <Medal className="w-6 h-6 text-amber-700 mx-auto" /> :
                     <span className="font-bold text-slate-400">#{idx + 1}</span>}
                  </td>
                  <td className="p-4 font-bold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-500 flex items-center justify-center text-xs">
                        {user.nickname[0].toUpperCase()}
                      </div>
                      {user.nickname}
                    </div>
                  </td>
                  <td className="p-4 text-center text-slate-500 font-medium">{user.posts}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 font-bold text-primary-500">
                      {user.likes} <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
