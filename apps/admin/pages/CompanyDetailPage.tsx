import React, { useState, useMemo } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  ArrowLeftIcon, CreditCardIcon, DownloadIcon,
  TrashIcon, BriefcaseIcon, UserGroupIcon, CalendarIcon, GlobeAltIcon,
  PencilIcon, BanIcon, CheckBadgeIcon, CheckCircleIcon, PauseIcon, PlayIcon,
  SearchIcon, DocumentTextIcon,
} from '../components/Icons';
import { mockCompanies, AdminCompany, mockAdminJobs, AdminJob } from '../data/mockData';
import ChartCard from '../components/ChartCard';
import { useToast } from '../hooks/useToast';
import ConfirmationModal from '../components/ConfirmationModal';

// Reusable Components
const SectionCard: React.FC<{ title: string; children: React.ReactNode; onEdit?: () => void; isEditing?: boolean; onSave?: () => void; onCancel?: () => void; }> = ({ title, children, onEdit, isEditing, onSave, onCancel }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
            <h3 className="font-bold text-dark-text text-lg">{title}</h3>
            {onEdit && !isEditing && <button onClick={onEdit} className="text-sm font-semibold text-primary hover:underline">Edit</button>}
            {isEditing && (
                <div className="space-x-3">
                    <button onClick={onCancel} className="text-sm font-semibold text-light-text hover:text-dark-text">Cancel</button>
                    <button onClick={onSave} className="text-sm font-semibold text-primary hover:underline">Save Changes</button>
                </div>
            )}
        </div>
        <div>{children}</div>
    </div>
);

const InfoField: React.FC<{ label: string; value: string | undefined; isEditing: boolean; onChange: (value: string) => void; isProtected?: boolean; isModified?: boolean; error?: string; }> = ({ label, value, isEditing, onChange, isProtected = false, isModified, error }) => (
    <div>
        <label className="text-xs text-light-text font-semibold uppercase flex items-center">
            {label}
            {isModified && <span className="ml-2 text-xs font-bold text-accent-orange bg-accent-orange/10 px-2 py-0.5 rounded-full">Modified</span>}
        </label>
        {isEditing && !isProtected ? (
            <input type="text" value={value} onChange={e => onChange(e.target.value)} className={`w-full mt-1 bg-light border rounded-md p-2 text-sm focus:outline-none focus:ring-1 ${error ? 'border-red-500 ring-red-500' : 'border-gray-200 focus:ring-primary'}`} />
        ) : (
            <p className="text-sm text-dark-text font-medium mt-1">{value || 'N/A'}</p>
        )}
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
);

const ActionButton: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void; color?: string; }> = ({ icon, text, onClick, color = 'bg-gray-100 text-gray-800 hover:bg-gray-200' }) => (
    <button onClick={onClick} className={`flex items-center py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${color}`}>
        <span className="w-5 h-5 mr-2">{icon}</span> {text}
    </button>
);

const OverviewStat: React.FC<{ label: string; value: React.ReactNode; }> = ({ label, value }) => (
    <div className="p-3 bg-light rounded-lg">
        <p className="text-xs text-light-text font-semibold uppercase">{label}</p>
        <div className="text-sm font-semibold text-dark-text mt-1">{value}</div>
    </div>
);


const CompanyDetailPage: React.FC = () => {
    const { id } = ReactRouterDom.useParams();
    const [isEditing, setIsEditing] = useState(false);
    const { addToast } = useToast();
    
    // FIX: Remove parseInt as company ID is now a string to align with backend.
    const originalCompany = useMemo(() => mockCompanies.find(c => c.id === id), [id]);
    const [companyData, setCompanyData] = useState<AdminCompany | undefined>(originalCompany);
    const [changes, setChanges] = useState<Record<string, { from: any; to: any }>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [jobSearch, setJobSearch] = useState('');
    const [jobStatusFilter, setJobStatusFilter] = useState('all');

    const companyJobs = useMemo(() => {
        if (!companyData) return [];
        return mockAdminJobs.filter(job => job.companyId === companyData.id);
    }, [companyData]);

    const filteredJobs = useMemo(() => {
        return companyJobs.filter(job => {
            const searchMatch = job.title.toLowerCase().includes(jobSearch.toLowerCase());
            const statusMatch = jobStatusFilter === 'all' || job.status === jobStatusFilter;
            return searchMatch && statusMatch;
        });
    }, [companyJobs, jobSearch, jobStatusFilter]);

    const handleMarkDocVerified = (docToVerify: string) => {
        if (!companyData) return;
        const updatedDocs = companyData.pendingDocuments?.filter(doc => doc !== docToVerify);
        const updatedCompany = { ...companyData, pendingDocuments: updatedDocs };
        
        const companyIndex = mockCompanies.findIndex(c => c.id === companyData.id);
        if (companyIndex > -1) {
            mockCompanies[companyIndex] = updatedCompany as AdminCompany;
        }
    
        setCompanyData(updatedCompany);
        addToast(`'${docToVerify}' marked as verified.`, 'success');
    };

    if (!companyData || !originalCompany) {
        return <div className="text-center"><h1 className="text-xl font-bold">Company not found.</h1><ReactRouterDom.Link to="/companies" className="text-primary hover:underline">Go back</ReactRouterDom.Link></div>;
    }

    const handleEdit = () => setIsEditing(true);
    
    const handleCancel = () => { 
        setCompanyData(originalCompany); 
        setIsEditing(false);
        setChanges({});
        setValidationErrors({});
    };
    
    const updateChanges = (key: string, fromValue: any, toValue: any) => {
        setChanges(prev => {
            const newChanges = { ...prev };
            if (String(toValue).trim() === String(fromValue).trim()) {
                delete newChanges[key];
            } else {
                newChanges[key] = { from: newChanges[key]?.from ?? fromValue, to: toValue };
            }
            return newChanges;
        });
    };

    const handleFieldChange = (field: keyof AdminCompany, value: string) => {
        const originalValue = originalCompany ? originalCompany[field] : undefined;
        updateChanges(String(field), originalValue, value);
        setCompanyData(prev => prev ? { ...prev, [field]: value } as AdminCompany : undefined);
    };
    const handleContactChange = (field: keyof AdminCompany['contact'], value: string) => {
        const originalValue = originalCompany ? originalCompany.contact[field] : undefined;
        const changeKey = `contact.${String(field)}`;
        updateChanges(changeKey, originalValue, value);
        setCompanyData(prev => prev ? { ...prev, contact: { ...prev.contact, [field]: value } } : undefined);
    };

    const validate = (): { isValid: boolean, errors: Record<string, string> } => {
        if (!companyData) return { isValid: false, errors: {} };
        const errors: Record<string, string> = {};
        if (!companyData.name.trim()) errors.name = 'Company name is required.';
        if (!/^\S+@\S+\.\S+$/.test(companyData.contact.email)) errors['contact.email'] = 'Invalid email format.';
        if (!/^\+?[0-9\s-]{7,}$/.test(companyData.contact.phone)) errors['contact.phone'] = 'Invalid phone number format.';
        try {
            if (companyData.website) new URL(companyData.website);
        } catch (_) {
            errors.website = 'Invalid website URL format.';
        }
        return { isValid: Object.keys(errors).length === 0, errors };
    };

    const handleAttemptSave = () => {
        setValidationErrors({});
        const { isValid, errors } = validate();
        if (!isValid) {
            setValidationErrors(errors);
            addToast('Please fix the validation errors.', 'error');
            return;
        }
        if (Object.keys(changes).length === 0) {
            addToast("No changes to save.", "info");
            setIsEditing(false);
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        const companyIndex = mockCompanies.findIndex(c => c.id === companyData.id);
        if (companyIndex > -1) {
            mockCompanies[companyIndex] = { ...companyData };
        }
        setIsConfirmModalOpen(false);
        setIsEditing(false);
        setChanges({});
        addToast("Company details updated successfully!");
    };

    const handleStatusChange = (
        field: 'accountStatus' | 'verificationStatus',
        status: AdminCompany['accountStatus'] | AdminCompany['verificationStatus'],
        message: string
    ) => {
        setCompanyData(prev => {
            if (!prev) return undefined;
            
            const companyIndex = mockCompanies.findIndex(c => c.id === prev.id);
            if (companyIndex > -1) {
                mockCompanies[companyIndex] = { ...mockCompanies[companyIndex], [field]: status };
            }

            let toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
            if (status === 'Banned' || status === 'Rejected') {
                toastType = 'error';
            } else if (status === 'Suspended') {
                toastType = 'warning';
            }
            addToast(message, toastType);

            return { ...prev, [field]: status };
        });
    };

    const JobStatusBadge: React.FC<{ status: AdminJob['status'] }> = ({ status }) => {
        const statusConfig = {
            active: { bg: 'bg-accent-green/10', text: 'text-accent-green' },
            pending: { bg: 'bg-accent-orange/10', text: 'text-accent-orange' },
            paused: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
            closed: { bg: 'bg-gray-100', text: 'text-gray-600' },
            expired: { bg: 'bg-red-100', text: 'text-red-600' },
            rejected: { bg: 'bg-red-100', text: 'text-red-600' },
        };
        const config = statusConfig[status];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };
    

    const jobPostingChartData = useMemo(() => [{ name: 'Jan', Active: 12, Pending: 3, Expired: 5 }, { name: 'Feb', Active: 15, Pending: 1, Expired: 2 }, { name: 'Mar', Active: 18, Pending: 4, Expired: 4 }, { name: 'Apr', Active: 14, Pending: 2, Expired: 5 }, { name: 'May', Active: 16, Pending: 3, Expired: 6 }, { name: 'Jun', Active: companyData.jobs.active, Pending: companyData.jobs.pending, Expired: companyData.jobs.expired }], [companyData.jobs]);
    const applicationsChartData = useMemo(() => jobPostingChartData.map(d => ({ name: d.name, Applications: (d.Active + d.Expired) * (Math.random() * 15 + 10) })), [jobPostingChartData]);
    const sourceChartData = useMemo(() => [{ name: 'Direct Search', value: 400 }, { name: 'Recommendation', value: 300 }, { name: 'Referral', value: 300 }, { name: 'Campaign', value: 200 }], []);
    const categoryChartData = useMemo(() => [{ name: 'Engineering', value: 400 }, { name: 'Design', value: 150 }, { name: 'Sales', value: 300 }, { name: 'Marketing', value: 200 }], []);

    return (
        <>
        <div className="space-y-6">
            <ReactRouterDom.Link to="/companies" className="flex items-center text-sm font-semibold text-light-text hover:text-dark-text">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to All Companies
            </ReactRouterDom.Link>
            
            <SectionCard title="1. Overview">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    <OverviewStat label="Company Name" value={companyData.name} />
                    <OverviewStat label="Company ID" value={`#${companyData.id}`} />
                    <OverviewStat label="Registration" value={new Date(companyData.registrationDate).toLocaleDateString()} />
                    <OverviewStat label="Last Login" value={new Date(companyData.lastLogin).toLocaleDateString()} />
                    <OverviewStat label="Account Type" value="Employer" />
                    <OverviewStat label="Verification" value={<span className="flex items-center gap-1">{companyData.verificationStatus === 'Verified' && <CheckCircleIcon className="w-4 h-4 text-accent-blue" />}{companyData.verificationStatus}</span>} />
                    <OverviewStat label="Account Status" value={companyData.accountStatus} />
                </div>
            </SectionCard>

             <div className="mt-8">
                 <h2 className="text-2xl font-bold text-dark-text mb-4">2. Charts / Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Job Posting Overview"><ResponsiveContainer><BarChart data={jobPostingChartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Active" stackId="a" fill="#34a853" /><Bar dataKey="Pending" stackId="a" fill="#f9ab00" /><Bar dataKey="Expired" stackId="a" fill="#e91e63" /></BarChart></ResponsiveContainer></ChartCard>
                    <ChartCard title="Applications Received"><ResponsiveContainer><LineChart data={applicationsChartData}><CartesianGrid /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="Applications" stroke="#4b2fdb" /></LineChart></ResponsiveContainer></ChartCard>
                    <ChartCard title="Candidate Source"><ResponsiveContainer><PieChart><Pie data={sourceChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} label={p => p.name}>{sourceChartData.map((_, index) => <Cell key={`cell-${index}`} fill={['#4b2fdb', '#f9ab00', '#34a853', '#e91e63'][index % 4]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></ChartCard>
                    <ChartCard title="Job Category Distribution"><ResponsiveContainer><BarChart data={categoryChartData} layout="vertical"><CartesianGrid /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} /><Tooltip /><Bar dataKey="value" fill="#4b2fdb" /></BarChart></ResponsiveContainer></ChartCard>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
                <div className="xl:col-span-2 space-y-6">
                    <SectionCard title="3. Basic & Contact Information" onEdit={handleEdit} isEditing={isEditing} onSave={handleAttemptSave} onCancel={handleCancel}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoField label="Company Name" value={companyData.name} isEditing={isEditing} onChange={(val) => handleFieldChange('name', val)} isModified={!!changes.name} error={validationErrors.name}/>
                            <InfoField label="Industry/Sector" value={companyData.industry} isEditing={isEditing} onChange={(val) => handleFieldChange('industry', val)} isModified={!!changes.industry} />
                            <InfoField label="Website" value={companyData.website} isEditing={isEditing} onChange={(val) => handleFieldChange('website', val)} isModified={!!changes.website} error={validationErrors.website}/>
                            <InfoField label="Location" value={companyData.location} isEditing={isEditing} onChange={(val) => handleFieldChange('location', val)} isModified={!!changes.location} />
                            <InfoField label="Contact Name" value={companyData.contact.name} isEditing={isEditing} onChange={(val) => handleContactChange('name', val)} isModified={!!changes['contact.name']} />
                            <InfoField label="Contact Email" value={companyData.contact.email} isEditing={isEditing} onChange={(val) => handleContactChange('email', val)} isModified={!!changes['contact.email']} error={validationErrors['contact.email']} />
                            <InfoField label="Contact Phone" value={companyData.contact.phone} isEditing={isEditing} onChange={(val) => handleContactChange('phone', val)} isModified={!!changes['contact.phone']} error={validationErrors['contact.phone']} />
                        </div>
                    </SectionCard>
                    <SectionCard title="4. Job Postings & Recruitment Data">
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div><p className="text-2xl font-bold">{companyData.jobs.active + companyData.jobs.pending + companyData.jobs.expired}</p><p className="text-sm text-light-text">Total Jobs</p></div>
                            <div><p className="text-2xl font-bold">{companyData.jobs.active}</p><p className="text-sm text-light-text">Active</p></div>
                            <div><p className="text-2xl font-bold">{companyData.jobs.pending}</p><p className="text-sm text-light-text">Pending</p></div>
                            <div><p className="text-2xl font-bold">{companyData.applicationsReceived}</p><p className="text-sm text-light-text">Applications</p></div>
                         </div>
                    </SectionCard>
                    <SectionCard title="Jobs from this Company">
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <div className="relative flex-grow">
                                <SearchIcon className="w-5 h-5 text-light-text absolute top-1/2 left-3 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search by job title..."
                                    value={jobSearch}
                                    onChange={(e) => setJobSearch(e.target.value)}
                                    className="w-full bg-light pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary text-sm"
                                />
                            </div>
                            <select
                                value={jobStatusFilter}
                                onChange={(e) => setJobStatusFilter(e.target.value)}
                                className="w-full sm:w-auto bg-light border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="pending">Pending</option>
                                <option value="paused">Paused</option>
                                <option value="closed">Closed</option>
                                <option value="expired">Expired</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Job Title</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Applicants</th>
                                        <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Posted</th>
                                        <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                        <tr key={job.id}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <ReactRouterDom.Link to={`/jobs/${job.id}`} className="font-semibold text-dark-text hover:text-primary">{job.title}</ReactRouterDom.Link>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <JobStatusBadge status={job.status} />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-light-text">{job.applicantsCount}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-light-text">{new Date(job.postedDate).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                <ReactRouterDom.Link to={`/jobs/${job.id}?edit=true`} className="font-semibold text-primary hover:underline flex items-center justify-end">
                                                    <PencilIcon className="w-4 h-4 mr-1" />
                                                    Edit
                                                </ReactRouterDom.Link>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-light-text">No jobs found for this company matching the filters.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6 xl:sticky top-28">
                     <SectionCard title="5. Subscription & Plan Details">
                        <div className="space-y-4">
                            <InfoField label="Current Plan" value={companyData.plan} isEditing={isEditing} onChange={() => {}} isModified={!!changes.plan}/>
                            {isEditing && (
                                <select value={companyData.plan} onChange={(e) => handleFieldChange('plan', e.target.value)} className="w-full mt-1 bg-light border border-gray-200 rounded-md p-2 text-sm">
                                    <option>Free</option><option>Premium</option><option>Enterprise</option>
                                </select>
                            )}
                            <ActionButton icon={<CreditCardIcon/>} text="Manage Billing" onClick={() => addToast("Navigate to billing page...", "info")}/>
                        </div>
                    </SectionCard>
                    <SectionCard title="6. Activity & Engagement Metrics">
                        <div className="grid grid-cols-2 gap-4">
                             <div><label className="text-xs text-light-text font-semibold">PROFILE VIEWS</label><p>12k</p></div>
                             <div><label className="text-xs text-light-text font-semibold">LOGIN FREQUENCY</label><p>Daily</p></div>
                             <div><label className="text-xs text-light-text font-semibold">RESPONSE RATE</label><p>85%</p></div>
                             <div><label className="text-xs text-light-text font-semibold">FLAGGED JOBS</label><p className="text-red-500 font-bold">{companyData.flaggedJobs}</p></div>
                        </div>
                    </SectionCard>
                     <SectionCard title="7. Admin Actions">
                        <div className="flex flex-wrap gap-3">
                            {companyData.verificationStatus !== 'Verified' && <ActionButton icon={<CheckBadgeIcon/>} text="Verify" onClick={() => handleStatusChange('verificationStatus', 'Verified', 'Company Verified!')} color="bg-green-100 text-green-800 hover:bg-green-200"/>}
                            
                            {companyData.accountStatus === 'Active' && <ActionButton icon={<PauseIcon/>} text="Suspend Company" onClick={() => handleStatusChange('accountStatus', 'Suspended', 'Company has been suspended.')} color="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"/>}
                            
                            {companyData.accountStatus === 'Suspended' && <ActionButton icon={<PlayIcon/>} text="Re-activate Company" onClick={() => handleStatusChange('accountStatus', 'Active', 'Company has been re-activated.')} color="bg-green-100 text-green-800 hover:bg-green-200"/>}

                            {companyData.accountStatus !== 'Banned' && <ActionButton icon={<BanIcon/>} text="Ban Company" onClick={() => handleStatusChange('accountStatus', 'Banned', 'Company has been banned.')} color="bg-red-100 text-red-800 hover:bg-red-200"/>}
                            
                            {companyData.accountStatus === 'Banned' && <ActionButton icon={<PlayIcon/>} text="Unban Company" onClick={() => handleStatusChange('accountStatus', 'Active', 'Company has been unbanned and is now active.')} color="bg-green-100 text-green-800 hover:bg-green-200"/>}

                            <ActionButton icon={<DownloadIcon/>} text="Export Report" onClick={() => addToast("Exporting report...", "info")}/>
                        </div>
                    </SectionCard>
                     <SectionCard title="8. Pending Verifications">
                        {(companyData.pendingDocuments && companyData.pendingDocuments.length > 0) ? (
                            <ul className="space-y-3">
                                {companyData.pendingDocuments.map((doc, index) => (
                                    <li key={index} className="p-3 bg-light rounded-lg border flex justify-between items-center">
                                        <div className="flex items-center">
                                            <DocumentTextIcon className="w-5 h-5 mr-3 text-light-text"/>
                                            <span className="text-sm font-medium text-dark-text">{doc}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button className="text-xs font-semibold text-primary hover:underline">Request</button>
                                            <button onClick={() => handleMarkDocVerified(doc)} className="text-xs font-semibold text-accent-green hover:underline">Verify</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-4">
                                <CheckCircleIcon className="w-10 h-10 text-accent-green mx-auto mb-2"/>
                                <p className="text-sm text-light-text">All documents are verified.</p>
                            </div>
                        )}
                    </SectionCard>
                </div>
            </div>
        </div>
        <ConfirmationModal 
            isOpen={isConfirmModalOpen}
            onClose={() => setIsConfirmModalOpen(false)}
            onConfirm={handleConfirmSave}
            changes={changes}
            title="Confirm Company Changes"
        />
        </>
    );
};

export default CompanyDetailPage;