import { useState } from 'react';
import { createChore } from '../firebase/chores';
import { endOfWeekSunday } from '../utils/weekUtils';
import './AddChoreModal.css';

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseCode: string;
  isMaintenanceMode?: boolean;
}

export default function AddChoreModal({ isOpen, onClose, houseCode, isMaintenanceMode = false }: AddChoreModalProps) {
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  // Default to next Sunday (end of current week)
  const getNextSundayDateString = (): string => {
    const sunday = endOfWeekSunday(new Date());
    return sunday.toISOString().split('T')[0];
  };
  
  const [dueDate, setDueDate] = useState(getNextSundayDateString());

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    if (isMaintenanceMode) {
      alert('The site is currently under maintenance. Changes are disabled.');
      return;
    }

    try {
      await createChore(houseCode, title.trim(), assignedTo.trim(), new Date(dueDate).toISOString());
      setTitle('');
      setAssignedTo('');
      setDueDate(getNextSundayDateString());
      onClose();
    } catch (error) {
      console.error('Error creating chore:', error);
      alert('Failed to create chore. Please try again.');
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>Add New Chore</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chore title"
              required
              autoFocus
            />
          </div>
          <div className="form-field">
            <label>Assigned to</label>
            <input
              type="text"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              placeholder="Name (optional)"
            />
          </div>
          <div className="form-field">
            <label>Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" disabled={!title.trim()} className="submit-button">
              Add Chore
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

