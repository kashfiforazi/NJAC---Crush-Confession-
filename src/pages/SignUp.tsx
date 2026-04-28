import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Helmet } from 'react-helmet-async';

export default function SignUp() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user && !user.isAnonymous) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return toast.error('Please fill all fields');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Save user to db
      await setDoc(doc(db, 'users', result.user.uid), {
        displayName: name,
        email: result.user.email,
        photoURL: null,
        createdAt: new Date(),
      });

      toast.success('Account created successfully');
      navigate('/profile');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user exists in db, if not create profile
      const userRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          displayName: result.user.displayName || 'User',
          email: result.user.email,
          photoURL: result.user.photoURL || null,
          createdAt: new Date(),
        });
      }
      
      toast.success('Signed in with Google');
      navigate('/profile');
    } catch (error) {
      console.error(error);
      toast.error('Failed to log in with Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-20 px-4">
      <Helmet>
        <title>Sign Up | NJAC</title>
      </Helmet>
      <div className="glass-card p-8 rounded-3xl text-center shadow-xl">
        <h1 className="text-3xl font-bold font-heading mb-2">Create Account</h1>
        <p className="text-slate-500 mb-8">Join NJAC Confessions today.</p>
        
        <form onSubmit={handleSignUp} className="space-y-4 mb-6 text-left">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input 
              type="text" 
              placeholder="John Doe"
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              placeholder="you@email.com"
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input 
              type="password" 
              placeholder="Choose a strong password"
              className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-primary-500 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-700"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span></div>
        </div>

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
          <span>Google</span>
        </button>

        <p className="text-slate-500 mt-6">
          Already have an account? <Link to="/login" className="text-primary-500 font-medium hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
