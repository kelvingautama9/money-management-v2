import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { PersistedUser } from '../types';

export type { PersistedUser };

// Initialize Firebase App instance safely (singleton pattern)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider with Google Sheets & Drive scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  prompt: 'select_account'
});

const TOKEN_STORAGE_KEY = 'kelvin_financial_google_access_token';
const TOKEN_EXPIRY_KEY = 'kelvin_financial_google_token_expiry';
const USER_STORAGE_KEY = 'kelvin_financial_active_user';

// Helper to save user persistently in localStorage
export const savePersistedUser = (user: User | PersistedUser) => {
  try {
    const data: PersistedUser = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isDevMode: (user as any).isDevMode === true
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save user session to localStorage:', e);
  }
};

// Helper to get persisted user
export const getPersistedUser = (): PersistedUser | null => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

// Helper to purge all confidential financial caches upon logout
export const clearAllUserSessionAndCaches = () => {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem('kelvin_financial_sheet_summaries');
    localStorage.removeItem('kelvin_financial_available_sheets');

    // Remove all cached transaction rows and custom assets to ensure 100% privacy
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('kelvin_financial_txs_') || k.startsWith('kelvin_financial_custom_'))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Error clearing cached user sessions:', e);
  }
};

// Helper to save token persistently in localStorage
export const saveTokenToStorage = (token: string, expiresInSeconds = 3600) => {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    const expiryTimestamp = Date.now() + (expiresInSeconds - 120) * 1000;
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTimestamp.toString());
  } catch (e) {
    console.warn('Failed to save access token to localStorage:', e);
  }
};

// Helper to retrieve token from storage if not expired
export const getStoredToken = (): string | null => {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!token) return null;
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      // Token is expired
      return null;
    }
    return token;
  } catch (e) {
    return null;
  }
};

// Helper to clear token storage
export const clearStoredToken = () => {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (e) {}
};

// In-memory token cache
let cachedAccessToken: string | null = getStoredToken();
let isSigningIn = false;

/**
 * Initialize auth state listener.
 * Checks redirect results and restores session token automatically.
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  // 1. Process redirect result if page was reloaded from signInWithRedirect
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          cachedAccessToken = credential.accessToken;
          saveTokenToStorage(credential.accessToken);
          if (onAuthSuccess) {
            onAuthSuccess(result.user, credential.accessToken);
          }
        }
      }
    })
    .catch((err) => {
      console.warn('Firebase getRedirectResult error:', err);
    });

  // 2. Listen to ongoing auth state
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      savePersistedUser(user);
      const token = cachedAccessToken || getStoredToken();
      if (token) {
        cachedAccessToken = token;
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else {
        // User is still authenticated with Firebase!
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      clearStoredToken();
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Perform Google Sign-In.
 * Automatically tries signInWithPopup; if blocked by browser, seamlessly falls back to signInWithRedirect.
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  if (isSigningIn) {
    console.warn('Google Sign-In already in progress...');
    return null;
  }

  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    saveTokenToStorage(credential.accessToken);
    savePersistedUser(result.user);
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // If browser popup blocker intercepts (common in Firefox / Safari / Mobile)
    if (
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Popup blocked/cancelled by browser. Falling back to signInWithRedirect...', error);
      try {
        await signInWithRedirect(auth, provider);
        return null;
      } catch (redirectErr) {
        console.error('Redirect sign-in failed:', redirectErr);
        throw redirectErr;
      }
    }

    if (error?.code === 'auth/popup-closed-by-user') {
      console.log('Jendela login Google ditutup oleh pengguna.');
      return null;
    }

    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Perform direct redirect sign-in (for users with strict popup blockers)
 */
export const googleSignInRedirect = async (): Promise<void> => {
  await signInWithRedirect(auth, provider);
};

/**
 * Retrieve active access token (from memory or persistent storage)
 */
export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  const stored = getStoredToken();
  if (stored) {
    cachedAccessToken = stored;
    return stored;
  }
  return null;
};

/**
 * Sets access token manually if recovered from auth flow.
 */
export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  if (token) {
    saveTokenToStorage(token);
  } else {
    clearStoredToken();
  }
};

/**
 * Sign out and clear all cached credentials, tokens, and data.
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('SignOut error:', e);
  }
  cachedAccessToken = null;
  clearAllUserSessionAndCaches();
};

