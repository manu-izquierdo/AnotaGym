import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signInAnonymously,
  getRedirectResult,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext(null);

/**
 * Detecta navegador móvil para elegir popup vs redirect.
 * Safari iOS bloquea popups → usamos redirect.
 */
function isMobileBrowser() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}

/**
 * Traduce códigos de error Firebase al español.
 */
function translateFirebaseError(code) {
  const messages = {
    'auth/user-not-found':              'No existe ninguna cuenta con ese email',
    'auth/wrong-password':              'Contraseña incorrecta',
    'auth/email-already-in-use':        'Ya existe una cuenta con ese email',
    'auth/weak-password':               'La contraseña debe tener al menos 6 caracteres',
    'auth/invalid-email':               'El email no tiene un formato válido',
    'auth/popup-closed-by-user':        'Cancelaste el inicio de sesión con Google',
    'auth/popup-blocked':               'Tu navegador bloqueó la ventana. Inténtalo de nuevo',
    'auth/network-request-failed':      'Sin conexión a internet',
    'auth/too-many-requests':           'Demasiados intentos. Espera e inténtalo de nuevo',
    'auth/invalid-credential':          'Email o contraseña incorrectos',
    'auth/cancelled-popup-request':     'Solo puede abrirse una ventana de Google a la vez',
    'auth/unauthorized-domain':         'Dominio no autorizado. Añade esta IP a Firebase Console → Authentication → Authorized domains',
    'auth/redirect-cancelled-by-user':  'Cancelaste el inicio de sesión con Google',
    'auth/operation-not-allowed':       'Este método de inicio de sesión no está habilitado en Firebase',
    'auth/account-exists-with-different-credential':
      'Ya existe una cuenta con este email usando otro método (ej: email/contraseña)',
  };
  return messages[code] || `Error inesperado (${code || 'desconocido'}). Inténtalo de nuevo`;
}

async function ensureUserProfile(firebaseUser) {
  const profileRef = doc(db, 'users', firebaseUser.uid, 'profile', 'data');
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    const profileData = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || null,
      displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Invitado'),
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
  const [currentUser, setCurrentUser]         = useState(null);
  const [userProfile, setUserProfile]         = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [redirectPending, setRedirectPending] = useState(false);
  // Error del redirect (lo pasamos al LoginView para mostrarlo)
  const [redirectError, setRedirectError]     = useState('');

  // ── Listener de autenticación ──
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

  // ── Procesa el resultado del redirect de Google (solo móvil) ──
  useEffect(() => {
    setRedirectPending(true);
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Login correcto — onAuthStateChanged ya actualizará el estado
          setRedirectError('');
          console.log('[AnotaGym] Google redirect OK:', result.user.email);
        }
        // result === null → no había redirect pendiente (caso normal en desktop)
      })
      .catch((err) => {
        console.error('[AnotaGym] Google redirect error:', err.code, err.message);
        // Mostramos el error traducido al usuario en el LoginView
        if (err.code) {
          setRedirectError(translateFirebaseError(err.code));
        }
      })
      .finally(() => {
        setRedirectPending(false);
      });
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
      if (displayName) await updateProfile(user, { displayName });
      return { ok: true };
    } catch (err) {
      return { ok: false, message: translateFirebaseError(err.code) };
    }
  }

  /**
   * Google Sign-In:
   * - Desktop  → signInWithPopup  (sin recarga de página)
   * - Móvil    → signInWithRedirect (única opción fiable en Safari iOS)
   *
   * REQUISITO: la IP/dominio desde donde accedes debe estar en
   * Firebase Console → Authentication → Settings → Authorized domains
   */
  async function loginWithGoogle() {
    setRedirectError('');
    try {
      if (isMobileBrowser()) {
        // Inicia el redirect — la página se recarga al volver de Google
        await signInWithRedirect(auth, googleProvider);
        // Este código no se ejecuta en móvil (redirect)
        return { ok: true };
      } else {
        await signInWithPopup(auth, googleProvider);
        return { ok: true };
      }
    } catch (err) {
      const msg = translateFirebaseError(err.code);
      return { ok: false, message: msg };
    }
  }

  async function loginAsGuest() {
    setRedirectError('');
    try {
      await signInAnonymously(auth);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: translateFirebaseError(err.code) };
    }
  }

  async function logout() {
    await signOut(auth);
  }

  async function refreshProfile() {
    if (!currentUser) return;
    const profileRef = doc(db, 'users', currentUser.uid, 'profile', 'data');
    const snap = await getDoc(profileRef);
    if (snap.exists()) setUserProfile(snap.data());
  }

  const value = {
    currentUser,
    userProfile,
    loading: loading || redirectPending,
    isAdmin: userProfile?.role === 'admin',
    redirectError,           // ← Error del redirect visible en el LoginView
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginAsGuest,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!value.loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
