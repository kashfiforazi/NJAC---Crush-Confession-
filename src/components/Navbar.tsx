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
  const { user, isAdmin, refreshAdminStatus } = useAuth();
  const { headerLogo, headerTitle } = useSettings();
  const navigate = useNavigate();

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
        <div className="flex justify-between items-center h-20">
          <Link to="/" onClick={() => setClickCount(c => c + 1)} className="flex items-center space-x-2 cursor-pointer select-none min-w-0 flex-1 md:flex-initial">
            {headerLogo ? (
              <img src={headerLogo} alt="Logo" className="h-8 w-auto object-contain flex-shrink-0" />
            ) : (
              <Heart className="w-8 h-8 text-primary-500 fill-primary-500 flex-shrink-0" />
            )}
            <span className="font-heading font-bold text-[15px] sm:text-lg md:text-xl tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
              {headerTitle ? headerTitle : (
                <>NJAC <span className="text-primary-500">Crush</span></>
              )}
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8 relative flex-shrink-0 ml-8">
            <Link to="/" className="text-sm font-medium hover:text-primary-500 transition-colors">Home</Link>
            <Link to="/category/crush" className="text-sm font-medium hover:text-primary-500 transition-colors">Trending</Link>
            <Link to="/leaderboard" className="text-sm font-medium hover:text-primary-500 transition-colors">Leaderboard</Link>
            <Link to="/community" className="text-sm font-medium hover:text-primary-500 transition-colors">Community</Link>
            <Link to="/game-zone" className="text-sm font-medium hover:text-primary-500 transition-colors">Game Zone</Link>
            <Link to="/submit" className="flex items-center space-x-1 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
              <Edit3 className="w-4 h-4" />
              <span>Submit</span>
            </Link>
            {user && !user.isAnonymous ? (
              <Link to="/profile" className="flex items-center space-x-1 px-5 py-2.5 rounded-full bg-slate-800 text-white text-sm font-bold shadow-lg transition-all hover:-translate-y-0.5">Profile</Link>
            ) : (
              <Link to="/login" className="flex items-center space-x-1 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-bold shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:-translate-y-0.5">Login / Sign Up</Link>
            )}
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <div className="relative">
              <Link 
                to="/notices"
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative block"
              >
                <Bell className="w-5 h-5 text-primary-500" />
                {notices.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
              </Link>
            </div>
            <div className="relative">
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
                    className="absolute right-0 mt-2 w-56 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700"
                  >
                    <Link to="/news" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <Newspaper className="w-4 h-4 text-blue-500" />
                      <span>News</span>
                    </Link>
                    <Link to="/blog" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <BookOpen className="w-4 h-4 text-green-500" />
                      <span>Blog</span>
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
                    <Link to="/leaderboard" onClick={() => setIsDesktopMoreOpen(false)} className="flex items-center space-x-3 px-4 py-2 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                      <TrendingUp className="w-4 h-4 text-rose-500" />
                      <span>Leaderboard</span>
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
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden space-x-4 flex-shrink-0 ml-6">
            <Link to="/notices" className="p-2 text-primary-500 relative">
               <Bell className="w-5 h-5" />
               {notices.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
            </Link>
            <button onClick={toggleTheme} className="p-2">
              {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
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
            className="md:hidden glass absolute top-16 left-0 right-0 border-b border-white/20 dark:border-slate-800/50 p-4 flex flex-col space-y-4 shadow-xl"
          >
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Home className="w-5 h-5 text-primary-500" />
                <span>Home</span>
              </Link>
              <Link to="/category/crush" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <span>Trending</span>
              </Link>
              <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Grid className="w-5 h-5 text-indigo-500" />
                <span>Categories</span>
              </Link>
              <Link to="/news" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Newspaper className="w-5 h-5 text-blue-500" />
                <span>News</span>
              </Link>
              <Link to="/blog" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <BookOpen className="w-5 h-5 text-green-500" />
                <span>Blog</span>
              </Link>
              <Link to="/community" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Users className="w-5 h-5 text-primary-500" />
                <span>Community</span>
              </Link>
              <Link to="/game-zone" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Gamepad2 className="w-5 h-5 text-indigo-500" />
                <span>Game Zone</span>
              </Link>
              <Link to="/history" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>History</span>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:bg-slate-800 rounded-lg text-primary-500 font-bold bg-primary-50/50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-900/30">
                  <Shield className="w-5 h-5" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
              <Link to="/leaderboard" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <TrendingUp className="w-5 h-5 text-orange-500" />
                <span>Leaderboard</span>
              </Link>
              <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Info className="w-5 h-5 text-yellow-500" />
                <span>About Us</span>
              </Link>
              <Link to="/submit" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-bold">
                <Edit3 className="w-5 h-5 text-emerald-500" />
                <span>Submit Confession</span>
              </Link>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                {user && !user.isAnonymous ? (
                  <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold w-full">
                    <span>Profile</span>
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-primary-500 text-white font-bold w-full mt-2">
                    <span>Login / Sign Up</span>
                  </Link>
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
