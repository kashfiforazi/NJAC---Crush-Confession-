import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, increment, collection, addDoc, query, where, orderBy, getDocs, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { Heart, Send, Edit, Trash2, BadgeCheck, Clock, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export default function PostDetails() {
  const { slug } = useParams();
  const { user, isAdmin, isBanned } = useAuth();
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commenterName, setCommenterName] = useState('');
  const [isAnonymousComment, setIsAnonymousComment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyIsAnonymous, setReplyIsAnonymous] = useState(false);
  const [adminSettings, setAdminSettings] = useState<any>(null);
  const [useOfficialIdentity, setUseOfficialIdentity] = useState(false);
  
  const [actualPostId, setActualPostId] = useState<string | null>(null);
  const [authorsInfo, setAuthorsInfo] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchData() {
      if (!slug) return;
      try {
        let postDoc: any = null;
        let pId = slug;

        const { limit } = await import('firebase/firestore');

        const slugPromises = [];
        slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), where('status', '==', 'published'), limit(1))).catch(() => null));
        if (user) slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), where('authorUid', '==', user.uid), limit(1))).catch(() => null));
        if (isAdmin) slugPromises.push(getDocs(query(collection(db, 'posts'), where('slug', '==', slug), limit(1))).catch(() => null));

        const slugResults = await Promise.all(slugPromises);
        for (const res of slugResults) {
          if (res && !res.empty) {
            postDoc = res.docs[0];
            pId = postDoc.id;
            break;
          }
        }

        if (!postDoc) {
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
        
        if (reactionRef) promises.push(getDoc(reactionRef));

        const results = await Promise.all(promises);
        const commentsSnap = results[0];
        
        const postData = postDoc.data();
        setPost({ id: postDoc.id, ...postData });
        
        if (postData.status === 'published') {
          updateDoc(docRef, { viewsCount: increment(1) }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `posts/${pId}`));
        }

        const commentsData = commentsSnap.docs.map((d: any) => ({id: d.id, ...d.data()}));
        setComments(commentsData);

        if (reactionRef && results[1]) {
          const reactionSnap = results[1];
          if (reactionSnap.exists()) setUserReaction(reactionSnap.data().type);
        }

        // Fetch admin settings for official identity
        try {
          const adminSnap = await getDoc(doc(db, 'adminSettings', 'profile'));
          if (adminSnap.exists()) setAdminSettings(adminSnap.data());
        } catch (e) {
          console.error('Non-critical: Admin profile not found');
        }

        // Fetch all authors info to show verified badges and photos
        const uids = new Set<string>();
        if (postData.authorUid) uids.add(postData.authorUid);
        commentsData.forEach((c: any) => { if (c.authorUid) uids.add(c.authorUid); });

        const info: Record<string, any> = {};
        const userPromises = Array.from(uids).map(uid => getDoc(doc(db, 'users', uid)));
        const userSnaps = await Promise.all(userPromises);
        userSnaps.forEach(snap => {
          if (snap.exists()) info[snap.id] = snap.data();
        });
        setAuthorsInfo(info);
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `posts/${slug}`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug, user, isAdmin]);

  const handleReact = async (type: 'like' | 'love' | 'haha' | 'sad' | 'wow') => {
    if (!user || !actualPostId || !post) return;
    try {
      if (userReaction === type) return;
      const reactionRef = doc(db, 'posts', actualPostId, 'reactions', user.uid);
      const postRef = doc(db, 'posts', actualPostId);
      const updates: any = {};
      if (userReaction) updates[`reactionCounts.${userReaction}`] = increment(-1);
      updates[`reactionCounts.${type}`] = increment(1);
      await updateDoc(postRef, updates);
      await setDoc(reactionRef, { type, createdAt: serverTimestamp() });
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
      handleFirestoreError(err, OperationType.WRITE, `posts/${actualPostId}/reactions/${user.uid}`);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !actualPostId || !newComment.trim()) return;
    if (isBanned) return toast.error('Your account is banned.');
    setSubmitting(true);
    try {
      const isPostAsAdmin = isAdmin && useOfficialIdentity;
      const commentData: any = {
        postId: actualPostId,
        authorUid: user.uid,
        content: newComment.trim(),
        nickname: isPostAsAdmin ? (adminSettings?.displayName || 'NJAC ADMIN') : (isAnonymousComment ? 'Anonymous' : (commenterName.trim() || user.displayName || 'Anonymous')),
        authorName: isPostAsAdmin ? (adminSettings?.displayName || 'NJAC ADMIN') : (isAnonymousComment ? 'Anonymous' : (user.displayName || 'Anonymous')),
        authorPhotoURL: isPostAsAdmin ? (adminSettings?.photoURL || null) : (isAnonymousComment ? null : (user.photoURL || null)),
        authorVerified: isPostAsAdmin ? true : (isAnonymousComment ? false : (authorsInfo[user.uid]?.isVerified || false)),
        isAdmin: isPostAsAdmin,
        isAnonymous: isPostAsAdmin ? false : isAnonymousComment,
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([...comments, { id: docRef.id, ...commentData, createdAt: new Date() }]);
      setNewComment('');
      toast.success('Comment added!');
      if (!authorsInfo[user.uid] && !isAnonymousComment) {
        setAuthorsInfo({ ...authorsInfo, [user.uid]: { displayName: user.displayName, photoURL: user.photoURL, isVerified: authorsInfo[user.uid]?.isVerified } });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
    } finally {
      setSubmitting(false);
    }
  };

  const submitReply = async (commentId: string) => {
    if (!user || !actualPostId || !replyText.trim()) return;
    if (isBanned) return toast.error('Your account is banned.');
    setSubmitting(true);
    try {
      const isPostAsAdmin = isAdmin && useOfficialIdentity;
      const commentData: any = {
        postId: actualPostId,
        parentId: commentId,
        authorUid: user.uid,
        content: replyText.trim(),
        nickname: isPostAsAdmin ? (adminSettings?.displayName || 'NJAC ADMIN') : (replyIsAnonymous ? 'Anonymous' : (commenterName.trim() || user.displayName || 'Anonymous')),
        authorName: isPostAsAdmin ? (adminSettings?.displayName || 'NJAC ADMIN') : (replyIsAnonymous ? 'Anonymous' : (user.displayName || 'Anonymous')),
        authorPhotoURL: isPostAsAdmin ? (adminSettings?.photoURL || null) : (replyIsAnonymous ? null : (user.photoURL || null)),
        authorVerified: isPostAsAdmin ? true : (replyIsAnonymous ? false : (authorsInfo[user.uid]?.isVerified || false)),
        isAdmin: isPostAsAdmin,
        isAnonymous: isPostAsAdmin ? false : replyIsAnonymous,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'comments'), commentData);
      setComments([...comments, { id: docRef.id, ...commentData, createdAt: new Date() }]);
      setReplyingToId(null);
      setReplyText('');
      toast.success('Reply added!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
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
      handleFirestoreError(err, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
      toast.success('Comment deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  if (loading) return <div className="py-20 text-center animate-pulse">Loading...</div>;
  if (!post || (post.status !== 'published' && post.authorUid !== user?.uid)) {
    return <div className="py-20 text-center text-xl text-slate-500">Post not found or pending approval.</div>;
  }

  const postAuthor = authorsInfo[post.authorUid];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <Helmet>
        <title>{post.title || 'Confession'} | NJAC</title>
        <meta name="description" content={post.content?.substring(0, 160) || 'Read this confession on NJAC'} />
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

        <div className="flex items-center space-x-3 text-sm text-slate-500 mb-8">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden shrink-0">
             {postAuthor?.photoURL && post.nickname !== 'NJAC ADMIN' ? (
                <img src={postAuthor.photoURL} alt="" className="w-full h-full object-cover" />
             ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                  {post.nickname?.[0]?.toUpperCase() || 'A'}
                </div>
             )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className={`font-bold ${post.nickname === 'NJAC ADMIN' ? 'text-blue-500' : 'text-slate-900 dark:text-white'}`}>
                {post.nickname || 'Anonymous'}
              </span>
              {(postAuthor?.isVerified || post.nickname === 'NJAC ADMIN') && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
            </div>
            <span className="text-xs">Author</span>
          </div>
        </div>

        {/* Reactions */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex gap-4 flex-wrap">
          {(['like', 'love', 'haha', 'sad', 'wow'] as const).map(type => (
            <button 
              key={type}
              onClick={() => handleReact(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${userReaction === type ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-800' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <span className="capitalize">{type}</span>
              {post.reactionCounts?.[type] > 0 && <span className="ml-1 opacity-80">{post.reactionCounts[type]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Share Section */}
      <div className="glass-card p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <h3 className="font-bold">Share this confession</h3>
        <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!'); }} className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-bold">Copy Link</button>
      </div>

      {/* Comments Section */}
      <div className="glass-card p-8">
        <h3 className="text-2xl font-bold font-heading mb-6">Comments ({comments.length})</h3>
        
        <form onSubmit={submitComment} className="mb-8">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                placeholder="Nickname"
                className="sm:w-1/3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none disabled:opacity-50"
                value={commenterName}
                onChange={e => setCommenterName(e.target.value)}
                disabled={isAnonymousComment}
              />
              <input
                type="text"
                placeholder="Add a comment..."
                className="flex-grow p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-500 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isAnonymousComment} 
                  onChange={e => setIsAnonymousComment(e.target.checked)}
                  disabled={isAdmin && useOfficialIdentity}
                  className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500" 
                />
                Comment Anonymously
              </label>
              {isAdmin && (
                <label className="flex items-center gap-2 text-sm font-black text-primary-500 cursor-pointer select-none uppercase tracking-widest">
                  <input 
                    type="checkbox" 
                    checked={useOfficialIdentity} 
                    onChange={e => {
                      setUseOfficialIdentity(e.target.checked);
                      if (e.target.checked) setIsAnonymousComment(false);
                    }}
                    className="w-4 h-4 rounded border-primary-300 text-primary-600 focus:ring-primary-500" 
                  />
                  Post as Official Admin
                </label>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="px-6 py-3 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2">
              <Send className="w-4 h-4" /> Post Comment
            </button>
          </div>
        </form>

        <div className="space-y-6">
          {comments.filter(c => !c.parentId).map((comment) => {
            const author = authorsInfo[comment.authorUid];
            const isCommentAdmin = comment.isAdmin;
            const isCommentVerified = comment.authorVerified || (author?.isVerified && !comment.isAnonymous);
            
            return (
              <div key={comment.id} className="pb-6 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-full overflow-hidden flex items-center justify-center font-bold relative ${isCommentAdmin ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      {(author?.photoURL || comment.authorPhotoURL) && !comment.isAnonymous ? (
                        <img src={comment.authorPhotoURL || author.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{comment.nickname?.[0]?.toUpperCase()}</span>
                      )}
                      {isCommentVerified && !isCommentAdmin && (
                        <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-0.5">
                          <BadgeCheck className="w-3 h-3 text-blue-500 fill-current" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 line-height-1">
                        <span className={`font-bold text-sm ${isCommentAdmin ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                          {isCommentAdmin ? 'NJAC ADMIN' : (comment.nickname || 'Anonymous')}
                        </span>
                        {isCommentAdmin && (
                          <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-[8px] font-black uppercase tracking-widest rounded-md">
                            ADMIN
                          </span>
                        )}
                        {isCommentVerified && (
                          <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500/10" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                         {comment.createdAt?.toDate ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true }) : 'Recently'}
                      </span>
                    </div>
                  </div>
                  {user && (user.uid === comment.authorUid || isAdmin) && (
                    <div className="flex gap-2">
                      <button onClick={() => handleDeleteComment(comment.id)} className="p-1 text-slate-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  )}
                </div>
                
                <p className={`ml-12 text-sm leading-relaxed ${isCommentAdmin ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                  {comment.content}
                </p>
                <button onClick={() => setReplyingToId(comment.id)} className="ml-12 mt-2 text-xs font-bold text-primary-500 uppercase tracking-wider hover:opacity-70 transition-opacity">Reply</button>

                {replyingToId === comment.id && (
                  <div className="ml-12 mt-4 space-y-3">
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         placeholder="Write a reply..." 
                         className="flex-grow p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm outline-none focus:ring-1 focus:ring-primary-500" 
                         value={replyText} 
                         onChange={e => setReplyText(e.target.value)} 
                       />
                       <button onClick={() => submitReply(comment.id)} className="px-4 py-2 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-colors">Send</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 cursor-pointer uppercase tracking-widest">
                        <input 
                          type="checkbox" 
                          checked={replyIsAnonymous} 
                          onChange={e => setReplyIsAnonymous(e.target.checked)}
                          className="w-3 h-3 rounded" 
                        />
                        Anonymous
                      </label>
                      <button onClick={() => setReplyingToId(null)} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Cancel</button>
                    </div>
                  </div>
                )}

                {/* Sub Replies */}
                <div className="mt-2 space-y-4">
                  {comments.filter(r => r.parentId === comment.id).map(reply => {
                    const rAuthor = authorsInfo[reply.authorUid];
                    const isReplyAdmin = reply.isAdmin;
                    const isReplyVerified = reply.authorVerified || (rAuthor?.isVerified && !reply.isAnonymous);

                    return (
                      <div key={reply.id} className={`ml-12 p-5 rounded-2xl border ${isReplyAdmin ? 'bg-primary-50/50 dark:bg-primary-900/10 border-primary-200/50 dark:border-primary-800/30' : 'bg-slate-50 dark:bg-slate-800/20 border-transparent'}`}>
                         <div className="flex items-center gap-3 mb-2">
                            <div className={`w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-bold ${isReplyAdmin ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                              {(rAuthor?.photoURL || reply.authorPhotoURL) && !reply.isAnonymous ? (
                                <img src={reply.authorPhotoURL || rAuthor.photoURL} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{reply.nickname?.[0]?.toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                 <span className={`text-xs font-bold ${isReplyAdmin ? 'text-primary-600 dark:text-primary-400' : 'text-slate-900 dark:text-white'}`}>
                                   {isReplyAdmin ? 'NJAC ADMIN' : (reply.nickname || 'Anonymous')}
                                 </span>
                                 {isReplyAdmin && <span className="text-[7px] font-black bg-primary-500 text-white px-1 py-0.5 rounded tracking-tighter uppercase whitespace-nowrap">Admin Reply</span>}
                                 {isReplyVerified && <BadgeCheck className="w-3 h-3 text-blue-500" />}
                              </div>
                              <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                                {reply.createdAt?.toDate ? formatDistanceToNow(reply.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                              </span>
                            </div>
                            {user && (user.uid === reply.authorUid || isAdmin) && (
                              <button onClick={() => handleDeleteComment(reply.id)} className="ml-auto p-1 text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                         </div>
                         <p className={`text-sm leading-relaxed ${isReplyAdmin ? 'text-slate-800 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300'}`}>
                           {reply.content}
                         </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
