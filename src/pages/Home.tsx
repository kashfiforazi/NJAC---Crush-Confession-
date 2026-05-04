import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Clock, Send, BadgeCheck, Search, MessageSquare, TrendingUp, Newspaper, BookOpen, MoreVertical, Trophy, Users, Shield, ArrowRight, Zap, Target } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import AdSlot from '../components/AdSlot';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const { bannerImage } = useSettings();

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            toast.success('Push notifications enabled!');
          }
        });
      }, 5000); // ask after 5 seconds
    }
    
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

        const snapshotB = await getDocs(query(collection(db, 'banners'), orderBy('order', 'asc'), limit(3)));
        setBanners(snapshotB.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple_collections');
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  const [showNoticePopup, setShowNoticePopup] = useState(false);
  const [latestNotice, setLatestNotice] = useState<any>(null);

  useEffect(() => {
    async function checkNotices() {
      try {
        const qNotices = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(1));
        const noticeSnap = await getDocs(qNotices);
        
        if (!noticeSnap.empty) {
          const notice = { id: noticeSnap.docs[0].id, ...noticeSnap.docs[0].data() };
          setLatestNotice(notice);
          
          // Check if popup should show
          const lastSeen = localStorage.getItem('last_notice_seen_time');
          const lastNoticeId = localStorage.getItem('last_notice_id');
          const now = Date.now();
          const oneDay = 24 * 60 * 60 * 1000;

          if (notice.id !== lastNoticeId || !lastSeen || (now - parseInt(lastSeen)) > oneDay) {
            setShowNoticePopup(true);
          }
        }
      } catch (err) {
        console.error('Notice error:', err);
      }
    }
    checkNotices();
  }, []);

  const closeNotice = () => {
    setShowNoticePopup(false);
    localStorage.setItem('last_notice_seen_time', Date.now().toString());
    if (latestNotice) localStorage.setItem('last_notice_id', latestNotice.id);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'posts', id), { status });
      setPosts(posts.filter(p => id !== p.id));
      toast.success(`Post ${status}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  return (
    <div className="space-y-12 overflow-x-hidden">
      <Helmet>
        <title>Home | NJAC - Crush & Confession</title>
        <meta name="description" content="Welcome to the NJAC Crush & Confession website. Share your secret feelings anonymously and see what others are saying." />
        <meta name="keywords" content="NJAC, confession, crush, anonymous, college, university" />
        <meta property="og:title" content="NJAC - Crush & Confession" />
        <meta property="og:description" content="Share your secret feelings anonymously." />
      </Helmet>

      {/* Slider Banner Section - Pure Image if exists */}
      {banners.length > 0 ? (
        <section className="relative h-[250px] md:h-[450px] w-full max-w-7xl mx-auto px-4">
          <div className="relative w-full h-full rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <img 
                  src={banners[currentBanner].imageUrl} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </section>
      ) : (
        <section className="relative min-h-[500px] flex items-center justify-center p-6 md:p-12 rounded-[3rem] overflow-hidden group max-w-7xl mx-auto">
          {/* Background Layer */}
          <div className="absolute inset-0 bg-slate-900 overflow-hidden">
            {bannerImage && (
               <img src={bannerImage} className="w-full h-full object-cover opacity-40" alt="Background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          </div>
          
          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-6 shadow-xl">
                Official Pulse Station
              </span>
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-black font-heading leading-[0.85] tracking-tighter text-white uppercase italic">
                <span className="block opacity-90 drop-shadow-2xl">Unspoken</span>
                <span className="text-gradient drop-shadow-2xl">Stories</span>
              </h1>
            </motion.div>
  
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 1 }}
              className="text-lg md:text-xl text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed italic"
            >
              Speak your heart, share your secrets, and connect with the soul of the community anonymously.
            </motion.p>
  
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
            >
              <Link to="/submit" className="group relative px-10 py-5 rounded-2xl bg-white text-slate-900 font-black text-sm uppercase tracking-widest overflow-hidden transition-all hover:pr-14 active:scale-95 shadow-2xl">
                <span className="relative z-10">Confess Now</span>
                <div className="absolute top-0 right-0 h-full w-0 bg-primary-500 transition-all group-hover:w-12 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <Send className="w-4 h-4 text-white" />
                </div>
              </Link>
              <Link to="/leaderboard" className="px-10 py-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                 View Legends
              </Link>
            </motion.div>
          </div>
        </section>
      )}

      <AdSlot type="728x90" className="max-w-7xl mx-auto px-4 mb-2" />

      {/* Global Search Bar - Now below banner */}
      <div className="max-w-7xl mx-auto px-4 mb-12">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search through unspoken secrets..." 
            className="w-full pl-14 pr-6 py-6 rounded-[2rem] bg-white dark:bg-slate-900 border border-transparent shadow-sm focus:shadow-2xl focus:border-primary-500/30 transition-all outline-hidden text-lg font-medium italic"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-6 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-primary-500 hover:text-white transition-all shadow-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>



      {/* Notice Popup */}
      <AnimatePresence>
        {showNoticePopup && latestNotice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800"
            >
              <div className="relative p-8 pt-10 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-primary-500/10 rounded-3xl flex items-center justify-center text-primary-500 shadow-inner">
                  <Shield className="w-10 h-10" />
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary-500">Official Notice</span>
                  <h2 className="text-3xl font-black font-heading tracking-tighter uppercase italic">{latestNotice.title}</h2>
                </div>
                
                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed italic">
                  {latestNotice.content}
                </p>

                <div className="pt-4 flex flex-col gap-3">
                  <button 
                    onClick={closeNotice}
                    className="w-full py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    Acknowledged
                  </button>
                  <Link 
                    to="/notices" 
                    onClick={closeNotice}
                    className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 transition-colors"
                  >
                    View All Notices
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              {posts
                .filter(p => !searchQuery || 
                  p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((post, index) => (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                >
                  <PostCard 
                    post={post} 
                    onUpdateStatus={handleUpdateStatus} 
                    onDelete={handleDelete} 
                  />
                </motion.div>
              ))}
              {posts.filter(p => !searchQuery || 
                  p.content?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.category?.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 && (
                <div className="text-center py-12 glass-card">
                   <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No secrets match your search</p>
                </div>
              )}
            </div>
          )}

          {/* News Section */}
          {news.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl font-heading font-bold border-b border-slate-200 dark:border-slate-700 pb-2">Latest News</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <NewsBlogCard item={item} />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Blog Section */}
          {blogs.length > 0 && (
            <div className="mt-12 space-y-6">
              <h2 className="text-2xl font-heading font-bold border-b border-slate-200 dark:border-slate-700 pb-2">Recent Blogs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogs.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <NewsBlogCard item={item} />
                  </motion.div>
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
  const { adsterraBanner300x250 } = useSettings();

  return (
    <div className="space-y-8">
      {/* Categories - Professional Grid */}
      <div className="glass-card p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl -mr-8 -mt-8" />
        <h3 className="font-heading font-black text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
          <div className="w-1.5 h-6 bg-primary-500 rounded-full" />
          Categories
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {['Crush', 'Love', 'Secret', 'Funny', 'Advice'].map(cat => (
            <Link key={cat} to={`/category/${cat.toLowerCase()}`} className="group flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
              <span className="font-bold text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{cat}</span>
              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary-500 transition-colors">
                <Send className="w-3 h-3 text-slate-400 group-hover:text-white" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ad Slot */}
      <AdSlot type="300x250" className="!my-0" />
    </div>
  );
}

function NewsBlogCard({ item }: { item: any, key?: any }) {
  const content = (
    <>
      {item.imageUrl && (
        <div className="h-44 w-full overflow-hidden relative">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-[10px] font-black text-white uppercase tracking-widest shadow-xl">
             {item.type}
          </div>
        </div>
      )}
      <div className="p-6">
        <h3 className="font-heading font-black text-xl mb-3 leading-tight group-hover:text-primary-500 transition-colors line-clamp-2">{item.title}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 font-medium leading-relaxed">{item.content}</p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <Clock className="w-3 h-3" />
              {item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}
           </div>
           <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center group-hover:bg-primary-500 group-hover:border-primary-500 transition-all">
              <Eye className="w-4 h-4 text-slate-400 group-hover:text-white" />
           </div>
        </div>
      </div>
    </>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block glass-card overflow-hidden group">
        {content}
      </a>
    );
  }

  const getLink = () => {
    const idOrSlug = item.slug || item.id;
    return `/${item.type}/${idOrSlug}`;
  };

  return (
    <Link to={getLink()} className="block glass-card overflow-hidden group">
      {content}
    </Link>
  );
}

function PostCard({ post, onUpdateStatus, onDelete }: { post: any, key?: any, onUpdateStatus?: (id:string, status:string)=>void, onDelete?: (id:string)=>void }) {
  const totalReactions = Object.values(post.reactionCounts || {}).reduce((a: any, b: any) => a + b, 0) as number;
  const hahaCount = post.reactionCounts?.haha || 0;
  const isAdminPost = post.authorUid === 'admin' || post.isAdmin === true;
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

  const getPostLink = () => {
    if (post.slug) return `/post/${post.slug}`;
    return `/post/${post.id}`;
  };

  return (
    <Link to={getPostLink()} className="block glass-card p-8 group relative overflow-hidden">
      {/* Modern Badge Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="w-full h-full rounded-[0.6rem] overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-900 flex items-center justify-center">
                {isAdminPost && post.authorPhotoURL ? (
                  <img src={post.authorPhotoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Heart className={`w-6 h-6 ${isAdminPost ? 'text-primary-500 group-hover:scale-110' : 'text-slate-400 opacity-50'} transition-transform duration-500`} />
                )}
              </div>
            </div>
            {isAdminPost && (
              <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white p-1 rounded-lg border-2 border-white dark:border-slate-900 shadow-lg">
                <BadgeCheck className="w-3 h-3" />
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-black uppercase tracking-widest ${isAdminPost ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                {isAdminPost ? post.authorName || 'Verified Admin' : 'Anonymous Heart'}
              </span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              <span className="px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 text-[9px] font-black uppercase tracking-tighter">
                {post.category}
              </span>
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Clock className="w-3 h-3" />
              {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Processing...'}
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="relative">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAdminMenu(!showAdminMenu); }}
              className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            <AnimatePresence>
              {showAdminMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.9 }}
                  className="absolute right-0 mt-2 w-40 glass shadow-2xl rounded-2xl py-2 z-50 border border-slate-200 dark:border-slate-700"
                >
                  <button onClick={(e) => handleAdminAction(e, 'reject')} className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors">Reject</button>
                  <button onClick={(e) => handleAdminAction(e, 'delete')} className="w-full text-left px-4 py-2 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">Delete</button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {post.title && (
        <h2 className="text-2xl font-black font-heading mb-4 tracking-tighter leading-tight group-hover:text-primary-500 transition-colors uppercase italic">
          {post.title}
        </h2>
      )}

      <div className="relative mb-8">
        {post.imageUrl && (
          <div className="mb-6 rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner group/img">
            <img src={post.imageUrl} alt="Confession" className="w-full h-64 object-cover group-hover/img:scale-105 transition-transform duration-1000" />
          </div>
        )}
        <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic line-clamp-3">
          "{post.content}"
        </p>
      </div>

      <AdSlot type="300x250" className="!my-0 mb-8 border-none bg-transparent" />

      <div className="flex items-center justify-between pt-8 border-t-2 border-slate-50 dark:border-slate-800/50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
             <ReactionBadge icon="😂" count={hahaCount} label="Haha" />
             <ReactionBadge 
               icon={<Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />} 
               count={totalReactions} 
               label="Love" 
             />
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            <MessageCircle className="w-4 h-4" />
            Comments
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 dark:bg-slate-800 text-[10px] font-black tracking-widest uppercase text-slate-400">
          <Eye className="w-3 h-3" />
          <span>{post.viewsCount || 0}</span>
        </div>
      </div>
    </Link>
  );
}

function ReactionBadge({ icon, count, label }: { icon: any, count: number, label: string }) {
  return (
    <div className="flex items-center gap-2 group/reaction cursor-pointer">
      <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover/reaction:scale-110 group-hover/reaction:bg-white dark:group-hover/reaction:bg-slate-700 transition-all shadow-sm">
        {typeof icon === 'string' ? <span className="text-lg">{icon}</span> : icon}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-black dark:text-white leading-none">{count}</span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">{label}</span>
      </div>
    </div>
  );
}
