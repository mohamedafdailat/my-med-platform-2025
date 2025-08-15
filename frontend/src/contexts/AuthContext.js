import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../firebase/config';
import { onAuthStateChanged, sendPasswordResetEmail, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Wait briefly to ensure persistence is initialized
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const tokenResult = await firebaseUser.getIdTokenResult();
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        const enrichedUser = {
          ...firebaseUser,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: tokenResult.claims.role || userData.role || 'student',
          ...userData,
          customClaims: tokenResult.claims,
        };

        setUser(enrichedUser);
      } catch (error) {
        console.error('Error enriching user data:', error);
        setUser({
          ...firebaseUser,
          role: 'student',
        });
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  });

  return unsubscribe;
  }, []);

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: process.env.REACT_APP_BASE_URL || 'http://localhost:3000/login',
      });
    } catch (error) {
      console.error('AuthContext resetPassword error:', error.code, error.message);
      throw error; // Propagate error to component
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};