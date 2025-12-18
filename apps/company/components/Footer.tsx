import React from 'react';
import { Link } from 'react-router-dom';
import { NaukriLogo, LinkedInIcon, FacebookIcon, YouTubeIcon, XIcon, InstagramIcon } from './Icons';

const FooterLink: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <li>
        <Link to={to} className="text-gray-400 hover:text-white transition-colors text-sm">
            {children}
        </Link>
    </li>
);

const SocialIcon: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
    <a href={to} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-transform hover:scale-110">
        {children}
    </a>
);

const Footer: React.FC = () => {
  return (
    <footer 
        className="bg-gray-800 text-white border-t border-gray-700"
        style={{
            backgroundImage: `linear-gradient(rgba(45, 55, 72, 0.97), rgba(45, 55, 72, 0.97)), url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3e%3cfilter id='n' x='0' y='0'%3e%3cfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3e%3c/filter%3e%3crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3e%3c/svg%3e")`
        }}
    >
      <div className="container mx-auto px-6 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Logo and Social */}
          <div className="col-span-2">
            <NaukriLogo className="h-8" />
            <p className="mt-4 text-sm text-gray-400 max-w-xs">
              The faster, smarter way to hire top talent. We connect companies with millions of professionals.
            </p>
            <div className="mt-6 flex items-center space-x-4">
                <SocialIcon to="#"><LinkedInIcon className="w-6 h-6"/></SocialIcon>
                <SocialIcon to="#"><XIcon className="w-5 h-5"/></SocialIcon>
                <SocialIcon to="#"><FacebookIcon className="w-6 h-6"/></SocialIcon>
                <SocialIcon to="#"><YouTubeIcon className="w-7 h-7"/></SocialIcon>
                <SocialIcon to="#"><InstagramIcon className="w-6 h-6"/></SocialIcon>
            </div>
          </div>
          
          {/* Links */}
          <div className="lg:col-start-4">
            <h4 className="font-semibold mb-4 tracking-wide">Products</h4>
            <ul className="space-y-3">
              <FooterLink to="/dashboard/post-job">Job Posting</FooterLink>
              <FooterLink to="#">Resdex Database</FooterLink>
              <FooterLink to="#">Employer Branding</FooterLink>
              <FooterLink to="/dashboard/analytics">Recruitment Analytics</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 tracking-wide">Resources</h4>
            <ul className="space-y-3">
              <FooterLink to="#">Blog</FooterLink>
              <FooterLink to="#">Help Center</FooterLink>
              <FooterLink to="#">Case Studies</FooterLink>
              <FooterLink to="#">Contact Sales</FooterLink>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 tracking-wide">Company</h4>
            <ul className="space-y-3">
              <FooterLink to="#">About Us</FooterLink>
              <FooterLink to="#">Careers</FooterLink>
              <FooterLink to="#">Privacy Policy</FooterLink>
              <FooterLink to="#">Terms of Service</FooterLink>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Job Portal Pro. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
