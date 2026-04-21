import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

/**
 * Traduce los códigos de error de Firebase al español.
 */
function translateFirebaseError(code) {
  const messages = {
    'auth/user-not-found':       'No existe ninguna cuenta con ese email',
    'auth/wrong-password':       'Contraseña incorrecta',
    'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
    'auth/weak-password':        'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email':        'El email no tiene un formato válido',
    'auth/popup-closed-by-user': 'Cancelaste el inicio de sesión con Google',
    'auth/network-request-failed': 'Sin conexión a internet',
    'auth/too-many-requests':    'Demasiados intentos. Espera un momento e inténtalo de nuevo',
    'auth/invalid-credential':   'Email o contraseña incorrectos',
  };
  return messages[code] || 'Error inesperado. Inténtalo de nuevo';
}

/**
 * Crea o recupera el perfil del usuario en Firestore.
 * Si es la primera vez que entra, crea el documento con role: 'user'.
 */
async function ensureUserProfile(firebaseUser) {
  const profileRef = doc(db, 'users', firebaseUser.uid, 'profile', 'data');
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    const profileData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
      photoURL: firebaseUser.photoURL || null,
      role: 'user',
      createdAt: serverTimestamp(),
    };
    await setDoc(profileRef, profileData);
    return profileData;
  }

  return snap.data();
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // { role, displayName, ... }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const profile = await ensureUserProfile(firebaseUser);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error loading user profile:', err);
          setUserProfile({ role: 'user', displayName: firebaseUser.displayName });
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // ---------- Auth actions ----------

  async function loginWithEmail(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: translateFirebaseError(err.code) };
    }
  }

  async function registerWithEmail(email, password, displayName) {
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      return { ok: true };
    } catch (err) {
      return { ok: false, message: translateFirebaseError(err.code) };
    }
  }

  async function loginWithGoogle() {
    try {
      await signInWithPopup(auth, googleProvider);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: translateFirebaseError(err.code) };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  /**
   * Refresca el perfil del usuario desde Firestore
   * (útil después de que el admin cambie su propio rol en consola).
   */
  async function refreshProfile() {
    if (!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'data');
    const snap = await getDoc(profileRef);
    if (snap.exists()) setUserProfile(snap.data());
  }

  const value = {
    currentUser,
    userProfile,
    loading,
    isAdmin: userProfile?.role === 'admin',
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
