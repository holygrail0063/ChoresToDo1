import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDoc,
  query,
  orderBy,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { startOfWeekMonday, endOfWeekSunday, getRotationWeek } from '../utils/weekUtils';
import { getSoleResponsibilityAssignmentForWeek } from '../utils/taskAssignment';
import { getCommonAssignmentsForWeek } from '../utils/taskAssignment';

export interface ChoreEditHistory {
  changedBy: string; // User name
  changedByUid?: string; // User uid
  changedAt: string; // ISO string
  changeType: 'assigned' | 'unassigned' | 'swapped' | 'dueDate' | 'completed' | 'uncompleted';
  oldValue?: string;
  newValue?: string;
  swappedWith?: string; // Name of person swapped with
  swappedWithUid?: string; // UID of person swapped with
}

export interface Chore {
  id: string;
  title: string;
  assignedTo: string; // Legacy: member name (for backward compatibility)
  assignedToUid?: string; // New: user uid
  dueDate: string | null; // ISO string or null
  isDone: boolean;
  doneAt: string | null; // ISO string or null
  isCommonArea?: boolean;
  isSoleResponsibility?: boolean;
  weeklySchedule?: { member: string; week: number }[];
  currentWeek?: number;
  // New: Common bundle fields
  isCommonBundle?: boolean;
  bundleChores?: string[]; // Array of chore titles in this bundle
  bundleId?: string; // Bundle identifier
  editHistory?: ChoreEditHistory[]; // Track all edits
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export const DEFAULT_CHORES: string[] = [];

export const createChore = async (
  houseCode: string,
  title: string,
  assignedTo: string,
  dueDate: string,
  assignedToUid?: string
): Promise<void> => {
  const choresRef = collection(db, 'houses', houseCode, 'chores');
  await addDoc(choresRef, {
    title,
    assignedTo,
    assignedToUid: assignedToUid || null,
    dueDate,
    isDone: false,
    doneAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const updateChore = async (
  houseCode: string,
  choreId: string,
  updates: Partial<{
    title: string;
    assignedTo: string;
    assignedToUid?: string;
    dueDate: string;
    isDone: boolean;
    doneAt: string | null;
  }>,
  editHistory?: ChoreEditHistory
): Promise<void> => {
  try {
    const choreRef = doc(db, 'houses', houseCode, 'chores', choreId);
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Only include fields that are provided and not undefined
    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.assignedTo !== undefined) {
      updateData.assignedTo = updates.assignedTo;
    }
    // Only include assignedToUid if it's defined (not undefined)
    // If undefined, set to null to remove the field or keep existing value
    if (updates.assignedToUid !== undefined) {
      updateData.assignedToUid = updates.assignedToUid || null;
    }
    if (updates.isDone !== undefined) {
      updateData.isDone = updates.isDone;
    }
    if (updates.doneAt !== undefined) {
      updateData.doneAt = updates.doneAt;
    }
    
    // Convert dueDate string to Firestore Timestamp if provided
    if (updates.dueDate) {
      // Handle both "YYYY-MM-DD" format and ISO string format
      let dateObj: Date;
      if (updates.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // YYYY-MM-DD format - add time to make it a valid date
        dateObj = new Date(updates.dueDate + 'T00:00:00');
      } else {
        // ISO string format
        dateObj = new Date(updates.dueDate);
      }
      
      // Validate date
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date format: ${updates.dueDate}`);
      }
      
      // Convert to Firestore Timestamp
      updateData.dueDate = Timestamp.fromDate(dateObj);
    }
    
    // Add edit history if provided
    if (editHistory) {
      const choreSnap = await getDoc(choreRef);
      if (!choreSnap.exists()) {
        throw new Error(`Chore ${choreId} not found in house ${houseCode}`);
      }
      const currentHistory = (choreSnap.data() as Chore)?.editHistory || [];
      updateData.editHistory = [...currentHistory, editHistory];
    }
    
    console.log('Updating chore:', { houseCode, choreId, updateData });
    await updateDoc(choreRef, updateData);
    console.log('Chore updated successfully');
  } catch (error: any) {
    console.error('Error updating chore:', error);
    console.error('Error code:', error?.code);
    console.error('Error message:', error?.message);
    console.error('Update data:', { houseCode, choreId, updates });
    throw error;
  }
};

export const deleteChore = async (
  houseCode: string,
  choreId: string
): Promise<void> => {
  const choreRef = doc(db, 'houses', houseCode, 'chores', choreId);
  await deleteDoc(choreRef);
};

/**
 * Updates all chores assigned to a specific user (by uid or by name) with a new name and uid
 * This is called when a user changes their name or enters their name for the first time
 * It links existing chores assigned by name to the user's UID
 */
export const updateChoresForUser = async (
  houseCode: string,
  uid: string,
  newName: string
): Promise<void> => {
  const choresRef = collection(db, 'houses', houseCode, 'chores');
  const snapshot = await getDocs(choresRef);
  
  const updatePromises: Promise<void>[] = [];
  
  // Normalize name for comparison (trim + toLowerCase)
  const normalizeName = (name: string | null | undefined): string => {
    return (name || '').trim().toLowerCase();
  };
  const normalizedNewName = normalizeName(newName);
  
  snapshot.forEach((docSnap) => {
    const chore = docSnap.data() as Chore;
    const choreRef = doc(db, 'houses', houseCode, 'chores', docSnap.id);
    const normalizedAssignedTo = normalizeName(chore.assignedTo);
    
    // Update chores that are assigned to this user by uid
    if (chore.assignedToUid === uid) {
      updatePromises.push(
        updateDoc(choreRef, {
          assignedTo: newName,
          updatedAt: serverTimestamp(),
        })
      );
    }
    // Also update chores assigned by name (but not by UID) to link them to this user's UID
    // This ensures "My Chores" filtering works for existing chores assigned by name
    else if (!chore.assignedToUid && normalizedAssignedTo === normalizedNewName) {
      updatePromises.push(
        updateDoc(choreRef, {
          assignedTo: newName,
          assignedToUid: uid,
          updatedAt: serverTimestamp(),
        })
      );
    }
  });
  
  await Promise.all(updatePromises);
};

export const subscribeToChores = (
  houseCode: string,
  callback: (chores: Chore[]) => void
): (() => void) => {
  const choresRef = collection(db, 'houses', houseCode, 'chores');
  const q = query(choresRef, orderBy('createdAt', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const chores: Chore[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert dueDate from Firestore Timestamp to ISO string if it exists
      let dueDate: string | null = null;
      if (data.dueDate) {
        if (data.dueDate.toDate) {
          // Firestore Timestamp
          dueDate = data.dueDate.toDate().toISOString();
        } else if (typeof data.dueDate === 'string') {
          // Already a string (backward compatibility)
          dueDate = data.dueDate;
        }
      }
      
      return {
        id: doc.id,
        ...data,
        dueDate, // Override with converted value
      } as Chore;
    });
    callback(chores);
  });
};

export const initializeChoresWithAssignments = async (
  houseCode: string,
  tasks: string[],
  assignments: Record<string, string>
): Promise<void> => {
  const choresRef = collection(db, 'houses', houseCode, 'chores');
  const snapshot = await getDocs(choresRef);
  
  // Only initialize if no chores exist
  if (snapshot.empty) {
    const nextSunday = getNextSunday();
    
    for (const task of tasks) {
      await addDoc(choresRef, {
        title: task,
        assignedTo: assignments[task] || '',
        dueDate: nextSunday.toISOString(),
        isDone: false,
        doneAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
};

// Support both old (week) and new (rotationIndex) assignment formats
type Assignment = 
  | { member: string; week: number } // Legacy format
  | { member: string; rotationIndex: number }; // New format

export const initializeChoresWithSchedule = async (
  houseCode: string,
  commonAreaTasks: string[],
  soleResponsibilityTasks: string[],
  commonAreaAssignments: Record<string, Assignment[]>,
  soleResponsibilityAssignments: Record<string, Assignment[]>,
  membersMap?: { [uid: string]: { name: string; joinedAt?: any } } | { [name: string]: string }, // Map uid to Member OR name to uid (for backward compatibility)
  scheduleStartDate?: Date,
  cycleLength?: number,
  commonChoreBundles?: Array<{ id: string; title: string; choreTitles: string[] }>, // New: bundles
  members?: string[] // Needed for bundle assignments
): Promise<void> => {
  const choresRef = collection(db, 'houses', houseCode, 'chores');
  const snapshot = await getDocs(choresRef);
  
  // Only initialize if no chores exist
  if (snapshot.empty) {
    const today = new Date();
    const scheduleStart = scheduleStartDate || startOfWeekMonday(today);
    const cycleLen = cycleLength || 4;
    
    // Calculate current rotation index
    const { rotationIndex } = getRotationWeek(scheduleStart, today, cycleLen);
    
    // Calculate due date (end of current week - Sunday)
    const thisSunday = endOfWeekSunday(today);
    
    // Create chores for common areas
    // NEW APPROACH: Use bundles (one bundle per member per week)
    if (commonChoreBundles && commonChoreBundles.length > 0 && members && members.length > 0) {
      const bundleAssignments = getCommonAssignmentsForWeek(commonChoreBundles, members, rotationIndex);
      
      for (const assignment of bundleAssignments) {
        const bundle = commonChoreBundles.find(b => b.id === assignment.bundleId);
        if (!bundle) continue;
        
        // Find UID for the assigned member
        let assignedToUid: string | undefined = undefined;
        if (membersMap && assignment.memberName) {
          // Check if membersMap is uid->Member format or name->uid format
          const memberEntry = Object.entries(membersMap).find(([key, value]) => {
            if (typeof value === 'string') {
              // Legacy format: name -> uid
              return key === assignment.memberName;
            } else {
              // New format: uid -> Member
              return value.name === assignment.memberName;
            }
          });
          if (memberEntry) {
            assignedToUid = typeof memberEntry[1] === 'string' ? memberEntry[1] : memberEntry[0];
          }
        }
        
        await addDoc(choresRef, {
          title: bundle.title,
          assignedTo: assignment.memberName,
          assignedToUid: assignedToUid || null,
          dueDate: thisSunday.toISOString(),
          isDone: false,
          doneAt: null,
          isCommonArea: true,
          isCommonBundle: true,
          bundleChores: bundle.choreTitles,
          bundleId: bundle.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } else {
      // LEGACY APPROACH: Individual task assignments (backward compatibility)
      // TODO: Migrate old houses to use bundles
      for (const task of commonAreaTasks) {
        const assignments = commonAreaAssignments[task] || [];
        
        // Find assignment for current rotation index
        // Support both old format (week) and new format (rotationIndex)
        const currentAssignment = assignments.find(a => {
          if ('rotationIndex' in a) {
            return a.rotationIndex === rotationIndex;
          } else {
            // Legacy: map week 1-5 to rotation index (week 1 = index 0, etc.)
            return (a.week - 1) % cycleLen === rotationIndex;
          }
        });
        
        const assignedMember = currentAssignment?.member || '';
        const assignedToUid = membersMap && assignedMember ? membersMap[assignedMember] : undefined;
        
        await addDoc(choresRef, {
          title: task,
          assignedTo: assignedMember,
          assignedToUid: assignedToUid || null,
          dueDate: thisSunday.toISOString(),
          isDone: false,
          doneAt: null,
          isCommonArea: true,
          weeklySchedule: assignments, // Keep for backward compatibility
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
    
    // Create chores for sole responsibility tasks with rotating assignments
    // Sole responsibility rotates through responsible members (one person per week)
    for (const task of soleResponsibilityTasks) {
      const weeklyAssignments = soleResponsibilityAssignments[task] || [];
      const scheduleStartMonday = startOfWeekMonday(scheduleStart);
      const todayMonday = startOfWeekMonday(today);
      
      // Get assigned member for current week (rotates through responsible members)
      const assignedMember = getSoleResponsibilityAssignmentForWeek(
        weeklyAssignments as Array<{ member: string; rotationIndex?: number; week?: number }>,
        scheduleStartMonday,
        todayMonday
      );
      
      let assignedToUid: string | undefined = undefined;
      if (membersMap && assignedMember !== 'Unassigned' && assignedMember) {
        // Find UID for the assigned member
        const memberEntry = Object.entries(membersMap).find(([key, value]) => {
          if (typeof value === 'string') {
            // Legacy format: name -> uid
            return key === assignedMember;
          } else {
            // New format: uid -> Member
            return value.name === assignedMember;
          }
        });
        if (memberEntry) {
          assignedToUid = typeof memberEntry[1] === 'string' ? memberEntry[1] : memberEntry[0];
        }
      }
      
      await addDoc(choresRef, {
        title: task,
        assignedTo: assignedMember !== 'Unassigned' ? assignedMember : '',
        assignedToUid: assignedToUid || null,
        dueDate: thisSunday.toISOString(),
        isDone: false,
        doneAt: null,
        isCommonArea: false,
        isSoleResponsibility: true,
        weeklySchedule: weeklyAssignments, // Keep for backward compatibility
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }
};

function getNextSunday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
  const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  nextSunday.setHours(23, 59, 59, 999); // End of Sunday
  return nextSunday;
}

