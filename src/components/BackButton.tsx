import { useNavigate } from 'react-router-dom';
import './BackButton.css';

export default function BackButton() {
  const navigate = useNavigate();

  const handleBack = () => {
    // Try to go back, but if there's no history, go home
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <button onClick={handleBack} className="back-button">
      <span className="back-button-icon">←</span>
      <span className="back-button-text">Back</span>
    </button>
  );
}

