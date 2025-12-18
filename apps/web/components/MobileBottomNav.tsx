import React from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HomeIcon, BriefcaseIcon, SearchIcon, UserCircleIcon } from './Icons';

interface MobileBottomNavProps {
    onSearchClick: () => void;
}

const NavItem: React.FC<{ to: string, icon: React.ReactNode, label: string, end?: boolean }> = ({ to, icon, label, end }) => {
    return (
        <ReactRouterDom.NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full text-center transition-colors duration-200 ${
                    isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`
            }
        >
            <div className="w-6 h-6 mb-1">{icon}</div>
            <span className="text-xs font-medium">{label}</span>
        </ReactRouterDom.NavLink>
    );
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onSearchClick }) => {
    const { user } = useAuth();

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-[0_-2px_5px_rgba(0,0,0,0.05)] md:hidden z-50">
            <div className="flex justify-around items-center h-full max-w-md mx-auto">
                <NavItem to="/" icon={<HomeIcon />} label="Home" end={true} />
                <NavItem to="/jobs" icon={<BriefcaseIcon />} label="Jobs" />
                <button
                    onClick={onSearchClick}
                    aria-label="Search jobs"
                    className="flex flex-col items-center justify-center w-full text-center text-gray-500 hover:text-primary transition-colors duration-200"
                >
                    <div className="w-6 h-6 mb-1"><SearchIcon /></div>
                    <span className="text-xs font-medium">Search</span>
                </button>
                <NavItem
                    to={user ? "/profile" : "/login"}
                    icon={<UserCircleIcon />}
                    label={user ? "Profile" : "Login"}
                />
            </div>
        </nav>
    );
};

export default MobileBottomNav;