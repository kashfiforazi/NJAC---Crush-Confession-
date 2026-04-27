import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Clock, Send, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { bannerImage } = useSettings();

  useEffect(() => {
    async function fetchPosts() {
      try {
        const qPosts = query(
          collection(db, 'posts'),
          where('status', '==', 'published'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const qNews = query(collection(db, 'news_blogs'), where('type', '==', 'news'), orderBy('createdAt', 'desc'), limit(5));
        const qBlogs = query(collection(db, 'news_blogs'), where('type', '==', 'blog'), orderBy('createdAt', 'desc'), limit(5));

        const [snapshot, newsSnap, blogsSnap] = await Promise.all([
          getDocs(qPosts),
          getDocs(qNews),
          getDocs(qBlogs)
        ]);

        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPosts(fetchedPosts);
        setNews(newsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setBlogs(blogsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { status });
      setPosts(posts.filter(p => id !== p.id));
      toast.success(`Post ${status}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative text-center py-24 px-4 rounded-[2.5rem] overflow-hidden glass shadow-2xl border border-white/20 dark:border-slate-800/50 bg-slate-100 dark:bg-[#3b251b] text-slate-900 dark:text-white">
        {/* Background Effects */}
        {bannerImage ? (
           <div className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay" style={{backgroundImage: `url(${bannerImage})`}}></div>
        ) : (
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay"></div>
        )}
        <div className="absolute inset-0 bg-gradient-radial from-primary-500/30 via-transparent to-transparent opacity-70"></div>
        
        {/* Decorative Floating Elements */}
        <Heart className="absolute top-12 left-[10%] w-8 h-8 text-rose-400 opacity-60 animate-bounce" />
        <Heart className="absolute bottom-20 right-[15%] w-12 h-12 text-primary-400 opacity-40 animate-pulse" />
        <Send className="absolute top-20 right-[10%] w-10 h-10 text-white/50 -rotate-12 animate-pulse" />

        {/* Sticky Note Decoration */}
        <div className="hidden md:block absolute top-[20%] left-[5%] bg-[#fffae6] text-[#6b4c3a] p-4 rounded-sm shadow-md transform -rotate-6 font-handwriting text-sm w-36">
          <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-2 -mt-2 shadow-sm"></div>
          Some crushes stay silent... ♡
        </div>
        <div className="hidden md:block absolute bottom-[20%] right-[5%] bg-[#fffae6] text-[#6b4c3a] p-4 rounded-sm shadow-md transform rotate-6 font-handwriting text-sm w-40">
          <div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-2 -mt-2 shadow-sm"></div>
          Bring the courage to speak. ♡
        </div>

        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-heading font-extrabold tracking-tight pb-2" style={{ textShadow: "0 4px 20px rgba(250, 125, 5, 0.4)" }}>
            <span className="text-slate-900 dark:text-white">NJAC</span><br/>
            <span className="text-gradient">Crush</span> <span className="text-3xl md:text-5xl italic font-light opacity-90 text-slate-900 dark:text-white">and</span> <span className="text-gradient">Confession</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-800 dark:text-orange-100 font-medium tracking-wide">
            — WHERE CRUSHES TURN INTO CONFESSIONS —
          </p>
          <p className="text-sm tracking-[0.2em] font-bold text-slate-700 dark:text-primary-300">
            BE BOLD. BE HONEST. BE YOU.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center gap-6">
            <Link to="/submit" className="px-8 py-4 rounded-full bg-gradient-to-r from-primary-500 to-orange-400 text-white font-bold text-lg shadow-[0_0_20px_rgba(250,125,5,0.4)] hover:shadow-[0_0_30px_rgba(250,125,5,0.6)] transition-all hover:-translate-y-1 flex items-center justify-center gap-2">
              <Send className="w-5 h-5 -mt-1" />
              Submit Confession
            </Link>
            <a href="#trending" className="px-8 py-4 rounded-full bg-slate-200/50 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-300/50 dark:hover:bg-white/20 transition-all">
              Read Stories
            </a>
          </div>
        </div>
      </section>

      {/* Main Feed */}
      <div id="trending" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary-500" />
            Latest Confessions
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 glass-card">
              <p className="text-slate-500">No confessions yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map(post => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onUpdateStatus={handleUpdateStatus} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          )}

          {/* News Section */}
          {news.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl font-heading font-bold border-b border-slate-200 dark:border-slate-700 pb-2">Latest News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map(item => (
                  <NewsBlogCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Blog Section */}
          {blogs.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl font-heading font-bold border-b border-slate-200 dark:border-slate-700 pb-2">Recent Blogs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map(item => (
                  <NewsBlogCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <SidebarAd />
      </div>
    </div>
  );
}

function SidebarAd() {
  const { adClient, adSlotSidebar } = useSettings();
  const adRef = React.useRef<HTMLModElement>(null);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    if (adClient && adSlotSidebar && !adPushed) {
      const checkAndPushAd = () => {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          // If AdSense has already processed this ins element, we don't need to push again
          if (adRef.current.getAttribute('data-adsbygoogle-status') === 'done') {
            setAdPushed(true);
            return;
          }
          
          try {
            ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            setAdPushed(true);
          } catch (e: any) {
            console.error("AdSense error inside check", e);
            // Ignore common adsbygoogle errors
            const errMsg = typeof e === 'string' ? e : (e.message || '');
            if (errMsg.includes("already have ads") || errMsg.includes("No slot size") || errMsg.includes("no_div")) {
              setAdPushed(true);
            }
          }
        } else {
          timeoutId = setTimeout(checkAndPushAd, 200);
        }
      };
      
      // Delay initial check slightly to let layout settle
      timeoutId = setTimeout(checkAndPushAd, 100);
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [adClient, adSlotSidebar, adPushed]);

  return (
    <div className="space-y-8">
      {/* Ad Slot */}
      {(adClient && adSlotSidebar) ? (
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-400 mb-2">Advertisement</p>
          <div className="overflow-hidden rounded-xl w-full min-h-[250px]">
             <ins className="adsbygoogle"
               ref={adRef}
               style={{display:"block", width: "100%", height: "250px"}}
               data-ad-client={adClient}
               data-ad-slot={adSlotSidebar}
               data-ad-format="auto"
               data-full-width-responsive="true"></ins>
          </div>
        </div>
      ) : (
        <div className="glass-card p-4 text-center">
          <p className="text-xs text-slate-400 mb-2">Advertisement</p>
          <div className="bg-slate-200 dark:bg-slate-800 h-64 rounded-xl flex items-center justify-center text-slate-400">
            Ad Slot
          </div>
        </div>
      )}

      {/* Categories */}
      <div className="glass-card p-6 border-t-4 border-t-primary-500">
        <h3 className="font-heading font-bold text-lg mb-4">Categories</h3>
        <div className="flex flex-col space-y-2">
          {['Crush', 'Love', 'Secret', 'Funny', 'Advice'].map(cat => (
            <Link key={cat} to={`/category/${cat.toLowerCase()}`} className="flex justify-between items-center py-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function NewsBlogCard({ item }: { item: any, key?: any }) {
  const content = (
    <>
      {item.imageUrl && (
        <div className="h-40 w-full overflow-hidden">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500" />
        </div>
      )}
      <div className="p-5">
        <h3 className="font-bold font-heading text-lg mb-2 line-clamp-2 hover:text-primary-500 transition-colors">{item.title}</h3>
        <p className="text-sm text-slate-800 font-medium dark:text-slate-200 line-clamp-3 mb-4">{item.content}</p>
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}</span>
          <span className="uppercase tracking-wider font-bold text-primary-500">{item.type}</span>
        </div>
      </div>
    </>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block glass-card overflow-hidden hover:shadow-xl transition-shadow group">
        {content}
      </a>
    );
  }

  return (
    <Link to={`/${item.type}/${item.id}`} className="block glass-card overflow-hidden hover:shadow-xl transition-shadow group">
      {content}
    </Link>
  );
}

function PostCard({ post, onUpdateStatus, onDelete }: { post: any, key?: any, onUpdateStatus?: (id:string, status:string)=>void, onDelete?: (id:string)=>void }) {
  // Reaction total
  const totalReactions = Object.values(post.reactionCounts || {}).reduce((a: any, b: any) => a + b, 0) as number;
  const hahaCount = post.reactionCounts?.haha || 0;
  const isAdminPost = post.nickname === 'NJAC ADMIN';
  const { isAdmin } = useAuth();
  const [showAdminMenu, setShowAdminMenu] = useState(false);

  const handleAdminAction = (e: React.MouseEvent, action: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAdminMenu(false);
    if (action === 'delete') {
      if (onDelete && window.confirm('Delete this post?')) onDelete(post.id);
    } else if (action === 'reject') {
      if (onUpdateStatus && window.confirm('Reject this post?')) onUpdateStatus(post.id, 'rejected');
    }
  };

  return (
    <Link to={`/post/${post.id}`} className="block relative glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-visible">
      {/* Decorative gradient corner */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-bl from-primary-400/20 to-transparent blur-2xl rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4 relative z-20">
        <div className="flex items-center space-x-2">
          <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
            {post.category}
          </span>
          <span className="text-xs text-slate-400">
            {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
          </span>
        </div>
        
        {isAdmin && (
          <div className="relative">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdminMenu(!showAdminMenu); }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-800 rounded-full shadow-sm hover:shadow-md transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showAdminMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                <button onClick={(e) => handleAdminAction(e, 'reject')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-600">Reject</button>
                <button onClick={(e) => handleAdminAction(e, 'delete')} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 text-red-600">Delete</button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {post.title && (
        <h3 className="text-xl font-bold font-heading mb-3 group-hover:text-primary-500 transition-colors">
          {post.title}
        </h3>
      )}
      
      {post.imageUrl && (
        <div className="mb-4 rounded-xl overflow-hidden max-h-64 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <img src={post.imageUrl} alt="Confession context" className="w-full h-auto object-cover" loading="lazy" />
        </div>
      )}

      <p className="text-slate-800 font-medium dark:text-slate-200 line-clamp-3 mb-6 relative z-10">
        {post.content}
      </p>

      {isAdminPost && (
        <div className="flex items-center space-x-1.5 text-blue-500 font-bold text-sm mb-4">
           <span>NJAC ADMIN</span>
           <BadgeCheck className="w-4 h-4" />
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-slate-600 font-bold border-t border-slate-100 dark:border-slate-800 pt-4">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5" title="Haha Reactions">
              <span className="text-lg -mt-0.5">😂</span>
              <span>{hahaCount}</span>
            </div>
            <div className="flex items-center space-x-1.5" title="Total Reactions">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>{totalReactions}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <Eye className="w-4 h-4" />
          <span>{post.viewsCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}
