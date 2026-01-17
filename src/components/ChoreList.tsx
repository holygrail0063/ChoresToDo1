import { useState, useEffect } from 'react';
import { Chore, subscribeToChores, updateChore, deleteChore } from '../firebase/chores';
import { House } from '../firebase/houses';
import AddChoreModal from './AddChoreModal';
import {
  ListProvider,
  ListGroup,
  ListHeader,
  ListItems,
  ListItem,
} from '@/components/ui/list';
import type { DragEndEvent } from '@dnd-kit/core';
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

  // Define status columns
  const statuses = [
    { id: 'todo', name: 'To Do', color: '#6B7280' },
    { id: 'done', name: 'Done', color: '#10B981' },
  ];

  // Handle drag end - update chore completion status
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || isMaintenanceMode) {
      return;
    }

    const choreId = active.id as string;
    const targetStatus = over.id as string;

    // Find the chore
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    // Check if user can move this chore (must be assigned to them, or admin)
    if (!isAdmin && !canToggle(chore)) {
      alert('You can only move chores assigned to you.');
      return;
    }

    // Determine new completion status
    const newIsDone = targetStatus === 'done';
    
    // Only update if status actually changed
    if (chore.isDone !== newIsDone) {
      try {
        const now = new Date().toISOString();
        await updateChore(houseCode, choreId, {
          isDone: newIsDone,
          doneAt: newIsDone ? now : null,
        });
        console.log(`Chore "${chore.title}" moved to ${newIsDone ? 'Done' : 'To Do'}`);
      } catch (error) {
        console.error('Error updating chore:', error);
        alert('Failed to update chore. Please try again.');
      }
    }
  };

  // Get member info for display
  const getMemberInfo = (uid?: string, name?: string) => {
    if (uid && house?.membersMap?.[uid]) {
      return house.membersMap[uid];
    }
    return { name: name || 'Unassigned' };
  };

  // Format due date
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(date);
    due.setHours(0, 0, 0, 0);
    
    if (due < today) return { text: 'Overdue', isOverdue: true };
    if (due.getTime() === today.getTime()) return { text: 'Today', isOverdue: false };
    return { text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), isOverdue: false };
  };

  // Check if user can toggle (must be assigned to them)
  const canToggle = (chore: Chore) => {
    if (currentUid && chore.assignedToUid) {
      return chore.assignedToUid === currentUid;
    }
    return currentUserName && chore.assignedTo === currentUserName;
  };

  // Handle delete (admin only)
  const handleDelete = async (choreId: string) => {
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this chore?')) {
      try {
        await deleteChore(houseCode, choreId);
      } catch (error) {
        console.error('Error deleting chore:', error);
        alert('Failed to delete chore. Please try again.');
      }
    }
  };

  return (
    <div className="chore-list-container">
      <ListProvider onDragEnd={handleDragEnd}>
        <div className="flex flex-col md:flex-row gap-4 w-full">
          {statuses.map((status) => {
            const statusChores = filteredChores.filter(chore => {
              if (status.id === 'done') return chore.isDone;
              return !chore.isDone;
            });

            return (
              <ListGroup key={status.id} id={status.id} className="flex-1 min-w-0">
                <ListHeader name={status.name} color={status.color} />
                <ListItems>
                  {statusChores.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No chores
                    </div>
                  ) : (
                    statusChores.map((chore, index) => {
                      const memberInfo = getMemberInfo(chore.assignedToUid, chore.assignedTo);
                      const dueDateInfo = formatDueDate(chore.dueDate);
                      const canDrag = (isAdmin || canToggle(chore)) && !isMaintenanceMode;

                      return (
                        <ListItem
                          key={chore.id}
                          id={chore.id}
                          name={chore.title}
                          parent={status.id}
                          index={index}
                          disabled={!canDrag}
                        >
                          <div className="flex flex-col gap-2 w-full">
                            <div className="flex items-start justify-between gap-2">
                              <p className="m-0 font-medium text-sm flex-1">{chore.title}</p>
                              {isAdmin && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(chore.id);
                                  }}
                                  className="text-destructive hover:text-destructive/80 text-xs px-2 py-1"
                                  title="Delete chore"
                                >
                                  ×
                                </button>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {memberInfo.name && (
                                <span className="flex items-center gap-1">
                                  <span>👤</span>
                                  <span>{memberInfo.name}</span>
                                </span>
                              )}
                              {dueDateInfo && (
                                <span className={dueDateInfo.isOverdue ? 'text-destructive font-semibold' : ''}>
                                  📅 {dueDateInfo.text}
                                </span>
                              )}
                            </div>
                          </div>
                        </ListItem>
                      );
                    })
                  )}
                </ListItems>
              </ListGroup>
            );
          })}
        </div>
      </ListProvider>

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
