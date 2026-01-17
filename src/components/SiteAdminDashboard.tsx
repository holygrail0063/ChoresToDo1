import { useState, useEffect } from 'react';
import { getSiteSettings, updateSiteSettings, SiteSettings } from '../firebase/siteSettings';
import { listHouses, updateHouseStatus, getHouseStats, HouseListItem } from '../firebase/siteHouses';
import './SiteAdminDashboard.css';

export default function SiteAdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'settings'>('overview');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [houses, setHouses] = useState<HouseListItem[]>([]);
  const [stats, setStats] = useState({ totalHouses: 0, housesCreatedToday: 0, activeHouses: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'houses') {
      loadHouses();
    }
  }, [activeTab, searchTerm]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsData, statsData] = await Promise.all([
        getSiteSettings(),
        getHouseStats(),
      ]);
      setSettings(settingsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHouses = async () => {
    try {
      const housesData = await listHouses(searchTerm || undefined);
      setHouses(housesData);
    } catch (error) {
      console.error('Error loading houses:', error);
    }
  };

  const handleUpdateSettings = async (updates: Partial<SiteSettings>) => {
    if (!settings) return;
    
    setSaveMessage('');
    try {
      await updateSiteSettings(updates);
      setSettings({ ...settings, ...updates });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error updating settings:', error);
      setSaveMessage('Error saving settings');
    }
  };

  const handleToggleHouseStatus = async (houseCode: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'disabled' : 'active';
    try {
      await updateHouseStatus(houseCode, newStatus);
      setHouses(houses.map(h => h.houseCode === houseCode ? { ...h, status: newStatus } : h));
      console.log(`House ${houseCode} ${newStatus}`);
    } catch (error) {
      console.error('Error updating house status:', error);
      alert('Failed to update house status');
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Site Admin Console</h1>
        <div className="admin-tabs">
          <button
            className={activeTab === 'overview' ? 'active' : ''}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={activeTab === 'houses' ? 'active' : ''}
            onClick={() => setActiveTab('houses')}
          >
            Houses
          </button>
          <button
            className={activeTab === 'settings' ? 'active' : ''}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Site Overview</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{stats.totalHouses}</div>
                <div className="stat-label">Total Houses</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.housesCreatedToday}</div>
                <div className="stat-label">Created Today</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{stats.activeHouses}</div>
                <div className="stat-label">Active Houses</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'houses' && (
          <div className="houses-section">
            <h2>Houses Management</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by house code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="houses-table">
              <table>
                <thead>
                  <tr>
                    <th>House Code</th>
                    <th>Name</th>
                    <th>Members</th>
                    <th>Created</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {houses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="no-data">No houses found</td>
                    </tr>
                  ) : (
                    houses.map(house => {
                      const createdAt = house.createdAt?.toDate 
                        ? house.createdAt.toDate().toLocaleDateString()
                        : 'Unknown';
                      const status = house.status || 'active';
                      
                      return (
                        <tr key={house.houseCode}>
                          <td><code>{house.houseCode}</code></td>
                          <td>{house.name || 'Unnamed'}</td>
                          <td>{house.memberCount}</td>
                          <td>{createdAt}</td>
                          <td>
                            <span className={`status-badge ${status}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleToggleHouseStatus(house.houseCode, status)}
                              className={`toggle-btn ${status === 'active' ? 'disable' : 'enable'}`}
                            >
                              {status === 'active' ? 'Disable' : 'Enable'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && settings && (
          <div className="settings-section">
            <h2>Site Settings</h2>
            {saveMessage && (
              <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                {saveMessage}
              </div>
            )}
            
            <div className="settings-form">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.maintenanceMode}
                    onChange={(e) => handleUpdateSettings({ maintenanceMode: e.target.checked })}
                  />
                  <span>Maintenance Mode</span>
                </label>
                <p className="setting-description">
                  When enabled, users can read but cannot write. Shows maintenance banner.
                </p>
              </div>

              <div className="setting-item">
                <label>Maintenance Message</label>
                <textarea
                  value={settings.maintenanceMessage}
                  onChange={(e) => handleUpdateSettings({ maintenanceMessage: e.target.value })}
                  onBlur={() => handleUpdateSettings({ maintenanceMessage: settings.maintenanceMessage })}
                  rows={3}
                  className="setting-input"
                />
              </div>

              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.allowNewHouseCreation}
                    onChange={(e) => handleUpdateSettings({ allowNewHouseCreation: e.target.checked })}
                  />
                  <span>Allow New House Creation</span>
                </label>
                <p className="setting-description">
                  When disabled, users cannot create new houses.
                </p>
              </div>

              <div className="setting-item">
                <label>Max Members Per House</label>
                <input
                  type="number"
                  value={settings.maxMembersPerHouse}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSettings({ ...settings, maxMembersPerHouse: value });
                  }}
                  onBlur={() => handleUpdateSettings({ maxMembersPerHouse: settings.maxMembersPerHouse })}
                  min="1"
                  max="50"
                  className="setting-input"
                />
              </div>

              <div className="setting-item">
                <label>Max Chores Per House</label>
                <input
                  type="number"
                  value={settings.maxChoresPerHouse}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setSettings({ ...settings, maxChoresPerHouse: value });
                  }}
                  onBlur={() => handleUpdateSettings({ maxChoresPerHouse: settings.maxChoresPerHouse })}
                  min="1"
                  max="200"
                  className="setting-input"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

