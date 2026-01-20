import { useNavigate } from 'react-router-dom';
import './GlobalHeader.css';

export default function GlobalHeader() {
  const navigate = useNavigate();

  return (
    <header className="global-header">
      <div className="global-header-content">
        <div className="global-header-left" onClick={() => navigate('/')}>
          <span className="global-header-icon">🏠</span>
          <div className="global-header-title-group">
            <h1 className="global-header-title">ChoresToDo</h1>
            <span className="global-header-subtitle">Clean house, calm mind.</span>
          </div>
        </div>
      </div>
    </header>
  );
}

