import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onIdTokenChanged, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    let version = 0;
    let activeUid = null;
    let unsubscribeProfile = () => {};
    const unsubscribeAuth = onIdTokenChanged(auth, async (firebaseUser) => {
      const currentVersion = ++version;
      unsubscribeProfile();
      unsubscribeProfile = () => {};
      setProfileError(null);
      const accountChanged = activeUid !== (firebaseUser?.uid || null);
      activeUid = firebaseUser?.uid || null;
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      // Refreshing a token or display name must not unmount the active form.
      if (accountChanged) {
        setUser(null);
        setLoading(true);
      }
      try {
        const { claims } = await firebaseUser.getIdTokenResult();
        if (version !== currentVersion) return;
        const updateUser = (data = {}, error = null) => {
          if (version !== currentVersion) return;
          setUser({
            ...data,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            emailVerified: firebaseUser.emailVerified,
            displayName: data.fullName || data.displayName || firebaseUser.displayName || '',
            fullName: data.fullName || data.displayName || firebaseUser.displayName || '',
            photoURL: firebaseUser.photoURL,
            role: claims.role || 'student',
            customClaims: claims,
          });
          setProfileError(error);
          setLoading(false);
        };
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid),
          (snapshot) => updateUser(snapshot.data()),
          (error) => updateUser({}, error.code));
      } catch (error) {
        if (version !== currentVersion) return;
        setUser(null);
        setProfileError(error.code || 'auth/unavailable');
        setLoading(false);
      }
    });
    return () => {
      ++version;
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const resetPassword = (email) => sendPasswordResetEmail(auth, email, {
    url: `${window.location.origin}/login`,
  });

  const logout = async () => {
    await signOut(auth);
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, profileError, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
