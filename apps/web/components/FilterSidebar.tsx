import React, { useState, useEffect, useRef } from 'react';
import { Filters } from '../../../packages/types';

interface Option {
    value: string;
    label: string;
    count?: number;
}

interface FilterSidebarProps {
    filters: Partial<Filters>;
    onFiltersChange: (filters: Partial<Filters>) => void;
    salaryOptions: Option[];
    jobTypeOptions: Option[];
    datePostedOptions: Option[];
    experienceOptions: Option[];
}

// Debounce hook logic
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}


const FilterSidebar: React.FC<FilterSidebarProps> = ({ 
    filters, 
    onFiltersChange,
    salaryOptions,
    jobTypeOptions,
    datePostedOptions,
    experienceOptions
}) => {

    const [keywords, setKeywords] = useState(filters.keywords || '');
    const [location, setLocation] = useState(filters.location || '');

    const debouncedKeywords = useDebounce(keywords, 500);
    const debouncedLocation = useDebounce(location, 500);

    // Use a ref to hold the latest filters from props to avoid stale closures in the useEffect.
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    // Sync local state when filters from URL change (e.g., from homepage search bar or removing tags)
    useEffect(() => {
        setKeywords(filters.keywords || '');
        setLocation(filters.location || '');
    }, [filters.keywords, filters.location]);

    // Update URL search params ONLY when debounced values change (user has stopped typing)
    useEffect(() => {
        const currentFilters = filtersRef.current;
        
        // This is the core of the race condition fix.
        // If a debounced value exists (e.g., user was typing "react"), but the corresponding
        // filter from the parent/URL is now empty, it means an external action (like "Clear All")
        // has occurred. We must not re-apply our stale debounced value.
        const keywordsClearedExternally = debouncedKeywords && !currentFilters.keywords;
        const locationClearedExternally = debouncedLocation && !currentFilters.location;

        if (keywordsClearedExternally || locationClearedExternally) {
            return; // Abort the update to prevent re-applying the filter.
        }

        if (debouncedKeywords !== (currentFilters.keywords || '') || debouncedLocation !== (currentFilters.location || '')) {
            onFiltersChange({
                ...currentFilters,
                keywords: debouncedKeywords,
                location: debouncedLocation
            });
        }
    }, [debouncedKeywords, debouncedLocation, onFiltersChange]);

    const handleCheckboxChange = (category: 'jobType' | 'salary', value: string) => {
        const currentValues = (filters[category] as string[]) || [];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(item => item !== value)
            : [...currentValues, value];
        onFiltersChange({ ...filters, [category]: newValues });
    };
    
    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const key = name as keyof Filters;
        onFiltersChange({
            ...filters,
            [key]: filters[key] === value ? '' : value // Allow unselecting
        });
    };
    
    const handleClear = () => {
        onFiltersChange({});
    };

    const FilterSection: React.FC<{title: string, children: React.ReactNode}> = ({title, children}) => (
        <div className="py-4 border-b">
            <h3 className="font-semibold text-dark-gray mb-3">{title}</h3>
            <div className="space-y-2">
                {children}
            </div>
        </div>
    );
    
    const CheckboxItem: React.FC<{label: string, value: string, category: 'jobType' | 'salary', count?: number}> = ({label, value, category, count}) => (
        <label className="flex items-center space-x-2 text-sm text-dark-gray hover:text-primary cursor-pointer">
            <input 
                type="checkbox" 
                className="rounded text-primary focus:ring-primary"
                checked={(filters[category] as string[] || []).includes(value)}
                onChange={() => handleCheckboxChange(category, value)}
            />
            <span>{label}</span>
            {count && <span className="text-gray-400 text-xs">({count})</span>}
        </label>
    );

    const RadioItem: React.FC<{ label: string; value: string; name: keyof Filters }> = ({ label, value, name }) => (
         <label className="flex items-center space-x-2 text-sm text-dark-gray hover:text-primary cursor-pointer">
            <input 
                type="radio" 
                name={name}
                value={value}
                checked={filters[name] === value}
                onChange={handleRadioChange}
                className="text-primary focus:ring-primary"
            />
            <span>{label}</span>
        </label>
    );

  return (
    <aside className="w-full bg-white p-4 rounded-2xl shadow-sm">
      <div className="flex justify-between items-center border-b pb-2 mb-2">
        <h2 className="text-lg font-bold">Filter Jobs</h2>
        <button onClick={handleClear} className="text-sm font-semibold text-primary hover:underline">Clear All</button>
      </div>

       <FilterSection title="Keywords">
         <input 
            type="text"
            name="keywords"
            placeholder="Job title, company..."
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
         />
      </FilterSection>

      <FilterSection title="Location">
         <input 
            type="text"
            name="location"
            placeholder="e.g. Pune"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
         />
      </FilterSection>

      <FilterSection title="Experience">
        {experienceOptions.map(opt => (
            <RadioItem key={opt.value} label={opt.label} value={opt.value} name="experience" />
        ))}
      </FilterSection>

      <FilterSection title="Job Type">
        {jobTypeOptions.map(opt => (
            <CheckboxItem key={opt.value} label={opt.label} value={opt.value} category="jobType" count={opt.count} />
        ))}
      </FilterSection>

      <FilterSection title="Salary (P.A.)">
        {salaryOptions.map(opt => (
            <CheckboxItem key={opt.value} label={opt.label} value={opt.value} category="salary" count={opt.count} />
        ))}
      </FilterSection>

      <FilterSection title="Date Posted">
        {datePostedOptions.map(opt => (
            <RadioItem key={opt.value} label={opt.label} value={opt.value} name="postedDate" />
        ))}
      </FilterSection>
    </aside>
  );
};

export default FilterSidebar;