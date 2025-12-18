import React from 'react';
// DO: Add comment above each fix.
// FIX: The build environment seems to have issues with named exports from 'react-router-dom'. Using a namespace import instead.
import * as ReactRouterDom from 'react-router-dom';
import {
  DashboardIcon,
  UserGroupIcon,
  BriefcaseIcon,
  EyeIcon,
  ChartBarIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  SparklesIcon,
  LogoutIcon,
  BuildingOfficeIcon,
  // DO: Add comment above each fix.
  // FIX: Added CheckBadgeIcon for approvals link.
  CheckBadgeIcon,
  ArrowLeftIcon,
} from './Icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; children: React.ReactNode }> = ({ to, icon, children }) => {
  return (
    <li>
      <ReactRouterDom.NavLink
        to={to}
        end={to === "/"} // Use 'end' prop for exact match on Dashboard only
        className={({ isActive }) =>
          `flex items-center px-4 py-3 rounded-xl transition-colors ${isActive
            ? 'bg-white/10 text-white'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
          }`
        }
      >
        <span className="w-6 h-6 mr-4">{icon}</span>
        <span className="font-semibold">{children}</span>
      </ReactRouterDom.NavLink>
    </li>
  );
};

const Sidebar: React.FC = () => {
  const location = ReactRouterDom.useLocation();
  const isCmsMode = location.pathname.startsWith('/cms');

  return (
    <aside className={`${isCmsMode ? 'w-20' : 'w-72'} bg-primary text-white flex-shrink-0 flex flex-col rounded-r-3xl shadow-2xl transition-all duration-300`}>
      <div className={`h-24 flex items-center ${isCmsMode ? 'justify-center px-0' : 'justify-start px-8'}`}>
        <ReactRouterDom.NavLink to="/" className="text-2xl font-bold flex items-center space-x-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center font-bold">J</div>
          {!isCmsMode && <span>JobPortal Pro</span>}
        </ReactRouterDom.NavLink>
      </div>
      <nav className="flex-1 px-4 custom-scrollbar overflow-y-auto">
        <ul className="space-y-2">
          <NavItem to="/" icon={<DashboardIcon />}>{!isCmsMode && "Dashboard"}</NavItem>
          <NavItem to="/users" icon={<UserGroupIcon />}>{!isCmsMode && "User Management"}</NavItem>
          <NavItem to="/companies" icon={<BuildingOfficeIcon />}>{!isCmsMode && "Company Management"}</NavItem>
          <NavItem to="/jobs" icon={<BriefcaseIcon />}>{!isCmsMode && "Job Management"}</NavItem>
          {/* DO: Add comment above each fix. */}
          {/* FIX: Added NavItem for Recruiter Approvals page. */}
          <NavItem to="/recruiter-approvals" icon={<CheckBadgeIcon />}>{!isCmsMode && "Recruiter Approvals"}</NavItem>

          <li className="pt-3 pb-2 px-4">
            <div className="border-t border-white/10"></div>
          </li>

          <NavItem to="/cms" icon={<EyeIcon />}>{!isCmsMode && "CMS Management"}</NavItem>
          <NavItem to="/analytics" icon={<ChartBarIcon />}>{!isCmsMode && "Analytics"}</NavItem>
          <NavItem to="/communications" icon={<BellIcon />}>{!isCmsMode && "Communications"}</NavItem>

          <li className="pt-3 pb-2 px-4">
            <div className="border-t border-white/10"></div>
          </li>

          <NavItem to="/security" icon={<ShieldCheckIcon />}>{!isCmsMode && "Security"}</NavItem>
          <NavItem to="/monetization" icon={<CreditCardIcon />}>{!isCmsMode && "Monetization"}</NavItem>
          <NavItem to="/special-features" icon={<SparklesIcon />}>{!isCmsMode && "Special Features"}</NavItem>
        </ul>
      </nav>
      <div className="p-6">
        <button className={`w-full flex items-center ${isCmsMode ? 'justify-center px-0' : 'px-4'} py-3 text-sm font-semibold rounded-lg text-white/70 hover:bg-white/5 hover:text-white`}>
          <LogoutIcon className={`w-6 h-6 ${isCmsMode ? 'mr-0' : 'mr-4'}`} />
          {!isCmsMode && "Logout"}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;