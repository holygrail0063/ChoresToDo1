import { useState, useEffect } from 'react';
import './NameModal.css';

interface NameModalProps {
  isOpen: boolean;
  currentName: string | null;
  onSave: (name: string) => void;
  required?: boolean; // If true, modal cannot be closed without entering name
}

export default function NameModal({ isOpen, currentName, onSave, required = false }: NameModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(currentName || '');
    }
  }, [isOpen, currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!required && e.target === e.currentTarget) {
      // Only allow closing if not required
      return;
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2>{required ? 'Set Your Name' : "What's your name?"}</h2>
        {required && <p className="help-text">You need to set your name to join this house.</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            autoFocus
            maxLength={50}
            required
            autoComplete="off"
          />
          <div className="modal-actions">
            <button type="submit" disabled={!name.trim()}>
              {required ? 'Join House' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

