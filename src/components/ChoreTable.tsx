import { useState } from 'react';
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
}

export default function ChoreTable({
  chores,
  houseCode,
  currentUid,
  isAdmin = false,
  isMaintenanceMode = false,
  house,
}: ChoreTableProps) {
  const [editingChoreId, setEditingChoreId] = useState<string | null>(null);
  const [swappingChoreId, setSwappingChoreId] = useState<string | null>(null);
  const [editedAssignedTo, setEditedAssignedTo] = useState('');
  const [editedDueDate, setEditedDueDate] = useState('');
  const [swapTargetUid, setSwapTargetUid] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Get list of members for swap dropdown
  const getMembersList = () => {
    if (!house?.membersMap) return [];
    return Object.entries(house.membersMap).map(([uid, member]) => ({
      uid,
      name: member.name,
    }));
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
    setEditedAssignedTo(chore.assignedTo || '');
    setEditedDueDate(chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : '');
    setActionMenuOpen(null);
  };

  // Save edit
  const handleSaveEdit = async (choreId: string) => {
    if (!editedDueDate || isMaintenanceMode) {
      if (isMaintenanceMode) {
        alert('The site is currently under maintenance. Changes are disabled.');
      }
      setEditingChoreId(null);
      return;
    }

    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const oldAssignedTo = chore.assignedTo;
    
    // Look up UID from membersMap when assignee name changes
    let newAssignedToUid: string | undefined = undefined;
    if (editedAssignedTo && house?.membersMap) {
      const memberEntry = Object.entries(house.membersMap).find(
        ([, member]) => member.name === editedAssignedTo
      );
      if (memberEntry) {
        newAssignedToUid = memberEntry[0];
      }
    }
    
    const editHistory: ChoreEditHistory = {
      changedBy: 'User',
      changedByUid: currentUid || undefined,
      changedAt: new Date().toISOString(),
      changeType: editedAssignedTo !== oldAssignedTo ? 'assigned' : 'dueDate',
      oldValue: oldAssignedTo,
      newValue: editedAssignedTo,
    };

    await updateChore(houseCode, choreId, {
      assignedTo: editedAssignedTo,
      assignedToUid: newAssignedToUid,
      dueDate: new Date(editedDueDate).toISOString(),
    }, editHistory);
    setEditingChoreId(null);
  };

  // Cancel edit
  const handleCancelEdit = () => {
    setEditingChoreId(null);
    setEditedAssignedTo('');
    setEditedDueDate('');
  };

  // Start swap
  const handleStartSwap = (chore: Chore) => {
    setSwappingChoreId(chore.id);
    setSwapTargetUid('');
    setActionMenuOpen(null);
  };

  // Save swap
  const handleSaveSwap = async (choreId: string) => {
    if (!swapTargetUid || isMaintenanceMode) {
      if (isMaintenanceMode) {
        alert('The site is currently under maintenance. Changes are disabled.');
      }
      setSwappingChoreId(null);
      return;
    }

    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const targetMember = house?.membersMap?.[swapTargetUid];
    if (!targetMember) {
      alert('Selected member not found');
      return;
    }

    const oldAssignedTo = chore.assignedTo;

    const editHistory: ChoreEditHistory = {
      changedBy: 'User',
      changedByUid: currentUid || undefined,
      changedAt: new Date().toISOString(),
      changeType: 'swapped',
      oldValue: oldAssignedTo,
      newValue: targetMember.name,
      swappedWith: targetMember.name,
      swappedWithUid: swapTargetUid,
    };

    await updateChore(houseCode, choreId, {
      assignedTo: targetMember.name,
      assignedToUid: swapTargetUid,
    }, editHistory);
    setSwappingChoreId(null);
    setSwapTargetUid('');
  };

  // Cancel swap
  const handleCancelSwap = () => {
    setSwappingChoreId(null);
    setSwapTargetUid('');
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
  const canSwapChore = (chore: Chore) => canEditChore() && members.length > 1 && (chore.assignedTo || chore.assignedToUid);

  if (chores.length === 0) {
    return (
      <div className="chore-table-container">
        <div className="chore-table-card">
          <h2 className="chore-table-title">Chore Schedule</h2>
          <div className="chore-table-empty">
            <p>No chores yet. {isAdmin && !isMaintenanceMode && 'Add one to get started!'}</p>
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

  return (
    <div className="chore-table-container">
      <div className="chore-table-card">
        <h2 className="chore-table-title">Chore Schedule</h2>
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
                const isSwapping = swappingChoreId === chore.id;

                return (
                  <tr key={chore.id} className={chore.isDone ? 'row-completed' : ''}>
                    <td className="col-done">
                      <input
                        type="checkbox"
                        checked={chore.isDone}
                        onChange={() => handleToggle(chore)}
                        disabled={!canToggle() || isMaintenanceMode || isEditing || isSwapping}
                        className="chore-checkbox"
                        title={canToggle() ? "Mark as done" : "Disabled during maintenance"}
                      />
                    </td>
                    <td className="col-task">
                      {isEditing ? (
                        <div className="edit-form-inline">
                          <input
                            type="text"
                            value={editedAssignedTo}
                            onChange={(e) => setEditedAssignedTo(e.target.value)}
                            placeholder="Assigned to"
                            className="edit-input"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="task-name">{chore.title}</div>
                          {chore.assignedTo && (
                            <div className="task-assigned">Assigned to {chore.assignedTo}</div>
                          )}
                        </div>
                      )}
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
                      ) : isSwapping ? (
                        <div className="action-buttons-inline">
                          <select
                            value={swapTargetUid}
                            onChange={(e) => setSwapTargetUid(e.target.value)}
                            className="swap-select"
                          >
                            <option value="">Select...</option>
                            {members.map(member => (
                              <option key={member.uid} value={member.uid}>
                                {member.name}
                              </option>
                            ))}
                          </select>
                          <button onClick={() => handleSaveSwap(chore.id)} className="btn-save" disabled={!swapTargetUid}>
                            Swap
                          </button>
                          <button onClick={handleCancelSwap} className="btn-cancel">Cancel</button>
                        </div>
                      ) : (
                        <div className="action-menu-wrapper">
                          {canEditChore() && (
                            <>
                              <button
                                className="action-menu-trigger"
                                onClick={() => setActionMenuOpen(actionMenuOpen === chore.id ? null : chore.id)}
                              >
                                ⋯
                              </button>
                              {actionMenuOpen === chore.id && (
                                <>
                                  <div className="action-menu-overlay" onClick={() => setActionMenuOpen(null)} />
                                  <div className="action-menu">
                                    {canSwapChore(chore) && (
                                      <button onClick={() => handleStartSwap(chore)} className="action-menu-item">
                                        Swap
                                      </button>
                                    )}
                                    <button onClick={() => handleStartEdit(chore)} className="action-menu-item">
                                      Edit
                                    </button>
                                    {isAdmin && (
                                      <button onClick={() => handleDelete(chore.id)} className="action-menu-item action-menu-item-danger">
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </>
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

