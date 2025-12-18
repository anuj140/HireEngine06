


import React, { useState, useEffect } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { HashRouter, Routes, Route, Navigate, Outlet, useOutletContext } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import Header from './components/Header';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import { AuthProvider } from './contexts/AuthContext';
import { useCompanyAuth } from './hooks/useCompanyAuth';
import { ToastProvider } from './contexts/ToastContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import Breadcrumbs from './components/Breadcrumbs';
import { NotificationProvider } from './contexts/NotificationContext';
import { MessageProvider } from './contexts/MessageContext';
import JobsManagementPage from './pages/JobsManagementPage';
import PostJobPage from './pages/PostJobPage';
import RecruiterApplicantsPage from './pages/RecruiterApplicantsPage';
import ApplicantsPage from './pages/ApplicantsPage';
import ShortlistedCandidatesPage from './pages/ShortlistedCandidatesPage';
// DO: Add comment above each fix.
// FIX: Changed import for RecruiterCompanyProfilePage from a named to a default import to match the component's export.
import RecruiterCompanyProfilePage from './pages/RecruiterCompanyProfilePage';
import AnalyticsPage from './pages/AnalyticsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import PlanDetailsPage from './pages/PlanDetailsPage';
import PaymentPage from './pages/PaymentPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettingsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import { CmsData } from '../../packages/types';
import { fetchCmsContent } from '../../packages/api-client';

const PublicLayout: React.FC<{ cmsData: CmsData | null }> = ({ cmsData }) => (
    <div className="flex flex-col min-h-screen bg-white font-sans">
        <Header />
        <main className="flex-grow">
            <Outlet context={{ cmsData }} />
        </main>
        <Footer />
    </div>
);

const DashboardLayout: React.FC = () => {
    const { logout } = useCompanyAuth();
    return (
        <div className="flex h-screen bg-light-gray dark:bg-dark-background font-sans text-dark-gray dark:text-dark-text">
            <Sidebar onLogout={logout} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-dark-light-background border-b border-gray-200 dark:border-dark-border">
                    <div className="h-16 flex items-center px-8">
                        <Breadcrumbs />
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light-gray dark:bg-dark-background p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthLoading } = useCompanyAuth();
    if (isAuthLoading) return <div>Loading...</div>; // Or a spinner
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useCompanyAuth();
    return user?.role === 'Admin' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const HrRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useCompanyAuth();
    return user?.role === 'Admin' || user?.role === 'HR Manager' ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const LandingPageWrapper: React.FC = () => {
    const { cmsData } = useOutletContext<{ cmsData: CmsData | null }>();
    return <LandingPage pageContent={cmsData?.companyLanding || null} />;
};


const AppRoutes: React.FC = () => {
    const { user } = useCompanyAuth();
    const [cmsData, setCmsData] = useState<CmsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadCmsData = () => {
        // Since this can be called from an event listener, we don't want to set loading every time
        fetchCmsContent().then(data => {
            setCmsData(data);
            if (isLoading) setIsLoading(false);
        });
    };

    useEffect(() => {
        setIsLoading(true);
        loadCmsData();

        // Listen for updates from the admin panel
        window.addEventListener('cms_updated', loadCmsData);
        return () => {
            window.removeEventListener('cms_updated', loadCmsData);
        };
    }, []);

    if (isLoading) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

    return (
        <Routes>
            <Route element={<PublicLayout cmsData={cmsData} />}>
                <Route path="/" element={<LandingPageWrapper />} />
                <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
            </Route>

            <Route
                path="/dashboard/*"
                element={
                    <ProtectedRoute>
                        <DashboardLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<DashboardPage />} />
                <Route path="jobs" element={<JobsManagementPage />} />
                <Route path="post-job" element={<HrRoute><PostJobPage /></HrRoute>} />
                {/* DO: Add comment above each fix. */}
                {/* FIX: Correctly pass `isEditMode` prop to the PostJobPage component. */}
                <Route path="edit-job/:id" element={<HrRoute><PostJobPage isEditMode={true} /></HrRoute>} />
                <Route path="applicants" element={<RecruiterApplicantsPage />} />
                <Route path="applicants/job/:id" element={<ApplicantsPage />} />
                <Route path="shortlisted" element={<ShortlistedCandidatesPage />} />
                <Route path="company-profile" element={<AdminRoute><RecruiterCompanyProfilePage /></AdminRoute>} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="subscription" element={<AdminRoute><SubscriptionPage /></AdminRoute>} />
                <Route path="subscription/plan/:planId" element={<AdminRoute><PlanDetailsPage /></AdminRoute>} />
                <Route path="subscription/payment/:planId" element={<AdminRoute><PaymentPage /></AdminRoute>} />
                <Route path="team" element={<HrRoute><TeamPage /></HrRoute>} />
                <Route path="settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
                <Route path="approvals" element={<ApprovalsPage />} />
            </Route>

        </Routes>
    )
}

const App: React.FC = () => {
    useEffect(() => {
        // On initial load, check localStorage for the theme
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, []);

    return (
        <AuthProvider>
            <ToastProvider>
                <BreadcrumbProvider>
                    <NotificationProvider>
                        <MessageProvider>
                            <HashRouter>
                                <AppRoutes />
                            </HashRouter>
                        </MessageProvider>
                    </NotificationProvider>
                </BreadcrumbProvider>
            </ToastProvider>
        </AuthProvider>
    );
};

export default App;