import { useNavigate } from 'react-router-dom';
import MaintenanceBanner from '../components/MaintenanceBanner';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <MaintenanceBanner />
      <div className="landing-container">
        <div className="landing-header">
          <h1>House Chores</h1>
          <p className="landing-subtitle">Manage household chores with your housemates</p>
        </div>

        <div className="landing-actions">
          <div className="action-card" onClick={() => navigate('/create')}>
            <div className="action-icon">🏠</div>
            <h2>Create House</h2>
            <p>Start a new house and set up your chore schedule</p>
          </div>

          <div className="action-card" onClick={() => navigate('/join')}>
            <div className="action-icon">🔗</div>
            <h2>Join House</h2>
            <p>Enter a house code or open a shared link</p>
          </div>
        </div>
      </div>
    </div>
  );
}

