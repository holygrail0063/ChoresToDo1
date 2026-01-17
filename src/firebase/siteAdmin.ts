import { doc, getDoc } from 'firebase/firestore';
import { db } from './config';
import { signInAnonymous, waitForAuth } from './auth';

/**
 * Ensures anonymous authentication is initialized
 */
export const ensureAnonAuth = async (): Promise<string> => {
  try {
    await signInAnonymous();
    const uid = await waitForAuth();
    return uid;
  } catch (error) {
    console.error('Failed to ensure anonymous auth:', error);
    throw error;
  }
};

/**
 * Gets the current user's UID
 */
export const getCurrentUid = async (): Promise<string> => {
  return await ensureAnonAuth();
};

/**
 * Checks if a user is a site admin by checking if siteAdmins/{uid} document exists
 */
export const isSiteAdmin = async (uid: string): Promise<boolean> => {
  try {
    const adminDocRef = doc(db, 'siteAdmins', uid);
    const adminDoc = await getDoc(adminDocRef);
    return adminDoc.exists();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

