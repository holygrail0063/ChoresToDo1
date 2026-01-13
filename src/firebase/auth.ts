import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from './config';

export const signInAnonymous = async () => {
  try {
    const userCredential = await signInAnonymously(auth);
    console.log('Anonymous sign-in successful:', userCredential.user.uid);
    return userCredential.user;
  } catch (error: any) {
    console.error('Error signing in anonymously:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    throw error;
  }
};

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const waitForAuth = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Set a timeout to avoid hanging forever
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Authentication timeout: No user after 5 seconds'));
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      clearTimeout(timeout);
      unsubscribe();
      if (user) {
        console.log('Auth state changed: User authenticated', user.uid);
        resolve(user.uid);
      } else {
        console.error('Auth state changed: No user');
        reject(new Error('No authenticated user'));
      }
    });
  });
};

