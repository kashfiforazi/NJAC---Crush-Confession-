import { useSettings } from '../contexts/SettingsContext';
import { Facebook, Instagram, MessageCircle, Users } from 'lucide-react';
import AdSlot from '../components/AdSlot';

export default function About() {
  const { aboutUsText, fbPage1, fbPage2, fbGroup, instagram, messenger } = useSettings();

  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-4xl font-heading font-extrabold mb-6">About Us</h1>
      
      <div className="glass-card p-8 space-y-4 mb-8 text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
        {aboutUsText ? (
          <p className="whitespace-pre-wrap">{aboutUsText}</p>
        ) : (
          <>
            <p>Welcome to NJAC - Crush & Confession!</p>
            <p>This is a safe space to share your secret thoughts, crushes, and funny stories anonymously.</p>
            <p>Be respectful, be kind, and enjoy the confessions.</p>
          </>
        )}
      </div>

      <AdSlot type="native" className="!my-0 mb-8" />

      <div className="glass-card p-8">
        <h2 className="text-2xl font-bold mb-6 font-heading border-b border-slate-100 dark:border-slate-800 pb-4">Connect With Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fbPage1 && (
            <a href={fbPage1} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg"><Facebook className="w-6 h-6" /></div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Facebook Page 1</span>
            </a>
          )}
          {fbPage2 && (
            <a href={fbPage2} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-lg"><Facebook className="w-6 h-6" /></div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Facebook Page 2</span>
            </a>
          )}
          {fbGroup && (
            <a href={fbGroup} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg"><Users className="w-6 h-6" /></div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Facebook Group</span>
            </a>
          )}
          {instagram && (
            <a href={instagram} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
              <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-2 rounded-lg"><Instagram className="w-6 h-6" /></div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Instagram</span>
            </a>
          )}
          {messenger && (
            <a href={messenger} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800">
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-500 dark:text-blue-300 p-2 rounded-lg"><MessageCircle className="w-6 h-6" /></div>
              <span className="font-bold text-slate-800 dark:text-slate-200">Messenger</span>
            </a>
          )}
          {!fbPage1 && !fbPage2 && !fbGroup && !instagram && !messenger && (
            <p className="text-slate-500 dark:text-slate-400">No social links configured yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
