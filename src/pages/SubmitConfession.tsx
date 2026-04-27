import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Send, AlertCircle, Image as ImageIcon } from 'lucide-react';

const CATEGORIES = ['Crush', 'Love', 'Secret', 'Funny', 'Advice', 'General'];

export default function SubmitConfession() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    category: 'Crush',
    nickname: '',
    title: '',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('You must be connected to submit.');
      return;
    }
    
    if (formData.content.length < 10) {
      toast.error('Content is too short.');
      return;
    }

    setLoading(true);
    try {
      const postPayload: any = {
        content: formData.content,
        category: formData.category,
        nickname: formData.nickname || 'Anonymous',
        status: 'pending', // Requires admin approval
        createdAt: serverTimestamp(),
        viewsCount: 0,
        reactionCounts: { like: 0, love: 0, sad: 0, wow: 0, haha: 0 },
        authorUid: user.uid,
      };

      if (formData.title.trim()) {
        postPayload.title = formData.title.trim();
      }

      if (formData.imageUrl.trim()) {
        postPayload.imageUrl = formData.imageUrl.trim();
      }

      await addDoc(collection(db, 'posts'), postPayload);

      toast.success('Your confession has been submitted for review!');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit confession.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-heading font-extrabold mb-4">Confess Your Heart Out</h1>
        <p className="text-slate-700 font-medium dark:text-slate-300">Your secret is safe with us. Submissions are reviewed before publishing.</p>
      </div>

      <div className="glass-card p-8">
        <form onSubmit={handleSubmit} className="space-y-6">

          <div>
            <label className="block text-sm font-semibold mb-2">Category</label>
            <div className="flex flex-wrap gap-3">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, category: cat})}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.category === cat 
                      ? 'bg-primary-500 text-white shadow-md' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 font-bold dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Title (Optional)</label>
            <input 
              type="text" 
              maxLength={100}
              placeholder="Give your confession a catchy title..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Image URL (Optional)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ImageIcon className="h-5 w-5 text-slate-400" />
              </div>
              <input 
                type="url" 
                maxLength={1000}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Your Confession</label>
            <textarea 
              required
              maxLength={5000}
              rows={8}
              placeholder="Tell us everything..."
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all resize-none"
              value={formData.content}
              onChange={e => setFormData({...formData, content: e.target.value})}
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Nickname (Optional)</label>
            <input 
              type="text" 
              maxLength={50}
              placeholder="Leave blank for 'Anonymous'"
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
              value={formData.nickname}
              onChange={e => setFormData({...formData, nickname: e.target.value})}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">
              Please avoid using real names of people who might not want to be identified. Keep it respectful. Posts violating community guidelines will be rejected.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-primary-500 to-orange-400 text-white font-bold text-lg shadow-[0_0_20px_rgba(250,125,5,0.4)] hover:shadow-[0_0_30px_rgba(250,125,5,0.6)] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                <Send className="w-5 h-5" />
                Submit Confession
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
