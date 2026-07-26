import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import MainLayout from './layouts/MainLayout';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
const ClubsEvents = React.lazy(() => import('./pages/ClubsEvents'));
const ClubEventDetail = React.lazy(() => import('./pages/ClubEventDetail'));
const Chatbot = React.lazy(() => import('./pages/Chatbot'));
const Connect = React.lazy(() => import('./pages/Connect'));
const FacultyDirectory = React.lazy(() => import('./pages/FacultyDirectory'));
const CampusMap = React.lazy(() => import('./pages/CampusMap'));
const StudyHub = React.lazy(() => import('./pages/StudyHub'));
const AdminKnowledge = React.lazy(() => import('./pages/AdminKnowledge'));
const AdminAIReports = React.lazy(() => import('./pages/admin/AdminAIReports'));
const AdminReviews = React.lazy(() => import('./pages/admin/AdminReviews'));
import BrandedSplashLoader from './components/common/BrandedSplashLoader';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminFaculty from './pages/admin/AdminFaculty';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminEvents from './pages/admin/AdminEvents';
import AdminNotices from './pages/admin/AdminNotices';
import AdminStudyHub from './pages/admin/AdminStudyHub';
import AdminHostel from './pages/admin/AdminHostel';
import AdminBusRoutes from './pages/admin/AdminBusRoutes';
import AdminCommittees from './pages/admin/AdminCommittees';
import AdminRoommates from './pages/admin/AdminRoommates';
import AdminCalendar from './pages/admin/AdminCalendar';
import AdminSeniors from './pages/admin/AdminSeniors';
import AdminNavigation from './pages/admin/AdminNavigation';
import AdminAnnaUniversity from './pages/admin/AdminAnnaUniversity';
import AdminPlacements from './pages/admin/AdminPlacements';
import AdminWebSync from './pages/admin/AdminWebSync';
import AdminMedia from './pages/admin/AdminMedia';
import AdminRoles from './pages/admin/AdminRoles';
import AdminSettings from './pages/admin/AdminSettings';

// Route Guard: redirect unauthenticated users strictly to Welcome Page
const ProtectedRoute = ({ children }) => {
  const { onboarded, token, user } = useApp();
  const location = useLocation();

  if (!onboarded || !token || !user) {
    return <Navigate to="/welcome" state={{ from: location }} replace />;
  }
  return children;
};

// Route Guard: Admin routes
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('pm_admin_token');
  const location = useLocation();
  if (!token) return <Navigate to="/admin/login" state={{ from: location }} replace />;
  return children;
};

// Route Guard: redirect already authenticated users past welcome/login/onboarding
const AuthRoute = ({ children }) => {
  const { onboarded, token } = useApp();
  if (onboarded && token) return <Navigate to="/" replace />;
  return children;
};

// MD3 Compliant Page Loading Skeleton
const PageSkeleton = () => (
  <div className="max-w-5xl mx-auto py-8 space-y-8 animate-pulse p-6 text-left">
    <div className="space-y-2">
      <div className="h-6 bg-surfaceVariant/60 rounded-full w-1/4"></div>
      <div className="h-10 bg-surfaceVariant/40 rounded-full w-2/5 mt-2"></div>
      <div className="h-4 bg-surfaceVariant/30 rounded-full w-2/3 mt-2"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <div className="h-56 bg-surfaceVariant/20 rounded-[28px] border border-surfaceVariant/30"></div>
      <div className="h-56 bg-surfaceVariant/20 rounded-[28px] border border-surfaceVariant/30"></div>
    </div>
  </div>
);

function AppContent() {
  const { initializing } = useApp();

  if (initializing) {
    return <BrandedSplashLoader />;
  }

  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Public & Authentication Gates (No App Navbar) */}
          <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
          <Route path="/welcome" element={<AuthRoute><Welcome /></AuthRoute>} />
          <Route path="/onboarding" element={<AuthRoute><Onboarding /></AuthRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard Area */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="faculty" element={<AdminFaculty />} />
            <Route path="departments" element={<AdminDepartments />} />
            <Route path="knowledge" element={<AdminKnowledge />} />
            <Route path="ai-reports" element={<AdminAIReports />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="study-hub" element={<AdminStudyHub />} />
            <Route path="hostel" element={<AdminHostel />} />
            <Route path="bus-routes" element={<AdminBusRoutes />} />
            <Route path="committees" element={<AdminCommittees />} />
            <Route path="roommates" element={<AdminRoommates />} />
            <Route path="volunteers" element={<Navigate to="../roommates" replace />} />
            <Route path="seniors" element={<AdminSeniors />} />
            <Route path="navigation" element={<AdminNavigation />} />
            <Route path="anna-university" element={<AdminAnnaUniversity />} />
            <Route path="placements" element={<AdminPlacements />} />
            <Route path="calendar" element={<AdminCalendar />} />
            <Route path="web-sync" element={<AdminWebSync />} />
            <Route path="media" element={<AdminMedia />} />
            <Route path="roles" element={<AdminRoles />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Protected Student Portal Shell (with Navbar) */}
          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/student" element={<Home />} />
            <Route path="/student/home" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/clubs" element={<ClubsEvents />} />
            <Route path="/club-event/:id" element={<ClubEventDetail />} />
            <Route path="/connect" element={<Connect />} />
            <Route path="/faculty" element={<FacultyDirectory />} />
            <Route path="/map" element={<CampusMap />} />
            <Route path="/study-hub" element={<StudyHub />} />
            <Route path="/chatbot" element={<Chatbot />} />
          </Route>

          {/* Legacy redirects */}
          <Route path="/hostel" element={<Navigate to="/connect" replace />} />
          <Route path="/senior-connect" element={<Navigate to="/connect" replace />} />

          {/* Catch-all redirect to login or dashboard depending on auth */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
