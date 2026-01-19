import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-links">
        <Link to="/about">About</Link>
        <span className="footer-separator">|</span>
        <Link to="/terms">Terms</Link>
      </div>
    </footer>
  );
}

