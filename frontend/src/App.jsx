import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import MainLayout from './layouts/MainLayout';
import Welcome from './pages/Welcome';
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
import BrandedSplashLoader from './components/common/BrandedSplashLoader';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminStudents from './pages/admin/AdminStudents';
import AdminEvents from './pages/admin/AdminEvents';
import AdminNotices from './pages/admin/AdminNotices';
import AdminCommittees from './pages/admin/AdminCommittees';
import AdminVolunteers from './pages/admin/AdminVolunteers';
import AdminSeniors from './pages/admin/AdminSeniors';

// Route Guard: redirect unauthenticated users to Welcome Gate
const ProtectedRoute = ({ children }) => {
  const { onboarded } = useApp();
  if (!onboarded) return <Navigate to="/welcome" replace />;
  return children;
};

// Route Guard: Admin routes
const AdminProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('pm_admin_token');
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

// Route Guard: redirect already-onboarded users past welcome/onboarding
const OnboardingRoute = ({ children }) => {
  const { onboarded } = useApp();
  if (onboarded) return <Navigate to="/" replace />;
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
  const { initializing, showSplash } = useApp();

  if (initializing) {
    if (showSplash) {
      return <BrandedSplashLoader />;
    }
    return null; // Prevent flashes on super-fast network queries
  }

  return (
    <BrowserRouter>
      <React.Suspense fallback={<PageSkeleton />}>
        <Routes>
          {/* Pre-app gates (no navbar) */}
          <Route path="/welcome" element={<OnboardingRoute><Welcome /></OnboardingRoute>} />
          <Route path="/onboarding" element={<OnboardingRoute><Onboarding /></OnboardingRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Admin Dashboard Area */}
          <Route path="/admin" element={<AdminProtectedRoute><AdminLayout /></AdminProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="knowledge" element={<AdminKnowledge />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="notices" element={<AdminNotices />} />
            <Route path="committees" element={<AdminCommittees />} />
            <Route path="volunteers" element={<AdminVolunteers />} />
            <Route path="seniors" element={<AdminSeniors />} />
            <Route path="settings" element={<div className="p-4"><h1 className="text-xl font-bold">Settings Module</h1></div>} />
          </Route>

          {/* Main app shell with persistent navbar */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/clubs" element={<ProtectedRoute><ClubsEvents /></ProtectedRoute>} />
            <Route path="/club-event/:id" element={<ProtectedRoute><ClubEventDetail /></ProtectedRoute>} />
            <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
            <Route path="/faculty" element={<ProtectedRoute><FacultyDirectory /></ProtectedRoute>} />
            <Route path="/map" element={<ProtectedRoute><CampusMap /></ProtectedRoute>} />
            <Route path="/study-hub" element={<ProtectedRoute><StudyHub /></ProtectedRoute>} />
            <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          </Route>

          {/* Legacy redirects for old /hostel and /senior-connect routes */}
          <Route path="/hostel" element={<Navigate to="/connect" replace />} />
          <Route path="/senior-connect" element={<Navigate to="/connect" replace />} />

          {/* Catch-all */}
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

