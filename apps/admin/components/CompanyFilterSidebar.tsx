import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

export type CompanyFilters = {
    name: string;
    email: string;
    phone: string;
    location: string;
    industry: string;
    status: ('Active' | 'Inactive' | 'Suspended' | 'Banned')[];
    verification: ('Verified' | 'Pending' | 'Rejected')[];
    plan: string;
    minJobs: string;
    maxJobs: string;
    lastActive: string;
};

export const initialFilters: CompanyFilters = {
    name: '',
    email: '',
    phone: '',
    location: '',
    industry: '',
    status: [],
    verification: [],
    plan: 'any',
    minJobs: '',
    maxJobs: '',
    lastActive: 'any',
};

interface CompanyFilterSidebarProps {
    filters: CompanyFilters;
    onFiltersChange: (filters: CompanyFilters) => void;
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

const FormInput: React.FC<{ label: string; name: keyof CompanyFilters; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; type?: string }> = ({ label, ...props }) => (
    <div>
        <label className="text-sm font-medium text-light-text">{label}</label>
        <input {...props} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"/>
    </div>
);

const CompanyFilterSidebar: React.FC<CompanyFilterSidebarProps> = ({ filters, onFiltersChange }) => {
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            const category = name as 'status' | 'verification';
            const currentValues = filters[category];
            const newValues = checked ? [...currentValues, value as any] : currentValues.filter(s => s !== value);
            onFiltersChange({ ...filters, [category]: newValues });
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
                <CollapsibleFilterSection title="Company Info">
                    <FormInput label="Company Name" name="name" value={filters.name} onChange={handleChange} placeholder="Search by name..."/>
                    <FormInput label="Contact Email" name="email" value={filters.email} onChange={handleChange} placeholder="Search by email..."/>
                    <FormInput label="Phone" name="phone" value={filters.phone} onChange={handleChange} placeholder="Search by phone..."/>
                    <FormInput label="Location" name="location" value={filters.location} onChange={handleChange} placeholder="City, State..."/>
                    <FormInput label="Industry" name="industry" value={filters.industry} onChange={handleChange} placeholder="e.g., IT, Fintech"/>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Account">
                    <div>
                        <label className="text-sm font-medium text-light-text">Account Status</label>
                        <div className="space-y-2 mt-2">
                            {(['Active', 'Inactive', 'Suspended', 'Banned'] as const).map(status => (
                                <label key={status} className="flex items-center"><input type="checkbox" name="status" value={status} checked={filters.status.includes(status)} onChange={handleChange} className="h-4 w-4 rounded text-primary focus:ring-primary/50 border-gray-300"/> <span className="ml-2 text-sm">{status}</span></label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text">Verification</label>
                         <div className="space-y-2 mt-2">
                            {(['Verified', 'Pending', 'Rejected'] as const).map(status => (
                                <label key={status} className="flex items-center"><input type="checkbox" name="verification" value={status} checked={filters.verification.includes(status)} onChange={handleChange} className="h-4 w-4 rounded text-primary focus:ring-primary/50 border-gray-300"/> <span className="ml-2 text-sm">{status}</span></label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-light-text">Subscription Plan</label>
                        <select name="plan" value={filters.plan} onChange={handleChange} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm">
                            <option value="any">Any</option>
                            <option value="Free">Free</option>
                            <option value="Premium">Premium</option>
                            <option value="Enterprise">Enterprise</option>
                        </select>
                    </div>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Activity">
                     <div>
                        <label className="text-sm font-medium text-light-text">Job Postings</label>
                        <div className="flex items-center space-x-2 mt-1">
                           <FormInput label="" name="minJobs" value={filters.minJobs} onChange={handleChange} placeholder="Min" type="number" />
                           <span className="text-gray-400">-</span>
                           <FormInput label="" name="maxJobs" value={filters.maxJobs} onChange={handleChange} placeholder="Max" type="number" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-light-text">Last Active</label>
                        <select name="lastActive" value={filters.lastActive} onChange={handleChange} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm">
                            <option value="any">Any time</option>
                            <option value="24h">Within 24 hours</option>
                            <option value="7d">Within 7 days</option>
                            <option value="30d">Within 30 days</option>
                            <option value="over30d">Over 30 days ago</option>
                        </select>
                    </div>
                </CollapsibleFilterSection>
            </div>
        </div>
    );
};

export default CompanyFilterSidebar;