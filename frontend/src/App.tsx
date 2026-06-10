import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { APP_ROUTES } from '@/constants/routes';

// Layouts
import MobileLayout from '@/components/layout/MobileLayout';
import OwnerLayout from '@/components/layout/OwnerLayout';

// PWA Pages
import Home from '@/pages/pwa/Home';
import Search from '@/pages/pwa/Search';
import MapPage from '@/pages/pwa/Map';
import Tours from '@/pages/pwa/Tours';
import POIDetail from '@/pages/pwa/POIDetail';
import QRLanding from '@/pages/pwa/QR';

// Owner Pages
import Login from '@/pages/owner/Login';
import Dashboard from '@/pages/owner/Dashboard';
import POIList from '@/pages/owner/POIList';
import MenuManagement from '@/pages/owner/MenuManagement';
import Notifications from '@/pages/owner/Notifications';

// Admin Pages
import AdminLayout from '@/components/layout/AdminLayout';
import AdminDashboard from '@/pages/admin/Dashboard';
import AdminOwners from '@/pages/admin/Owners';
import AdminPOIs from '@/pages/admin/POIs';
import AdminQR from '@/pages/admin/QR';
import AdminQuiz from '@/pages/admin/Quiz';
import AdminAudio from '@/pages/admin/Audio';
import AdminLanguages from '@/pages/admin/Languages';
import AdminAuditLogs from '@/pages/admin/AuditLogs';

// Errors
import NotFound from '@/pages/errors/NotFound';
import { Toaster } from '@/components/ui/sonner';

export function App() {
  return (
    <>
    <BrowserRouter>
      <Routes>
        {/* Tourist Public Mobile PWA Routes */}
        <Route path="/" element={<MobileLayout />}>
          <Route index element={<Home />} />
          <Route path={APP_ROUTES.SEARCH.substring(1)} element={<Search />} />
          <Route path={APP_ROUTES.MAP.substring(1)} element={<MapPage />} />
          <Route path={APP_ROUTES.TOURS.substring(1)} element={<Tours />} />
        </Route>
        
        {/* Detail Pages without Bottom Navigation */}
        <Route path={APP_ROUTES.POI_DETAIL.substring(1)} element={<POIDetail />} />
        
        {/* QR Flow */}
        <Route path="/qr/:code" element={<QRLanding />} />

        {/* Owner Portal Routes */}
        <Route path={APP_ROUTES.LOGIN.substring(1)} element={<Login />} />
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<Navigate to={APP_ROUTES.OWNER_DASHBOARD} replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pois" element={<POIList />} />
          <Route path="menu" element={<MenuManagement />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        {/* Admin CMS Routes */}
        <Route path={APP_ROUTES.ADMIN_LOGIN.substring(1)} element={<Login />} /> {/* Tạm thời dùng chung form Login */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to={APP_ROUTES.ADMIN_DASHBOARD} replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="owners" element={<AdminOwners />} />
          <Route path="pois" element={<AdminPOIs />} />
          <Route path="qr" element={<AdminQR />} />
          <Route path="quiz" element={<AdminQuiz />} />
          <Route path="audio" element={<AdminAudio />} />
          <Route path="languages" element={<AdminLanguages />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
    </>
  );
}

export default App;


