import React from 'react';
import { SearchIcon, FilterIcon, BellIcon, ChevronDownIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 md:gap-8">
      {/* Search Bar */}
      <div className="w-full md:w-auto flex-1 flex items-center space-x-4">
        <div className="relative flex-1">
          <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-4 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search for job, candidates..."
            className="w-full bg-white pl-12 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button className="flex items-center space-x-2 px-5 py-3 bg-white border border-gray-200 rounded-full font-semibold text-gray-900 hover:border-primary hover:text-primary transition-colors">
          <FilterIcon className="w-5 h-5" />
          <span>Filters</span>
        </button>
      </div>

      {/* Right Side Icons & Profile */}
      <div className="w-full md:w-auto flex items-center justify-between space-x-5">
        <button className="hidden md:block px-5 py-3 bg-primary text-white font-semibold rounded-full hover:opacity-90 transition-opacity">
          Find
        </button>
        <div className="flex items-center space-x-5">
          <button className="relative text-gray-500 hover:text-primary">
            <BellIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-orange"></span>
            </span>
          </button>
          <div className="flex items-center space-x-3 cursor-pointer">
            <img
              src="https://i.pravatar.cc/150?u=admin-pro"
              alt="Admin"
              className="w-10 h-10 rounded-full"
            />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">John Doe</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <ChevronDownIcon className="w-5 h-5 text-gray-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;