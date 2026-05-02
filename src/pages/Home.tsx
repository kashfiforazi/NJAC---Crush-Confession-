import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Eye, Clock, Send, BadgeCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';

export default function Home() {
  const [posts, setPosts] = useState<any[]>([]);
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

      {/* Slider Banner Section */}
      {banners.length > 0 && (
        <section className="relative h-[300px] md:h-[450px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentBanner}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <img 
                src={banners[currentBanner].imageUrl} 
                alt={banners[currentBanner].title || 'Banner'} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
              
              {banners[currentBanner].title && (
                <div className="absolute bottom-10 left-10 right-10">
                   <h2 className="text-3xl md:text-5xl font-black font-heading text-white uppercase tracking-tight drop-shadow-lg">
                      {banners[currentBanner].title}
                   </h2>
                   {banners[currentBanner].link && (
                     <a 
                      href={banners[currentBanner].link} 
                      className="mt-4 inline-block px-6 py-2 bg-primary-500 text-white font-bold rounded-lg uppercase tracking-widest text-xs hover:bg-primary-600 transition-colors"
                     >
                        Learn More
                     </a>
                   )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
             {banners.map((_, i) => (
               <button 
                key={i} 
                onClick={() => setCurrentBanner(i)}
                className={`w-2 h-2 rounded-full transition-all ${currentBanner === i ? 'w-8 bg-primary-500' : 'bg-white/40'}`}
               />
             ))}
          </div>

          {/* Navigation Arrows */}
          <button 
            onClick={() => setCurrentBanner(prev => (prev - 1 + banners.length) % banners.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ←
          </button>
          <button 
            onClick={() => setCurrentBanner(prev => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            →
          </button>
        </section>
      )}

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
            <a href="#trending" className="px-8 py-4 rounded-full bg-slate-200/50 dark:bg-white/10 backdrop-blur-md border border-slate-300 dark:border-white/20 text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-300/50 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2">
              <Eye className="w-5 h-5" />
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
              {posts.map((post, index) => (
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
  const { adClient, adSlotSidebar } = useSettings();
  const adRef = React.useRef<HTMLModElement>(null);
  const [adPushed, setAdPushed] = useState(false);

  useEffect(() => {
    let timeoutId: any;
    // Check if adsbygoogle exists and is an array or object
    if (adClient && adSlotSidebar && !adPushed) {
      const checkAndPushAd = () => {
        if (adRef.current && adRef.current.offsetWidth > 0) {
          // Verify if adsbygoogle is ready
          const adsbygoogle = (window as any).adsbygoogle;
          if (adsbygoogle) {
            try {
              adsbygoogle.push({});
              setAdPushed(true);
            } catch (e: any) {
              console.error("AdSense Error:", e);
              // Mark as pushed even on error to prevent infinite retries if it's already filled
              if (e.message?.includes("already have ads")) {
                setAdPushed(true);
              }
            }
          }
        }
      };
      
      timeoutId = setTimeout(checkAndPushAd, 500);
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
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3">Sponsor</p>
          <div className="overflow-hidden rounded-xl w-full min-h-[250px] bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center">
             <ins className="adsbygoogle"
               ref={adRef}
               style={{display:"block", width: "100%", height: "250px"}}
               data-ad-client={adClient}
               data-ad-slot={adSlotSidebar}
               data-ad-format="rectangle"
               data-full-width-responsive="true"></ins>
          </div>
        </div>
      ) : (
        <div className="glass-card p-4 text-center">
          <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-3">Advertisement</p>
          <div className="bg-slate-200 dark:bg-slate-800 h-64 rounded-xl flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700">
            <span className="text-xs font-bold uppercase tracking-tighter">Ad Slot Waiting for Config</span>
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

  const getLink = () => {
    const idOrSlug = item.slug || item.id;
    return `/${item.type}/${idOrSlug}`;
  };

  return (
    <Link to={getLink()} className="block glass-card overflow-hidden hover:shadow-xl transition-shadow group">
      {content}
    </Link>
  );
}

function PostCard({ post, onUpdateStatus, onDelete }: { post: any, key?: any, onUpdateStatus?: (id:string, status:string)=>void, onDelete?: (id:string)=>void }) {
  // Reaction total
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
    <Link to={getPostLink()} className="block relative glass-card p-6 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-visible">
      {/* Decorative gradient corner */}
      <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-bl from-primary-400/20 to-transparent blur-2xl rounded-full pointer-events-none"></div>

      <div className="flex justify-between items-start mb-4 relative z-20">
        <div className="flex items-center space-x-3">
          {isAdminPost && (
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 overflow-hidden border border-primary-500/20 shadow-lg shadow-primary-500/5">
              {post.authorPhotoURL ? (
                <img src={post.authorPhotoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary-500 text-white">
                  <BadgeCheck className="w-5 h-5" />
                </div>
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              {isAdminPost && (
                <>
                  <span className="text-xs font-black uppercase tracking-tight text-slate-900 dark:text-white">{post.authorName || 'NJAC ADMIN'}</span>
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                </>
              )}
              <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider">
                {post.category}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {isAdminPost && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">@njac_official</span>}
              <span className="text-[10px] text-slate-400 font-medium">
                {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
              </span>
            </div>
          </div>
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
