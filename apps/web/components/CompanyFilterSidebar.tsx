import React, { useState, useEffect } from 'react';
// DO: Add comment above each fix.
// FIX: `COMPANY_FILTERS_DATA` is now exported from the api-client/cms-data file.
import { COMPANY_FILTERS_DATA } from '../../../packages/api-client/cms-data';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon } from './Icons';

interface AppliedFilters {
    companyType: string[];
    location: string[];
    industry: string[];
}
interface CompanyFilterSidebarProps {
  onApplyFilters: (filters: Partial<AppliedFilters>) => void;
}

const FilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="py-5 border-b border-gray-100 last:border-b-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center group">
                <h3 className="font-bold text-dark-gray group-hover:text-primary transition-colors">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-4 h-4 text-gray-400" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400" />}
            </button>
            {isOpen && (
                <div className="mt-4">
                    {children}
                </div>
            )}
        </div>
    );
};

const CompanyFilterSidebar: React.FC<CompanyFilterSidebarProps> = ({ onApplyFilters }) => {
  const [filters, setFilters] = useState<Partial<AppliedFilters>>({
    companyType: [],
    industry: [],
    location: [],
  });

  useEffect(() => {
    onApplyFilters(filters);
  }, [filters, onApplyFilters]);

  const handleCheckboxChange = (category: keyof AppliedFilters, value: string) => {
    setFilters(prev => {
        const currentValues = prev[category] || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        return { ...prev, [category]: newValues };
    });
  };
    
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      <div className="p-5 border-b border-gray-200 flex justify-between items-center">
        <h2 className="font-bold text-lg text-dark-gray">All Filters</h2>
        {/* Only show clear if filters are applied could be an enhancement */}
        <button 
          onClick={() => setFilters({ companyType: [], industry: [], location: [] })} 
          className="text-xs font-bold text-primary hover:underline uppercase"
        >
            Clear
        </button>
      </div>

      <div className="px-5">
        <FilterSection title="Company type">
            <div className="space-y-3">
                {COMPANY_FILTERS_DATA.companyType.map(item => (
                    <label key={item.name} className="flex items-center space-x-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all"
                                checked={filters.companyType?.includes(item.name)}
                                onChange={() => handleCheckboxChange('companyType', item.name)}
                            />
                             <svg
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-dark-gray">{item.name}</span>
                        <span className="text-xs text-gray-400">({item.count})</span>
                    </label>
                ))}
            </div>
        </FilterSection>

        <FilterSection title="Industry">
            <div className="relative mb-3">
                <input 
                    type="text" 
                    placeholder="Search Industry"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-primary transition-colors"
                />
                <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {COMPANY_FILTERS_DATA.industry.map(item => (
                    <label key={item.name} className="flex items-center space-x-3 cursor-pointer group">
                         <div className="relative flex items-center">
                            <input 
                                type="checkbox" 
                                className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all"
                                checked={filters.industry?.includes(item.name)}
                                onChange={() => handleCheckboxChange('industry', item.name)}
                            />
                             <svg
                                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-dark-gray">{item.name}</span>
                        <span className="text-xs text-gray-400">({item.count})</span>
                    </label>
                ))}
            </div>
            <button className="text-sm font-bold text-primary mt-3 hover:underline">+59 more</button>
        </FilterSection>
        
        <FilterSection title="Location">
             <div className="relative mb-3">
                <input 
                    type="text" 
                    placeholder="Search Location"
                    className="w-full text-sm pl-9 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-primary transition-colors"
                />
                <SearchIcon className="w-4 h-4 absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            </div>
            <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer group">
                     <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all"/>
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-dark-gray">Bengaluru</span>
                    <span className="text-xs text-gray-400">(3433)</span>
                </label>
                 <label className="flex items-center space-x-3 cursor-pointer group">
                     <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all"/>
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-dark-gray">Delhi / NCR</span>
                    <span className="text-xs text-gray-400">(3294)</span>
                </label>
                 <label className="flex items-center space-x-3 cursor-pointer group">
                     <div className="relative flex items-center">
                        <input type="checkbox" className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all"/>
                        <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-dark-gray">Mumbai</span>
                    <span className="text-xs text-gray-400">(2840)</span>
                </label>
            </div>
             <button className="text-sm font-bold text-primary mt-3 hover:underline">+90 more</button>
        </FilterSection>
      </div>
    </div>
  );
};

export default CompanyFilterSidebar;