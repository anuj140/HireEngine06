
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    NaukriLogo, 
    SearchIcon, 
    BellIcon, 
    MenuIcon, 
    ProfileMenuIcon, 
    ChevronDownIcon, 
    LogoutIcon,
    DocumentTextIcon,
    BookmarkIcon,
    MailOpenIcon,
    LinkedInIconColorful,
    FacebookIconColorful,
    YouTubeIconColorful,
    XIconColorful,
    InstagramIconColorful
} from './Icons';
import { CmsNavigation } from '../../../packages/types';
import LoginModal from './LoginModal';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchCmsContent } from '../../../packages/api-client';
import { formatSearchDisplay } from '../utils/searchParser';

interface HeaderProps {
    onSearchClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnJobsPage = location.pathname.startsWith('/jobs');

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJobsMenuOpen, setIsJobsMenuOpen] = useState(false);
  const [isCompaniesMenuOpen, setIsCompaniesMenuOpen] = useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const notifications = useNotifications();
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  
  const [navData, setNavData] = useState<CmsNavigation | null>(null);

  const keywords = searchParams.get('keywords');
  const locationParam = searchParams.get('location');
  const experienceParam = searchParams.get('experience');
  const hasSearchParams = !!keywords || !!locationParam || !!experienceParam;


  useEffect(() => {
    fetchCmsContent()
        .then(data => {
            if (data && data.globalHeader) {
                setNavData(data.globalHeader);
            }
        })
        .catch(err => console.error("Failed to fetch navigation data", err));
  }, []);

  const openLoginModal = () => {
    setIsLoginModalOpen(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setIsNotificationMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleBellClick = () => {
    const newIsOpenState = !isNotificationMenuOpen;
    setIsNotificationMenuOpen(newIsOpenState);
    if (newIsOpenState && notifications && notifications.unreadCount > 0) {
        notifications.markAllAsRead();
    }
  };
  
  const handleProfileClick = () => {
      setIsProfileMenuOpen(false);
      navigate('/profile');
  };

  const timeAgo = (isoDate: string) => {
      const date = new Date(isoDate);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + "y ago";
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + "mo ago";
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + "d ago";
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + "h ago";
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + "m ago";
      return "just now";
  };

  const NavItem: React.FC<{ to: string; text: string; count?: number, end?: boolean }> = ({ to, text, count, end }) => (
    <NavLink 
      to={to} 
      end={end}
      className={({ isActive }) => 
        `relative text-base px-2 font-bold transition-colors hover:text-primary whitespace-nowrap ${isActive ? 'text-primary' : 'text-dark-gray'} md:py-0 py-2 block`
      }
      onClick={() => setIsMobileMenuOpen(false)}
    >
      {text}
      {count && <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{count}</span>}
    </NavLink>
  );

  const MobileFooterLink: React.FC<{ to: string; children: React.ReactNode; isExternal?: boolean }> = ({ to, children, isExternal }) => {
    const commonProps = { onClick: () => setIsMobileMenuOpen(false), className: "block text-sm text-gray-600 hover:text-primary py-1" };
    if (isExternal) return <li><a href={to} {...commonProps}>{children}</a></li>;
    return <li><Link to={to} {...commonProps}>{children}</Link></li>;
  };

  const SocialIconLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">{children}</a>
  );
  
  const jobsMenuGroups = navData?.groups ? navData.groups.filter(g => g.title.toLowerCase().includes('job')) : [];
  const companiesMenuGroups = navData?.groups ? navData.groups.filter(g => g.title.toLowerCase().includes('compan') || g.title.toLowerCase().includes('collection')) : [];

  return (
    <>
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b-2 border-gray-100">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <Link to="/"><NaukriLogo className="h-7" /></Link>
              </div>
              <nav className="hidden md:flex items-center space-x-2">
                <NavItem to="/" text="Home" end />
                <div className="relative py-2" onMouseEnter={() => setIsJobsMenuOpen(true)} onMouseLeave={() => setIsJobsMenuOpen(false)}>
                    <NavItem to="/jobs" text="Jobs" count={2} />
                    {isJobsMenuOpen && (
                        <div className="absolute top-full left-0 mt-0 w-max bg-white rounded-lg shadow-2xl z-20 border animate-fade-in" style={{ animationDuration: '150ms' }}>
                            <div className="flex p-6">
                                {jobsMenuGroups.map((group, i) => (
                                    <div key={group.title} className={i > 0 ? "border-l border-gray-200 pl-12" : "pr-12"}>
                                        <h3 className="font-bold text-dark-gray mb-3 text-base">{group.title}</h3>
                                        <ul className="space-y-2">
                                            {group.links.map(link => (
                                                <li key={link.text}><Link to={link.url} className="text-sm text-dark-gray hover:text-primary whitespace-nowrap" onClick={() => setIsJobsMenuOpen(false)}>{link.text}</Link></li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative py-2" onMouseEnter={() => setIsCompaniesMenuOpen(true)} onMouseLeave={() => setIsCompaniesMenuOpen(false)}>
                    <NavItem to="/companies" text="Companies" />
                    {isCompaniesMenuOpen && (
                         <div className="absolute top-full left-0 mt-0 w-max bg-white rounded-lg shadow-2xl z-20 border animate-fade-in" style={{ animationDuration: '150ms' }}>
                            <div className="flex p-6">
                                {companiesMenuGroups.map((group, i) => (
                                    <div key={group.title} className={i > 0 ? "border-l border-gray-200 pl-12" : "pr-12"}>
                                        <h3 className="font-bold text-dark-gray mb-3 text-base">{group.title}</h3>
                                        <ul className="space-y-2">
                                            {group.links.map(link => (
                                                <li key={link.text}><Link to={link.url} className="text-sm text-dark-gray hover:text-primary whitespace-nowrap" onClick={() => setIsCompaniesMenuOpen(false)}>{link.text}</Link></li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
              </nav>
            </div>

            <div className="hidden md:flex flex-1 justify-center px-6">
                {isOnJobsPage && hasSearchParams ? (
                     <div onClick={onSearchClick} className="relative items-center w-full max-w-sm transition-all cursor-pointer group">
                        <div className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full flex items-center text-sm text-dark-gray group-hover:border-primary group-hover:shadow-md">
                          <SearchIcon className="w-4 h-4 text-gray-400 mr-2"/>
                          <span className="truncate capitalize">
                              {formatSearchDisplay({ 
                                  keywords: keywords || undefined, 
                                  location: locationParam || undefined, 
                                  experience: experienceParam || undefined 
                               })}
                          </span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                            <button className="p-1.5 bg-primary text-white rounded-full"><SearchIcon className="w-4 h-4" /></button>
                        </div>
                      </div>
                ) : (
                    <div onClick={onSearchClick} className="relative items-center w-full max-w-sm transition-all cursor-text">
                        <div className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full flex items-center text-sm text-gray-500 hover:border-gray-400">Search jobs here</div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <button className="p-1.5 bg-primary text-white rounded-full" tabIndex={-1}><SearchIcon className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
            
            <div className="flex items-center space-x-5">
                {user ? (
                  <>
                    {notifications && (
                       <div className="relative" ref={notificationMenuRef}>
                          <button onClick={handleBellClick} className="relative text-dark-gray hover:text-primary">
                              <BellIcon className="w-6 h-6" />
                              {notifications.unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{notifications.unreadCount}</span>}
                          </button>
                          {isNotificationMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl z-20 border animate-fade-in" style={{ animationDuration: '150ms' }}>
                                <div className="p-3 border-b"><h3 className="font-bold text-dark-gray">Notifications</h3></div>
                                {notifications.notifications.length > 0 ? (
                                    <ul className="max-h-96 overflow-y-auto custom-scrollbar">
                                        {notifications.notifications.map(notif => (
                                            <li key={notif.id} className={`border-b last:border-b-0 ${!notif.isRead ? 'bg-blue-50' : ''}`}>
                                                <Link to={notif.link} onClick={() => setIsNotificationMenuOpen(false)} className="block p-3 hover:bg-gray-100">
                                                    <p className="text-sm text-dark-gray" dangerouslySetInnerHTML={{ __html: notif.message }}/>
                                                    <p className="text-xs text-primary mt-1">{timeAgo(notif.timestamp)}</p>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <div className="p-4 text-center text-sm text-gray-500">No new notifications.</div>}
                                {user.role === 'JobSeeker' && <div className="p-2 bg-gray-50 text-center"><Link to="/applied-jobs" onClick={() => setIsNotificationMenuOpen(false)} className="text-sm font-semibold text-primary hover:underline">View all applications</Link></div>}
                            </div>
                          )}
                        </div>
                    )}
                    
                    <div className="relative" ref={profileMenuRef}>
                        <button onClick={() => setIsProfileMenuOpen(prev => !prev)} className="flex items-center space-x-2 p-1 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
                            <ProfileMenuIcon className="w-auto h-3.5 text-slate-500 ml-2" />
                            <div className="relative"><img src={user.profilePhoto || `https://i.pravatar.cc/150?u=${user.email}`} alt="User" className="w-8 h-8 rounded-full"/></div>
                        </button>
                        {isProfileMenuOpen && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-lg shadow-2xl z-20 border animate-fade-in" style={{ animationDuration: '150ms' }}>
                                <div className="p-3 border-b">
                                    <p className="font-bold text-sm text-dark-gray truncate">{user.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                </div>
                                <ul className="py-2 text-sm text-dark-gray">
                                    <li className="hover:bg-gray-100">
                                        <button onClick={handleProfileClick} className="flex items-center w-full px-4 py-2 text-left">
                                            <ProfileMenuIcon className="w-5 h-5 mr-3 text-gray-500"/> My Profile
                                        </button>
                                    </li>
                                    <li className="hover:bg-gray-100"><Link to="/applied-jobs" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2"><DocumentTextIcon className="w-5 h-5 mr-3 text-gray-500"/> Applied Jobs</Link></li>
                                    <li className="hover:bg-gray-100"><Link to="/saved-jobs" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2"><BookmarkIcon className="w-5 h-5 mr-3 text-gray-500"/> Saved Jobs</Link></li>
                                    <li className="hover:bg-gray-100"><Link to="/job-alerts" onClick={() => setIsProfileMenuOpen(false)} className="flex items-center px-4 py-2"><MailOpenIcon className="w-5 h-5 mr-3 text-gray-500"/> Job Alerts</Link></li>
                                </ul>
                                <div className="p-2 border-t">
                                    <button onClick={() => { logout(); setIsProfileMenuOpen(false); }} className="w-full text-left flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"><LogoutIcon className="w-5 h-5 mr-3"/> Logout</button>
                                </div>
                            </div>
                        )}
                    </div>
                  </>
                ) : (
                   <div className="hidden md:flex items-center space-x-4">
                      <button onClick={openLoginModal} className="px-4 py-2 text-sm font-semibold text-primary hover:text-primary-dark transition-colors">Login</button>
                      <Link to="/register" className="px-4 py-2 text-sm font-semibold border border-secondary text-secondary rounded-full hover:bg-secondary/5 transition-colors">Register</Link>
                   </div>
                )}
                <button className="md:hidden text-dark-gray hover:text-primary" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label="Toggle menu" aria-expanded={isMobileMenuOpen}><MenuIcon className="w-6 h-6" /></button>
            </div>
          </div>
          {isMobileMenuOpen && (
              <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
                  {!user && (
                      <div className="flex items-center space-x-4 mb-4">
                          <button onClick={() => { openLoginModal(); setIsMobileMenuOpen(false); }} className="flex-1 text-center px-4 py-2 text-sm font-semibold text-primary border border-primary rounded-full">Login</button>
                          <Link to="/register" onClick={() => setIsMobileMenuOpen(false)} className="flex-1 text-center px-4 py-2 text-sm font-semibold bg-secondary text-white rounded-full">Register</Link>
                      </div>
                  )}
                   <div className="relative items-center w-full mb-4" onClick={() => { setIsMobileMenuOpen(false); onSearchClick(); }}>
                      <div className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm text-gray-500">Search jobs here</div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                          <button className="p-1.5 bg-primary text-white rounded-full" tabIndex={-1}><SearchIcon className="w-4 h-4" /></button>
                      </div>
                  </div>
                  <nav className="flex flex-col space-y-1">
                      <NavItem to="/" text="Home" end />
                      <NavItem to="/jobs" text="Jobs" count={2} />
                      <NavItem to="/companies" text="Companies" />
                  </nav>
                  <div className="pt-4 mt-4 border-t border-gray-200">
                      <button onClick={() => setIsMobileAboutOpen(!isMobileAboutOpen)} className="w-full flex justify-between items-center text-base px-2 font-bold text-dark-gray py-2" aria-expanded={isMobileAboutOpen}>
                          <span>About Job Portal Pro</span>
                          <ChevronDownIcon className={`w-5 h-5 transition-transform ${isMobileAboutOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {isMobileAboutOpen && (
                          <div className="pl-4 pt-2 pb-4 space-y-4 animate-fade-in" style={{animationDuration: '200ms'}}>
                              <div>
                                  <h4 className="font-bold text-dark-gray mb-2 text-sm">Job Seekers</h4>
                                  <ul className="space-y-1">
                                      <MobileFooterLink to="/jobs">Find Jobs</MobileFooterLink>
                                      <MobileFooterLink to="/profile">Create Profile</MobileFooterLink>
                                      <MobileFooterLink to="#">Career Advice</MobileFooterLink>
                                      <MobileFooterLink to="#">FAQs</MobileFooterLink>
                                  </ul>
                              </div>
                              <div>
                                  <h4 className="font-bold text-dark-gray mb-2 text-sm">Recruiters</h4>
                                  <ul className="space-y-1">
                                      <MobileFooterLink to="/company/" isExternal>Post a Job</MobileFooterLink>
                                      <MobileFooterLink to="/company/" isExternal>Recruiter Dashboard</MobileFooterLink>
                                  </ul>
                              </div>
                              <div>
                                  <h4 className="font-bold text-dark-gray mb-2 text-sm">Company</h4>
                                  <ul className="space-y-1">
                                      <MobileFooterLink to="#">About Us</MobileFooterLink>
                                      <MobileFooterLink to="#">Contact Us</MobileFooterLink>
                                      <MobileFooterLink to="#">Blog</MobileFooterLink>
                                  </ul>
                              </div>
                              <div className="pt-4 border-t">
                                  <h4 className="font-semibold text-dark-gray mb-3 text-sm">Follow us</h4>
                                  <div className="flex items-center space-x-3">
                                      <SocialIconLink href="#"><LinkedInIconColorful className="w-6 h-6"/></SocialIconLink>
                                      <SocialIconLink href="#"><XIconColorful className="w-6 h-6"/></SocialIconLink>
                                      <SocialIconLink href="#"><FacebookIconColorful className="w-6 h-6"/></SocialIconLink>
                                      <SocialIconLink href="#"><InstagramIconColorful className="w-6 h-6"/></SocialIconLink>
                                      <SocialIconLink href="#"><YouTubeIconColorful className="w-6 h-6"/></SocialIconLink>
                                  </div>
                              </div>
                              <div className="pt-4 border-t text-sm text-gray-500 space-x-4">
                                  <Link to="#" onClick={() => setIsMobileMenuOpen(false)}>Privacy Policy</Link>
                                  <Link to="#" onClick={() => setIsMobileMenuOpen(false)}>Terms & Conditions</Link>
                              </div>
                              <p className="text-xs text-gray-400 pt-2">&copy; {new Date().getFullYear()} Job Portal Pro.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}
        </nav>
      </header>
      
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)}/>
    </>
  );
};

export default Header;
