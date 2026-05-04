import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

export default function Footer() {
  const { footerLogo, footerTitle } = useSettings();

  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 pt-20 pb-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center space-x-3">
              {footerLogo ? (
                 <img src={footerLogo} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <Heart className="w-6 h-6 text-white fill-white/20" />
                </div>
              )}
              <span className="font-heading font-black text-2xl tracking-tighter uppercase italic">{footerTitle ? footerTitle : 'NJAC Crush'}</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-sm font-medium leading-relaxed">
              The premier platform for sharing secret feelings, confessions, and connecting with your community anonymously. Building courage, one heartbeat at a time.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Platforms</h4>
            <div className="flex flex-col gap-3">
              <Link to="/news" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">News Archive</Link>
              <Link to="/blog" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">Developer Blog</Link>
              <Link to="/community" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">Community Space</Link>
              <Link to="/game-zone" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">Game Zone</Link>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-6">Legal</h4>
            <div className="flex flex-col gap-3">
              <Link to="/about" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">About Team</Link>
              <Link to="/privacy-policy" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">Usage Terms</Link>
              <Link to="/admin-login" className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-primary-500 mt-2 opacity-50">Staff Access</Link>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            &copy; {new Date().getFullYear()} {footerTitle ? footerTitle : 'NJAC CO.'} - All Pulse Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest">Global Heartbeat Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ to, children }: { to: string, children: React.ReactNode }) {
  return (
    <Link to={to} className="text-sm font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:text-primary-500 dark:hover:text-white transition-colors">
      {children}
    </Link>
  );
}
