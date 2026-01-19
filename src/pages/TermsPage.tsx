import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import './TermsPage.css';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <div className="terms-page">
      <div className="terms-container">
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back
        </button>
        
        <div className="terms-content">
          <h1>Terms & Conditions</h1>
          
          <div className="terms-section">
            <h2>Use of Service</h2>
            <p>
              ChoresToDo is provided "as is" without any guarantees or warranties. 
              We do not guarantee the accuracy, availability, or reliability of the service.
            </p>
          </div>

          <div className="terms-section">
            <h2>User Responsibility</h2>
            <p>
              You are responsible for how you use this app. ChoresToDo is a tool to help coordinate 
              household tasks, but it is not a substitute for agreements or communication between housemates.
            </p>
          </div>

          <div className="terms-section">
            <h2>No Liability</h2>
            <p>
              We are not responsible for any disputes that arise between housemates regarding chores, 
              assignments, or the use of this app. We are also not responsible for any lost data, 
              interruptions in service, or changes to the app.
            </p>
          </div>

          <div className="terms-section">
            <h2>Service Modifications</h2>
            <p>
              The app administrators and creators can modify, update, or shut down the service at any time 
              without notice. We are not obligated to maintain or continue providing the service.
            </p>
          </div>

          <div className="terms-section">
            <h2>Privacy & Data</h2>
            <p>
              ChoresToDo does not require personal accounts or passwords. The data stored is limited to:
            </p>
            <ul>
              <li>House names and codes</li>
              <li>Chore lists and assignments</li>
              <li>Member names (as entered by users)</li>
            </ul>
            <p>
              We do not sell, share, or use your data for any commercial purposes. 
              Data is stored securely but we cannot guarantee absolute security.
            </p>
          </div>

          <div className="terms-section">
            <h2>Personal Use Only</h2>
            <p>
              This app is intended for personal use by roommates and shared households. 
              It is not intended for commercial or business use.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

