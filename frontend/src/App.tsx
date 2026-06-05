import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';

// Layouts
import MobileLayout from './components/layout/MobileLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages (Tourists)
import ExplorePage from './pages/ExplorePage';
import DiscoverPage from './pages/DiscoverPage';
import POIDetailPage from './pages/POIDetailPage';
import ScanPage from './pages/ScanPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

// Pages (Admin)
import DashboardPage from './pages/admin/DashboardPage';
import POIEditorPage from './pages/admin/POIEditorPage';
import ToursPage from './pages/admin/ToursPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';

// QR Code Redirect Handler
function QRRedirect() {
  const { code } = useParams<{ code: string }>();
  // Redirect to discover page with QR code in query parameters
  return <Navigate to={`/discover?qr=${code}`} replace />;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Tourist Public Mobile PWA Routes */}
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<ExplorePage />} />
          <Route path="discover" element={<DiscoverPage />} />
          <Route path="poi/:id" element={<POIDetailPage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="qr/:code" element={<QRRedirect />} />
        </Route>

        {/* Admin CMS Gated Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="pois" element={<POIEditorPage />} />
          <Route path="tours" element={<ToursPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        {/* Fallback Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
