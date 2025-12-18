import React, { useState, useEffect } from 'react';
import { Filters } from '../../../packages/types';
import { CloseIcon, ChevronDownIcon, ChevronUpIcon, FunnelIcon } from './Icons';

// --- Type definitions ---
interface Option {
    value: string;
    label: string;
    count?: number;
}

type FilterOptionsMap = {
    [key in keyof Omit<Filters, 'keywords' | 'location'>]?: Option[];
};

interface MobileJobFiltersProps {
    filters: Partial<Filters>;
    onFiltersChange: (filters: Partial<Filters>) => void;
    options: FilterOptionsMap;
}

const filterConfig = [
    { type: 'experience', label: 'Experience', isMulti: false },
    { type: 'jobType', label: 'Job Type', isMulti: true },
    { type: 'salary', label: 'Salary', isMulti: true },
    { type: 'postedDate', label: 'Date Posted', isMulti: false },
] as const;

type FilterType = typeof filterConfig[number]['type'];


// --- Internal Components ---

const FilterPanel: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: Partial<Filters>) => void;
    currentFilters: Partial<Filters>;
    options: FilterOptionsMap;
}> = ({ isOpen, onClose, onApply, currentFilters, options }) => {
    const [tempFilters, setTempFilters] = useState<Partial<Filters>>(currentFilters);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setTempFilters(currentFilters); // Sync with props when opened
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen, currentFilters]);

    const handleSelect = (type: FilterType, value: string, isMulti: boolean) => {
        setTempFilters(prev => {
            const newFilters = { ...prev };
            if (isMulti) {
                const multiSelectType = type as 'jobType' | 'salary';
                const current = (newFilters[multiSelectType]) || [];
                const newSelection = current.includes(value)
                    ? current.filter(item => item !== value)
                    : [...current, value];
                newFilters[multiSelectType] = newSelection;
            } else {
                const singleSelectType = type as 'experience' | 'postedDate';
                newFilters[singleSelectType] = prev[singleSelectType] === value ? '' : value;
            }
            return newFilters;
        });
    };

    const handleCloseAndApply = () => {
        onApply(tempFilters);
        onClose();
    };

    const handleClearAll = () => {
        const clearedFilters: Partial<Filters> = { ...tempFilters };
        filterConfig.forEach(f => {
            delete clearedFilters[f.type];
        });
        setTempFilters(clearedFilters);
        onApply(clearedFilters);
    };
    
    const totalSelections = filterConfig.reduce((acc, f) => {
        const value = tempFilters[f.type];
        if (Array.isArray(value)) return acc + value.length;
        if (value) return acc + 1;
        return acc;
    }, 0);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end animate-fade-in" onClick={handleCloseAndApply}>
            <div className="bg-white w-full rounded-t-2xl shadow-lg max-h-[85vh] flex flex-col animate-slide-up-from-bottom" onClick={e => e.stopPropagation()}>
                <header className="flex-shrink-0 flex items-center justify-between p-4 border-b">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-bold text-dark-gray">Filters</h2>
                        {totalSelections > 0 && (
                            <button onClick={handleClearAll} className="text-sm font-semibold text-primary hover:underline">
                                Clear all
                            </button>
                        )}
                    </div>
                    <button onClick={handleCloseAndApply} aria-label="Close filters"><CloseIcon className="w-6 h-6 text-gray-600" /></button>
                </header>
    
                <main className="flex-grow overflow-y-auto">
                    {filterConfig.map(filter => (
                        <CollapsibleFilterSection key={filter.type} title={filter.label} defaultOpen={true}>
                            <ul className="space-y-1">
                                {(options[filter.type] || []).map(option => {
                                    const isChecked = filter.isMulti
                                        ? ((tempFilters[filter.type] as string[]) || []).includes(option.value)
                                        : tempFilters[filter.type] === option.value;
                                    return (
                                        <li key={option.value}>
                                            <label className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer">
                                                <input
                                                    type={filter.isMulti ? 'checkbox' : 'radio'}
                                                    name={filter.type}
                                                    checked={isChecked}
                                                    onChange={() => handleSelect(filter.type, option.value, filter.isMulti)}
                                                    className={`form-${filter.isMulti ? 'checkbox' : 'radio'} h-5 w-5 rounded text-primary focus:ring-primary/50 border-gray-400`}
                                                />
                                                <span className="ml-3 text-dark-gray">{option.label}</span>
                                            </label>
                                        </li>
                                    );
                                })}
                            </ul>
                        </CollapsibleFilterSection>
                    ))}
                </main>
            </div>
        </div>
    );
};

const CollapsibleFilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-4">
                <h3 className="font-bold text-dark-gray">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && (
                <div className="px-4 pb-4">
                    {children}
                </div>
            )}
        </div>
    );
};


// --- Main Exported Component ---
const MobileJobFilters: React.FC<MobileJobFiltersProps> = ({ filters, onFiltersChange, options }) => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const getSelectionCount = (type: FilterType) => {
        const value = filters[type];
        if (Array.isArray(value)) return value.length;
        return value ? 1 : 0;
    };
    
    const totalActiveFilters = filterConfig.reduce((acc, f) => acc + getSelectionCount(f.type), 0);

    return (
        <>
            <button
                onClick={() => setIsPanelOpen(true)}
                className="flex items-center justify-start w-full px-4 py-3 text-base font-semibold bg-white border border-gray-300 rounded-lg text-dark-gray"
            >
                <FunnelIcon className="w-5 h-5 mr-2" />
                Filters
                {totalActiveFilters > 0 && (
                    <span className="ml-2 text-xs w-6 h-6 flex items-center justify-center rounded-full bg-primary text-white font-bold">{totalActiveFilters}</span>
                )}
            </button>

            <FilterPanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                onApply={onFiltersChange}
                currentFilters={filters}
                options={options}
            />
        </>
    );
};

export default MobileJobFilters;
