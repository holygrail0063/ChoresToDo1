import { HashRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import CreateHouse from './components/CreateHouse';
import JoinHousePage from './pages/JoinHousePage';
import HousePage from './pages/HousePage';
import AdminPage from './pages/AdminPage';
import ActivityPage from './pages/ActivityPage';
import SiteAdminPage from './pages/SiteAdminPage';
import './App.css';

// Legacy route redirects
function LegacyHouseRedirect() {
  const { houseCode } = useParams<{ houseCode: string }>();
  return <Navigate to={`/house/${houseCode}`} replace />;
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/create" element={<CreateHouse />} />
        <Route path="/join" element={<JoinHousePage />} />
        <Route path="/house/:houseCode" element={<HousePage />} />
        <Route path="/house/:houseCode/admin" element={<AdminPage />} />
        <Route path="/house/:houseCode/activity" element={<ActivityPage />} />
        <Route path="/Admin" element={<SiteAdminPage />} />
        {/* Legacy routes for backward compatibility */}
        <Route path="/h/:houseCode" element={<LegacyHouseRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;

