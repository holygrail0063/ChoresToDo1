import { useState, useEffect } from 'react';
import { Chore, subscribeToChores } from '../firebase/chores';
import { House } from '../firebase/houses';
import ChoreTable from './ChoreTable';
import './ChoreList.css';

interface ChoreListProps {
  houseCode: string;
  currentUserName: string | null;
  currentUid?: string | null;
  isAdmin?: boolean;
  viewMode?: 'my' | 'all';
  isMaintenanceMode?: boolean;
  house?: House | null;
}

export default function ChoreList({ 
  houseCode, 
  currentUserName, 
  currentUid, 
  isAdmin = false, 
  viewMode = 'all', 
  isMaintenanceMode = false,
  house
}: ChoreListProps) {
  const [chores, setChores] = useState<Chore[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToChores(houseCode, (updatedChores) => {
      setChores(updatedChores);
    });

    return () => unsubscribe();
  }, [houseCode]);

  // Filter chores based on view mode
  // "My Chores" should ONLY match by UID when currentUid is available
  // This prevents showing chores assigned to other people with the same name
  const filteredChores = viewMode === 'my' 
    ? chores.filter(chore => {
        // If currentUid exists, ONLY match by UID (never by name)
        if (currentUid) {
          return chore.assignedToUid === currentUid;
        }
        // Only fallback to name matching if currentUid is not available (backward compatibility)
        return currentUserName && chore.assignedTo === currentUserName;
      })
    : chores;

  // Sort chores: incomplete first, then by due date
  const sortedChores = [...filteredChores].sort((a, b) => {
    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1;
    }
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });

  return (
    <ChoreTable
      chores={sortedChores}
      houseCode={houseCode}
      currentUserName={currentUserName}
      currentUid={currentUid}
      isAdmin={isAdmin}
      isMaintenanceMode={isMaintenanceMode}
      house={house}
    />
  );
}
