import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import LoginModal from '@/components/auth/LoginModal';

// --- Lazy Load Public Pages ---
const HomePage = React.lazy(() => import('@/pages/HomePage'));
const POIDetailPage = React.lazy(() => import('@/pages/POIDetailPage'));
const QRScanPage = React.lazy(() => import('@/pages/QRScanPage'));
const QuizPage = React.lazy(() => import('@/pages/QuizPage'));
const ActivatePage = React.lazy(() => import('@/pages/ActivatePage'));

// --- Lazy Load Owner Pages ---
const OwnerLayout = React.lazy(() => import('@/components/layout/OwnerLayout'));
const OwnerLoginPage = React.lazy(() => import('@/pages/owner/LoginPage'));
const OwnerRegisterPage = React.lazy(() => import('@/pages/owner/RegisterPage'));
const OwnerPaymentPage = React.lazy(() => import('@/pages/owner/OwnerPaymentPage'));
const OwnerDashboardPage = React.lazy(() => import('@/pages/owner/DashboardPage'));
const OwnerPOIListPage = React.lazy(() => import('@/pages/owner/POIListPage'));
const OwnerPOIFormPage = React.lazy(() => import('@/pages/owner/POIFormPage'));
const OwnerMenuListPage = React.lazy(() => import('@/pages/owner/MenuListPage'));
const OwnerQRPage = React.lazy(() => import('@/pages/owner/QRPage'));
const OwnerNotificationListPage = React.lazy(() => import('@/pages/owner/NotificationListPage'));
const OwnerProfilePage = React.lazy(() => import('@/pages/owner/ProfilePage'));

// --- Lazy Load Admin Pages ---
const AdminLayout = React.lazy(() => import('@/components/layout/AdminLayout'));
const AdminDashboardPage = React.lazy(() => import('@/pages/admin/DashboardPage'));
const AdminOwnerApprovalPage = React.lazy(() => import('@/pages/admin/OwnerApprovalPage'));
const AdminPOIApprovalPage = React.lazy(() => import('@/pages/admin/POIApprovalPage'));
const AdminPOIListPage = React.lazy(() => import('@/pages/admin/POIListPage'));
const AdminPOIFormPage = React.lazy(() => import('@/pages/admin/POIFormPage'));
const AdminCategoryPage = React.lazy(() => import('@/pages/admin/CategoryPage'));
const AdminLanguagePage = React.lazy(() => import('@/pages/admin/LanguagePage'));
const AdminQuizManagePage = React.lazy(() => import('@/pages/admin/QuizManagePage'));
const AdminTourListPage = React.lazy(() => import('@/pages/admin/TourListPage'));
const AdminTourFormPage = React.lazy(() => import('@/pages/admin/TourFormPage'));
const AdminQRListPage = React.lazy(() => import('@/pages/admin/QRListPage'));
const AdminAudioListPage = React.lazy(() => import('@/pages/admin/AudioListPage'));
const AdminAuditLogsPage = React.lazy(() => import('@/pages/admin/AuditLogsPage'));
const AdminTripLogsPage = React.lazy(() => import('@/pages/admin/TripLogsPage'));

// --- Protected Route Wrapper ---
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'admin' | 'owner';
}

function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { isAuthenticated, role, setLoginModalOpen, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLoginModalOpen(true);
    }
  }, [isLoading, isAuthenticated, setLoginModalOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-secondary">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-xs font-semibold mt-3.5">Restoring session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={role === 'admin' ? '/admin' : '/owner'} replace />;
  }

  return <>{children}</>;
}

// --- Loading Shimmer Skeleton Fallback ---
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-text-secondary">
      <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      <span className="text-xs font-semibold mt-3.5">Loading workspace...</span>
    </div>
  );
}

export default function App() {
  const { loginModalOpen, setLoginModalOpen } = useAuth();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* === Visitor Public Routes === */}
        <Route path="/" element={<HomePage />} />
        <Route path="/pois" element={<HomePage />} />
        <Route path="/tours" element={<HomePage />} />
        <Route path="/place/:slug" element={<POIDetailPage />} />
        <Route path="/place/detail/quiz/:poiId" element={<QuizPage />} />
        <Route path="/place/:slug/quiz" element={<QuizPage />} />
        <Route path="/qr/:code" element={<QRScanPage />} />
        <Route path="/activate" element={<ActivatePage />} />

        {/* === Owner Panel Routes === */}
        <Route path="/owner/login" element={<OwnerLoginPage />} />
        <Route path="/owner/register" element={<OwnerRegisterPage />} />
        <Route path="/owner/payment" element={<OwnerPaymentPage />} />
        
        <Route
          path="/owner"
          element={
            <ProtectedRoute allowedRole="owner">
              <OwnerLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="dashboard" element={<OwnerDashboardPage />} />
          <Route path="pois" element={<OwnerPOIListPage />} />
          <Route path="pois/new" element={<OwnerPOIFormPage />} />
          <Route path="pois/:id/edit" element={<OwnerPOIFormPage />} />
          <Route path="pois/:id/menu" element={<OwnerMenuListPage />} />
          <Route path="pois/:id/qr" element={<OwnerQRPage />} />
          <Route path="notifications" element={<OwnerNotificationListPage />} />
          <Route path="profile" element={<OwnerProfilePage />} />
        </Route>

        {/* === Admin Panel Routes === */}
        <Route path="/admin/login" element={<Navigate to="/owner/login" replace />} />
        
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="owners" element={<AdminOwnerApprovalPage />} />
          <Route path="pois" element={<AdminPOIListPage />} />
          <Route path="pois/new" element={<AdminPOIFormPage />} />
          <Route path="pois/:id/edit" element={<AdminPOIFormPage />} />
          <Route path="pois/pending" element={<AdminPOIApprovalPage />} />
          <Route path="categories" element={<AdminCategoryPage />} />
          <Route path="languages" element={<AdminLanguagePage />} />
          <Route path="quiz" element={<AdminQuizManagePage />} />
          <Route path="tours" element={<AdminTourListPage />} />
          <Route path="tours/new" element={<AdminTourFormPage />} />
          <Route path="tours/:id/edit" element={<AdminTourFormPage />} />
          <Route path="qr" element={<AdminQRListPage />} />
          <Route path="audios" element={<AdminAudioListPage />} />
          <Route path="audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="trip-logs" element={<AdminTripLogsPage />} />
        </Route>

        {/* === Catch-All Redirection === */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {loginModalOpen && (
        <LoginModal onClose={() => setLoginModalOpen(false)} />
      )}
    </Suspense>
  );
}
