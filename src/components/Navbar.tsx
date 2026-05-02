import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun, Heart, Edit3, Menu, X, MoreVertical, Newspaper, BookOpen, Clock, Info, Shield, Home, TrendingUp, Grid, Bell, Users, Gamepad2, Search as SearchIcon, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { collection, query, orderBy, limit, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDesktopMoreOpen, setIsDesktopMoreOpen] = useState(false);
  const [showNotices, setShowNotices] = useState(false);
  const [notices, setNotices] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(5));
    return onSnapshot(q, (snapshot) => {
      setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);
  const [clickCount, setClickCount] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [lastNoticeId, setLastNoticeId] = useState<string | null>(null);
  const { user, isAdmin, refreshAdminStatus } = useAuth();
  const { headerLogo, headerTitle } = useSettings();
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(1));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const latestNotice = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as any;
        setNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Only set the initial ID if it's the first run
        if (lastNoticeId === null) {
          setLastNoticeId(latestNotice.id);
          return;
        }

        // Show popup for new notice
        if (latestNotice.id !== lastNoticeId) {
          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-slate-800 shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden`}>
              <div className="flex-1 w-0 p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <Bell className="h-10 w-10 text-primary-500" />
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">New Notice!</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">{latestNotice.content}</p>
                    <button onClick={() => { navigate('/notices'); toast.dismiss(t.id); }} className="mt-2 text-xs font-bold text-primary-500 hover:text-primary-600">View All Notices</button>
                  </div>
                </div>
              </div>
              <div className="flex border-l border-slate-200 dark:border-slate-700">
                <button onClick={() => toast.dismiss(t.id)} className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none">Close</button>
              </div>
            </div>
          ), { duration: 5000 });
        }
        setLastNoticeId(latestNotice.id);
      }
    });
  }, [lastNoticeId, navigate]);

  useEffect(() => {
    if (clickCount >= 3) {
      setClickCount(0);
      setShowAdminModal(true);
    }
  }, [clickCount]);

  const handleAdminAuth = async () => {
    if (adminPassword === "NJAC26") {
      if (user) {
        try {
          await setDoc(doc(db, 'admins', user.uid), { password: adminPassword, createdAt: serverTimestamp() });
          await refreshAdminStatus();
          toast.success("Admin access granted.");
          setShowAdminModal(false);
          setAdminPassword('');
          navigate('/admin');
        } catch (e) {
          console.error(e);
          toast.error("Failed assigning admin.");
        }
      } else {
        toast.error("Not connected yet, please wait.");
      }
    } else {
      toast.error("Incorrect Password.");
      setAdminPassword('');
    }
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 glass border-b border-white/20 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-x-2">
          <Link to="/" onClick={() => setClickCount(c => c + 1)} className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none min-w-0 shrink-0">
            <div className="shrink-0 relative">
              {headerLogo ? (
                <img src={headerLogo} alt="Logo" className="h-9 sm:h-11 w-auto object-contain" />
              ) : (
                <div className="relative">
                  <Heart className="w-9 h-9 sm:w-11 sm:h-11 text-primary-500 fill-primary-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.3)]" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1] }} 
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary-400 rounded-full blur-[2px] opacity-50"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h1 className="font-heading font-black text-[14px] xs:text-[16px] sm:text-lg lg:text-xl tracking-tight text-slate-900 dark:text-white leading-tight flex items-center gap-1">
                {headerTitle ? headerTitle : (
                  <>
                    <span className="hidden lg:inline">NJAC </span>
                    <span className="whitespace-nowrap">Crush <span className="text-primary-500">& Confession</span></span>
                  </>
                )}
              </h1>
            </div>
          </Link>

          {/* Nav Links - Hidden on small/medium, shown on LG+ */}
          <nav className="hidden lg:flex items-center gap-x-1 xl:gap-x-4 shrink-1 min-w-0">
            <Link to="/" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1">Home</Link>
            <Link to="/category/crush" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1">Trending</Link>
            <Link to="/categories" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1">Categories</Link>
            <Link to="/leaderboard" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1 uppercase tracking-tighter">Leaderboard</Link>
            <Link to="/news" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1">News</Link>
            <Link to="/community" className="text-[13px] xl:text-sm font-bold hover:text-primary-500 transition-colors whitespace-nowrap px-2 py-1">Chat</Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Desktop only Profile/Notices */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2">
                {user && !user.isAnonymous ? (
                  <Link to="/profile" className="px-4 py-2 rounded-full bg-slate-800 text-white text-[12px] font-black uppercase shadow-lg transition-all hover:-translate-y-0.5 whitespace-nowrap flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                ) : (
                  <Link to="/login" className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-full bg-primary-500 text-white text-[11px] sm:text-[12px] font-black uppercase shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:-translate-y-0.5 whitespace-nowrap">
                    Login
                  </Link>
                )}
              </div>

              <Link 
                to="/notices"
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-primary-500" />
                {notices.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </Link>
            </div>

            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>

            <div className="relative hidden lg:block">
              <button onClick={() => setIsDesktopMoreOpen(!isDesktopMoreOpen)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
              <AnimatePresence>
                {isDesktopMoreOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-[60]"
                  >
                    <Link to="/news" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Newspaper className="w-4 h-4 text-blue-500" />
                      <span>News</span>
                    </Link>
                    <Link to="/blog" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span>Blog</span>
                    </Link>
                    <Link to="/game-zone" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Gamepad2 className="w-4 h-4 text-indigo-500" />
                      <span>Games</span>
                    </Link>
                    <Link to="/history" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span>History</span>
                    </Link>
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    <Link to="/about" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Info className="w-4 h-4 text-yellow-500" />
                      <span>About Us</span>
                    </Link>
                    {isAdmin && (
                      <>
                        <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                        <Link to="/admin" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm text-primary-500 font-bold hover:bg-primary-50 dark:hover:bg-slate-700">
                          <Shield className="w-4 h-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors leading-none inline-flex items-center justify-center lg:hidden">
              {isMobileMenuOpen ? <X className="w-6 h-6 flex-shrink-0" /> : <Menu className="w-6 h-6 flex-shrink-0" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden glass absolute top-20 left-0 right-0 border-b border-white/20 dark:border-slate-800/50 p-4 flex flex-col space-y-2 shadow-xl z-[55] max-h-[85vh] overflow-y-auto"
          >
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Home className="w-5 h-5 text-primary-500" />
                <span>Home</span>
              </Link>
              <Link to="/category/crush" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <span>Trending</span>
              </Link>
              <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Grid className="w-5 h-5 text-indigo-500" />
                <span>Categories</span>
              </Link>
              <Link to="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>Leaderboard</span>
              </Link>
              <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Community Chat</span>
              </Link>
              <Link to="/game-zone" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Gamepad2 className="w-5 h-5 text-indigo-500" />
                <span>Game Zone</span>
              </Link>
              <Link to="/news" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Newspaper className="w-5 h-5 text-blue-500" />
                <span>News</span>
              </Link>
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <BookOpen className="w-5 h-5 text-green-500" />
                <span>Blog</span>
              </Link>
              <Link to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>History</span>
              </Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Info className="w-5 h-5 text-yellow-500" />
                <span>About Us</span>
              </Link>
              <Link to="/submit" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <Edit3 className="w-5 h-5 text-emerald-500" />
                <span>Submit Confession</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-3 hover:bg-slate-100 dark:bg-slate-800 rounded-xl text-primary-500 font-bold bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30">
                  <Shield className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              
              <Link to="/notices" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl font-bold transition-colors">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-primary-500" />
                  <span>Notifications</span>
                </div>
                {notices.length > 0 && (
                  <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full">{notices.length}</span>
                )}
              </Link>

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {user && !user.isAnonymous ? (
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-4 rounded-xl bg-slate-800 text-white font-bold w-full transition-all active:scale-95 shadow-lg">
                    <Users className="w-5 h-5" />
                    <span>My Profile</span>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-4 rounded-xl bg-primary-500 text-white font-bold w-full shadow-lg shadow-primary-500/30 transition-all active:scale-95">
                      <span>Login / Sign Up</span>
                    </Link>
                    <p className="text-center text-[11px] text-slate-500 font-medium">Join our community to post confessions!</p>
                  </div>
                )}
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
            <h2 className="text-2xl font-bold font-heading mb-4">Admin Login</h2>
             <div className="space-y-4">
               <div>
                  <label className="block text-sm font-semibold mb-2">Password</label>
                  <input 
                    type="password" 
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAdminAuth()}
                  />
               </div>
               <div className="flex justify-end space-x-3 pt-4">
                  <button onClick={() => setShowAdminModal(false)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                  <button onClick={handleAdminAuth} className="px-6 py-2 bg-primary-500 text-white rounded-lg font-bold">Login</button>
               </div>
             </div>
          </div>
        </div>
      )}
    </header>
  );
}
