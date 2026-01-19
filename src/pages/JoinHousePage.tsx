import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymous } from '../firebase/auth';
import { getHouse } from '../firebase/houses';
import { normalizeHouseCode } from '../utils/houseCode';
import Footer from '../components/Footer';
import './JoinHousePage.css';

export default function JoinHousePage() {
  const navigate = useNavigate();
  const [houseCode, setHouseCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const normalizedCode = normalizeHouseCode(houseCode);
    
    if (!normalizedCode) {
      setError('Please enter a house code');
      return;
    }

    if (normalizedCode.length !== 6) {
      setError('House code must be exactly 6 characters');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await signInAnonymous();
      const house = await getHouse(normalizedCode);
      
      if (!house) {
        setError('House not found. Please check the code and try again.');
        setIsLoading(false);
        return;
      }

      // Navigate to house page - it will handle membership check
      navigate(`/house/${normalizedCode}`);
    } catch (error) {
      console.error('Error joining house:', error);
      setError('Failed to join house. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="join-house-page">
      <div className="join-container">
        <div className="join-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back
          </button>
          <h1>Join House</h1>
          <p>Enter the 6-character house code to join</p>
        </div>

        <form onSubmit={handleJoin} className="join-form">
          <div className="form-group">
            <label htmlFor="houseCode">House Code</label>
            <input
              id="houseCode"
              type="text"
              value={houseCode}
              onChange={(e) => {
                const normalized = normalizeHouseCode(e.target.value);
                setHouseCode(normalized);
                setError('');
              }}
              placeholder="ABC123"
              maxLength={6}
              className="house-code-input"
              autoFocus
              disabled={isLoading}
            />
            <p className="help-text">Ask your housemate for the house code</p>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="join-button"
            disabled={isLoading || !houseCode.trim()}
          >
            {isLoading ? 'Joining...' : 'Join House'}
          </button>
        </form>
      </div>
      <Footer />
    </div>
  );
}

