import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  type Auth,
  type User as FirebaseUser
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  type Firestore
} from 'firebase/firestore';
import type { FirebaseConfig, SaasTenant, SaasUser } from '../types/saas';
import { TRIAL_DURATION_DAYS } from '../types/saas';

const STORAGE_KEY_FIREBASE = 'construction_khata_firebase_config';
const STORAGE_KEY_LOCAL_USERS = 'construction_khata_saas_users';
const STORAGE_KEY_LOCAL_TENANTS = 'construction_khata_saas_tenants';
const STORAGE_KEY_CURRENT_SESSION = 'construction_khata_saas_session';

// Live Google Firebase project configuration
const metaEnv = (import.meta as any).env || {};
export const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || 'AIzaSyC2bsyOdUU-UrsDhxV3y8gV5ewIGOtC608',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || 'construction-khata-fedf6.firebaseapp.com',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || 'construction-khata-fedf6',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || 'construction-khata-fedf6.firebasestorage.app',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '260262281984',
  appId: metaEnv.VITE_FIREBASE_APP_ID || '1:260262281984:web:cd0fb1bd84bd21d48c69e5',
  measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || 'G-J65BSTZQ60'
};

export function getSavedFirebaseConfig(): FirebaseConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return DEFAULT_CONFIG.apiKey ? DEFAULT_CONFIG : null;
}

export function saveFirebaseConfig(cfg: FirebaseConfig) {
  localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(cfg));
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseFirestore: Firestore | null = null;

export function initFirebaseService() {
  const cfg = getSavedFirebaseConfig();
  if (cfg && cfg.apiKey && cfg.projectId) {
    try {
      if (!getApps().length) {
        firebaseApp = initializeApp(cfg);
      } else {
        firebaseApp = getApps()[0];
      }
      firebaseAuth = getAuth(firebaseApp);
      firebaseFirestore = getFirestore(firebaseApp);
      return { app: firebaseApp, auth: firebaseAuth, db: firebaseFirestore, isLive: true };
    } catch (err) {
      console.warn('Firebase init error, using local fallback:', err);
    }
  }
  return { app: null, auth: null, db: null, isLive: false };
}

// ----------------- LOCAL SAAS PERSISTENCE FALLBACK -----------------
function getLocalTenants(): SaasTenant[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_TENANTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function getLocalUsers(): SaasUser[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOCAL_USERS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  const now = Date.now();
  const initialUsers: SaasUser[] = [
    // Super Admin (YOU)
    {
      id: 'super_admin_owner',
      tenantId: 'platform_owner',
      email: 'admin@khata.ai',
      displayName: 'Khata Platform Owner',
      role: 'super_admin',
      isSuperAdmin: true,
      createdAt: now
    }
  ];
  localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(initialUsers));
  return initialUsers;
}

export function saveLocalTenants(tenants: SaasTenant[]) {
  localStorage.setItem(STORAGE_KEY_LOCAL_TENANTS, JSON.stringify(tenants));
}

export function saveLocalUsers(users: SaasUser[]) {
  localStorage.setItem(STORAGE_KEY_LOCAL_USERS, JSON.stringify(users));
}

export function getCurrentSession(): { user: SaasUser; tenant: SaasTenant } | null {
  try {
    // Read from permanent localStorage (or sessionStorage fallback)
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION) || sessionStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Purge legacy dummy demo contractor
      if (parsed.user?.email === 'contractor@sharma.com' || parsed.user?.displayName?.includes('Ramesh Sharma')) {
        localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
        sessionStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
        return null;
      }
      return parsed;
    }
  } catch (e) {}
  return null;
}

export function saveCurrentSession(user: SaasUser | null, tenant: SaasTenant | null) {
  try {
    if (!user || !tenant) {
      localStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
      sessionStorage.removeItem(STORAGE_KEY_CURRENT_SESSION);
    } else {
      const data = JSON.stringify({ user, tenant });
      // Store in permanent localStorage so user stays logged in forever until manual logout
      localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, data);
      sessionStorage.setItem(STORAGE_KEY_CURRENT_SESSION, data);
    }
  } catch (e) {}
}

// ----------------- AUTHENTICATION & REGISTRATION -----------------

export async function saasRegisterContractor(params: {
  firmName: string;
  email: string;
  password?: string;
  phone?: string;
  displayName: string;
}): Promise<{ user: SaasUser; tenant: SaasTenant }> {
  const now = Date.now();
  const trialEnd = now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000; // 4 Months Free

  const tenantId = 'tenant_' + Date.now();
  const userId = 'usr_' + Date.now();

  const newTenant: SaasTenant = {
    id: tenantId,
    name: params.firmName || 'My Construction Firm',
    ownerId: userId,
    ownerEmail: params.email,
    ownerPhone: params.phone,
    plan: 'free_trial',
    status: 'active',
    trialStartDate: now,
    trialEndDate: trialEnd,
    maxAllowedSites: 1, // 1 Site Free for 4 Months
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  const newUser: SaasUser = {
    id: userId,
    tenantId: tenantId,
    email: params.email,
    displayName: params.displayName || params.firmName,
    phone: params.phone,
    role: 'contractor_admin',
    isSuperAdmin: false,
    createdAt: now,
    lastLoginAt: now
  };

  // If live Firebase auth is enabled, attempt firebase auth creation
  const { auth, db, isLive } = initFirebaseService();
  if (isLive && auth && db && params.password) {
    try {
      const fbCred = await createUserWithEmailAndPassword(auth, params.email, params.password);
      newUser.id = fbCred.user.uid;
      newTenant.ownerId = fbCred.user.uid;

      // Sync tenant & user documents to Firestore
      await setDoc(doc(db, 'tenants', tenantId), newTenant);
      await setDoc(doc(db, 'users', fbCred.user.uid), newUser);
    } catch (fbErr) {
      console.warn('Firebase registration failed, stored locally:', fbErr);
    }
  }

  // Update local storage
  const tenants = getLocalTenants();
  tenants.push(newTenant);
  saveLocalTenants(tenants);

  const users = getLocalUsers();
  users.push(newUser);
  saveLocalUsers(users);

  saveCurrentSession(newUser, newTenant);
  return { user: newUser, tenant: newTenant };
}

export async function saasLoginUser(
  email: string,
  password?: string
): Promise<{ user: SaasUser; tenant: SaasTenant }> {
  const { auth, db, isLive } = initFirebaseService();
  const now = Date.now();

  if (isLive && auth && db && password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
      if (userDoc.exists()) {
        const u = userDoc.data() as SaasUser;
        const tenantDoc = await getDoc(doc(db, 'tenants', u.tenantId));
        const t = (tenantDoc.data() as SaasTenant) || {
          id: u.tenantId,
          name: 'My Firm',
          ownerId: u.id,
          ownerEmail: u.email,
          plan: 'free_trial',
          status: 'active',
          trialStartDate: now,
          trialEndDate: now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
          maxAllowedSites: 1,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now
        };

        u.lastLoginAt = now;
        t.lastLoginAt = now;
        try {
          await updateDoc(doc(db, 'tenants', t.id), { lastLoginAt: now, updatedAt: now });
          await updateDoc(doc(db, 'users', u.id), { lastLoginAt: now });
        } catch (e) {}

        saveCurrentSession(u, t);
        return { user: u, tenant: t };
      }
    } catch (err) {
      console.warn('Firebase login failed, falling back to local user store:', err);
    }
  }

  // Check local users
  const users = getLocalUsers();
  const tenants = getLocalTenants();

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // If account not found in local store, automatically onboard contractor with 4-Month Free Plan
    const defaultFirm =
      email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()) +
      ' Construction';
    return await saasRegisterContractor({
      firmName: defaultFirm,
      email,
      password,
      displayName: defaultFirm
    });
  }

  const tenant = tenants.find(t => t.id === user.tenantId) || {
    id: user.tenantId,
    name: 'My Construction Co.',
    ownerId: user.id,
    ownerEmail: user.email,
    plan: 'free_trial',
    status: 'active',
    trialStartDate: now,
    trialEndDate: now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000,
    maxAllowedSites: 1,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now
  };

  user.lastLoginAt = now;
  tenant.lastLoginAt = now;
  tenant.updatedAt = now;

  // Persist updated lastLoginAt locally
  const uIdx = users.findIndex(u => u.id === user.id);
  if (uIdx !== -1) {
    users[uIdx] = { ...user, lastLoginAt: now };
    saveLocalUsers(users);
  }
  const tIdx = tenants.findIndex(t => t.id === tenant.id);
  if (tIdx !== -1) {
    tenants[tIdx] = { ...tenant, lastLoginAt: now, updatedAt: now };
    saveLocalTenants(tenants);
  }

  saveCurrentSession(user, tenant);
  return { user, tenant };
}

export async function saasLoginWithGoogle(): Promise<{ user: SaasUser; tenant: SaasTenant }> {
  const { auth, db, isLive } = initFirebaseService();
  const now = Date.now();

  if (isLive && auth) {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, provider);
      const email = cred.user.email || '';
      const displayName = cred.user.displayName || email.split('@')[0];

      if (db) {
        try {
          const userDoc = await getDoc(doc(db, 'users', cred.user.uid));
          if (userDoc.exists()) {
            const u = userDoc.data() as SaasUser;
            const tenantDoc = await getDoc(doc(db, 'tenants', u.tenantId));
            const t = tenantDoc.data() as SaasTenant;
            u.lastLoginAt = now;
            t.lastLoginAt = now;
            try {
              await updateDoc(doc(db, 'tenants', t.id), { lastLoginAt: now, updatedAt: now });
              await updateDoc(doc(db, 'users', u.id), { lastLoginAt: now });
            } catch (e) {}
            saveCurrentSession(u, t);
            return { user: u, tenant: t };
          }
        } catch (readErr) {
          console.warn('Could not read existing user doc from Firestore:', readErr);
        }
      }

      // New Google User: Create tenant and user with 4-Month Free Plan
      const tenantId = 'tenant_' + Date.now();
      const defaultFirm = displayName + ' Construction';

      const newTenant: SaasTenant = {
        id: tenantId,
        name: defaultFirm,
        ownerId: cred.user.uid,
        ownerEmail: email,
        plan: 'free_trial',
        status: 'active',
        trialStartDate: now,
        trialEndDate: now + TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000, // 4 Months Free!
        maxAllowedSites: 1,
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };

      const newUser: SaasUser = {
        id: cred.user.uid,
        tenantId,
        email,
        displayName,
        role: 'contractor_admin',
        isSuperAdmin: false,
        createdAt: now,
        lastLoginAt: now
      };

      if (db) {
        try {
          await setDoc(doc(db, 'tenants', tenantId), newTenant);
          await setDoc(doc(db, 'users', cred.user.uid), newUser);
        } catch (writeErr) {
          console.warn('Could not save user/tenant to Firestore:', writeErr);
        }
      }

      // Save locally as well
      const tenants = getLocalTenants();
      tenants.push(newTenant);
      saveLocalTenants(tenants);

      const users = getLocalUsers();
      users.push(newUser);
      saveLocalUsers(users);

      saveCurrentSession(newUser, newTenant);
      return { user: newUser, tenant: newTenant };
    } catch (err: any) {
      console.warn('Google sign-in popup error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        throw new Error('Google Sign-in was cancelled by user.');
      }
      if (err.code === 'auth/unauthorized-domain') {
        throw new Error('Domain not authorized: Firebase Console > Authentication > Settings > Authorized domains mein "construction-khata-ai1.vercel.app" add karein.');
      }
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/operation-not-allowed') {
        throw new Error('Firebase Console mein Google Sign-in enable nahi hai. Authentication > Sign-in method mein Google provider ON karein.');
      }
      if (err.code === 'auth/network-request-failed' || err.message?.includes('network-request-failed')) {
        throw new Error('Google Sign-in setup pending: Firebase Console mein "Google" provider enable karein aur Authorized Domains mein vercel app URL jodein. Ya fir niche Email & Password se turant Sign In karein!');
      }
      throw new Error(err.message || 'Google Sign-in failed');
    }
  }

  // If Firebase is not configured yet with live credentials:
  throw new Error(
    'Firebase backend is not configured yet. To use real Google Sign-In, please add your Firebase credentials in Super Admin (?admin=true) or .env. In the meantime, you can test with Email & Password.'
  );
}

export async function saasSignOut() {
  const { auth, isLive } = initFirebaseService();
  if (isLive && auth) {
    try {
      await signOut(auth);
    } catch (e) {}
  }
  saveCurrentSession(null, null);
}

// ----------------- SUPER ADMIN CAPABILITIES -----------------

export async function fetchAllSaaSTenants(): Promise<SaasTenant[]> {
  const { db, isLive } = initFirebaseService();
  if (isLive && db) {
    try {
      const snap = await getDocs(collection(db, 'tenants'));
      const list: SaasTenant[] = [];
      snap.forEach(d => list.push(d.data() as SaasTenant));
      if (list.length > 0) return list;
    } catch (e) {
      console.warn('Firestore fetch failed:', e);
    }
  }
  return getLocalTenants();
}

export async function updateTenantPlanByAdmin(
  tenantId: string,
  updates: Partial<SaasTenant>
) {
  const { db, isLive } = initFirebaseService();
  if (isLive && db) {
    try {
      await updateDoc(doc(db, 'tenants', tenantId), updates);
    } catch (e) {}
  }

  const tenants = getLocalTenants();
  const idx = tenants.findIndex(t => t.id === tenantId);
  if (idx !== -1) {
    tenants[idx] = { ...tenants[idx], ...updates, updatedAt: Date.now() };
    saveLocalTenants(tenants);

    // If current active session belongs to this tenant, update session as well
    const session = getCurrentSession();
    if (session && session.tenant.id === tenantId) {
      saveCurrentSession(session.user, tenants[idx]);
    }
  }
}

export async function deleteTenantByAdmin(tenantId: string) {
  const { db, isLive } = initFirebaseService();
  if (isLive && db) {
    try {
      await deleteDoc(doc(db, 'tenants', tenantId));
    } catch (e) {}
  }

  // Remove from local tenants
  const tenants = getLocalTenants().filter(t => t.id !== tenantId);
  saveLocalTenants(tenants);

  // Remove users associated with this tenant
  const users = getLocalUsers().filter(u => u.tenantId !== tenantId);
  saveLocalUsers(users);

  // If current active session was this tenant, reset to remaining tenant or clear
  const session = getCurrentSession();
  if (session && session.tenant.id === tenantId) {
    if (tenants.length > 0) {
      const nextUser = users.find(u => u.tenantId === tenants[0].id) || users[0];
      saveCurrentSession(nextUser, tenants[0]);
    } else {
      saveCurrentSession(null, null);
    }
  }
}
