import { useState } from 'react';
import './AccessDenied.css';

interface AccessDeniedProps {
  uid: string;
}

export default function AccessDenied({ uid }: AccessDeniedProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy UID:', error);
    }
  };

  return (
    <div className="access-denied">
      <div className="access-denied-container">
        <div className="access-denied-icon">🔒</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to access the admin console.</p>
        
        <div className="uid-section">
          <p className="uid-label">Your User ID:</p>
          <div className="uid-display">
            <code>{uid}</code>
            <button 
              onClick={handleCopyUid}
              className="copy-uid-btn"
              title="Copy UID"
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
          <p className="uid-instructions">
            To gain admin access, this UID must be added to the <code>siteAdmins</code> collection in Firebase Console.
          </p>
        </div>
      </div>
    </div>
  );
}

