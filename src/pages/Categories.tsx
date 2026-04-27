import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORIES = ['Crush', 'Love', 'Secret', 'Funny', 'Advice', 'General'];

export default function Categories() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    async function fetchAllPosts() {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      post.content?.toLowerCase().includes(searchLower) || 
      post.title?.toLowerCase().includes(searchLower) ||
      post.nickname?.toLowerCase().includes(searchLower);
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="glass-card p-8 text-center bg-gradient-to-br from-primary-50 to-rose-100 dark:from-slate-800 dark:to-slate-900">
        <h1 className="text-3xl font-heading font-bold mb-4">Categories & Search</h1>
        
        <div className="relative max-w-xl mx-auto mb-6">
          <input 
            type="text" 
            placeholder="Search confessions..." 
            className="w-full pl-12 pr-4 py-3 rounded-full border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button 
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === 'All' ? 'bg-primary-500 text-white' : 'bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-primary-500 text-white' : 'bg-white/50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 animate-pulse">Loading...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="glass-card p-12 text-center text-slate-500">
          No confessions found matching your criteria.
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map(post => {
            const totalReactions = Object.values(post.reactionCounts || {}).reduce((a: any, b: any) => a + b, 0) as number;
            const hahaCount = post.reactionCounts?.haha || 0;

            return (
              <Link key={post.id} to={`/post/${post.id}`} className="block relative glass-card p-6 border-l-4 border-l-primary-500 hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-3">
                  {post.title && (
                    <h3 className="text-xl font-bold font-heading">{post.title}</h3>
                  )}
                  <span className="text-xs text-slate-400 whitespace-nowrap ml-auto">
                    {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                
                {post.imageUrl && (
                  <div className="mb-4 rounded-xl overflow-hidden max-h-64 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img src={post.imageUrl} alt="Confession context" className="w-full h-auto object-cover" loading="lazy" />
                  </div>
                )}
                
                <p className="text-slate-800 font-medium dark:text-slate-200 line-clamp-3 mb-4">{post.content}</p>
                
                <div className="flex justify-between items-center text-sm border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                  <div className="flex items-center gap-4">
                    <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded text-xs font-bold uppercase">{post.category}</span>
                    <span className="text-slate-700 font-bold text-xs">{post.nickname || 'Anonymous'}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-slate-600 font-bold dark:text-slate-400">
                    <div className="flex items-center space-x-1" title="Haha Reactions">
                      <span className="text-lg">😂</span>
                      <span>{hahaCount}</span>
                    </div>
                    <div className="flex items-center space-x-1" title="Total Reactions">
                      <span className="text-rose-500">❤️</span>
                      <span>{totalReactions}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
