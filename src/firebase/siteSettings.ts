import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './config';

export interface SiteSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  allowNewHouseCreation: boolean;
  maxMembersPerHouse: number;
  maxChoresPerHouse: number;
  uiTheme?: 'light' | 'dark';
  userThemeAccess?: boolean;
}

const defaultSettings: SiteSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'The site is currently under maintenance. Please check back later.',
  allowNewHouseCreation: true,
  maxMembersPerHouse: 11,
  maxChoresPerHouse: 50,
  uiTheme: 'light',
  userThemeAccess: false,
};

/**
 * Gets site settings from Firestore
 * Returns default settings if document doesn't exist
 */
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const settingsDocRef = doc(db, 'siteSettings', 'main');
    const settingsDoc = await getDoc(settingsDocRef);
    
    if (settingsDoc.exists()) {
      return { ...defaultSettings, ...settingsDoc.data() } as SiteSettings;
    }
    
    // Initialize with defaults if doesn't exist
    await setDoc(settingsDocRef, defaultSettings);
    return defaultSettings;
  } catch (error) {
    console.error('Error getting site settings:', error);
    return defaultSettings;
  }
};

/**
 * Updates site settings (admin only - enforced by Firestore rules)
 */
export const updateSiteSettings = async (
  partial: Partial<SiteSettings>
): Promise<void> => {
  try {
    const settingsDocRef = doc(db, 'siteSettings', 'main');
    const currentSettings = await getSiteSettings();
    const updatedSettings = { ...currentSettings, ...partial };
    
    await setDoc(settingsDocRef, updatedSettings, { merge: true });
    console.log('Site settings updated:', partial);
  } catch (error) {
    console.error('Error updating site settings:', error);
    throw error;
  }
};

