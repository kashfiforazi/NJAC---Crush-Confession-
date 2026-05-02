import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: any | null; // Use any to allow custom properties if we merge them, or just keep it as User | null
  isAdmin: boolean;
  isBanned: boolean;
  loading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, isBanned: false, loading: true, refreshAdminStatus: async () => {} });

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkUserStatus = async (uid: string) => {
    try {
      const [adminDoc, userDoc] = await Promise.all([
        getDoc(doc(db, 'admins', uid)),
        getDoc(doc(db, 'users', uid))
      ]);
      setIsAdmin(adminDoc.exists());
      if (userDoc.exists()) {
        setIsBanned(userDoc.data().isBanned === true);
      } else {
        setIsBanned(false);
      }
    } catch (error) {
      setIsAdmin(false);
      setIsBanned(false);
    }
  };

  const refreshAdminStatus = async () => {
    if (user) {
      setLoading(true);
      await checkUserStatus(user.uid);
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await checkUserStatus(currentUser.uid);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsBanned(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, isBanned, loading, refreshAdminStatus }}>
      {children}
    </AuthContext.Provider>
  );
}
