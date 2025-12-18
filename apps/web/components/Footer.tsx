
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    NaukriLogo,
    LinkedInIconColorful,
    FacebookIconColorful,
    YouTubeIconColorful,
    XIconColorful,
    InstagramIconColorful,
} from './Icons';
import { fetchCmsContent } from '../../../packages/api-client';
import { CmsNavigation } from '../../../packages/types';

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <li>
        <Link to={to} className="text-gray-500 hover:text-primary transition-colors text-sm">
            {children}
        </Link>
    </li>
);

const SocialIconLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-110">
        {children}
    </a>
);


const Footer: React.FC = () => {
  const [footerData, setFooterData] = useState<CmsNavigation | null>(null);
  
  useEffect(() => {
    fetchCmsContent().then(data => {
        if (data && data.globalFooter) {
            setFooterData(data.globalFooter);
        }
    }).catch(err => {
        console.error("Failed to load footer CMS content:", err);
    });
  }, []);

  return (
    <footer className="bg-gray-50 text-gray-600 footer-texture border-t pb-16 md:pb-0">
      <div className="container mx-auto px-4 pt-4 pb-2">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 border-b border-gray-200 pb-4">
            <div className="col-span-1 sm:col-span-2 md:col-span-2">
                <Link to="/">
                    <NaukriLogo className="h-6" />
                </Link>
                <p className="mt-3 text-sm text-gray-500 max-w-xs leading-relaxed">
                    Your next career move starts here. Find jobs, build your profile, and connect with top employers.
                </p>
                <div className="mt-4">
                    <h3 className="text-xs font-bold text-dark-gray mb-2 uppercase tracking-wider">Follow us</h3>
                    <div className="flex items-center space-x-3">
                        <SocialIconLink href="#"><LinkedInIconColorful className="w-6 h-6"/></SocialIconLink>
                        <SocialIconLink href="#"><XIconColorful className="w-6 h-6"/></SocialIconLink>
                        <SocialIconLink href="#"><FacebookIconColorful className="w-6 h-6"/></SocialIconLink>
                        <SocialIconLink href="#"><InstagramIconColorful className="w-6 h-6"/></SocialIconLink>
                        <SocialIconLink href="#"><YouTubeIconColorful className="w-6 h-6"/></SocialIconLink>
                    </div>
                </div>
            </div>
            
            {(footerData?.groups || []).map(group => (
              <div key={group.title}>
                <h4 className="font-bold text-dark-gray mb-3 text-sm">{group.title}</h4>
                <ul className="space-y-1.5">
                  {group.links.map(link => (
                    <FooterLink key={link.text} to={link.url}>{link.text}</FooterLink>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        <div className="pt-4 text-center md:text-left text-gray-500 text-xs flex flex-col md:flex-row justify-between items-center">
            <p>&copy; {new Date().getFullYear()} Job Portal Pro. All rights reserved.</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
                <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
