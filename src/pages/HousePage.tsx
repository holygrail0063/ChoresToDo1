import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { signInAnonymous, waitForAuth } from '../firebase/auth';
import { getHouse, House } from '../firebase/houses';
import { normalizeHouseCode } from '../utils/houseCode';
import { startOfWeekMonday, formatWeekRange } from '../utils/weekUtils';
import { getSiteSettings } from '../firebase/siteSettings';
import HouseHeader from '../components/HouseHeader';
import ChoreList from '../components/ChoreList';
import MaintenanceBanner from '../components/MaintenanceBanner';
import Footer from '../components/Footer';
import './HousePage.css';

export default function HousePage() {
  const { houseCode: rawHouseCode } = useParams<{ houseCode: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [houseName, setHouseName] = useState<string>('');
  const [house, setHouse] = useState<House | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
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

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing house:', error);
        setError('Failed to load house. Please try again.');
        setIsLoading(false);
      }
    };

    initialize();
  }, [rawHouseCode, navigate]);


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
          />
          
          <ChoreList 
            houseCode={normalizedCode}
            isMaintenanceMode={isMaintenanceMode} 
            currentUid={currentUid}
            isAdmin={isAdmin}
            house={house}
            weekRange={weekRange}
          />
          
          <Footer />
        </div>
      );
}

