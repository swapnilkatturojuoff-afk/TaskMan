import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserProfile, saveUserProfile } from '../firebase/firestore';

const AuthContext = createContext(undefined);

const GUEST_STORAGE_KEY = 'taskmaster_guest_user';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const savedGuest = localStorage.getItem(GUEST_STORAGE_KEY);
    if (savedGuest) {
      const guestObj = JSON.parse(savedGuest);
      setIsGuest(true);
      setUserProfile(guestObj);
      setUser({
        uid: guestObj.uid,
        email: guestObj.email,
        displayName: guestObj.displayName,
        photoURL: null,
      });
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsGuest(false);
        setUser(firebaseUser);
        let profile = await getUserProfile(firebaseUser.uid);
        if (!profile) {
          profile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || 'Taskmaster User',
            photoURL: firebaseUser.photoURL,
            currentStreak: 1,
            longestStreak: 1,
            completedTasksCount: 0,
            lastActiveDate: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
          };
          await saveUserProfile(profile);
        } else {
          const today = new Date().toISOString().split('T')[0];
          if (profile.lastActiveDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            let newStreak = profile.currentStreak || 1;
            if (profile.lastActiveDate === yesterday) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
            profile = {
              ...profile,
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, profile.longestStreak || 1),
              lastActiveDate: today
            };
            await saveUserProfile(profile);
          }
        }
        setUserProfile(profile);
      } else {
        const defaultGuest = {
          uid: 'guest_user_demo',
          email: 'demo@taskmaster.ai',
          displayName: 'Productivity Champion',
          photoURL: null,
          currentStreak: 3,
          longestStreak: 7,
          completedTasksCount: 12,
          lastActiveDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        setIsGuest(true);
        setUserProfile(defaultGuest);
        setUser({
          uid: defaultGuest.uid,
          email: defaultGuest.email,
          displayName: defaultGuest.displayName,
          photoURL: null,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setIsGuest(false);
      setUser(result.user);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email, pass) => {
    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, pass);
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setIsGuest(false);
      setUser(result.user);
    } catch (error) {
      console.error('Email Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signupWithEmail = async (email, pass, name) => {
    try {
      setLoading(true);
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user) {
        await updateProfile(result.user, { displayName: name });
        const newProfile = {
          uid: result.user.uid,
          email: result.user.email,
          displayName: name,
          photoURL: null,
          currentStreak: 1,
          longestStreak: 1,
          completedTasksCount: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString()
        };
        await saveUserProfile(newProfile);
        setUserProfile(newProfile);
      }
      localStorage.removeItem(GUEST_STORAGE_KEY);
      setIsGuest(false);
      setUser(result.user);
    } catch (error) {
      console.error('Sign Up Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginAsGuest = () => {
    const guestObj = {
      uid: `guest_${Date.now()}`,
      email: 'guest@taskmaster.local',
      displayName: 'Guest Pilot',
      photoURL: null,
      currentStreak: 1,
      longestStreak: 1,
      completedTasksCount: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(guestObj));
    setIsGuest(true);
    setUserProfile(guestObj);
    setUser({
      uid: guestObj.uid,
      email: guestObj.email,
      displayName: guestObj.displayName,
      photoURL: null,
    });
  };

  const logout = async () => {
    try {
      localStorage.removeItem(GUEST_STORAGE_KEY);
      await signOut(auth);
      loginAsGuest();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const incrementCompletedCount = async () => {
    if (!userProfile) return;
    const updated = {
      ...userProfile,
      completedTasksCount: (userProfile.completedTasksCount || 0) + 1
    };
    setUserProfile(updated);
    if (!isGuest && user) {
      await saveUserProfile(updated);
    } else {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isGuest,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsGuest,
        logout,
        incrementCompletedCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
