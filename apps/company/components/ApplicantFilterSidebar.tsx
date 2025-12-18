import React, { useState, useMemo, useEffect } from 'react';
import { ApplicantFilters, Job, Applicant } from '../../../packages/types';
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';

interface ApplicantFilterSidebarProps {
  onFiltersChange: (filters: ApplicantFilters) => void;
  filters: ApplicantFilters;
  jobs: Job[];
}

const CollapsibleFilterSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="py-4 border-b border-gray-200 last:border-b-0">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <h3 className="font-semibold text-dark-gray">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && <div className="mt-4 space-y-3">{children}</div>}
        </div>
    );
};

const initialFilterState: ApplicantFilters = {
  jobTitle: '',
  applicationDate: '',
  location: '',
  qualification: '',
  status: [],
  minExperience: '',
  maxExperience: '',
  skills: '',
  minSalary: '',
  maxSalary: '',
  noticePeriod: '',
  matchScoreCategory: 'any',
  hasCoverLetter: false,
};

const datePostedOptions = [
    { value: '', label: 'Any time' },
    { value: '1', label: 'Last 24 hrs' },
    { value: '7', label: 'Last 7 days' },
    { value: '15', label: 'Last 15 days' },
    { value: '30', label: 'Last 30 days' },
];

const noticePeriodOptions = ['', 'Immediate joiner', '15 days', '30 days', '60+ days'];
const statusOptions: Applicant['status'][] = ['New', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];
const matchScoreOptions = [
    { value: 'any', label: 'Any' },
    { value: 'high', label: 'High (80-100%)' },
    { value: 'medium', label: 'Medium (50-79%)' },
    { value: 'low', label: 'Low (0-49%)' },
];

const ApplicantFilterSidebar: React.FC<ApplicantFilterSidebarProps> = ({ onFiltersChange, filters, jobs }) => {
    const jobTitleOptions = useMemo(() => {
        return ['All Jobs', ...[...new Set(jobs.map(job => job.title))]];
    }, [jobs]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            onFiltersChange({ ...filters, [name]: checked });
        } else {
            onFiltersChange({ ...filters, [name]: value });
        }
    };

    const handleStatusChange = (status: Applicant['status']) => {
        const currentStatus = filters.status || [];
        const newStatus = currentStatus.includes(status)
            ? currentStatus.filter(s => s !== status)
            : [...currentStatus, status];
        onFiltersChange({ ...filters, status: newStatus });
    };

    const handleClear = () => {
        onFiltersChange(initialFilterState);
    };

    return (
        <aside className="w-full bg-white p-4 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center border-b pb-2 mb-2">
                <h2 className="text-lg font-bold flex items-center"><FunnelIcon className="w-5 h-5 mr-2"/> Filter Applicants</h2>
                <button onClick={handleClear} className="text-sm font-semibold text-primary hover:underline">Clear All</button>
            </div>
            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto pr-3 custom-scrollbar">
                <CollapsibleFilterSection title="Basic Filters" defaultOpen>
                    <div>
                        <label className="text-sm font-medium">Job</label>
                        <select name="jobTitle" value={filters.jobTitle} onChange={handleChange} className="w-full mt-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50">
                            {jobTitleOptions.map(title => <option key={title} value={title === 'All Jobs' ? '' : title}>{title}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Application Status</label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {statusOptions.map(status => (
                                <label key={status} className="flex items-center space-x-2 text-sm cursor-pointer">
                                    <input type="checkbox" checked={filters.status?.includes(status)} onChange={() => handleStatusChange(status)} className="rounded text-primary focus:ring-primary"/>
                                    <span>{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Application Date</label>
                        {datePostedOptions.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2 text-sm cursor-pointer mt-1">
                                <input type="radio" name="applicationDate" value={opt.value} checked={filters.applicationDate === opt.value} onChange={handleChange} className="text-primary focus:ring-primary"/>
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Candidate Profile">
                    <div>
                        <label className="text-sm font-medium">Experience (years)</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input type="number" name="minExperience" value={filters.minExperience} onChange={handleChange} placeholder="Min" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                            <span className="text-gray-500">-</span>
                            <input type="number" name="maxExperience" value={filters.maxExperience} onChange={handleChange} placeholder="Max" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium">Skills</label>
                        <input type="text" name="skills" value={filters.skills} onChange={handleChange} placeholder="e.g. Java, React" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                     <div>
                        <label className="text-sm font-medium">Education</label>
                        <input type="text" name="qualification" value={filters.qualification} onChange={handleChange} placeholder="e.g. B.Tech, MBA" className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm" />
                    </div>
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Location">
                     <input type="text" name="location" value={filters.location} onChange={handleChange} placeholder="e.g. Pune" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                </CollapsibleFilterSection>

                <CollapsibleFilterSection title="Compensation & Availability">
                    <div>
                        <label className="text-sm font-medium">Expected Salary (in INR)</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input type="number" name="minSalary" value={filters.minSalary} onChange={handleChange} placeholder="Min" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                            <span className="text-gray-500">-</span>
                            <input type="number" name="maxSalary" value={filters.maxSalary} onChange={handleChange} placeholder="Max" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm" />
                        </div>
                    </div>
                     <div>
                        <label className="text-sm font-medium">Notice Period</label>
                        <select name="noticePeriod" value={filters.noticePeriod} onChange={handleChange} className="w-full mt-1 bg-white border border-gray-300 rounded-md px-3 py-2 text-sm">
                            {noticePeriodOptions.map(opt => <option key={opt} value={opt}>{opt || 'Select'}</option>)}
                        </select>
                    </div>
                </CollapsibleFilterSection>
                
                <CollapsibleFilterSection title="Application Quality">
                     <div>
                        <label className="text-sm font-medium">Match Score</label>
                        {matchScoreOptions.map(opt => (
                            <label key={opt.value} className="flex items-center space-x-2 text-sm cursor-pointer mt-1">
                                <input type="radio" name="matchScoreCategory" value={opt.value} checked={filters.matchScoreCategory === opt.value} onChange={handleChange} className="text-primary focus:ring-primary"/>
                                <span>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    <label className="flex items-center space-x-2 text-sm cursor-pointer mt-4">
                        <input type="checkbox" name="hasCoverLetter" checked={!!filters.hasCoverLetter} onChange={handleChange} className="rounded text-primary focus:ring-primary"/>
                        <span>Has Cover Letter</span>
                    </label>
                </CollapsibleFilterSection>
            </div>
        </aside>
    );
};

export default ApplicantFilterSidebar;