import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user, isAdmin, refreshAdminStatus } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast.success('Signed in with Google');
      // We do not redirect here, we wait for the effect to redirect if they are admin.
      // If they are not admin, they stay on this page to enter the password!
    } catch (error) {
      console.error(error);
      toast.error('Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminAccess = async () => {
    if (!user) {
      toast.error("Please sign in first via Google or wait for an anonymous session.");
      return;
    }
    if (password === 'NJAC26') {
      try {
        setLoading(true);
        await setDoc(doc(db, 'admins', user.uid), { password, createdAt: serverTimestamp() });
        await refreshAdminStatus();
        toast.success("Admin access granted.");
        navigate('/admin');
      } catch (err) {
        console.error(err);
        toast.error("Failed to grant admin access.");
      } finally {
        setLoading(false);
      }
    } else {
      toast.error("Incorrect Admin Password.");
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
        <h1 className="text-3xl font-bold font-heading mb-2">Admin Access</h1>
        <p className="text-slate-500 mb-8">Authenticate to access the dashboard.</p>
        
        {!user || user.isAnonymous ? (
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all font-medium mb-6"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span>{loading ? 'Signing in...' : 'Sign in with Google'}</span>
          </button>
        ) : (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-medium text-sm">
            Signed in as {user.email || 'Anonymous User'}
          </div>
        )}

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Security Key</span></div>
        </div>

        <div className="space-y-4">
          <input 
            type="password" 
            placeholder="Enter Admin Password"
            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
          />
          <button 
            onClick={handleAdminAccess}
            disabled={loading || !password}
            className="w-full p-4 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
