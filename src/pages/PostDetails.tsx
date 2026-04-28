import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Heart, Send, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PostDetails() {
  const { slug } = useParams();
  const { user, isAdmin } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  // also need limit from fs
  const [actualPostId, setActualPostId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        let postDoc: any = null;
        let pId = slug;

        // Try querying by slug using different rules-compliant queries
        const { limit } = await import('firebase/firestore');

        const slugPromises = [];
        // 1. Published post (works for everyone)
        slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), where('status', '==', 'published'), limit(1))).catch(() => null));
        
        // 2. Author's own post
        if (user) {
          slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), where('authorUid', '==', user.uid), limit(1))).catch(() => null));
        }
        
        // 3. Admin query
        if (isAdmin) {
          slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), limit(1))).catch(() => null));
        }

        const slugResults = await Promise.all(slugPromises);
        for (const res of slugResults) {
          if (res && !res.empty) {
            postDoc = res.docs[0];
            pId = postDoc.id;
            break;
          }
        }

        if (!postDoc) {
          // Fallback to fetch by ID if slug not found
          const docRef = doc(db, 'posts', slug);
          const iSnap = await getDoc(docRef);
          if (iSnap.exists()) {
            postDoc = iSnap;
            pId = iSnap.id;
          }
        }

        setActualPostId(pId);
        if (!postDoc) throw new Error('Post not found');

        const docRef = doc(db, 'posts', pId);
        
        const commentsQ = query(
          collection(db, 'comments'),
          where('postId', '==', pId),
          orderBy('createdAt', 'asc')
        );

        let reactionRef = null;
        if (user) {
          reactionRef = doc(db, 'posts', pId, 'reactions', user.uid);
        }

        const promises: Promise<any>[] = [
          getDocs(commentsQ)
        ];
        
        if (reactionRef) {
          promises.push(getDoc(reactionRef));
        }

        const results = await Promise.all(promises);
        const commentsSnap = results[0];
        
        setPost({ id: postDoc.id, ...postDoc.data() });
        
        if (postDoc.data().status === 'published') {
          updateDoc(docRef, {
            viewsCount: increment(1)
          }).catch(e => console.error('Failed to increment view', e));
        }

        setComments(commentsSnap.docs.map((d: any) => ({id: d.id, ...d.data()})));

        if (reactionRef && results[1]) {
          const reactionSnap = results[1];
          if (reactionSnap.exists()) {
            setUserReaction(reactionSnap.data().type);
          }
        }
      } catch (error) {
        console.error(error);
        toast.error('Could not load post');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, user]);

  const handleReact = async (type: 'like' | 'love' | 'haha' | 'sad' | 'wow') => {
    if (!user || !actualPostId || !post) return;
    
    // Optimistic UI update could go here
    try {
      if (userReaction === type) return; // Already reacted this way
      
      const reactionRef = doc(db, 'posts', actualPostId, 'reactions', user.uid);
      const postRef = doc(db, 'posts', actualPostId);

      // We update the reaction counts using increment
      const updates: any = {};
      if (userReaction) {
        updates[`reactionCounts.${userReaction}`] = increment(-1);
      }
      updates[`reactionCounts.${type}`] = increment(1);

      await updateDoc(postRef, updates);

      await setDoc(reactionRef, {
        type,
        createdAt: serverTimestamp()
      });

      setUserReaction(type);
      setPost({
        ...post,
        reactionCounts: {
          ...post.reactionCounts,
          [type]: (post.reactionCounts?.[type] || 0) + 1,
          ...(userReaction ? { [userReaction]: Math.max(0, (post.reactionCounts?.[userReaction] || 0) - 1) } : {})
        }
      });
      toast.success(`You reacted with ${type}`);
    } catch(err) {
      console.error(err);
      toast.error('Failed to react');
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !actualPostId || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const commentData = {
        postId: actualPostId,
        authorUid: user.uid,
        content: newComment.trim(),
        nickname: commenterName.trim() || 'Anonymous',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([...comments, { id: docRef.id, ...commentData, createdAt: new Date() }]);
      setNewComment('');
      toast.success('Comment added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!user || !actualPostId || !replyText.trim()) return;

    setSubmitting(true);
    try {
      const commentData = {
        postId: actualPostId,
        parentId: commentId,
        authorUid: user.uid,
        content: replyText.trim(),
        nickname: commenterName.trim() || 'Anonymous',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([...comments, { id: docRef.id, ...commentData, createdAt: new Date() }]);
      setReplyingToId(null);
      setReplyText('');
      toast.success('Reply added!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      await updateDoc(doc(db, 'comments', commentId), { content: editingCommentText.trim(), updatedAt: serverTimestamp() });
      setComments(comments.map(c => c.id === commentId ? { ...c, content: editingCommentText.trim() } : c));
      setEditingCommentId(null);
      toast.success('Comment updated');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading...</div>;
  if (!post || (post.status !== 'published' && post.authorUid !== user?.uid)) {
    return <div className="py-20 text-center text-xl text-slate-500">Post not found or pending approval.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Helmet>
        <title>{post.title || 'Confession'} | NJAC</title>
        <meta name="description" content={post.content?.substring(0, 160) || 'Read this confession on NJAC'} />
        <meta property="og:title" content={post.title || 'Confession'} />
        <meta property="og:description" content={post.content?.substring(0, 160) || 'Read this confession'} />
        {post.imageUrl && <meta property="og:image" content={post.imageUrl} />}
      </Helmet>

      {/* Post Content */}
      <div className="glass-card p-8 md:p-12">
        <div className="flex justify-between items-center mb-6">
          <span className="px-4 py-1.5 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300 rounded-full text-sm font-bold uppercase tracking-wider">
            {post.category}
          </span>
          <span className="text-slate-400 text-sm">
            {post.createdAt?.toDate ? formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true }) : ''}
          </span>
        </div>
        
        {post.title && (
          <h1 className="text-3xl md:text-5xl font-heading font-extrabold mb-6 leading-tight">
            {post.title}
          </h1>
        )}

        {post.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden max-h-96 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <img src={post.imageUrl} alt="Confession Context" className="w-full h-auto object-cover" />
          </div>
        )}
        
        <div className="prose dark:prose-invert max-w-none text-lg text-slate-700 dark:text-slate-300 mb-8 whitespace-pre-wrap">
          {post.content}
        </div>

        <div className="flex items-center space-x-2 text-sm text-slate-500 mb-8">
          {post.nickname === 'NJAC ADMIN' ? (
            <span className="font-bold flex items-center space-x-1.5 text-blue-500">
              <span>— NJAC ADMIN</span>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 16.17l-4.17-4.17-1.42 1.41 5.59 5.59 12-12-1.41-1.41z"></path></svg>
            </span>
          ) : (
            <span className="font-medium">— {post.nickname || 'Anonymous'}</span>
          )}
        </div>

        {/* Reactions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex gap-4 flex-wrap">
          <button 
            onClick={() => handleReact('like')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === 'like' ? 'bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-900/30 dark:border-blue-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            👍 Like {post.reactionCounts?.like > 0 && <span className="ml-1 opacity-80">{post.reactionCounts.like}</span>}
          </button>
          <button 
            onClick={() => handleReact('love')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === 'love' ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/30 dark:border-rose-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            ❤️ Love {post.reactionCounts?.love > 0 && <span className="ml-1 opacity-80">{post.reactionCounts.love}</span>}
          </button>
          <button 
            onClick={() => handleReact('haha')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === 'haha' ? 'bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            😂 Haha {post.reactionCounts?.haha > 0 && <span className="ml-1 opacity-80">{post.reactionCounts.haha}</span>}
          </button>
          <button 
             onClick={() => handleReact('sad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === 'sad' ? 'bg-yellow-50 border-yellow-200 text-yellow-600 dark:bg-yellow-900/30 dark:border-yellow-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            😢 Sad {post.reactionCounts?.sad > 0 && <span className="ml-1 opacity-80">{post.reactionCounts.sad}</span>}
          </button>
          <button 
            onClick={() => handleReact('wow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === 'wow' ? 'bg-purple-50 border-purple-200 text-purple-600 dark:bg-purple-900/30 dark:border-purple-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            😲 Wow {post.reactionCounts?.wow > 0 && <span className="ml-1 opacity-80">{post.reactionCounts.wow}</span>}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="font-bold">Share this confession</h3>
        <div className="flex space-x-2">
          <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')} className="px-4 py-2 bg-[#1877F2] text-white rounded-lg hover:opacity-90 transition-opacity font-bold flex items-center gap-2">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            Facebook
          </button>
          <button onClick={() => { 
            if (navigator.share) {
              navigator.share({
                title: post.title || 'NJAC Confession',
                url: window.location.href
              }).catch(console.error);
            } else {
              navigator.clipboard.writeText(window.location.href); 
              toast.success('Link copied!');
            }
          }} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold">
            {navigator.share ? 'Share...' : 'Copy Link'}
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-bold font-heading mb-6">Comments ({comments.length})</h3>
        
        <form onSubmit={submitComment} className="mb-8">
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              placeholder="Your Name (Optional)"
              className="w-1/3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              value={commenterName}
              onChange={e => setCommenterName(e.target.value)}
              maxLength={50}
            />
            <input
              type="text"
              placeholder="Add a comment..."
              className="flex-grow p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              required
              maxLength={1000}
            />
          </div>
          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={submitting}
              className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Post Comment</span>
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {comments.filter(c => !c.parentId).map((comment, i) => (
            <div key={comment.id || i} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 relative group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-400 to-purple-400 flex items-center justify-center text-white font-bold text-xs">
                    {comment.nickname?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="font-bold">{comment.nickname || 'Anonymous'}</span>
                  <span className="text-xs text-slate-400">
                    {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                  </span>
                </div>
                {user && (user.uid === comment.authorUid || isAdmin) && (
                  <div className="hidden group-hover:flex items-center gap-2">
                    <button onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }} className="p-1.5 text-slate-500 hover:text-primary-500 bg-slate-100 hover:bg-primary-50 rounded dark:bg-slate-800 dark:hover:bg-slate-700 transition"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteComment(comment.id)} className="p-1.5 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded dark:bg-slate-800 dark:hover:bg-slate-700 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
              
              {editingCommentId === comment.id ? (
                <div className="ml-10 mt-2">
                  <textarea 
                    className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent focus:ring-2 focus:ring-primary-500 outline-none" 
                    value={editingCommentText} 
                    onChange={e => setEditingCommentText(e.target.value)} 
                    rows={2} 
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={() => setEditingCommentId(null)} className="px-3 py-1.5 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">Cancel</button>
                    <button onClick={() => handleUpdateComment(comment.id)} className="px-3 py-1.5 text-sm font-semibold bg-primary-500 text-white rounded hover:bg-primary-600">Save</button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-slate-700 dark:text-slate-300 ml-10">{comment.content}</p>
                  <button 
                    onClick={() => setReplyingToId(comment.id)} 
                    className="ml-10 mt-2 text-xs font-bold text-slate-500 hover:text-primary-500 transition"
                  >
                    Reply
                  </button>
                </>
              )}

              {replyingToId === comment.id && (
                <div className="ml-10 mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    className="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <button 
                    onClick={() => submitReply(comment.id)}
                    disabled={submitting || !replyText.trim()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-xl font-bold hover:bg-primary-600 disabled:opacity-50 text-sm"
                  >
                    Send
                  </button>
                </div>
              )}

              {/* Nested Replies */}
              {comments.filter(reply => reply.parentId === comment.id).map(reply => (
                <div key={reply.id} className="ml-10 mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 relative group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {reply.nickname?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <span className="font-bold text-sm">{reply.nickname || 'Anonymous'}</span>
                      <span className="text-xs text-slate-400">
                        {reply.createdAt?.toDate ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                      </span>
                    </div>
                    {user && (user.uid === reply.authorUid || isAdmin) && (
                      <div className="hidden group-hover:flex items-center gap-2">
                        <button onClick={() => handleDeleteComment(reply.id)} className="p-1 text-slate-400 hover:text-red-500 transition"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
