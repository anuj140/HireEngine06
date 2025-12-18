
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import JobsPage from './pages/JobsPage';
import JobDetailPage from './pages/JobDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ScrollToTop from './components/ScrollToTop';
import { ToastProvider } from './contexts/ToastContext';
import CompaniesPage from './pages/CompaniesPage';
import CompanyDetailPage from './pages/CompanyDetailPage';
import PublicHomePage from './pages/PublicHomePage';
import ApplicationPage from './pages/ApplicationPage';
import AppliedJobsPage from './pages/AppliedJobsPage';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import Breadcrumbs from './components/Breadcrumbs';
import { UserActivityProvider } from './contexts/UserActivityContext';
import SavedJobsPage from './pages/SavedJobsPage';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import JobAlertsPage from './pages/JobAlertsPage';
import MobileBottomNav from './components/MobileBottomNav';
import FullScreenSearch from './components/FullScreenSearch';
import { CmsData } from '../../packages/types';
import { fetchCmsContent } from '../../packages/api-client';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TermsPage from './pages/TermsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthLoading } = useAuth();
  const location = useLocation();

  if (isAuthLoading) {
      return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const [cmsData, setCmsData] = useState<CmsData | null>(null);
  const [isCmsLoading, setIsCmsLoading] = useState(true);

  const loadCmsData = () => {
      setIsCmsLoading(true);
      fetchCmsContent().then(data => {
        setCmsData(data);
      }).catch(error => {
        console.error("Failed to load CMS content, using fallback.", error);
        // Set to an empty object to pass the `!cmsData` check and prevent infinite loader
        setCmsData({} as CmsData); 
      }).finally(() => {
          setIsCmsLoading(false);
      });
  };

  useEffect(() => {
    loadCmsData();
    window.addEventListener('cms_updated', loadCmsData);
    return () => {
        window.removeEventListener('cms_updated', loadCmsData);
    };
  }, []);


  if (isAuthLoading || isCmsLoading) {
    return (
      <main className="flex-grow flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </main>
    );
  }
  
  // Fallback to empty object if cmsData is still null (unlikely due to catch block)
  const safeCmsData = cmsData || {} as CmsData;

  return (
    <main className="flex-grow">
      <Routes>
        <Route path="/" element={!user ? <PublicHomePage pageContent={safeCmsData.webPublicHome} /> : <HomePage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/companies" element={<CompaniesPage />} />
        <Route path="/company/:id" element={<CompanyDetailPage />} />
        <Route path="/job/:id" element={<JobDetailPage />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        
        <Route path="/apply/:id" element={<ProtectedRoute><ApplicationPage /></ProtectedRoute>} />
        
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit/:section" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/edit/:section/:index" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        
        <Route path="/applied-jobs" element={<ProtectedRoute><AppliedJobsPage /></ProtectedRoute>} />
        <Route path="/saved-jobs" element={<ProtectedRoute><SavedJobsPage /></ProtectedRoute>} />
        <Route path="/job-alerts" element={<ProtectedRoute><JobAlertsPage /></ProtectedRoute>} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}

function App() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <AuthProvider>
      <ToastProvider>
        <BreadcrumbProvider>
          <UserActivityProvider>
            <NotificationProvider>
              <MessageProvider>
                <HashRouter>
                  <ScrollToTop />
                  <div className="flex flex-col min-h-screen bg-light-gray font-sans">
                    <Header onSearchClick={() => setIsSearchOpen(true)} />
                    <Breadcrumbs />
                    <AppRoutes />
                    <Footer />
                    <MobileBottomNav onSearchClick={() => setIsSearchOpen(true)} />
                  </div>
                  <FullScreenSearch 
                    isOpen={isSearchOpen} 
                    onClose={() => setIsSearchOpen(false)}
                  />
                </HashRouter>
              </MessageProvider>
            </NotificationProvider>
          </UserActivityProvider>
        </BreadcrumbProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
