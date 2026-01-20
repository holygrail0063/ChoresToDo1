import { useState, useEffect } from 'react';
import { Chore, subscribeToChores } from '../firebase/chores';
import { House } from '../firebase/houses';
import ChoreTable from './ChoreTable';
import './ChoreList.css';

interface ChoreListProps {
  houseCode: string;
  currentUid?: string | null;
  isAdmin?: boolean;
  isMaintenanceMode?: boolean;
  house?: House | null;
  weekRange?: { fromLabel: string; toLabel: string } | null;
}

export default function ChoreList({ 
  houseCode, 
  currentUid, 
  isAdmin = false, 
  isMaintenanceMode = false,
  house,
  weekRange
}: ChoreListProps) {
  const [chores, setChores] = useState<Chore[]>([]);

  useEffect(() => {
    const unsubscribe = subscribeToChores(houseCode, (updatedChores) => {
      setChores(updatedChores);
    });

    return () => unsubscribe();
  }, [houseCode]);

  // Always show all chores (no filtering)
  const filteredChores = chores;

  // Sort chores: only by due date (maintain original order, don't move completed tasks to bottom)
  const sortedChores = [...filteredChores].sort((a, b) => {
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
      currentUid={currentUid}
      isAdmin={isAdmin}
      isMaintenanceMode={isMaintenanceMode}
      house={house}
      weekRange={weekRange}
    />
  );
}
