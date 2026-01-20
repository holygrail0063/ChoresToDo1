import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Chore, ChoreEditHistory, updateChore, deleteChore } from '../firebase/chores';
import { House } from '../firebase/houses';
import AddChoreModal from './AddChoreModal';
import './ChoreTable.css';

interface ChoreTableProps {
  chores: Chore[];
  houseCode: string;
  currentUid?: string | null;
  isAdmin?: boolean;
  isMaintenanceMode?: boolean;
  house?: House | null;
  weekRange?: { fromLabel: string; toLabel: string } | null;
}

export default function ChoreTable({
  chores,
  houseCode,
  currentUid,
  isAdmin = false,
  isMaintenanceMode = false,
  house,
  weekRange,
}: ChoreTableProps) {
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [editedAssignedTo, setEditedAssignedTo] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; flipUp: boolean } | null>(null);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Reset menu position when menu closes
  useEffect(() => {
    if (!actionMenuOpen) {
      setMenuPosition(null);
    }
  }, [actionMenuOpen]);

  // Get list of members for dropdown
  // Combines membersMap (uid -> member) and members array (legacy) to show all house members
  const getMembersList = () => {
    const membersList: Array<{ uid: string; name: string }> = [];
    
    // First, add all members from membersMap (if it exists)
    if (house?.membersMap) {
      Object.entries(house.membersMap).forEach(([uid, member]) => {
        membersList.push({
          uid,
          name: member.name,
        });
      });
    }
    
    // Then, add any members from the members array that aren't already in membersMap
    // This handles legacy houses or cases where members haven't been added to membersMap yet
    if (house?.members && Array.isArray(house.members)) {
      const existingNames = new Set(membersList.map(m => m.name));
      house.members.forEach((memberName, index) => {
        // Only add if not already in the list
        if (memberName && !existingNames.has(memberName)) {
          // For members not in membersMap, use a temporary UID based on index
          // This allows the dropdown to work, but UID lookup will fail (which is okay for legacy)
          membersList.push({
            uid: `legacy-${index}`, // Temporary UID for legacy members
            name: memberName,
          });
        }
      });
    }
    
    // Sort by name for consistent display
    return membersList.sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get category for a chore
  const getCategory = (chore: Chore): string => {
    if (chore.isCommonBundle) {
      return 'Common Area';
    }
    if (chore.isCommonArea) {
      return 'Common Area';
    }
    if (chore.isSoleResponsibility) {
      return 'Sole Responsibility';
    }
    return 'General';
  };

  // Parse date string as local date (YYYY-MM-DD format)
  // DO NOT use new Date("YYYY-MM-DD") as it causes timezone shift
  const parseLocalDate = (dateString: string): Date | null => {
    if (!dateString) return null;
    
    // Extract date part (handle ISO strings like "2026-01-19T00:00:00.000Z")
    const datePart = dateString.split('T')[0];
    
    // If it's in YYYY-MM-DD format, parse as local date
    if (datePart.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [y, m, d] = datePart.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    
    // Otherwise parse normally and extract date parts as local
    const date = new Date(dateString);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // Get status for a chore (in priority order)
  const getStatus = (chore: Chore): { label: string; variant: 'completed' | 'overdue' | 'due-today' | 'due-soon' | 'pending' } => {
    // 1. If done => Completed
    if (chore.isDone) {
      return { label: 'Completed', variant: 'completed' };
    }
    
    // 2. If no due date => Pending
    if (!chore.dueDate) {
      return { label: 'Pending', variant: 'pending' };
    }
    
    // Parse due date as local date
    const dueDate = parseLocalDate(chore.dueDate);
    if (!dueDate) {
      return { label: 'Pending', variant: 'pending' };
    }
    
    // Get today at start of day (00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get due date at end of day (23:59:59)
    const endOfDueDate = new Date(dueDate);
    endOfDueDate.setHours(23, 59, 59, 999);
    
    // Calculate days until due
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // 3. If overdue (today > end of due date) => Overdue
    if (today > endOfDueDate) {
      return { label: 'Overdue', variant: 'overdue' };
    }
    
    // 4. If due today => Due Today
    if (daysUntilDue === 0) {
      return { label: 'Due Today', variant: 'due-today' };
    }
    
    // 5. If due within 2 days => Due Soon
    if (daysUntilDue <= 2) {
      return { label: 'Due Soon', variant: 'due-soon' };
    }
    
    // 6. Otherwise => Pending
    return { label: 'Pending', variant: 'pending' };
  };

  // Format due date (parse as local date to avoid timezone issues)
  // Format as "MMM d, yyyy" (e.g., "Jan 19, 2026")
  const formatDueDate = (dueDate: string | null): string => {
    if (!dueDate) return '—';
    const localDate = parseLocalDate(dueDate);
    if (!localDate) return '—';
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[localDate.getMonth()];
    const day = localDate.getDate();
    const year = localDate.getFullYear();
    
    return `${month} ${day}, ${year}`;
  };

  // Check if user can toggle - enable all checkboxes (no name-based restrictions)
  const canToggle = (): boolean => {
    return !isMaintenanceMode;
  };

  // Check if user can edit
  const canEditChore = (): boolean => {
    return !isMaintenanceMode;
  };

  // Handle toggle checkbox
  const handleToggle = async (chore: Chore) => {
    if (!canToggle() || isMaintenanceMode) return;

    const now = new Date().toISOString();
    const newIsDone = !chore.isDone;
    
    const editHistory: ChoreEditHistory = {
      changedBy: 'User',
      changedByUid: currentUid || undefined,
      changedAt: now,
      changeType: newIsDone ? 'completed' : 'uncompleted',
    };

    await updateChore(houseCode, chore.id, {
      isDone: newIsDone,
      doneAt: newIsDone ? now : null,
    }, editHistory);
  };

  // Start editing
  const handleStartEdit = (chore: Chore) => {
    setEditingChoreId(chore.id);
    // Initialize with current assignedTo, or first member if unassigned
    const currentAssignedTo = chore.assignedTo || '';
    setEditedAssignedTo(currentAssignedTo);
    setEditedDueDate(chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : '');
    setActionMenuOpen(null);
  };

  // Save edit
  const handleSaveEdit = async (choreId: string) => {
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      setEditingChoreId(null);
      return;
    }

    if (!editedDueDate) {
      alert('Please select a due date.');
      return;
    }

    // Validate assignedTo is selected (not empty)
    if (!editedAssignedTo || editedAssignedTo.trim() === '') {
      alert('Please select an assigned member.');
      return;
    }

    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const oldAssignedTo = chore.assignedTo;
    
    // Look up UID from membersMap when assignee name changes
    let newAssignedToUid: string | undefined = undefined;
    if (editedAssignedTo) {
      // First try to find in membersMap
      if (house?.membersMap) {
        const memberEntry = Object.entries(house.membersMap).find(
          ([, member]) => member.name === editedAssignedTo
        );
        if (memberEntry) {
          newAssignedToUid = memberEntry[0];
        }
      }
      
      // If not found in membersMap, check if it's a legacy member
      // For legacy members, we can't set a real UID, so leave it undefined
      // The assignedTo name will still be saved, which is fine for backward compatibility
    }
    
    const editHistory: ChoreEditHistory = {
      changedBy: 'User',
      changedByUid: currentUid || undefined,
      changedAt: new Date().toISOString(),
      changeType: editedAssignedTo !== oldAssignedTo ? 'assigned' : 'dueDate',
      oldValue: oldAssignedTo,
      newValue: editedAssignedTo,
    };

    try {
      // Pass dueDate as YYYY-MM-DD string (from date input)
      // updateChore will convert it to Firestore Timestamp
      await updateChore(houseCode, choreId, {
        assignedTo: editedAssignedTo,
        assignedToUid: newAssignedToUid,
        dueDate: editedDueDate, // Pass as YYYY-MM-DD string
      }, editHistory);
      setEditingChoreId(null);
      // UI will update automatically via onSnapshot subscription
    } catch (error: any) {
      console.error('Error saving chore:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        houseCode,
        choreId,
        editedAssignedTo,
        editedDueDate,
      });
      alert(`Failed to save changes: ${error?.message || 'Unknown error'}. Please try again.`);
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingChoreId(null);
    setEditedAssignedTo('');
    setEditedDueDate('');
  };

  // Handle delete
  const handleDelete = async (choreId: string) => {
    if (isMaintenanceMode || !isAdmin) {
      if (isMaintenanceMode) {
        alert('The site is currently under maintenance. Changes are disabled.');
      }
      return;
    }
    if (window.confirm('Are you sure you want to delete this chore?')) {
      await deleteChore(houseCode, choreId);
    }
    setActionMenuOpen(null);
  };

  const members = getMembersList();

  if (chores.length === 0) {
    return (
      <div className="chore-table-container">
        <div className="chore-table-card">
          <div className="chore-table-header">
            <div className="chore-table-header-left">
              <div className="chore-table-week-group">
                <span className="chore-table-week-label">Current Week</span>
                {weekRange && (
                  <span className="chore-table-date-range">
                    {weekRange.fromLabel} — {weekRange.toLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="chore-table-header-center">
              <h2 className="chore-table-title">Chore Schedule</h2>
            </div>
            <div className="chore-table-header-right">
              {isAdmin && !isMaintenanceMode && (
                <button 
                  className="chore-table-add-button" 
                  onClick={() => setIsAddModalOpen(true)}
                >
                  + Add Chore
                </button>
              )}
            </div>
          </div>
          <div className="chore-table-empty">
            <p>No chores yet. {isAdmin && !isMaintenanceMode && 'Add one to get started!'}</p>
          </div>
        </div>
        <AddChoreModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          houseCode={houseCode}
          isMaintenanceMode={isMaintenanceMode}
        />
      </div>
    );
  }

  return (
    <div className="chore-table-container">
      <div className="chore-table-card">
        <div className="chore-table-header">
          <div className="chore-table-header-left">
            <div className="chore-table-week-group">
              <span className="chore-table-week-label">Current Week</span>
              {weekRange && (
                <span className="chore-table-date-range">
                  {weekRange.fromLabel} — {weekRange.toLabel}
                </span>
              )}
            </div>
          </div>
          <div className="chore-table-header-center">
            <h2 className="chore-table-title">Chore Schedule</h2>
          </div>
          <div className="chore-table-header-right">
            {isAdmin && !isMaintenanceMode && (
              <button 
                className="chore-table-add-button" 
                onClick={() => setIsAddModalOpen(true)}
              >
                + Add Chore
              </button>
            )}
          </div>
        </div>
        <div className="chore-table-wrapper">
          <table className="chore-table">
            <thead>
              <tr>
                <th className="col-done">Done</th>
                <th className="col-task">Task</th>
                <th className="col-category">Category</th>
                <th className="col-status">Status</th>
                <th className="col-due-date">Due Date</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chores.map((chore) => {
                const status = getStatus(chore);
                const isEditing = editingChoreId === chore.id;

                return (
                  <tr key={chore.id} className={chore.isDone ? 'row-completed' : ''}>
                    <td className="col-done">
                      <input
                        type="checkbox"
                        checked={chore.isDone}
                        onChange={() => handleToggle(chore)}
                        disabled={!canToggle() || isMaintenanceMode || isEditing}
                        className="chore-checkbox"
                        title={canToggle() ? "Mark as done" : "Disabled during maintenance"}
                      />
                    </td>
                    <td className="col-task">
                      <div>
                        <div className="task-name">{chore.title}</div>
                        {isEditing ? (
                          <div className="edit-form-inline">
                            <label className="edit-label">Assigned to:</label>
                            <select
                              value={editedAssignedTo}
                              onChange={(e) => setEditedAssignedTo(e.target.value)}
                              className="edit-select"
                              required
                            >
                              <option value="">Select member...</option>
                              {members.map(member => (
                                <option key={member.uid} value={member.name}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          chore.assignedTo && (
                            <div className="task-assigned">Assigned to {chore.assignedTo}</div>
                          )
                        )}
                      </div>
                    </td>
                    <td className="col-category">
                      {getCategory(chore)}
                    </td>
                    <td className="col-status">
                      <span className={`status-badge status-${status.variant}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="col-due-date">
                      {isEditing ? (
                        <input
                          type="date"
                          value={editedDueDate}
                          onChange={(e) => setEditedDueDate(e.target.value)}
                          className="edit-input"
                        />
                      ) : (
                        formatDueDate(chore.dueDate)
                      )}
                    </td>
                    <td className="col-actions">
                      {isEditing ? (
                        <div className="action-buttons-inline">
                          <button onClick={() => handleSaveEdit(chore.id)} className="btn-save">Save</button>
                          <button onClick={handleCancelEdit} className="btn-cancel">Cancel</button>
                        </div>
                      ) : (
                        <div className="action-menu-wrapper">
                          {canEditChore() && (
                            <>
                              <button
                                ref={(el) => { triggerRefs.current[chore.id] = el; }}
                                className="action-menu-trigger"
                                onClick={() => {
                                  const trigger = triggerRefs.current[chore.id];
                                  if (trigger) {
                                    const rect = trigger.getBoundingClientRect();
                                    const viewportHeight = window.innerHeight;
                                    const menuHeight = 100; // Approximate menu height
                                    const spaceBelow = viewportHeight - rect.bottom;
                                    const spaceAbove = rect.top;
                                    const flipUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
                                    
                                    setMenuPosition({
                                      top: flipUp ? rect.top - menuHeight : rect.bottom,
                                      left: rect.right - 120, // Menu width is ~120px
                                      flipUp,
                                    });
                                  }
                                  setActionMenuOpen(actionMenuOpen === chore.id ? null : chore.id);
                                }}
                              >
                                ⋯
                              </button>
                              {actionMenuOpen === chore.id && menuPosition && createPortal(
                                <>
                                  <div className="action-menu-overlay" onClick={() => setActionMenuOpen(null)} />
                                  <div 
                                    className={`action-menu ${menuPosition.flipUp ? 'action-menu-flip-up' : ''}`}
                                    style={{
                                      position: 'fixed',
                                      top: `${menuPosition.top}px`,
                                      left: `${menuPosition.left}px`,
                                      zIndex: 9999,
                                    }}
                                  >
                                    <button onClick={() => {
                                      handleStartEdit(chore);
                                      setActionMenuOpen(null);
                                    }} className="action-menu-item">
                                      Edit
                                    </button>
                                    {isAdmin && (
                                      <button onClick={() => {
                                        handleDelete(chore.id);
                                        setActionMenuOpen(null);
                                      }} className="action-menu-item action-menu-item-danger">
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </>,
                                document.body
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {isAdmin && !isMaintenanceMode && (
        <button className="add-chore-button" onClick={() => setIsAddModalOpen(true)}>
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

