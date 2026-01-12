import { useParams, useNavigate } from 'react-router-dom';
import './ActivityPage.css';

export default function ActivityPage() {
  const { houseCode } = useParams<{ houseCode: string }>();
  const navigate = useNavigate();

  return (
    <div className="activity-page">
      <div className="activity-container">
        <div className="activity-header">
          <button onClick={() => navigate(`/house/${houseCode}`)} className="back-button">
            ← Back to House
          </button>
          <h1>Activity & History</h1>
        </div>

        <div className="activity-content">
          <div className="placeholder-message">
            <p>Activity history coming soon!</p>
            <p className="placeholder-subtext">
              This page will show completed chores, schedule changes, and member activity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

