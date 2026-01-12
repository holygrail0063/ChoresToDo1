import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NameModal from './NameModal';
import { getUserName, setUserName } from '../utils/storage';
import { House } from '../firebase/houses';
import { buildHouseShareLink, copyToClipboard } from '../utils/shareLink';
import './HouseHeader.css';

interface HouseHeaderProps {
  houseCode: string;
  houseName?: string;
  currentUid?: string | null;
  house?: House | null;
  onNameChange: (name: string | null) => void;
}

export default function HouseHeader({ houseCode, houseName, currentUid, house, onNameChange }: HouseHeaderProps) {
  const navigate = useNavigate();
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  
  // Get name from Firestore membersMap (source of truth) or fallback to localStorage
  const getDisplayName = (): string | null => {
    if (currentUid && house?.membersMap) {
      const member = house.membersMap[currentUid];
      if (member) {
        return member.name;
      }
    }
    // Fallback to localStorage for backward compatibility
    return getUserName(houseCode);
  };
  
  const currentName = getDisplayName();

  const handleCopyLink = async () => {
    try {
      const shareLink = buildHouseShareLink(houseCode);
      await copyToClipboard(shareLink);
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to copy link. Please try again.');
    }
  };

  const handleNameSave = async (name: string) => {
    setUserName(houseCode, name); // Cache in localStorage
    await onNameChange(name); // This will update Firestore
    setIsNameModalOpen(false);
  };

  return (
    <header className="house-header">
      <div className="header-content">
        <div className="header-left">
          <h1>{houseName || 'House Chores'}</h1>
          <span className="house-code">Code: {houseCode}</span>
        </div>
        <div className="header-right">
          <div className="user-name-section">
            {currentName ? (
              <>
                <span className="user-name">{currentName}</span>
                <button
                  onClick={() => setIsNameModalOpen(true)}
                  className="change-name-button"
                >
                  Change name
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsNameModalOpen(true)}
                className="set-name-button"
              >
                Set your name
              </button>
            )}
          </div>
          <button onClick={handleCopyLink} className="share-button">
            📋 Copy Share Link
          </button>
          <button onClick={() => navigate(`/house/${houseCode}/admin`)} className="admin-button">
            📊 Schedule
          </button>
          <button onClick={() => navigate(`/house/${houseCode}/activity`)} className="activity-button">
            📜 Activity
          </button>
        </div>
      </div>
      <NameModal
        isOpen={isNameModalOpen}
        currentName={currentName}
        onSave={handleNameSave}
      />
    </header>
  );
}

