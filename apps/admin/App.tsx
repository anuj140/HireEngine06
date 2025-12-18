

import React from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import UserDetailPage from './pages/UserDetailPage';
import JobManagementPage from './pages/JobManagementPage';
import JobDetailPage from './pages/JobDetailPage';
import CompanyManagementPage from './pages/CompanyManagementPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import CMSManagementPage from './pages/CMSManagementPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CommunicationsPage from './pages/CommunicationsPage';
import SecurityPage from './pages/SecurityPage';
import MonetizationPage from './pages/MonetizationPage';
import SpecialFeaturesPage from './pages/SpecialFeaturesPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider } from './contexts/AuthContext';
import { useAdminAuth } from './hooks/useAdminAuth';
import { ToastProvider } from './contexts/ToastContext';
import { BroadcastsProvider } from './contexts/BroadcastsContext';
// DO: Add comment above each fix.
// FIX: Added import for the new RecruiterApprovalsPage.
import RecruiterApprovalsPage from './pages/RecruiterApprovalsPage';


const AppLayout: React.FC = () => {
    return (
        <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="px-8 pt-6">
                    <Header />
                </div>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-light p-8">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/users" element={<UserManagementPage />} />
                        <Route path="/users/:id" element={<UserDetailPage />} />
                        <Route path="/companies" element={<CompanyManagementPage />} />
                        <Route path="/companies/:companyId" element={<CompanyDetailsPage />} />
                        <Route path="/jobs" element={<JobManagementPage />} />
                        <Route path="/jobs/:id" element={<JobDetailPage />} />
                        {/* DO: Add comment above each fix. */}
                        {/* FIX: Added route for RecruiterApprovalsPage. */}
                        <Route path="/recruiter-approvals" element={<RecruiterApprovalsPage />} />
                        <Route path="/cms" element={<CMSManagementPage />} />
                        <Route path="/analytics" element={<AnalyticsPage />} />
                        <Route path="/communications" element={<CommunicationsPage />} />
                        <Route path="/security" element={<SecurityPage />} />
                        <Route path="/monetization" element={<MonetizationPage />} />
                        <Route path="/special-features" element={<SpecialFeaturesPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
        </div>
    );
}

const AppRoutes: React.FC = () => {
    const { user, isAuthLoading } = useAdminAuth();

    if (isAuthLoading) {
        return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
            <Route path="/*" element={user ? <AppLayout /> : <Navigate to="/login" />} />
        </Routes>
    );
};


// Main App Component
const App: React.FC = () => {
    return (
        <AuthProvider>
            <ToastProvider>
                <BroadcastsProvider>
                    <HashRouter>
                        <AppRoutes />
                    </HashRouter>
                </BroadcastsProvider>
            </ToastProvider>
        </AuthProvider>
    );
};

export default App;