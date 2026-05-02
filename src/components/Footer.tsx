import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Footer() {
  const { footerLogo, footerTitle } = useSettings();

  return (
    <footer className="glass border-t border-slate-200 dark:border-slate-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center space-x-2">
          {footerLogo ? (
             <img src={footerLogo} alt="Logo" className="h-6 w-auto object-contain" />
          ) : (
            <Heart className="w-6 h-6 text-primary-500 fill-primary-500" />
          )}
          <span className="font-heading font-bold text-lg">{footerTitle ? footerTitle : 'NJAC Crush & Confession'}</span>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
          <Link to="/about" className="hover:text-primary-500 transition-colors">About</Link>
          <Link to="/news" className="hover:text-primary-500 transition-colors">News</Link>
          <Link to="/blog" className="hover:text-primary-500 transition-colors">Blog</Link>
          <Link to="/privacy-policy" className="hover:text-primary-500 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-primary-500 transition-colors">Terms of Service</Link>
          <Link to="/admin-login" className="hover:text-primary-500 transition-colors opacity-30 text-[8px] uppercase tracking-tighter self-end mb-1">Staff</Link>
        </div>
        
        <div className="text-sm text-slate-500 dark:text-slate-400">
          &copy; {new Date().getFullYear()} {footerTitle ? footerTitle : 'NJAC'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
