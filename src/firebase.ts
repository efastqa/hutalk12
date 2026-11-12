import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, setLogLevel } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Silence benign internal Firestore stream timeout / idle disconnect logs
try {
  setLogLevel('silent');
} catch {
  // ignore
}

if (typeof window !== 'undefined' && window.console) {
  const originalError = window.console.error;
  window.console.error = (...args: any[]) => {
    const fullText = args
      .map((a) => (typeof a === 'string' ? a : a?.message || String(a)))
      .join(' ');

    if (
      fullText.includes('Disconnecting idle stream') ||
      fullText.includes('Timed out waiting for new targets') ||
      (fullText.includes('@firebase/firestore') && fullText.includes('CANCELLED')) ||
      (fullText.includes('GrpcConnection') && fullText.includes('CANCELLED')) ||
      fullText.includes('cancelling stream')
    ) {
      console.debug('[Firestore Stream Notice]', ...args);
      return;
    }
    originalError.apply(window.console, args);
  };
}

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const msg = error instanceof Error ? error.message : String(error);

  // Benign idle stream timeouts, cancellation, or stream closures should be handled gracefully
  if (
    msg.includes('Disconnecting idle stream') ||
    msg.includes('CANCELLED') ||
    msg.includes('cancelling stream') ||
    msg.includes('idle stream') ||
    (error && typeof error === 'object' && 'code' in error && (error as any).code === 'cancelled')
  ) {
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };

  // Only throw exceptions for explicit mutating write operations where form submits expect a catch block
  if (operationType === OperationType.CREATE || operationType === OperationType.UPDATE || operationType === OperationType.DELETE || operationType === OperationType.WRITE) {
    console.error('Firestore Write Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else {
    // For background reads/listeners, do not throw unhandled runtime exceptions
    console.warn('Firestore Read Warning: ', msg);
  }
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Graceful offline or quota fallback without noisy console errors
  }
}

export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function signInGuest() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('Guest sign-in error:', error);
    throw error;
  }
}

export async function logOutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
}
