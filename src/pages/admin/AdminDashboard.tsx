import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, setDoc, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { Settings, CheckCircle, XCircle, Trash2, Eye, LayoutDashboard, LogOut, FileText, PlusCircle, Edit3, Image as ImageIcon } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const CATEGORIES = ['Crush', 'Love', 'Secret', 'Funny', 'Advice', 'General'];

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);
  
  const [mainTab, setMainTab] = useState<'posts' | 'create' | 'settings' | 'newsBlog'>('posts');
  const [newsBlogs, setNewsBlogs] = useState<any[]>([]);
  const [fetchingNews, setFetchingNews] = useState(true);
  const [createNewsData, setCreateNewsData] = useState({ title: '', content: '', imageUrl: '', type: 'news', url: '' });
  const [postTab, setPostTab] = useState<'pending' | 'published'>('pending');

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any>(null);

  // Create Post State
  const [createData, setCreateData] = useState({ title: '', content: '', category: 'Crush', imageUrl: '' });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({ 
    headerLogo: '', footerLogo: '', headerTitle: '', footerTitle: '', aboutUsText: '', 
    bannerImage: '', adClient: '', adSlotSidebar: '', founderImage: '', principalImage: '',
    fbPage1: '', fbPage2: '', fbGroup: '', instagram: '', messenger: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const globalSettings = useSettings();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) navigate('/login');
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    async function fetchPosts() {
      if (!isAdmin) return;
      try {
        setFetching(true);
        // Add limit to avoid fetching too many records at once and slowing down the app
        const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        // Fetch news/blogs
        const q2 = query(collection(db, 'news_blogs'), orderBy('createdAt', 'desc'), limit(50));
        const sn2 = await getDocs(q2);
        setNewsBlogs(sn2.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load data');
      } finally {
        setFetching(false);
      }
    }
    fetchPosts();
  }, [isAdmin]);

  useEffect(() => {
    if (globalSettings) {
      setSettingsForm({
        headerLogo: globalSettings.headerLogo || '',
        footerLogo: globalSettings.footerLogo || '',
        headerTitle: globalSettings.headerTitle || '',
        footerTitle: globalSettings.footerTitle || '',
        aboutUsText: globalSettings.aboutUsText || '',
        founderImage: globalSettings.founderImage || '',
        principalImage: globalSettings.principalImage || '',
        bannerImage: globalSettings.bannerImage || '',
        adClient: globalSettings.adClient || '',
        adSlotSidebar: globalSettings.adSlotSidebar || '',
        fbPage1: globalSettings.fbPage1 || '',
        fbPage2: globalSettings.fbPage2 || '',
        fbGroup: globalSettings.fbGroup || '',
        instagram: globalSettings.instagram || '',
        messenger: globalSettings.messenger || ''
      });
    }
  }, [globalSettings]);

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createNewsData.title || !createNewsData.content) return;
    try {
      const payload: any = {
        title: createNewsData.title,
        content: createNewsData.content,
        type: createNewsData.type,
        createdAt: serverTimestamp(),
        authorUid: user?.uid,
      };
      if (createNewsData.imageUrl) payload.imageUrl = createNewsData.imageUrl;
      if (createNewsData.url) payload.url = createNewsData.url;

      const newDoc = await addDoc(collection(db, 'news_blogs'), payload);
      setNewsBlogs([{ id: newDoc.id, ...payload, createdAt: { toDate: () => new Date() } }, ...newsBlogs]);
      setCreateNewsData({ title: '', content: '', imageUrl: '', type: 'news', url: '' });
      toast.success(`${createNewsData.type === 'news' ? 'News' : 'Blog'} published!`);
    } catch (err) {
       console.error(err); toast.error('Failed to create entry');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'news_blogs', id));
      setNewsBlogs(newsBlogs.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch (error: any) {
      console.error(error); toast.error('Failed to delete: ' + error.message);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'published' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'posts', id), { status });
      setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
      toast.success(`Post ${status}`);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to update status: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to delete post: ' + error.message);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.content) return;
    try {
      const payload: any = {
        content: createData.content,
        category: createData.category,
        nickname: 'NJAC ADMIN',
        status: 'published',
        createdAt: serverTimestamp(),
        viewsCount: 0,
        reactionCounts: { like: 0, love: 0, sad: 0, wow: 0, haha: 0 },
        authorUid: user?.uid,
      };
      if (createData.title.trim()) payload.title = createData.title.trim();
      if (createData.imageUrl) payload.imageUrl = createData.imageUrl;

      const newDoc = await addDoc(collection(db, 'posts'), payload);
      setPosts([{ id: newDoc.id, ...payload, createdAt: { toDate: () => new Date() } }, ...posts]);
      setCreateData({ title: '', content: '', category: 'Crush', imageUrl: '' });
      toast.success('Admin post published!');
      setMainTab('posts');
      setPostTab('published');
    } catch (err) {
       console.error(err); toast.error('Failed to create post');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    try {
      const payload: any = {
        content: editingPost.content,
        category: editingPost.category,
      };
      if (editingPost.imageUrl !== undefined) {
         payload.imageUrl = editingPost.imageUrl;
      }
      await updateDoc(doc(db, 'posts', editingPost.id), payload);
      setPosts(posts.map(p => p.id === editingPost.id ? { ...p, ...payload } : p));
      setEditingPost(null);
      toast.success('Post updated');
    } catch (err) {
      console.error(err); toast.error('Failed to update post');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settingsForm);
      toast.success('Settings saved! Reload to apply.');
    } catch (error) {
       console.error(error); toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center">Loading dashboard...</div>;
  if (!isAdmin) return null;

  const filteredPosts = posts.filter(p => p.status === postTab);
  const totalViews = posts.reduce((a, b) => a + (b.viewsCount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col md:flex-row text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-full md:w-64 md:flex-shrink-0 bg-white dark:bg-slate-800 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-8 md:mb-10">
          <Settings className="w-6 h-6 text-primary-500" />
          <span className="font-heading font-bold text-xl">Admin Panel</span>
        </div>
        
        
        <nav className="flex md:flex-col space-x-2 md:space-x-0 md:space-y-2 overflow-x-auto pb-4 md:pb-0 mb-4 md:mb-0">
          <button onClick={() => setMainTab('posts')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'posts' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span>Manage Posts</span>
          </button>
          <button onClick={() => setMainTab('create')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'create' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <PlusCircle className="w-5 h-5 shrink-0" />
            <span>Create Post</span>
          </button>
          <button onClick={() => setMainTab('newsBlog')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'newsBlog' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <FileText className="w-5 h-5 shrink-0" />
            <span>News & Blogs</span>
          </button>
          <button onClick={() => setMainTab('settings')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'settings' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <Settings className="w-5 h-5 shrink-0" />
            <span>Settings</span>
          </button>
          <div className="hidden md:block flex-1"></div>
          <Link to="/" className="flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400 font-medium">
            <Eye className="w-5 h-5 shrink-0" />
            <span>View Site</span>
          </Link>
          <button onClick={() => { signOut(auth).catch(console.error); localStorage.removeItem('adminKey'); navigate('/'); }} className="flex md:hidden items-center space-x-2 whitespace-nowrap px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </nav>

        <div className="hidden md:block mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
          <button onClick={() => { signOut(auth).catch(console.error); localStorage.removeItem('adminKey'); navigate('/'); }} className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 font-medium">
            <LogOut className="w-5 h-5 shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <h1 className="text-3xl font-heading font-bold mb-8">
          {mainTab === 'posts' ? 'Overview' : mainTab === 'create' ? 'Create Admin Post' : 'Site Settings'}
        </h1>
        
        {mainTab === 'posts' && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Total Posts</h3>
                <p className="text-3xl font-bold">{posts.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Pending</h3>
                <p className="text-3xl font-bold text-amber-500">{posts.filter(p=>p.status==='pending').length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Published</h3>
                <p className="text-3xl font-bold text-green-500">{posts.filter(p=>p.status==='published').length}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 mb-1">Total Views</h3>
                <p className="text-3xl font-bold text-blue-500">{totalViews}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 border-b border-slate-200 dark:border-slate-700 pb-px">
              <button onClick={() => setPostTab('pending')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${postTab === 'pending' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Pending Approvals</button>
              <button onClick={() => setPostTab('published')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${postTab === 'published' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Published Posts</button>
            </div>

            {/* Posts List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-medium">Snippet</th>
                      <th className="p-4 font-medium">Author/Category</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {filteredPosts.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No posts found in this tab.</td></tr>
                    ) : filteredPosts.map(post => (
                      <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                        <td className="p-4 w-1/2">
                          <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{post.content}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-bold text-xs mb-1">{post.nickname || 'Anonymous'}</div>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium">{post.category}</span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-sm text-slate-500">
                          {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : ''}
                        </td>
                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                          {postTab === 'pending' && (
                            <>
                              <button onClick={() => handleUpdateStatus(post.id, 'published')} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition" title="Approve"><CheckCircle className="w-4 h-4" /></button>
                              <button onClick={() => handleUpdateStatus(post.id, 'rejected')} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition" title="Reject"><XCircle className="w-4 h-4" /></button>
                            </>
                          )}
                          <button onClick={() => setEditingPost(post)} className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition" title="Edit"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(post.id)} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          <Link to={`/post/${post.id}`} target="_blank" className="inline-block p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition" title="View"><Eye className="w-4 h-4" /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {mainTab === 'create' && (
          <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleCreatePost} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-2">Title (Optional)</label>
                <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.title} onChange={e=>setCreateData({...createData, title: e.target.value})} placeholder="Give your post a title..." />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.category} onChange={e=>setCreateData({...createData, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Image URL (Optional)</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.imageUrl} onChange={e=>setCreateData({...createData, imageUrl: e.target.value})} placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Content</label>
                <textarea rows={6} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.content} onChange={e=>setCreateData({...createData, content: e.target.value})} placeholder="What's on your mind?"></textarea>
              </div>
              <button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600">Publish as NJAC ADMIN</button>
            </form>
          </div>
        )}

        {mainTab === 'newsBlog' && (
          <div className="space-y-8">
            <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-xl font-bold mb-4">Create News or Blog</h2>
              <form onSubmit={handleCreateNews} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Type</label>
                    <select className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.type} onChange={e=>setCreateNewsData({...createNewsData, type: e.target.value})}>
                      <option value="news">News</option>
                      <option value="blog">Blog</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Title</label>
                    <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.title} onChange={e=>setCreateNewsData({...createNewsData, title: e.target.value})} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Image URL (Optional)</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.imageUrl} onChange={e=>setCreateNewsData({...createNewsData, imageUrl: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">External URL (Optional)</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.url} onChange={e=>setCreateNewsData({...createNewsData, url: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Content</label>
                  <textarea rows={4} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.content} onChange={e=>setCreateNewsData({...createNewsData, content: e.target.value})} required></textarea>
                </div>
                <button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-lg font-bold hover:bg-primary-600">Publish</button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <h2 className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold">Existing News & Blogs</h2>
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {newsBlogs.length === 0 ? (
                    <tr><td className="p-8 text-center text-slate-500">No news or blogs yet.</td></tr>
                  ) : newsBlogs.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                      <td className="p-4">
                         <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium uppercase mr-2">{item.type}</span>
                         <span className="font-bold">{item.title}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                         {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleDateString() : ''}
                      </td>
                      <td className="p-4 text-right">
                        <Link to={`/${item.type}/${item.id}`} target="_blank" className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition inline-block mr-2" title="Preview">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDeleteNews(item.id)} className="p-1.5 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition inline-block" title="Delete"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mainTab === 'settings' && (
          <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold mb-1">Header Logo URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.headerLogo} onChange={e=>setSettingsForm({...settingsForm, headerLogo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Header Title</label>
                <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.headerTitle} onChange={e=>setSettingsForm({...settingsForm, headerTitle: e.target.value})} placeholder="NJAC Crush" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Footer Logo URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.footerLogo} onChange={e=>setSettingsForm({...settingsForm, footerLogo: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Footer Title</label>
                <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.footerTitle} onChange={e=>setSettingsForm({...settingsForm, footerTitle: e.target.value})} placeholder="NJAC Crush & Confession" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Hero Banner Image URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.bannerImage} onChange={e=>setSettingsForm({...settingsForm, bannerImage: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">About Us Text</label>
                <textarea rows={6} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.aboutUsText} onChange={e=>setSettingsForm({...settingsForm, aboutUsText: e.target.value})} placeholder="Write about your college/website..." />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Founder Image URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.founderImage} onChange={e=>setSettingsForm({...settingsForm, founderImage: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Principal Image URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.principalImage} onChange={e=>setSettingsForm({...settingsForm, principalImage: e.target.value})} />
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <h3 className="font-bold text-lg">Social Links</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Facebook Page 1</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.fbPage1} onChange={e=>setSettingsForm({...settingsForm, fbPage1: e.target.value})} placeholder="https://facebook.com/page1" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Facebook Page 2</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.fbPage2} onChange={e=>setSettingsForm({...settingsForm, fbPage2: e.target.value})} placeholder="https://facebook.com/page2" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Facebook Group</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.fbGroup} onChange={e=>setSettingsForm({...settingsForm, fbGroup: e.target.value})} placeholder="https://facebook.com/groups/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Instagram</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.instagram} onChange={e=>setSettingsForm({...settingsForm, instagram: e.target.value})} placeholder="https://instagram.com/..." />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">Messenger Link</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.messenger} onChange={e=>setSettingsForm({...settingsForm, messenger: e.target.value})} placeholder="https://m.me/..." />
                </div>
              </div>
              <hr className="border-slate-200 dark:border-slate-700" />
              <h3 className="font-bold text-lg">Google Ads</h3>
              <div>
                <label className="block text-sm font-semibold mb-1">Ad Client ID (ca-pub-xxx)</label>
                <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.adClient} onChange={e=>setSettingsForm({...settingsForm, adClient: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Sidebar Ad Slot ID</label>
                <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={settingsForm.adSlotSidebar} onChange={e=>setSettingsForm({...settingsForm, adSlotSidebar: e.target.value})} />
              </div>

              <button type="submit" disabled={savingSettings} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700">{savingSettings ? 'Saving...' : 'Save Settings'}</button>
            </form>
          </div>
        )}

      </main>

      {/* Edit Modal */}
      {editingPost && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Edit Post</h2>
              <button onClick={() => setEditingPost(null)}><XCircle className="w-6 h-6 hover:text-red-500" /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold mb-2">Category</label>
                <select className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={editingPost.category} onChange={e=>setEditingPost({...editingPost, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Image URL</label>
                <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={editingPost.imageUrl || ''} onChange={e=>setEditingPost({...editingPost, imageUrl: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Content</label>
                <textarea rows={8} className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={editingPost.content} onChange={e=>setEditingPost({...editingPost, content: e.target.value})}></textarea>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-2 text-slate-600 font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-primary-500 text-white rounded-lg font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
