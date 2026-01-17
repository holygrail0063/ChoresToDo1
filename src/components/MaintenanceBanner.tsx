import { useEffect, useState } from 'react';
import { getSiteSettings, SiteSettings } from '../firebase/siteSettings';
import './MaintenanceBanner.css';

export default function MaintenanceBanner() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const siteSettings = await getSiteSettings();
      setSettings(siteSettings);
    } catch (error) {
      console.error('Error loading site settings:', error);
    }
  };

  if (!settings?.maintenanceMode) {
    return null;
  }

  return (
    <div className="maintenance-banner">
      <div className="maintenance-content">
        <span className="maintenance-icon">⚠️</span>
        <span className="maintenance-message">
          {settings.maintenanceMessage || 'The site is currently under maintenance.'}
        </span>
      </div>
    </div>
  );
}

