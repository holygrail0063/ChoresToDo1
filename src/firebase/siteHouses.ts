import { collection, query, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from './config';

export interface HouseListItem {
  houseCode: string;
  name: string;
  memberCount: number;
  createdAt: any; // Firestore Timestamp
  status?: 'active' | 'disabled';
  lastActivityAt?: any; // Firestore Timestamp
}

/**
 * Lists all houses with optional search and limit
 */
export const listHouses = async (
  searchTerm?: string,
  maxResults: number = 100
): Promise<HouseListItem[]> => {
  try {
    const housesRef = collection(db, 'houses');
    let q = query(housesRef, orderBy('createdAt', 'desc'), limit(maxResults));
    
    // If search term provided, filter by houseCode or name
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      // Note: Firestore doesn't support case-insensitive search natively
      // We'll filter client-side for now
      const allDocs = await getDocs(q);
      const filtered = allDocs.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(house => {
          const code = (house.houseCode || '').toLowerCase();
          const name = (house.name || '').toLowerCase();
          return code.includes(searchLower) || name.includes(searchLower);
        })
        .slice(0, maxResults);
      
      return filtered.map(house => ({
        houseCode: house.houseCode || house.id,
        name: house.name || '',
        memberCount: house.memberCount || 0,
        createdAt: house.createdAt,
        status: house.status || 'active',
        lastActivityAt: house.lastActivityAt,
      }));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        houseCode: doc.id,
        name: data.name || '',
        memberCount: data.memberCount || 0,
        createdAt: data.createdAt,
        status: data.status || 'active',
        lastActivityAt: data.lastActivityAt,
      };
    });
  } catch (error) {
    console.error('Error listing houses:', error);
    throw error;
  }
};

/**
 * Updates house status (admin only - enforced by Firestore rules)
 */
export const updateHouseStatus = async (
  houseCode: string,
  status: 'active' | 'disabled'
): Promise<void> => {
  try {
    const houseRef = doc(db, 'houses', houseCode);
    await updateDoc(houseRef, { status });
    console.log(`House ${houseCode} status updated to: ${status}`);
  } catch (error) {
    console.error('Error updating house status:', error);
    throw error;
  }
};

/**
 * Gets house statistics for admin dashboard
 */
export const getHouseStats = async (): Promise<{
  totalHouses: number;
  housesCreatedToday: number;
  activeHouses: number;
}> => {
  try {
    const houses = await listHouses(undefined, 1000);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const housesCreatedToday = houses.filter(house => {
      if (!house.createdAt) return false;
      const createdAt = house.createdAt.toDate ? house.createdAt.toDate() : new Date(house.createdAt);
      return createdAt >= todayStart;
    }).length;
    
    const activeHouses = houses.filter(house => {
      if (house.status === 'disabled') return false;
      if (!house.lastActivityAt) return true; // Consider active if no lastActivityAt
      const lastActivity = house.lastActivityAt.toDate ? house.lastActivityAt.toDate() : new Date(house.lastActivityAt);
      return lastActivity >= yesterday;
    }).length;
    
    return {
      totalHouses: houses.length,
      housesCreatedToday,
      activeHouses,
    };
  } catch (error) {
    console.error('Error getting house stats:', error);
    return {
      totalHouses: 0,
      housesCreatedToday: 0,
      activeHouses: 0,
    };
  }
};

