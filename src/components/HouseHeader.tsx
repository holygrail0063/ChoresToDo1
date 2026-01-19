import { useNavigate } from 'react-router-dom';
import { House } from '../firebase/houses';
import { buildHouseShareLink, copyToClipboard } from '../utils/shareLink';
import './HouseHeader.css';

interface HouseHeaderProps {
  houseCode: string;
  houseName?: string;
  currentUid?: string | null;
  house?: House | null;
}

export default function HouseHeader({ houseCode, houseName }: HouseHeaderProps) {
  const navigate = useNavigate();

  const handleCopyLink = async () => {
    try {
      const shareLink = buildHouseShareLink(houseCode);
      await copyToClipboard(shareLink);
      alert('Share link copied to clipboard!');
    } catch (error) {
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <header className="house-header">
      <div className="header-content">
        <div className="header-left">
          <h1>{houseName || 'House Chores'}</h1>
          <span className="house-code">Code: {houseCode}</span>
        </div>
        <div className="header-right">
          <button onClick={handleCopyLink} className="share-button">
            📋 Share Link
          </button>
          <button onClick={() => navigate(`/house/${houseCode}/schedule`)} className="admin-button">
            📊 Schedule
          </button>
        </div>
      </div>
    </header>
  );
}

