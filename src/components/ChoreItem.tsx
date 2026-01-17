import { useState } from 'react';
import { Chore, ChoreEditHistory, updateChore, deleteChore } from '../firebase/chores';
import { House } from '../firebase/houses';
import './ChoreItem.css';

interface ChoreItemProps {
  chore: Chore;
  houseCode: string;
  currentUserName: string | null;
  currentUid?: string | null;
  isAdmin?: boolean;
  isMaintenanceMode?: boolean;
  house?: House | null;
}

export default function ChoreItem({ 
  chore, 
  houseCode, 
  currentUserName, 
  currentUid, 
  isAdmin = false, 
  isMaintenanceMode = false,
  house 
}: ChoreItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [editedAssignedTo, setEditedAssignedTo] = useState(chore.assignedTo);
  const [editedAssignedToUid, setEditedAssignedToUid] = useState(chore.assignedToUid || '');
  const [editedDueDate, setEditedDueDate] = useState(
    chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : ''
  );
  const [swapTargetUid, setSwapTargetUid] = useState('');

  const isOverdue = chore.dueDate
    ? !chore.isDone && new Date(chore.dueDate) < new Date()
    : false;

  // Get list of members for swap dropdown
  const getMembersList = () => {
    if (!house?.membersMap) return [];
    return Object.entries(house.membersMap).map(([uid, member]) => ({
      uid,
      name: member.name,
    }));
  };

  // Check if user can toggle (must be assigned to them)
  const canToggle = currentUid && chore.assignedToUid
    ? chore.assignedToUid === currentUid
    : (currentUserName && currentUserName === chore.assignedTo);
  
  // Allow all users to edit (not just admin)
  const canEdit = !isMaintenanceMode && currentUserName && currentUid;

  const handleToggle = async () => {
    if (!canToggle) return;
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      return;
    }

    const now = new Date().toISOString();
    const newIsDone = !chore.isDone;
    
    const editHistory: ChoreEditHistory = {
      changedBy: currentUserName || 'Unknown',
      changedByUid: currentUid || undefined,
      changedAt: now,
      changeType: newIsDone ? 'completed' : 'uncompleted',
    };

    await updateChore(houseCode, chore.id, {
      isDone: newIsDone,
      doneAt: newIsDone ? now : null,
    }, editHistory);
  };

  const handleSave = async () => {
    if (!editedDueDate) {
      alert('Please select a due date');
      return;
    }
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      setIsEditing(false);
      return;
    }

    const oldAssignedTo = chore.assignedTo;
    const oldAssignedToUid = chore.assignedToUid;
    
    const editHistory: ChoreEditHistory = {
      changedBy: currentUserName || 'Unknown',
      changedByUid: currentUid || undefined,
      changedAt: new Date().toISOString(),
      changeType: editedAssignedTo !== oldAssignedTo ? 'assigned' : 'dueDate',
      oldValue: oldAssignedTo,
      newValue: editedAssignedTo,
    };

    await updateChore(houseCode, chore.id, {
      assignedTo: editedAssignedTo,
      assignedToUid: editedAssignedToUid || undefined,
      dueDate: new Date(editedDueDate).toISOString(),
    }, editHistory);
    setIsEditing(false);
  };

  const handleSwap = async () => {
    if (!swapTargetUid || isMaintenanceMode) {
      if (isMaintenanceMode) {
        alert('The site is currently under maintenance. Changes are disabled.');
      }
      setIsSwapping(false);
      return;
    }

    const targetMember = house?.membersMap?.[swapTargetUid];
    if (!targetMember) {
      alert('Selected member not found');
      return;
    }

    const oldAssignedTo = chore.assignedTo;
    const oldAssignedToUid = chore.assignedToUid;

    const editHistory: ChoreEditHistory = {
      changedBy: currentUserName || 'Unknown',
      changedByUid: currentUid || undefined,
      changedAt: new Date().toISOString(),
      changeType: 'swapped',
      oldValue: oldAssignedTo,
      newValue: targetMember.name,
      swappedWith: targetMember.name,
      swappedWithUid: swapTargetUid,
    };

    await updateChore(houseCode, chore.id, {
      assignedTo: targetMember.name,
      assignedToUid: swapTargetUid,
    }, editHistory);
    setIsSwapping(false);
    setSwapTargetUid('');
  };

  const handleCancel = () => {
    setEditedAssignedTo(chore.assignedTo);
    setEditedAssignedToUid(chore.assignedToUid || '');
    setEditedDueDate(
      chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : ''
    );
    setIsEditing(false);
    setIsSwapping(false);
    setSwapTargetUid('');
  };

  const handleDelete = async () => {
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      return;
    }
    if (!isAdmin) {
      alert('Only admins can delete chores');
      return;
    }
    if (window.confirm('Are you sure you want to delete this chore?')) {
      await deleteChore(houseCode, chore.id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDoneAt = (doneAt: string | null) => {
    if (!doneAt) return '';
    const date = new Date(doneAt);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatEditHistory = (history: ChoreEditHistory) => {
    const date = new Date(history.changedAt);
    const timeStr = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    switch (history.changeType) {
      case 'swapped':
        return `${history.changedBy} swapped with ${history.swappedWith} on ${timeStr}`;
      case 'assigned':
        return `${history.changedBy} assigned to ${history.newValue} on ${timeStr}`;
      case 'unassigned':
        return `${history.changedBy} unassigned on ${timeStr}`;
      case 'dueDate':
        return `${history.changedBy} changed due date on ${timeStr}`;
      case 'completed':
        return `${history.changedBy} completed on ${timeStr}`;
      case 'uncompleted':
        return `${history.changedBy} marked incomplete on ${timeStr}`;
      default:
        return `${history.changedBy} edited on ${timeStr}`;
    }
  };

  const members = getMembersList();
  const canSwap = canEdit && chore.assignedToUid && members.length > 1;

  return (
    <div className={`chore-item ${chore.isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="chore-main">
        <div className="chore-checkbox-container">
          <input
            type="checkbox"
            checked={chore.isDone}
            onChange={handleToggle}
            disabled={!canToggle || isMaintenanceMode}
            className="chore-checkbox"
          />
        </div>
        <div className="chore-content">
          <div className="chore-title-section">
            <h3 className="chore-title">{chore.title}</h3>
            {chore.isCommonBundle && chore.bundleChores && chore.bundleChores.length > 0 && (
              <div className="bundle-chores-list">
                <span className="bundle-label">Includes:</span>
                <ul className="bundle-chores">
                  {chore.bundleChores.map((choreTitle, idx) => (
                    <li key={idx}>{choreTitle}</li>
                  ))}
                </ul>
              </div>
            )}
            {chore.isSoleResponsibility && (
              <span className="chore-sole-responsibility">Ongoing Responsibility</span>
            )}
          </div>
          {!isEditing && !isSwapping ? (
            <div className="chore-details">
              <div className="chore-meta">
                <span className="chore-assigned">
                  {chore.assignedTo || 'Unassigned'}
                </span>
                {chore.dueDate && (
                  <span className={`chore-due-date ${isOverdue ? 'overdue-text' : ''}`}>
                    Due: {formatDate(chore.dueDate)}
                  </span>
                )}
                {chore.isSoleResponsibility && (
                  <span className="chore-sole-responsibility">
                    Sole Responsibility
                  </span>
                )}
                {chore.isDone && chore.doneAt && (
                  <span className="chore-done-at">
                    Done: {formatDoneAt(chore.doneAt)}
                  </span>
                )}
              </div>
              {!canToggle && chore.assignedTo && (
                <p className="chore-assigned-note">
                  Assigned to {chore.assignedTo}
                </p>
              )}
              {chore.editHistory && chore.editHistory.length > 0 && (
                <div className="chore-edit-history">
                  {chore.editHistory.slice(-3).map((history, idx) => (
                    <div key={idx} className="edit-history-item">
                      {formatEditHistory(history)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : isSwapping ? (
            <div className="chore-swap-form">
              <div className="edit-field">
                <label>Swap with:</label>
                <select
                  value={swapTargetUid}
                  onChange={(e) => setSwapTargetUid(e.target.value)}
                  className="swap-select"
                >
                  <option value="">Select member...</option>
                  {members
                    .filter(m => m.uid !== chore.assignedToUid)
                    .map(member => (
                      <option key={member.uid} value={member.uid}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="edit-actions">
                <button onClick={handleSwap} className="save-button" disabled={!swapTargetUid}>
                  Swap
                </button>
                <button onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="chore-edit-form">
              <div className="edit-field">
                <label>Assigned to:</label>
                <input
                  type="text"
                  value={editedAssignedTo}
                  onChange={(e) => setEditedAssignedTo(e.target.value)}
                  placeholder="Name"
                />
              </div>
              <div className="edit-field">
                <label>Due date:</label>
                <input
                  type="date"
                  value={editedDueDate}
                  onChange={(e) => setEditedDueDate(e.target.value)}
                />
              </div>
              <div className="edit-actions">
                <button onClick={handleSave} className="save-button">
                  Save
                </button>
                <button onClick={handleCancel} className="cancel-button">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {!isEditing && !isSwapping && canEdit && (
        <div className="chore-actions">
          {canSwap && (
            <button onClick={() => setIsSwapping(true)} className="swap-button">
              Swap
            </button>
          )}
          <button onClick={() => setIsEditing(true)} className="edit-button">
            Edit
          </button>
          {isAdmin && (
            <button onClick={handleDelete} className="delete-button">
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
