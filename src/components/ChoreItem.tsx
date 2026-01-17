import { useState } from 'react';
import { Chore, updateChore, deleteChore } from '../firebase/chores';
import './ChoreItem.css';

interface ChoreItemProps {
  chore: Chore;
  houseCode: string;
  currentUserName: string | null;
  currentUid?: string | null;
  isAdmin?: boolean;
  isMaintenanceMode?: boolean;
}

export default function ChoreItem({ chore, houseCode, currentUserName, currentUid, isAdmin = false, isMaintenanceMode = false }: ChoreItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedAssignedTo, setEditedAssignedTo] = useState(chore.assignedTo);
  const [editedDueDate, setEditedDueDate] = useState(
    chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : ''
  );

  const isOverdue = chore.dueDate
    ? !chore.isDone && new Date(chore.dueDate) < new Date()
    : false;


  // Check if user can toggle (must be assigned to them)
  const canToggle = currentUid && chore.assignedToUid
    ? chore.assignedToUid === currentUid
    : (currentUserName && currentUserName === chore.assignedTo); // Fallback for backward compatibility
  
  // Check if user can edit/delete (admin only)
  const canEdit = isAdmin;

  const handleToggle = async () => {
    if (!canToggle) return;
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      return;
    }

    const now = new Date().toISOString();
    await updateChore(houseCode, chore.id, {
      isDone: !chore.isDone,
      doneAt: !chore.isDone ? now : null,
    });
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
    await updateChore(houseCode, chore.id, {
      assignedTo: editedAssignedTo,
      dueDate: new Date(editedDueDate).toISOString(),
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedAssignedTo(chore.assignedTo);
    setEditedDueDate(
      chore.dueDate ? new Date(chore.dueDate).toISOString().split('T')[0] : ''
    );
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
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

  return (
    <div className={`chore-item ${chore.isDone ? 'done' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div className="chore-main">
        <div className="chore-checkbox-container">
          <input
            type="checkbox"
            checked={chore.isDone}
            onChange={handleToggle}
            disabled={!canToggle}
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
          {!isEditing ? (
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
      {!isEditing && canEdit && (
        <div className="chore-actions">
          <button onClick={() => setIsEditing(true)} className="edit-button">
            Edit
          </button>
          <button onClick={handleDelete} className="delete-button">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

