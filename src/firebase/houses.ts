import { 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './config';
import { generateHouseCode } from '../utils/houseCode';
import { signInAnonymous, waitForAuth } from './auth';
import { startOfWeekMonday, timestampToDate } from '../utils/weekUtils';

export interface Member {
  name: string;
  joinedAt: Timestamp;
}

export interface CommonChoreBundle {
  id: string;
  title: string;
  choreTitles: string[];
}

export interface House {
  createdAt: Timestamp;
  name: string;
  memberCount: number;
  tasks: string[];
  members: string[]; // Legacy: member names array (for backward compatibility)
  soleResponsibilityTasks?: string[];
  commonAreaAssignments?: Record<string, { member: string; week: number }[]>; // Legacy: week 1-5, kept for backward compatibility
  soleResponsibilityAssignments?: Record<string, { member: string; week: number }[]>; // Legacy: week 1-5
  // New fields
  adminUid?: string;
  membersMap?: { [uid: string]: Member }; // New: uid -> member info mapping
  // Schedule fields
  scheduleStartDate?: Timestamp; // Monday of the week the house was created
  weekStartsOn?: string; // Always "MON"
  cycleLength?: number; // Default to memberCount
  _scheduleMigrated?: boolean; // Internal flag to prevent re-migration
  // Common chore bundles (new approach - one bundle per member per week)
  commonChoreBundles?: CommonChoreBundle[];
  // Admin fields
  status?: 'active' | 'disabled';
}

export const createHouse = async (
  houseCode: string,
  name: string,
  memberCount: number,
  commonAreaTasks: string[],
  members: string[],
  creatorUid: string,
  creatorName: string,
  soleResponsibilityTasks: string[] = [],
  commonAreaAssignments?: Record<string, { member: string; week: number }[]>,
  soleResponsibilityAssignments?: Record<string, { member: string; week: number }[]>,
  commonChoreBundles?: CommonChoreBundle[]
): Promise<void> => {
  const houseRef = doc(db, 'houses', houseCode);
  
  // Set schedule start date to Monday of creation week
  const now = new Date();
  const scheduleStartMonday = startOfWeekMonday(now);
  const cycleLength = memberCount || members.length || 4;
  
  // Only add creator to membersMap if a name was provided
  const membersMap: { [uid: string]: Member } = {};
  if (creatorName && creatorName.trim()) {
    membersMap[creatorUid] = {
      name: creatorName.trim(),
      joinedAt: serverTimestamp() as Timestamp,
    };
  }
  
  await setDoc(houseRef, {
    name,
    memberCount,
    tasks: commonAreaTasks,
    members, // Keep for backward compatibility
    soleResponsibilityTasks,
    commonAreaAssignments: commonAreaAssignments || {},
    soleResponsibilityAssignments: soleResponsibilityAssignments || {},
    adminUid: creatorUid,
    membersMap,
    scheduleStartDate: Timestamp.fromDate(scheduleStartMonday),
    weekStartsOn: 'MON',
    cycleLength,
    commonChoreBundles: commonChoreBundles || [], // New: bundles
    createdAt: serverTimestamp(),
  });
};

export const addMember = async (
  houseCode: string,
  uid: string,
  name: string
): Promise<void> => {
  const houseRef = doc(db, 'houses', houseCode);
  const houseSnap = await getDoc(houseRef);
  
  if (!houseSnap.exists()) {
    throw new Error('House not found');
  }
  
  const house = houseSnap.data() as House;
  const currentMembers = house.membersMap || {};
  
  await updateDoc(houseRef, {
    membersMap: {
      ...currentMembers,
      [uid]: {
        name,
        joinedAt: serverTimestamp() as Timestamp,
      }
    }
  });
};

/**
 * Migrates a house to include schedule fields if missing
 * Also migrates to bundles if house has commonAreaTasks but no bundles
 */
async function migrateHouseSchedule(houseRef: any, house: House): Promise<void> {
  const needsScheduleMigration = !house.scheduleStartDate || !house.cycleLength || house._scheduleMigrated !== true;
  const needsBundleMigration = (house.tasks && house.tasks.length > 0 && !house.commonChoreBundles);
  
  if (!needsScheduleMigration && !needsBundleMigration) {
    return;
  }
  
  const updates: Partial<House> = {};
  
  // Set scheduleStartDate: use createdAt if available, otherwise use current Monday
  if (!house.scheduleStartDate) {
    const baseDate = house.createdAt 
      ? timestampToDate(house.createdAt) || new Date()
      : new Date();
    const scheduleStartMonday = startOfWeekMonday(baseDate);
    updates.scheduleStartDate = Timestamp.fromDate(scheduleStartMonday);
  }
  
  // Set cycleLength: use memberCount or members.length
  if (!house.cycleLength) {
    updates.cycleLength = house.memberCount || house.members?.length || 4;
  }
  
  // Always set weekStartsOn
  updates.weekStartsOn = 'MON';
  updates._scheduleMigrated = true;
  
  // TODO: Migrate to bundles for old houses
  // For now, we keep legacy houses with individual task assignments
  // Future: Add admin button to migrate old houses to bundles
  // if (needsBundleMigration && house.tasks) {
  //   const { buildCommonBundles } = await import('../utils/taskAssignment');
  //   const memberCount = house.memberCount || house.members?.length || 4;
  //   updates.commonChoreBundles = buildCommonBundles(house.tasks, memberCount);
  // }
  
  await updateDoc(houseRef, updates);
}

export const getHouse = async (houseCode: string): Promise<House | null> => {
  const houseRef = doc(db, 'houses', houseCode);
  const houseSnap = await getDoc(houseRef);
  if (houseSnap.exists()) {
    const house = houseSnap.data() as House;
    
    // Migrate schedule fields if needed (one-time migration)
    await migrateHouseSchedule(houseRef, house);
    
    // Re-fetch to get updated data
    const updatedSnap = await getDoc(houseRef);
    if (updatedSnap.exists()) {
      return updatedSnap.data() as House;
    }
    return house;
  }
  return null;
};

/**
 * Creates a house with a unique code, checking Firestore for collisions.
 * Retries up to 10 times to find a unique code.
 * 
 * @param payload - House creation data (excluding houseCode)
 * @returns Object with the unique houseCode
 * @throws Error if unable to generate unique code after 10 attempts
 */
export interface CreateHousePayload {
  name: string;
  memberCount: number;
  commonAreaTasks: string[];
  members: string[];
  soleResponsibilityTasks?: string[];
  commonAreaAssignments?: Record<string, { member: string; rotationIndex: number }[] | { member: string; week: number }[]>;
  soleResponsibilityAssignments?: Record<string, { member: string; rotationIndex: number }[] | { member: string; week: number }[]>;
  creatorUid: string;
  creatorName: string;
  commonChoreBundles?: CommonChoreBundle[];
}

export const createHouseWithUniqueCode = async (
  payload: CreateHousePayload
): Promise<{ houseCode: string }> => {
  // Ensure user is authenticated
  try {
    await signInAnonymous();
    await waitForAuth();
  } catch (error) {
    console.error('Auth error:', error);
    throw new Error('Failed to authenticate. Please try again.');
  }

  const maxAttempts = 10;
  let attempts = 0;

  while (attempts < maxAttempts) {
    attempts++;
    const houseCode = generateHouseCode(6);
    
    // Check if code already exists
    const houseRef = doc(db, 'houses', houseCode);
    const houseSnap = await getDoc(houseRef);
    
    if (!houseSnap.exists()) {
      // Code is unique, create the house
      try {
        await createHouse(
          houseCode,
          payload.name,
          payload.memberCount,
          payload.commonAreaTasks,
          payload.members,
          payload.creatorUid,
          payload.creatorName,
          payload.soleResponsibilityTasks || [],
          payload.commonAreaAssignments as Record<string, { member: string; week: number }[]> | undefined,
          payload.soleResponsibilityAssignments as Record<string, { member: string; week: number }[]> | undefined,
          payload.commonChoreBundles
        );
        return { houseCode };
      } catch (error) {
        console.error('Error creating house:', error);
        throw new Error('Failed to create house. Please try again.');
      }
    }
    // Code exists, try again
  }

  // If we've exhausted all attempts
  throw new Error(
    'Unable to generate a unique house code after multiple attempts. ' +
    'Please try again in a moment.'
  );
};


