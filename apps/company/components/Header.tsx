import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { NaukriLogo, ChevronDownIcon, PhoneIcon, ArrowRightIcon } from './Icons';

const CompanyOfferingsDropdown: React.FC = () => {
  const products = [
    { name: 'Job Posting', description: 'Find & attract relevant talent' },
    { name: 'Resdex', description: "Access India's largest database" },
    { name: 'Expert Assist', description: 'Our Assisted hiring solution' },
    { name: 'Employer Branding', description: 'Showcase your brand presence' },
    { name: 'Talent Pulse', description: 'Make informed hiring decisions' },
  ];

  const businessTypes = [
    { name: 'Enterprises' },
    { name: 'Small & medium business' },
    { name: 'Consultants & agency' },
  ];

  return (
    <div 
      className="absolute top-full left-0 mt-2 w-[850px] max-w-[90vw] bg-white rounded-xl shadow-2xl z-20 border animate-fade-in"
      style={{ animationDuration: '150ms' }}
    >
      <div className="grid grid-cols-12">
        {/* Left Column */}
        <div className="col-span-5 bg-gradient-to-br from-orange-50 via-white to-purple-50/40 p-6 rounded-l-xl flex flex-col">
          <h3 className="text-2xl font-bold text-dark-gray leading-tight">With Free Job Posting, hire local talent at zero cost</h3>
          <ul className="text-sm text-gray-700 mt-4 space-y-2">
            <li>Unlimited free postings with <span className="font-bold">one active job</span> at a time</li>
            <li>Get up to <span className="font-bold">50 candidates/job</span> while your post remains visible for 7 days</li>
          </ul>
          <Link to="/register" className="flex items-center font-semibold text-primary mt-4 hover:underline">
            Free Job Posting <ArrowRightIcon className="w-4 h-4 ml-1" />
          </Link>
          <div className="flex-grow flex items-end mt-4">
            <img 
              src="https://img.naukri.com/info/static/images/V3/common/employer-zone.png" 
              alt="Recruiter" 
              className="max-w-full h-auto"
            />
          </div>
        </div>
        
        {/* Right Section */}
        <div className="col-span-7 p-6 grid grid-cols-2 gap-8">
          {/* Products Column */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-4">BY PRODUCTS</h4>
            <ul className="space-y-3">
              {products.map(product => (
                <li key={product.name}>
                  <Link to="#" className="group">
                    <p className="font-bold text-dark-gray group-hover:text-primary">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Business Type Column */}
          <div>
            <h4 className="text-xs font-bold text-gray-400 tracking-wider mb-4">BY BUSINESS TYPE</h4>
            <ul className="space-y-3">
              {businessTypes.map(type => (
                <li key={type.name}>
                  <Link to="#" className="group">
                    <p className="font-bold text-dark-gray group-hover:text-primary">{type.name}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const Header: React.FC = () => {
    const [isOfferingsOpen, setIsOfferingsOpen] = useState(false);
    const offeringsTimeoutRef = useRef<number | null>(null);

    const handleOfferingsEnter = () => {
        if (offeringsTimeoutRef.current) {
            clearTimeout(offeringsTimeoutRef.current);
        }
        setIsOfferingsOpen(true);
    };

    const handleOfferingsLeave = () => {
        offeringsTimeoutRef.current = window.setTimeout(() => {
            setIsOfferingsOpen(false);
        }, 200); // Small delay to allow moving to the dropdown
    };

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                {/* Left side */}
                <div className="flex items-center space-x-6">
                    <Link to="/" className="flex items-center space-x-2">
                        <NaukriLogo className="h-7" />
                    </Link>
                    <div className="hidden md:flex items-center space-x-6">
                        <div 
                            className="relative py-2"
                            onMouseEnter={handleOfferingsEnter}
                            onMouseLeave={handleOfferingsLeave}
                        >
                            <button
                                className="flex items-center text-base font-semibold text-dark-gray hover:text-primary"
                            >
                                Company Offerings
                                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isOfferingsOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isOfferingsOpen && <CompanyOfferingsDropdown />}
                        </div>
                    </div>
                </div>

                {/* Right side */}
                <div className="flex items-center space-x-4">
                    <div className="hidden lg:flex items-center space-x-1 text-base font-semibold text-dark-gray cursor-pointer">
                        <PhoneIcon className="w-5 h-5"/>
                        <span>1800-102-5558</span>
                        <ChevronDownIcon className="w-4 h-4" />
                    </div>
                    
                    <Link 
                        to="/register" 
                        className="relative px-5 py-2 text-base font-semibold border-2 border-primary text-primary rounded-md hover:bg-primary/5 transition-colors"
                    >
                        Post a job
                        <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            FREE
                        </span>
                    </Link>
                    
                    <Link to="/login" className="hidden sm:block text-base font-semibold text-dark-gray hover:text-primary transition-colors">
                        Login
                    </Link>
                </div>
            </nav>
        </header>
    );
};

export default Header;