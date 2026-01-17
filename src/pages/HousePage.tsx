import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymous, waitForAuth } from '../firebase/auth';
import { getHouse, addMember, House } from '../firebase/houses';
import { getUserName, setUserName } from '../utils/storage';
import { normalizeHouseCode } from '../utils/houseCode';
import { startOfWeekMonday, formatWeekRange } from '../utils/weekUtils';
import { updateChoresForUser } from '../firebase/chores';
import { getSiteSettings } from '../firebase/siteSettings';
import HouseHeader from '../components/HouseHeader';
import ChoreList from '../components/ChoreList';
import NameModal from '../components/NameModal';
import MaintenanceBanner from '../components/MaintenanceBanner';
import './HousePage.css';

export default function HousePage() {
  const { houseCode: rawHouseCode } = useParams<{ houseCode: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [houseName, setHouseName] = useState<string>('');
  const [house, setHouse] = useState<House | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'my' | 'all'>('all');
  const [weekRange, setWeekRange] = useState<{ fromLabel: string; toLabel: string } | null>(null);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  useEffect(() => {
    if (!rawHouseCode) {
      navigate('/');
      return;
    }

    // Normalize house code
    const normalizedCode = normalizeHouseCode(rawHouseCode);
    
    // Validate code length
    if (normalizedCode.length !== 6) {
      setError('Invalid house code');
      setIsLoading(false);
      return;
    }

    // Redirect if code was normalized (changed)
    if (normalizedCode !== rawHouseCode) {
      navigate(`/house/${normalizedCode}`, { replace: true });
      return;
    }

    const initialize = async () => {
      try {
        setError(null);
        // Ensure user is authenticated
        await signInAnonymous();
        const uid = await waitForAuth();
        setCurrentUid(uid);

        // Check if house exists
        const houseData = await getHouse(normalizedCode);
        if (!houseData) {
          setError('House not found');
          setIsLoading(false);
          return;
        }
        
        // Check if house is disabled
        if (houseData.status === 'disabled') {
          setError('This house is currently unavailable.');
          setIsLoading(false);
          return;
        }
        
        setHouse(houseData);
        setHouseName(houseData.name || '');
        
        // Check if user is admin
        setIsAdmin(houseData.adminUid === uid);
        
        // Load site settings for maintenance mode
        const settings = await getSiteSettings();
        setIsMaintenanceMode(settings.maintenanceMode || false);
        
        // Compute week range (Monday to Sunday)
        const thisMonday = startOfWeekMonday(new Date());
        const { fromLabel, toLabel } = formatWeekRange(thisMonday);
        
        setWeekRange({ fromLabel, toLabel });

        // Migration: If house has no membersMap, initialize it
        if (!houseData.membersMap || Object.keys(houseData.membersMap).length === 0) {
          // Legacy house - check localStorage for name
          const userName = getUserName(normalizedCode);
          if (userName) {
            // Add user to membersMap
            await addMember(normalizedCode, uid, userName);
            // Reload house
            const updatedHouse = await getHouse(normalizedCode);
            if (updatedHouse) {
              setHouse(updatedHouse);
            }
          }
        }

        // Check membership
        const membersMap = houseData.membersMap || {};
        const userMember = membersMap[uid];
        
        if (!userMember) {
          // User not a member - force Set Name
          setIsNameModalOpen(true);
        } else {
          // User is a member - set name from Firestore
          setCurrentUserName(userMember.name);
          // Also cache in localStorage for backward compatibility
          setUserName(normalizedCode, userMember.name);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing house:', error);
        setError('Failed to load house. Please try again.');
        setIsLoading(false);
      }
    };

    initialize();
  }, [rawHouseCode, navigate]);

  const handleNameChange = async (name: string | null) => {
    const normalizedCode = rawHouseCode ? normalizeHouseCode(rawHouseCode) : '';
    if (!name || !normalizedCode || !currentUid) return;
    
    const hadNameBefore = !!currentUserName;
    
    try {
      // Add user to house members (updates membersMap)
      await addMember(normalizedCode, currentUid, name);
      
      // Update all chores assigned to this user with the new name
      await updateChoresForUser(normalizedCode, currentUid, name);
      
      // Update local state
      setCurrentUserName(name);
      setUserName(normalizedCode, name); // Cache in localStorage
      
      // Switch to "My Chores" view when name is set or changed
      if (!hadNameBefore || viewMode === 'all') {
        setViewMode('my');
      }
      
      // Reload house to get updated membersMap
      const updatedHouse = await getHouse(normalizedCode);
      if (updatedHouse) {
        setHouse(updatedHouse);
      }
      
      setIsNameModalOpen(false);
    } catch (error) {
      console.error('Error saving name:', error);
      alert('Failed to save name. Please try again.');
    }
  };

  const normalizedCode = rawHouseCode ? normalizeHouseCode(rawHouseCode) : '';

  if (isLoading) {
    return (
      <div className="loading-container">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loading-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button onClick={() => navigate('/')} className="back-button">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!normalizedCode || normalizedCode.length !== 6) return null;

  return (
    <div className="house-page">
      <MaintenanceBanner />
      <HouseHeader 
        houseCode={normalizedCode} 
        houseName={houseName} 
        currentUid={currentUid}
        house={house}
        onNameChange={handleNameChange} 
      />
      
      {currentUserName && (
        <>
          {weekRange && (
            <div className="rotation-week-header">
              <h2>
                {weekRange.fromLabel} — {weekRange.toLabel}
              </h2>
            </div>
          )}
          
          <div className="view-toggle">
            <button
              className={`toggle-button ${viewMode === 'my' ? 'active' : ''}`}
              onClick={() => setViewMode('my')}
            >
              My Chores
            </button>
            <button
              className={`toggle-button ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              All Chores
            </button>
          </div>
          
          <ChoreList 
            houseCode={normalizedCode}
            isMaintenanceMode={isMaintenanceMode} 
            currentUserName={currentUserName}
            currentUid={currentUid}
            isAdmin={isAdmin}
            viewMode={viewMode}
            house={house}
          />
        </>
      )}
      
      <NameModal
        isOpen={isNameModalOpen}
        currentName={null}
        onSave={handleNameChange}
        required={true}
      />
    </div>
  );
}

