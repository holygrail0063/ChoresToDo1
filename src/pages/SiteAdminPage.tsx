import { useState, useEffect } from 'react';
import { ensureAnonAuth, isSiteAdmin } from '../firebase/siteAdmin';
import AccessDenied from '../components/AccessDenied';
import SiteAdminDashboard from '../components/SiteAdminDashboard';
import './SiteAdminPage.css';

export default function SiteAdminPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      // Ensure anonymous authentication
      const currentUid = await ensureAnonAuth();
      setUid(currentUid);
      
      // Check if user is admin
      const adminStatus = await isSiteAdmin(currentUid);
      setIsAdmin(adminStatus);
      
      console.log('Admin check:', { uid: currentUid, isAdmin: adminStatus });
    } catch (error) {
      console.error('Error checking admin access:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="site-admin-page">
        <div className="loading">Checking admin access...</div>
      </div>
    );
  }

  if (isAdmin === false && uid) {
    return <AccessDenied uid={uid} />;
  }

  if (isAdmin === true) {
    return <SiteAdminDashboard />;
  }

  return (
    <div className="site-admin-page">
      <div className="loading">Loading...</div>
    </div>
  );
}

