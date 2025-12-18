import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    NaukriLogo,
    DashboardIcon,
    BriefcaseIcon,
    UsersIcon,
    DocumentChartBarIcon,
    BuildingOfficeIcon,
    CogIcon,
    LogoutIcon,
    CreditCardIcon,
    UserGroupIcon,
    CheckCircleIcon,
    CheckBadgeIcon
} from './Icons';
import { useCompanyAuth } from '../hooks/useCompanyAuth';

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    exact?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, children, exact = false }) => {
    const location = useLocation();
    const isActive = exact ? location.pathname === `/dashboard${to === '/' ? '' : to}` : location.pathname.startsWith(`/dashboard${to}`);

    return (
        <Link
            to={`/dashboard${to === '/' ? '' : to}`}
            className={`flex items-center px-4 py-3 text-sm font-semibold rounded-lg transition-colors ${isActive
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 dark:text-dark-text-secondary hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
        >
            <span className="w-5 h-5 mr-3">{icon}</span>
            {children}
        </Link>
    );
};

const Sidebar: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const { user } = useCompanyAuth();

    if (!user) return null;

    const isAdmin = user.role === 'Admin';
    const isHrManager = user.role === 'HR Manager';

    return (
        <aside className="w-64 bg-white dark:bg-dark-light-background flex-shrink-0 border-r border-gray-200 dark:border-dark-border flex flex-col">
            <div className="h-16 flex items-center justify-center border-b border-gray-200 dark:border-dark-border px-4">
                <Link to="/dashboard">
                    <NaukriLogo className="h-7" />
                </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                <NavItem to="/" icon={<DashboardIcon />} exact>Dashboard</NavItem>
                {/* Jobs – visible to Admin, Manager, and Team Member */}
                {(isAdmin || isHrManager || user.role === 'recruiter') && (
                    <NavItem to="/jobs" icon={<BriefcaseIcon />}>Jobs</NavItem>
                )}
                <NavItem to="/applicants" icon={<UsersIcon />}>Applicants</NavItem>
                <NavItem to="/shortlisted" icon={<CheckCircleIcon />}>Shortlisted</NavItem>
                {/* Approvals – Admin & Manager */}
                {(isAdmin || isHrManager) && (
                    <NavItem to="/approvals" icon={<CheckBadgeIcon />}>Approvals</NavItem>
                )}
                {/* Company Profile – Admin only */}
                {isAdmin && (
                    <NavItem to="/company-profile" icon={<BuildingOfficeIcon />}>Company Profile</NavItem>
                )}

                <div className="pt-2 mt-2 border-t dark:border-gray-700">
                    {/* Analytics – Admin & Manager */}
                    {(isAdmin || isHrManager) && (
                        <NavItem to="/analytics" icon={<DocumentChartBarIcon />}>Analytics</NavItem>
                    )}
                    {/* Subscription – Admin only */}
                    {isAdmin && (
                        <NavItem to="/subscription" icon={<CreditCardIcon />}>Subscription</NavItem>
                    )}
                    {/* Team Management – Admin & Manager */}
                    {(isAdmin || isHrManager) && (
                        <NavItem to="/team" icon={<UserGroupIcon />}>Team Management</NavItem>
                    )}
                </div>
            </nav>
            <div className="p-4 border-t border-gray-200 dark:border-dark-border">
                {isAdmin && <NavItem to="/settings" icon={<CogIcon />}>Settings</NavItem>}
                <button
                    onClick={onLogout}
                    className="w-full flex items-center px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg mt-2 transition-colors"
                >
                    <span className="w-5 h-5 mr-3"><LogoutIcon /></span>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;