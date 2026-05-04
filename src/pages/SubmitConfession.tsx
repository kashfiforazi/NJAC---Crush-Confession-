import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Send, AlertCircle, Shield, Star, Image as ImageIcon } from 'lucide-react';

import AdSlot from '../components/AdSlot';

const CATEGORIES = ['Crush', 'Love', 'Secret', 'Funny', 'Advice', 'General'];

export default function SubmitConfession() {
  const { user, isBanned } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    category: 'Crush',
    nickname: '',
    title: '',
    imageUrl: '',
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (limit to 2MB for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File too large. Max 2MB allowed for direct upload.');
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      setUploading(false);
      toast.success('Image ready for transmission!');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be connected to submit.');
      return;
    }

    if (isBanned) {
      toast.error('Your account is banned. You cannot submit confessions.');
      return;
    }
    
    if (formData.content.length < 10) {
      toast.error('Content is too short.');
      return;
    }

    setLoading(true);
    try {
      const generatedSlug = (formData.title.trim() ? formData.title.trim() : formData.content.substring(0, 20))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + Date.now().toString(36);

      const postPayload: any = {
        content: formData.content,
        category: formData.category,
        nickname: formData.nickname || 'Anonymous',
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        viewsCount: 0,
        reactionCounts: { like: 0, love: 0, sad: 0, wow: 0, haha: 0 },
        authorUid: user.uid,
        slug: generatedSlug,
      };

      if (formData.title.trim()) {
        postPayload.title = formData.title.trim();
      }

      if (formData.imageUrl.trim()) {
        postPayload.imageUrl = formData.imageUrl.trim();
      }

      await addDoc(collection(db, 'posts'), postPayload);
      
      // Award points for posting
      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          totalPoints: increment(10),
          postsPoints: increment(10)
        });
      } catch (err) {
        console.error('Failed to award points:', err);
      }

      toast.success('Your confession has been submitted for review! +10 Points Earned.');
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-20 px-4">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
           Secure & Anonymous
        </div>
        <h1 className="text-6xl md:text-8xl font-black font-heading tracking-tighter uppercase italic leading-[0.8]">
          Share Your<br/>
          <span className="text-gradient">Secret</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto">
          Unburden your heart in a safe space. Your words have power, your identity remains a mystery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
           <div className="glass-card p-10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
              
              <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">Entry Details</h3>
                  
                  {/* Picture upload - Moved to top */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Pulse (Add a Photo First)</label>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="relative group">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleFileChange}
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="w-full min-h-[140px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-3 transition-all hover:border-primary-500/50">
                          <ImageIcon className={`w-8 h-8 ${uploading ? 'animate-pulse text-primary-500' : 'text-slate-300'}`} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {uploading ? 'Processing Signal...' : 'Pick a Photo'}
                          </span>
                        </div>
                      </div>
                      {formData.imageUrl && (
                        <div className="relative rounded-2xl overflow-hidden h-48 border-2 border-primary-500/20 shadow-2xl">
                          <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Pulse Preview" />
                          <button 
                            type="button"
                            onClick={() => setFormData({...formData, imageUrl: ''})}
                            className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-lg hover:scale-110 transition-transform"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Classification</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({...formData, category: cat})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            formData.category === cat 
                              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl scale-105' 
                              : 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">The Header (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="Title your heartbeat..."
                      className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/30 transition-all outline-none font-bold italic"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">The Pulse (Story)</h3>
                  <textarea 
                    required
                    rows={8}
                    placeholder="Pour your soul here..."
                    className="w-full p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500/30 transition-all outline-none font-medium italic resize-none leading-relaxed"
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4"
                >
                  {loading ? 'Transmitting...' : (
                    <>
                      <Send className="w-5 h-5" />
                      Release Confession
                    </>
                  )}
                </button>
              </form>
           </div>
        </div>

        <div className="space-y-8">
           <div className="glass-card p-10 border-l-8 border-primary-500">
              <h3 className="text-xs font-black uppercase tracking-widest text-primary-500 mb-6">Security Protocol</h3>
              <div className="space-y-6">
                 <ProtocolItem icon={<Shield className="w-5 h-5" />} title="End-to-End Privacy" desc="Your data is encrypted and your identity is never exposed to other heartbeat members." />
                 <ProtocolItem icon={<AlertCircle className="w-5 h-5" />} title="Moderation Guard" desc="Every pulse is reviewed by our elite moderators to ensure a safe and respectful ecosystem." />
                 <ProtocolItem icon={<Star className="w-5 h-5" />} title="Pulse Points" desc="Earn 10 points for every high-quality submission to climb the Legendary Board." />
              </div>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4">Identity Verification</label>
              <div className="glass-card p-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Identity Alias</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Broken Soul, Secret Admirer..."
                      className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-transparent focus:border-primary-500/30 outline-none text-xs font-bold transition-all"
                      value={formData.nickname}
                      onChange={e => setFormData({...formData, nickname: e.target.value})}
                    />
                  </div>
              </div>
           </div>
        </div>
      </div>
      <AdSlot type="728x90" className="mt-16" />
    </div>
  );
}

function ProtocolItem({ icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h4 className="font-black uppercase tracking-widest text-[10px] text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
