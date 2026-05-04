import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, orderBy, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp, getDoc, setDoc, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import toast from 'react-hot-toast';
import { Settings, CheckCircle, XCircle, Trash2, Eye, LayoutDashboard, LogOut, FileText, PlusCircle, Edit3, Image as ImageIcon, Users, MessageSquare, Bell, Search, BadgeCheck, User, Info } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const CATEGORIES = ['Crush', 'Love', 'Secret', 'Funny', 'Advice', 'General'];

const generateSlug = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export default function AdminDashboard() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  
  const [mainTab, setMainTab] = useState<'posts' | 'create' | 'settings' | 'newsBlog' | 'users' | 'comments' | 'notices' | 'banners' | 'adminProfile'>('posts');
  const [newsBlogs, setNewsBlogs] = useState<any[]>([]);
  const [usersBoard, setUsersBoard] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [allComments, setAllComments] = useState<any[]>([]);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [allNotices, setAllNotices] = useState<any[]>([]);
  const [allBanners, setAllBanners] = useState<any[]>([]);
  const [adminProfile, setAdminProfile] = useState({
    displayName: 'NJAC ADMIN',
    username: 'njac_official',
    photoURL: '',
    coverURL: '',
    bio: '',
    followersCount: 0,
    followingCount: 0
  });
  const [newNotice, setNewNotice] = useState('');
  const [fetchingNews, setFetchingNews] = useState(false);
  const [createNewsData, setCreateNewsData] = useState({ title: '', content: '', imageUrl: '', videoUrl: '', type: 'news', url: '', slug: '' });
  const [newBanner, setNewBanner] = useState({ imageUrl: '', link: '', title: '' });
  const [postTab, setPostTab] = useState<'pending' | 'published'>('pending');

  // Edit Post State
  const [editingPost, setEditingPost] = useState<any>(null);

  // Create Post State
  const [createData, setCreateData] = useState({ title: '', content: '', category: 'Crush', imageUrl: '', slug: '' });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({ 
    headerLogo: '', footerLogo: '', headerTitle: '', footerTitle: '', aboutUsText: '', 
    bannerImage: '', founderImage: '', principalImage: '',
    adsterraNativeBanner: '', adsterraBanner728x90: '', adsterraBanner300x250: '',
    adsterraPopunder: '', adsterraSocialBar: '',
    fbPage1: '', fbPage2: '', fbGroup: '', instagram: '', messenger: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const globalSettings = useSettings();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      toast.error('Admin access required');
      navigate('/admin-login');
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    async function fetchData() {
      if (!isAdmin) return;
      try {
        setFetching(true);
        if (mainTab === 'posts') {
          const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(50));
          const snapshot = await getDocs(q);
          setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (mainTab === 'newsBlog') {
          const q2 = query(collection(db, 'news_blogs'), orderBy('createdAt', 'desc'), limit(50));
          const sn2 = await getDocs(q2);
          setNewsBlogs(sn2.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (mainTab === 'users') {
          const qU = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(100));
          const snU = await getDocs(qU);
          setUsersBoard(snU.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (mainTab === 'comments') {
          const qC = query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(100));
          const snC = await getDocs(qC);
          setAllComments(snC.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (mainTab === 'notices') {
          const qN = query(collection(db, 'notices'), orderBy('createdAt', 'desc'), limit(50));
          const snN = await getDocs(qN);
          setAllNotices(snN.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else if (mainTab === 'banners') {
          const qB = query(collection(db, 'banners'), orderBy('order', 'asc'));
          const snB = await getDocs(qB);
          setAllBanners(snB.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `admin_${mainTab}`);
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [isAdmin, mainTab]);

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
        adsterraNativeBanner: globalSettings.adsterraNativeBanner || '',
        adsterraBanner728x90: globalSettings.adsterraBanner728x90 || '',
        adsterraBanner300x250: globalSettings.adsterraBanner300x250 || '',
        adsterraPopunder: globalSettings.adsterraPopunder || '',
        adsterraSocialBar: globalSettings.adsterraSocialBar || '',
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
      const slug = createNewsData.slug.trim() || generateSlug(createNewsData.title);
      const payload: any = {
        title: createNewsData.title,
        content: createNewsData.content,
        type: createNewsData.type,
        slug: slug,
        createdAt: serverTimestamp(),
        authorUid: user?.uid,
      };
      if (createNewsData.imageUrl) payload.imageUrl = createNewsData.imageUrl;
      if (createNewsData.videoUrl) payload.videoUrl = createNewsData.videoUrl;
      if (createNewsData.url) payload.url = createNewsData.url;

      const newDoc = await addDoc(collection(db, 'news_blogs'), payload);
      setNewsBlogs([{ id: newDoc.id, ...payload, createdAt: { toDate: () => new Date() } }, ...newsBlogs]);
      setCreateNewsData({ title: '', content: '', imageUrl: '', videoUrl: '', type: 'news', url: '', slug: '' });
      toast.success(`${createNewsData.type === 'news' ? 'News' : 'Blog'} published!`);
    } catch (err) {
       handleFirestoreError(err, OperationType.WRITE, 'news_blogs');
    }
  };

  const handleDeleteNews = async (id: string) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      await deleteDoc(doc(db, 'news_blogs', id));
      setNewsBlogs(newsBlogs.filter(p => p.id !== id));
      toast.success('Deleted');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `news_blogs/${id}`);
    }
  };

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const snap = await getDoc(doc(db, 'adminSettings', 'profile'));
        if (snap.exists()) {
          setAdminProfile(snap.data() as any);
        } else {
          console.log('Admin profile document does not exist yet. Using defaults.');
        }
      } catch (err) {
        console.warn('Admin profile fetch failed (likely needs initial setup):', err);
      }
    };
    fetchAdminProfile();
  }, []);

  const handleUpdateAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'adminSettings', 'profile'), {
        ...adminProfile,
        updatedAt: serverTimestamp()
      });
      toast.success('Admin Profile updated successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'adminSettings');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.trim()) return;
    try {
      const payload = {
        content: newNotice,
        active: true,
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'notices'), payload);
      setAllNotices([{ id: docRef.id, ...payload, createdAt: { toDate: () => new Date() } }, ...allNotices]);
      setNewNotice('');
      toast.success('Notice posted!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'notices');
    }
  };

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanner.imageUrl) return;
    try {
      const payload = { ...newBanner, order: allBanners.length, createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, 'banners'), payload);
      setAllBanners([...allBanners, { id: docRef.id, ...payload }]);
      setNewBanner({ imageUrl: '', title: '', link: '' });
      toast.success('Banner added');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'banners');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!window.confirm('Delete banner?')) return;
    try {
      await deleteDoc(doc(db, 'banners', id));
      setAllBanners(allBanners.filter(b => b.id !== id));
      toast.success('Banner deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'banners');
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notices', id));
      setAllNotices(allNotices.filter(n => n.id !== id));
      toast.success('Notice removed');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `notices/${id}`);
    }
  };

  const handleToggleBan = async (uId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uId), { isBanned: !currentStatus });
      setUsersBoard(usersBoard.map(u => u.id === uId ? { ...u, isBanned: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'Banned' : 'Unbanned'}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uId}`);
    }
  };

  const handleDeleteComment = async (cId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteDoc(doc(db, 'comments', cId));
      setAllComments(allComments.filter(c => c.id !== cId));
      toast.success('Comment deleted');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${cId}`);
    }
  };

  const handleAdminReply = async (comment: any) => {
    if (!adminReplyText.trim()) return;
    try {
      const payload = {
        postId: comment.postId,
        parentId: comment.id,
        content: adminReplyText.trim(),
        authorUid: user?.uid,
        authorName: adminProfile.displayName || 'NJAC ADMIN',
        authorPhotoURL: adminProfile.photoURL || null,
        nickname: adminProfile.displayName || 'NJAC ADMIN',
        isAdmin: true,
        createdAt: serverTimestamp()
      };
      await addDoc(collection(db, 'comments'), payload);
      setAdminReplyText('');
      setReplyingToCommentId(null);
      toast.success('Reply posted as Official Admin!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
    }
  };

  const handleUpdateStatus = async (id: string, status: 'published' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'posts', id), { status });
      setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
      toast.success(`Post ${status}`);
    } catch (error: any) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await deleteDoc(doc(db, 'posts', id));
      setPosts(posts.filter(p => p.id !== id));
      toast.success('Post deleted');
    } catch (error: any) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${id}`);
    }
  };

  const handleToggleVerified = async (uId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uId), { isVerified: !currentStatus });
      setUsersBoard(usersBoard.map(u => u.id === uId ? { ...u, isVerified: !currentStatus } : u));
      toast.success(`User ${!currentStatus ? 'Verified' : 'Unverified'}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uId}`);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.content) return;
    try {
      const slug = createData.slug.trim() || (createData.title ? generateSlug(createData.title) : '');
      const payload: any = {
        content: createData.content,
        category: createData.category,
        nickname: adminProfile.displayName || 'NJAC ADMIN',
        authorName: adminProfile.displayName || 'NJAC ADMIN',
        authorUsername: 'njac_official',
        authorPhotoURL: adminProfile.photoURL || null,
        authorVerified: true,
        isAdmin: true,
        status: 'published',
        createdAt: serverTimestamp(),
        viewsCount: 0,
        reactionCounts: { like: 0, love: 0, sad: 0, wow: 0, haha: 0 },
        authorUid: 'admin', // Official admin identity
      };
      if (createData.title.trim()) payload.title = createData.title.trim();
      if (createData.imageUrl) payload.imageUrl = createData.imageUrl;
      if (slug) payload.slug = slug;

      const newDoc = await addDoc(collection(db, 'posts'), payload);
      setPosts([{ id: newDoc.id, ...payload, createdAt: { toDate: () => new Date() } }, ...posts]);
      setCreateData({ title: '', content: '', category: 'Crush', imageUrl: '', slug: '' });
      toast.success('Admin post published!');
      setMainTab('posts');
      setPostTab('published');
    } catch (err) {
       handleFirestoreError(err, OperationType.WRITE, 'posts');
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
      handleFirestoreError(err, OperationType.UPDATE, `posts/${editingPost.id}`);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'global'), settingsForm);
      toast.success('Settings saved! Reload to apply.');
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, 'settings/global');
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
          <button onClick={() => setMainTab('comments')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'comments' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <MessageSquare className="w-5 h-5 shrink-0" />
            <span>Comments</span>
          </button>
          <button onClick={() => setMainTab('users')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'users' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <Users className="w-5 h-5 shrink-0" />
            <span>Users</span>
          </button>
          <button onClick={() => setMainTab('notices')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'notices' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <Bell className="w-5 h-5 shrink-0" />
            <span>Site Notices</span>
          </button>
          <button onClick={() => setMainTab('banners')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'banners' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <ImageIcon className="w-5 h-5 shrink-0" />
            <span>Slider Banners</span>
          </button>
          <button onClick={() => setMainTab('adminProfile')} className={`flex items-center space-x-2 md:space-x-3 whitespace-nowrap px-4 md:px-3 py-2 md:py-3 rounded-lg font-medium transition-colors ${mainTab === 'adminProfile' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'}`}>
            <User className="w-5 h-5 shrink-0" />
            <span>Admin Profile</span>
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
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Title (Optional)</label>
                  <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.title} onChange={e=>{
                    const t = e.target.value;
                    setCreateData({...createData, title: t, slug: generateSlug(t)});
                  }} placeholder="Give your post a title..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Slug (URL)</label>
                  <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createData.slug} onChange={e=>setCreateData({...createData, slug: e.target.value})} placeholder="post-url-slug" />
                </div>
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
                    <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.title} onChange={e=>{
                      const t = e.target.value;
                      setCreateNewsData({...createNewsData, title: t, slug: generateSlug(t)});
                    }} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Slug (URL)</label>
                    <input type="text" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.slug} onChange={e=>setCreateNewsData({...createNewsData, slug: e.target.value})} placeholder="news-url-slug" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Image URL (Optional)</label>
                    <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.imageUrl} onChange={e=>setCreateNewsData({...createNewsData, imageUrl: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Video Embed URL (YouTube/FB) (Optional)</label>
                  <input type="url" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent" value={createNewsData.videoUrl} onChange={e=>setCreateNewsData({...createNewsData, videoUrl: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">External News Link (Optional)</label>
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

        {mainTab === 'banners' && (
           <div className="space-y-8">
              <div className="glass-card p-8">
                <h3 className="text-xl font-bold font-heading uppercase mb-6">Manage Banners (Slider)</h3>
                <form onSubmit={handleCreateBanner} className="space-y-4">
                   <div className="grid md:grid-cols-2 gap-4">
                      <input type="url" placeholder="Banner Image URL" className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent outline-none" value={newBanner.imageUrl} onChange={e=>setNewBanner({...newBanner, imageUrl: e.target.value})} required />
                      <input type="text" placeholder="Title (Optional)" className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent outline-none" value={newBanner.title} onChange={e=>setNewBanner({...newBanner, title: e.target.value})} />
                   </div>
                   <input type="url" placeholder="Redirect Link (Optional)" className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent outline-none" value={newBanner.link} onChange={e=>setNewBanner({...newBanner, link: e.target.value})} />
                   <button type="submit" className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest">Add Banner</button>
                </form>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                 {allBanners.map(b => (
                    <div key={b.id} className="glass-card overflow-hidden group relative">
                       <img src={b.imageUrl} alt="" className="w-full h-32 object-cover" />
                       <div className="p-4">
                          <p className="font-bold text-sm truncate">{b.title || 'No Title'}</p>
                          <button onClick={()=>handleDeleteBanner(b.id)} className="mt-2 text-red-500 hover:text-red-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                 ))}
                 {allBanners.length === 0 && <p className="col-span-3 text-center text-slate-400 py-10 italic">No banners added. Maximum 3 recommended.</p>}
              </div>
           </div>
        )}

        {mainTab === 'users' && (
           <div className="space-y-6">
             <div className="glass-card p-4 flex items-center gap-4">
                <Search className="w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search user by name or email..." 
                  className="flex-1 bg-transparent outline-none p-2"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                />
             </div>

             <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
               <table className="w-full text-left">
                 <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500">
                    <th className="p-4">User</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                   {usersBoard
                    .filter(u => 
                      u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) || 
                      u.email?.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map(u => (
                     <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                       <td className="p-4">
                         <div className="flex items-center gap-2">
                           <div className="font-bold">{u.displayName}</div>
                           {u.isVerified && <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500/10" />}
                         </div>
                         <div className="text-xs text-slate-500">{u.email}</div>
                       </td>
                       <td className="p-4 text-right flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleToggleVerified(u.id, u.isVerified)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${u.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}
                          >
                            {u.isVerified ? 'Verified' : 'Verify'}
                          </button>
                          <button 
                            onClick={() => handleToggleBan(u.id, u.isBanned)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold ${u.isBanned ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                          >
                            {u.isBanned ? 'Unban User' : 'Ban User'}
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
           </div>
        )}

        {mainTab === 'comments' && (
           <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
             <table className="w-full text-left">
               <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold uppercase text-slate-500">
                  <th className="p-4">Comment</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                 {allComments.filter(c => !c.parentId).map(c => (
                   <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                     <td className="p-4">
                       <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${c.isAdmin ? 'text-primary-500' : 'text-slate-900 dark:text-slate-100'}`}>
                            {c.isAdmin ? 'NJAC ADMIN' : (c.nickname || 'Anonymous')}
                          </span>
                          {c.isAnonymous && <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">(Anonymous)</span>}
                       </div>
                       <div className="text-sm font-medium mb-1">{c.content}</div>
                       <div className="text-[10px] text-slate-400">Post ID: {c.postId} | {c.createdAt?.toDate ? c.createdAt.toDate().toLocaleString() : ''}</div>
                       
                       {replyingToCommentId === c.id ? (
                         <div className="mt-4 flex gap-2">
                            <input 
                              type="text" 
                              placeholder="Type admin reply..." 
                              className="flex-1 p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-sm" 
                              value={adminReplyText}
                              onChange={e => setAdminReplyText(e.target.value)}
                            />
                            <button onClick={()=>handleAdminReply(c)} className="px-4 py-2 bg-primary-500 text-white rounded-lg text-xs font-bold">Post Reply</button>
                            <button onClick={()=>setReplyingToCommentId(null)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold">Cancel</button>
                         </div>
                       ) : (
                         <div className="mt-2 space-y-2">
                            <button onClick={() => setReplyingToCommentId(c.id)} className="text-[10px] font-bold text-primary-500 uppercase tracking-widest hover:underline">Reply as Admin</button>
                            {/* Show sub-replies briefly? */}
                            {allComments.filter(r => r.parentId === c.id).map(r => (
                              <div key={r.id} className="ml-4 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border-l-2 border-primary-500 text-[11px]">
                                 <span className="font-bold text-primary-500 mr-2">{r.isAdmin ? 'ADMIN:' : 'USER:'}</span>
                                 {r.content}
                              </div>
                            ))}
                         </div>
                       )}
                     </td>
                     <td className="p-4 text-right align-top">
                        <button onClick={() => handleDeleteComment(c.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {mainTab === 'notices' && (
          <div className="space-y-8">
            <div className="max-w-xl bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="font-bold mb-4">Post Global Notice</h3>
              <form onSubmit={handleCreateNotice} className="flex gap-2">
                <input 
                  type="text" 
                  value={newNotice} 
                  onChange={e=>setNewNotice(e.target.value)} 
                  placeholder="Important announcement..." 
                  className="flex-1 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent"
                  required
                />
                <button type="submit" className="px-6 bg-primary-500 text-white font-bold rounded-lg shrink-0">Send</button>
              </form>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
              <h3 className="p-4 border-b border-slate-200 dark:border-slate-700 font-bold">Active Notices</h3>
              <table className="w-full text-left">
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {allNotices.map(n => (
                    <tr key={n.id}>
                      <td className="p-4 font-medium">{n.content}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => handleDeleteNotice(n.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mainTab === 'adminProfile' && (
          <div className="max-w-2xl mx-auto space-y-8 pb-12">
             <div className="glass-card p-8 border-b-8 border-primary-500/10">
                <div className="flex items-center gap-6 mb-8">
                   <div className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-700 shadow-xl relative group">
                      {adminProfile.photoURL ? (
                        <img src={adminProfile.photoURL} alt="Admin" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-12 h-12 text-slate-400" />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-[8px] font-black text-white uppercase tracking-widest">Preview</span>
                      </div>
                   </div>
                      <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">{adminProfile.displayName}</h3>
                        <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-[0.2em]">@{adminProfile.username}</p>
                        <div className="flex gap-4 mt-2">
                           <div className="text-[9px] font-black uppercase text-slate-400">Followers: <span className="text-slate-900 dark:text-white ml-1">{adminProfile.followersCount}</span></div>
                           <div className="text-[9px] font-black uppercase text-slate-400">Following: <span className="text-slate-900 dark:text-white ml-1">{adminProfile.followingCount}</span></div>
                        </div>
                      </div>
                </div>

                <form onSubmit={handleUpdateAdminProfile} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Official Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. NJAC OFFICIAL"
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold focus:ring-2 focus:ring-primary-500/20" 
                        value={adminProfile.displayName}
                        onChange={e => setAdminProfile({...adminProfile, displayName: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Username</label>
                      <input 
                        type="text" 
                        placeholder="e.g. njac_official"
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none font-bold focus:ring-2 focus:ring-primary-500/20" 
                        value={adminProfile.username}
                        onChange={e => setAdminProfile({...adminProfile, username: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Logo/Photo URL</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20" 
                        value={adminProfile.photoURL}
                        onChange={e => setAdminProfile({...adminProfile, photoURL: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Cover URL</label>
                      <input 
                        type="url" 
                        placeholder="https://..."
                        className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-primary-500/20" 
                        value={adminProfile.coverURL}
                        onChange={e => setAdminProfile({...adminProfile, coverURL: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Short Bio</label>
                    <textarea 
                      placeholder="About this official identity..."
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 outline-none h-32 resize-none" 
                      value={adminProfile.bio}
                      onChange={e => setAdminProfile({...adminProfile, bio: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs active:scale-[0.98] transition-all hover:shadow-lg">
                    Save Identity Settings
                  </button>
                </form>
             </div>

             <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl flex gap-4">
                <Info className="w-6 h-6 text-amber-500 shrink-0" />
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Setting this profile will replace your personal Google identity across all admin interactions. Users will see <strong>{adminProfile.displayName || 'Official Identity'}</strong> instead of your account name.
                </p>
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
              <h3 className="font-bold text-lg">Adsterra Advertisements</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Native Banner Script Code</label>
                  <textarea className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs" value={settingsForm.adsterraNativeBanner} onChange={e=>setSettingsForm({...settingsForm, adsterraNativeBanner: e.target.value})} placeholder="Paste Adsterra Native Banner script here..." rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Banner 728x90 Script Code</label>
                  <textarea className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs" value={settingsForm.adsterraBanner728x90} onChange={e=>setSettingsForm({...settingsForm, adsterraBanner728x90: e.target.value})} placeholder="Paste Adsterra 728x90 banner script here..." rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Banner 300x250 Script Code</label>
                  <textarea className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs" value={settingsForm.adsterraBanner300x250} onChange={e=>setSettingsForm({...settingsForm, adsterraBanner300x250: e.target.value})} placeholder="Paste Adsterra 300x250 banner script here..." rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Popunder Script Code</label>
                  <textarea className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs" value={settingsForm.adsterraPopunder} onChange={e=>setSettingsForm({...settingsForm, adsterraPopunder: e.target.value})} placeholder="Paste Adsterra Popunder script here..." rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-1">Social Bar Script Code</label>
                  <textarea className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent font-mono text-xs" value={settingsForm.adsterraSocialBar} onChange={e=>setSettingsForm({...settingsForm, adsterraSocialBar: e.target.value})} placeholder="Paste Adsterra Social Bar script here..." rows={3} />
                </div>
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
