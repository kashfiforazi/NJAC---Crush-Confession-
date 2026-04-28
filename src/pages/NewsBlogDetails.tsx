import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Share2, Send, Trash2, Video, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function NewsBlogDetails({ type }: { type: 'news' | 'blog' }) {
  const { id } = useParams();
  const { user, isAdmin, isBanned } = useAuth();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [authorsInfo, setAuthorsInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      try {
        const { limit } = await import('firebase/firestore');
        let actualDoc: any = null;
        
        // Search by Slug first
        const slugQuery = query(collection(db, 'news_blogs'), where('slug', '==', id), where('type', '==', type), limit(1));
        const slugSnap = await getDocs(slugQuery).catch(() => null);
        
        if (slugSnap && !slugSnap.empty) {
          actualDoc = slugSnap.docs[0];
        } else {
          const docRef = doc(db, 'news_blogs', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().type === type) {
            actualDoc = docSnap;
          }
        }

        if (actualDoc) {
          const itemData = actualDoc.data();
          setItem({ id: actualDoc.id, ...itemData });
          
          const pId = actualDoc.id;
          const commentsQ = query(collection(db, 'comments'), where('postId', '==', pId), orderBy('createdAt', 'asc'));
          const commentsSnap = await getDocs(commentsQ);
          const commentsData = commentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          setComments(commentsData);

          // Fetch author info
          const uids = new Set<string>();
          commentsData.forEach((c: any) => { if (c.authorUid) uids.add(c.authorUid); });
          const userPromises = Array.from(uids).map(uid => getDoc(doc(db, 'users', uid)));
          const userSnaps = await Promise.all(userPromises);
          const info: Record<string, any> = {};
          userSnaps.forEach(snap => { if (snap.exists()) info[snap.id] = snap.data(); });
          setAuthorsInfo(info);
        } else {
          toast.error('Item not found');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `news_blogs/${id}`);
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id, type]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
       navigator.share({ title: item?.title, url }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !item?.id || !newComment.trim()) return;
    if (isBanned) return toast.error('Banned');
    setSubmitting(true);
    try {
      const commentData = {
        postId: item.id,
        authorUid: user.uid,
        content: newComment.trim(),
        nickname: commenterName.trim() || user.displayName || 'Anonymous',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([...comments, { id: docRef.id, ...commentData, createdAt: new Date() }]);
      setNewComment('');
      toast.success('Comment added!');
      if (!authorsInfo[user.uid]) {
        setAuthorsInfo({ ...authorsInfo, [user.uid]: { displayName: user.displayName, photoURL: user.photoURL } });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 font-bold">Loading...</div>;
  if (!item) return <div className="text-center py-20 font-bold">Not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-12 px-4">
      <Link to={`/${type}`} className="inline-flex items-center text-primary-500 font-bold">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to {type}
      </Link>
      
      <div className="glass-card p-6 md:p-10">
        {item.imageUrl && <img src={item.imageUrl} alt="" className="w-full max-h-96 object-cover rounded-xl mb-8" />}
        <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-4">{item.title}</h1>
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-8">
           <span className="text-sm text-slate-500">{item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }) : ''}</span>
           <button onClick={handleShare} className="flex items-center text-primary-500 font-bold bg-primary-50 dark:bg-slate-800 px-4 py-2 rounded-full text-xs">
             <Share2 className="w-4 h-4 mr-2" /> Share
           </button>
        </div>
        <div className="prose prose-lg dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {item.content}
        </div>
      </div>

      <div className="glass-card p-8">
         <h3 className="text-2xl font-bold font-heading mb-8">Discussions ({comments.length})</h3>
         
         <form onSubmit={submitComment} className="mb-10 space-y-4">
            <div className="grid sm:grid-cols-4 gap-4">
               <input type="text" placeholder="Name" className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none" value={commenterName} onChange={e=>setCommenterName(e.target.value)} />
               <input type="text" placeholder="Comment..." className="sm:col-span-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent outline-none" value={newComment} onChange={e=>setNewComment(e.target.value)} required />
            </div>
            <div className="flex justify-end">
               <button type="submit" disabled={submitting} className="px-8 py-3 bg-primary-500 text-white font-bold rounded-xl disabled:opacity-50">Post Comment</button>
            </div>
         </form>

         <div className="space-y-6">
            {comments.map(c => {
               const author = authorsInfo[c.authorUid];
               return (
                  <div key={c.id} className="flex gap-4">
                     <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-slate-400">
                        {author?.photoURL ? <img src={author.photoURL} alt="" /> : c.nickname?.[0]?.toUpperCase()}
                     </div>
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="font-bold text-sm">{c.nickname || 'Anonymous'}</span>
                           {author?.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{c.content}</p>
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
}
