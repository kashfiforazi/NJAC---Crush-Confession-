import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function NewsBlogDetails({ type }: { type: 'news' | 'blog' }) {
  const { id } = useParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        const docRef = doc(db, 'news_blogs', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().type === type) {
          setItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error('Item not found');
        }
      } catch (error) {
        console.error(error);
        toast.error('Could not load details');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, type]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title || 'Check this out',
          url: url
        });
      } catch (err) {
        console.log('Error sharing', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  if (loading) return <div className="text-center py-20 text-white font-bold">Loading...</div>;
  if (!item) return <div className="text-center py-20 text-white font-bold">Not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      <Link to={`/${type}`} className="inline-flex items-center text-primary-400 hover:text-primary-300 transition-colors font-bold">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {type === 'news' ? 'News' : 'Blogs'}
      </Link>
      
      <div className="glass-card p-6 md:p-10">
        {item.imageUrl && (
          <img src={item.imageUrl} alt={item.title} className="w-full max-h-96 object-cover rounded-xl mb-8" />
        )}
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold text-slate-900 dark:text-white mb-4">
          {item.title}
        </h1>
        <div className="flex items-center justify-between text-sm text-slate-500 mb-8 pb-4 border-b border-slate-200 dark:border-slate-800">
          <span>{item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}</span>
          <button onClick={handleShare} className="flex items-center text-primary-500 hover:text-primary-400 transition-colors font-bold bg-primary-50 dark:bg-slate-800 px-3 py-1.5 rounded-full">
            <Share2 className="w-4 h-4 mr-2" /> Share
          </button>
        </div>
        
        <div className="prose prose-lg dark:prose-invert max-w-none">
          {item.content.split('\n').map((paragraph: string, idx: number) => (
            <p key={idx} className="mb-4 text-slate-700 dark:text-slate-300 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
        
        {item.url && (
            <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary-500 text-white px-6 py-3 rounded-full font-bold hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/30">
                    Read Original Article
                </a>
            </div>
        )}
      </div>
    </div>
  );
}
