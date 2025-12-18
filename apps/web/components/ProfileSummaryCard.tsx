

import React from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    InformationCircleIcon, 
    ChevronRightIcon, 
    LightningBoltIcon, 
    HomeIcon, 
    BriefcaseIcon,
    BuildingOfficeIcon,
} from './Icons';
import { Employment } from '../../../packages/types';
import ProfileCompletionCircle from './ProfileCompletionCircle';

const timeAgo = (dateString?: string): string => {
    if (!dateString) return 'a while ago';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    const days = Math.floor(seconds / 86400);
    if (days > 1) return `${days}d ago`;
    if (days === 1) return `1d ago`;
    
    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return `${hours}h ago`;
    if (hours === 1) return `1h ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return `${minutes}m ago`;

    return 'just now';
};


const ProfileSummaryCard: React.FC = () => {
    const { user } = useAuth();

    if (!user || (user.role !== 'JobSeeker' && user.role !== 'user')) {
        return null;
    }

    const profileCompletion = user.profile?.profileCompletion || 0;
    
    const currentEmployment = user.profile?.employment?.find((e: Employment) => e.isCurrent);
    // Fallback to headline if no current employment is set
    const title = currentEmployment?.jobTitle || (user.profile?.headline || 'Job Seeker').split('@')[0].trim();
    const companyString = currentEmployment ? `@ ${currentEmployment.companyName}` : ((user.profile?.headline || '').includes('@') ? `@ ${(user.profile?.headline || '').split('@')[1].trim()}` : '');

    const getCompletionColor = () => {
      if (profileCompletion >= 75) return 'text-green-600';
      if (profileCompletion >= 50) return 'text-yellow-500';
      return 'text-red-500';
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center">
                <div className="relative w-28 h-28">
                  <ProfileCompletionCircle progress={profileCompletion} size={112}>
                    <img src={user.profilePhoto || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} className="w-full h-full object-cover"/>
                  </ProfileCompletionCircle>
                </div>
                
                <p className={`text-base font-bold ${getCompletionColor()} mt-2`}>{profileCompletion}%</p>
                
                <h2 className="text-xl font-bold text-dark-gray mt-3">{user.name}</h2>
                <p className="text-sm text-gray-700 mt-1">{title}</p>
                {companyString && <p className="text-sm text-gray-700">{companyString}</p>}
                <p className="text-xs text-gray-500 mt-2">Last updated {timeAgo(user.updatedAt)}</p>

                <Link to="/profile" className="mt-4 bg-blue-600 text-white font-semibold py-2 px-8 rounded-full hover:bg-blue-700 transition-colors">
                    View profile
                </Link>
            </div>

            <div className="p-4">
                <div className="bg-sky-50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-dark-gray">Profile performance</h3>
                        <InformationCircleIcon className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex text-center pb-4">
                        <div className="w-1/2 border-r border-sky-200">
                            <p className="text-sm text-gray-600">Search appearances</p>
                            <a href="#" className="flex items-center justify-center text-blue-600 font-bold text-2xl hover:underline">
                                78 <ChevronRightIcon className="w-5 h-5 ml-0.5" />
                            </a>
                        </div>
                        <div className="w-1/2">
                            <p className="text-sm text-gray-600">Recruiter actions</p>
                             <Link to="/applied-jobs" className="flex items-center justify-center text-blue-600 font-bold text-2xl hover:underline">
                                {user.profile?.recruiterActionsCount || 0} <ChevronRightIcon className="w-5 h-5 ml-0.5" />
                            </Link>
                        </div>
                    </div>
                    <a href="#" className="bg-white rounded-lg p-3 flex items-center justify-between text-sm font-semibold text-dark-gray hover:bg-gray-50 transition-colors shadow-sm">
                        <div className="flex items-center">
                            <LightningBoltIcon className="w-5 h-5 mr-2 text-yellow-500" />
                            <span>Get 3X boost to your profile performance</span>
                        </div>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                    </a>
                </div>
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <nav className="space-y-0">
                    <NavLink to="/" end className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-200 text-dark-gray font-bold' : 'text-gray-700 hover:bg-gray-100 font-semibold'}`}>
                        <HomeIcon className="w-5 h-5 mr-3" /> My home
                    </NavLink>
                     <NavLink to="/jobs" className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-200 text-dark-gray font-bold' : 'text-gray-700 hover:bg-gray-100 font-semibold'}`}>
                        <BriefcaseIcon className="w-5 h-5 mr-3" /> Jobs
                    </NavLink>
                     <NavLink to="/companies" className={({isActive}) => `flex items-center px-4 py-3 rounded-lg text-sm transition-colors ${isActive ? 'bg-gray-200 text-dark-gray font-bold' : 'text-gray-700 hover:bg-gray-100 font-semibold'}`}>
                        <BuildingOfficeIcon className="w-5 h-5 mr-3" /> Companies
                    </NavLink>
                </nav>
            </div>
        </div>
    );
};

export default ProfileSummaryCard;
