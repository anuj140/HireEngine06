import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

export type UserFilters = {
    name: string;
    email: string;
    phone: string;
    location: string;
    status: ('Active' | 'Suspended' | 'Pending')[];
    isEmailVerified: 'any' | 'yes' | 'no';
    isPhoneVerified: 'any' | 'yes' | 'no';
    skills: string;
    minExperience: string;
    maxExperience: string;
    education: string;
    incompleteProfile: boolean;
    applicationsMin: string;
    applicationsMax: string;
    savedJobsMin: string;
    savedJobsMax: string;
};

export const initialFilters: UserFilters = {
    name: '',
    email: '',
    phone: '',
    location: '',
    status: [],
    isEmailVerified: 'any',
    isPhoneVerified: 'any',
    skills: '',
    minExperience: '',
    maxExperience: '',
    education: '',
    incompleteProfile: false,
    applicationsMin: '',
    applicationsMax: '',
    savedJobsMin: '',
    savedJobsMax: '',
};

interface UserFilterSidebarProps {
    filters: UserFilters;
    onFiltersChange: (filters: UserFilters) => void;
    initialFilters: UserFilters;
}

const CollapsibleFilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="py-4 border-b border-gray-200 last:border-b-0">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <h3 className="font-semibold text-dark-text">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && <div className="mt-4 space-y-4">{children}</div>}
        </div>
    );
};

const FormInput: React.FC<{ label: string; name: keyof UserFilters; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-light-text">{label}</label>
        <input {...props} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"/>
    </div>
);

const UserFilterSidebar: React.FC<UserFilterSidebarProps> = ({ filters, onFiltersChange, initialFilters }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            if(name === 'incompleteProfile') {
                onFiltersChange({ ...filters, [name]: checked });
            } else {
                // Handle status array
                const currentStatus = filters.status;
                const newStatus = checked ? [...currentStatus, value as UserFilters['status'][0]] : currentStatus.filter(s => s !== value);
                onFiltersChange({ ...filters, status: newStatus });
            }
        } else {
            onFiltersChange({ ...filters, [name]: value });
        }
    };
    
    return (
        <div className="bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => onFiltersChange(initialFilters)} className="text-sm font-semibold text-primary hover:underline">Clear All</button>
            </div>
            <div className="max-h-[calc(100vh-20rem)] overflow-y-auto pr-2 custom-scrollbar">
                <CollapsibleFilterSection title="Personal Info">
                    <FormInput label="Name" name="name" value={filters.name} onChange={handleChange} placeholder="Search by name..."/>
                    <FormInput label="Email" name="email" value={filters.email} onChange={handleChange} placeholder="Search by email..."/>
                    <FormInput label="Phone" name="phone" value={filters.phone} onChange={handleChange} placeholder="Search by phone..."/>
                    <FormInput label="Location" name="location" value={filters.location} onChange={handleChange} placeholder="City, State..."/>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Account Status">
                    <div className="space-y-2">
                        {(['Active', 'Suspended', 'Pending'] as const).map(status => (
                            <label key={status} className="flex items-center"><input type="checkbox" name="status" value={status} checked={filters.status.includes(status)} onChange={handleChange} className="h-4 w-4 rounded text-primary focus:ring-primary/50 border-gray-300"/> <span className="ml-2 text-sm">{status}</span></label>
                        ))}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text">Email Verified</label>
                        <select name="isEmailVerified" value={filters.isEmailVerified} onChange={handleChange} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm">
                            <option value="any">Any</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text">Phone Verified</label>
                         <select name="isPhoneVerified" value={filters.isPhoneVerified} onChange={handleChange} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm">
                            <option value="any">Any</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Professional Info">
                    <FormInput label="Skills" name="skills" value={filters.skills} onChange={handleChange} placeholder="Comma-separated skills"/>
                    <div>
                        <label className="text-sm font-medium text-light-text">Total Experience (years)</label>
                        <div className="flex items-center space-x-2 mt-1">
                           <FormInput label="" name="minExperience" value={filters.minExperience} onChange={handleChange} placeholder="Min" type="number" />
                           <span className="text-gray-400">-</span>
                           <FormInput label="" name="maxExperience" value={filters.maxExperience} onChange={handleChange} placeholder="Max" type="number" />
                        </div>
                    </div>
                    <FormInput label="Education / Degree" name="education" value={filters.education} onChange={handleChange} placeholder="e.g., B.Tech"/>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Activity Metrics">
                    <label className="flex items-center"><input type="checkbox" name="incompleteProfile" checked={filters.incompleteProfile} onChange={handleChange} className="h-4 w-4 rounded text-primary focus:ring-primary/50 border-gray-300"/> <span className="ml-2 text-sm">Incomplete Profile (&lt;100%)</span></label>
                    <div>
                        <label className="text-sm font-medium text-light-text">Applications Submitted</label>
                        <div className="flex items-center space-x-2 mt-1">
                           <FormInput label="" name="applicationsMin" value={filters.applicationsMin} onChange={handleChange} placeholder="Min" type="number" />
                           <span className="text-gray-400">-</span>
                           <FormInput label="" name="applicationsMax" value={filters.applicationsMax} onChange={handleChange} placeholder="Max" type="number" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text">Jobs Saved</label>
                        <div className="flex items-center space-x-2 mt-1">
                           <FormInput label="" name="savedJobsMin" value={filters.savedJobsMin} onChange={handleChange} placeholder="Min" type="number" />
                           <span className="text-gray-400">-</span>
                           <FormInput label="" name="savedJobsMax" value={filters.savedJobsMax} onChange={handleChange} placeholder="Max" type="number" />
                        </div>
                    </div>
                </CollapsibleFilterSection>
            </div>
        </div>
    );
};

export default UserFilterSidebar;