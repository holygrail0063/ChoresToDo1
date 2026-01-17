import { useState, useEffect } from 'react';
import { Chore, subscribeToChores } from '../firebase/chores';
import { House } from '../firebase/houses';
import AddChoreModal from './AddChoreModal';
import ChoreItem from './ChoreItem';
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToChores(houseCode, (updatedChores) => {
      setChores(updatedChores);
    });

    return () => unsubscribe();
  }, [houseCode]);

  // Filter chores based on view mode
  const filteredChores = viewMode === 'my' 
    ? chores.filter(chore => {
        // Show chores assigned to current user (by uid or name fallback)
        if (currentUid && chore.assignedToUid) {
          return chore.assignedToUid === currentUid;
        }
        // Fallback to name matching for backward compatibility
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
    <div className="chore-list-container">
      {sortedChores.length === 0 ? (
        <div className="chore-list-empty">
          <p>No chores yet. {isAdmin && !isMaintenanceMode && 'Add one to get started!'}</p>
        </div>
      ) : (
        <div className="chore-list">
          {sortedChores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              houseCode={houseCode}
              currentUserName={currentUserName}
              currentUid={currentUid}
              isAdmin={isAdmin}
              isMaintenanceMode={isMaintenanceMode}
              house={house}
            />
          ))}
        </div>
      )}

      {isAdmin && !isMaintenanceMode && (
        <button
          className="add-chore-button"
          onClick={() => setIsAddModalOpen(true)}
        >
          + Add Chore
        </button>
      )}
      <AddChoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        houseCode={houseCode}
        isMaintenanceMode={isMaintenanceMode}
      />
    </div>
  );
}
