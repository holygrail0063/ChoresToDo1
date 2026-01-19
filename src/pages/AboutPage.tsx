import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './AboutPage.css';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="about-container">
        <button onClick={() => navigate('/')} className="back-button">
          ← Back to Home
        </button>
        
        <div className="about-content">
          <h1>About ChoresToDo</h1>
          
          <p className="about-intro">
            ChoresToDo is a simple tool designed to help roommates and housemates manage shared household chores. 
            It automatically rotates chores weekly, so everyone gets a fair share of the work.
          </p>

          <div className="about-features">
            <h2>How it works</h2>
            <ul>
              <li><strong>Create a house:</strong> Set up your shared home and add the areas that need cleaning.</li>
              <li><strong>Share a link:</strong> Send the house link to your housemates so everyone can access the schedule.</li>
              <li><strong>Automatic rotation:</strong> Chores are automatically assigned and rotated weekly among all members.</li>
              <li><strong>Track progress:</strong> Mark chores as completed and see what's due each week.</li>
            </ul>
          </div>

          <div className="about-privacy">
            <h2>Privacy & Access</h2>
            <p>
              ChoresToDo uses anonymous access—no accounts or passwords required. 
              You can start using it right away by creating or joining a house with a simple code.
            </p>
          </div>

          <div className="about-disclaimer">
            <p>
              <strong>Note:</strong> This is a personal-use tool designed for roommates and shared homes. 
              It is not intended for commercial use.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

