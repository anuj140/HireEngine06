import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import {
  ArrowLeftIcon, PencilIcon, BriefcaseIcon, CheckCircleIcon,
  PauseIcon, ClockIcon, ArchiveBoxIcon, BanIcon, PlayIcon
} from '../components/Icons';
import { mockAdminJobs, AdminJob, mockCompanies, mockUsers } from '../data/mockData';
import ChartCard from '../components/ChartCard';
import ConfirmationModal from '../components/ConfirmationModal';
import { useToast } from '../hooks/useToast';

type ChartTimeFilter = 7 | 30 | 90;

const JobDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const originalJob = useMemo(() => mockAdminJobs.find(j => j.id === id), [id]);
    
    const [job, setJob] = useState<AdminJob | undefined>(originalJob);
    const [company, setCompany] = useState(() => mockCompanies.find(c => c.id === originalJob?.companyId));
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedJob, setEditedJob] = useState<AdminJob | undefined>(originalJob);
    const [changes, setChanges] = useState<Record<string, { from: any; to: any }>>({});
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'details' | 'applications'>('details');
    const [chartTimeFilter, setChartTimeFilter] = useState<ChartTimeFilter>(30);
    const [applicantSearchTerm, setApplicantSearchTerm] = useState('');
    const [applicantStatusFilter, setApplicantStatusFilter] = useState<'all' | AdminJob['applications'][0]['status']>('all');

    useEffect(() => {
        setJob(originalJob);
        setEditedJob(originalJob);
        setCompany(mockCompanies.find(c => c.id === originalJob?.companyId));
    }, [id, originalJob]);

    useEffect(() => {
        if (searchParams.get('edit') === 'true') {
            setIsEditing(true);
            setActiveTab('details');
            
            // Clean up URL parameter after activating edit mode
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('edit');
            setSearchParams(newSearchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    const usersByEmail = useMemo(() => mockUsers.reduce((acc, user) => {
        acc[user.email] = user;
        return acc;
    }, {} as Record<string, typeof mockUsers[0]>), []);

    const ActionButton: React.FC<{ icon: React.ReactNode; text: string; onClick: () => void; color?: string; }> = ({ icon, text, onClick, color = 'bg-gray-100 text-gray-800 hover:bg-gray-200' }) => (
        <button onClick={onClick} className={`flex items-center py-2 px-4 text-sm font-semibold rounded-lg transition-colors ${color}`}>
            <span className="w-5 h-5 mr-2">{icon}</span> {text}
        </button>
    );

    const handleStatusChange = (jobId: string, status: AdminJob['status'], message: string) => {
        const jobIndex = mockAdminJobs.findIndex(j => j.id === jobId);
        if (jobIndex > -1) {
            mockAdminJobs[jobIndex].status = status;
            const updatedJob = { ...job!, status };
            setJob(updatedJob);
            setEditedJob(updatedJob);
            
            let toastType: 'success' | 'error' | 'info' | 'warning' = 'success';
            if (status === 'rejected') {
                toastType = 'error';
            } else if (status === 'paused') {
                toastType = 'warning';
            } else if (status === 'pending') {
                toastType = 'info';
            }
            addToast(message, toastType);

        } else {
            addToast("Error updating job status.", "error");
        }
    };


    const filteredChartData = useMemo(() => {
        return job?.performanceData?.viewsOverTime.slice(-chartTimeFilter) || [];
    }, [job, chartTimeFilter]);
    
    const filteredApplicants = useMemo(() => {
        if (!job) return [];
        return job.applications.filter(app => {
            const searchMatch = app.name.toLowerCase().includes(applicantSearchTerm.toLowerCase()) || app.email.toLowerCase().includes(applicantSearchTerm.toLowerCase());
            const statusMatch = applicantStatusFilter === 'all' || app.status === applicantStatusFilter;
            return searchMatch && statusMatch;
        });
    }, [job, applicantSearchTerm, applicantStatusFilter]);

    if (!job || !company || !editedJob) {
        return (
            <div>
                <Link to="/jobs" className="flex items-center text-sm font-semibold text-light-text hover:text-dark-text mb-4">
                    <ArrowLeftIcon className="w-5 h-5 mr-2" />
                    Back to All Jobs
                </Link>
                <h1 className="text-2xl font-bold text-dark-text">Job not found.</h1>
            </div>
        );
    }
    
    const handleFieldChange = (field: keyof AdminJob, value: string | number | string[]) => {
        const originalValue = originalJob ? originalJob[field] : undefined;
        setChanges(prev => {
            const newChanges = { ...prev };
            if (String(value) === String(originalValue)) {
                delete newChanges[String(field)];
            } else {
                newChanges[String(field)] = { from: newChanges[String(field)]?.from ?? originalValue, to: value };
            }
            return newChanges;
        });
        setEditedJob(prev => prev ? { ...prev, [field]: value } as AdminJob : undefined);
    };

    const handleAttemptSave = () => {
        if (Object.keys(changes).length === 0) {
            addToast("No changes to save.", "info");
            setIsEditing(false);
            return;
        }
        setIsConfirmModalOpen(true);
    };

    const handleConfirmSave = () => {
        const jobIndex = mockAdminJobs.findIndex(j => j.id === job.id);
        if (jobIndex > -1) {
            mockAdminJobs[jobIndex] = { ...editedJob };
        }
        setJob(editedJob); // Update the view with the new data
        setIsConfirmModalOpen(false);
        setIsEditing(false);
        setChanges({});
        addToast("Job details updated successfully!");
    };

    const handleCancelEdit = () => {
        setEditedJob(originalJob);
        setIsEditing(false);
        setChanges({});
    };

    const topPerformingJobs = useMemo(() => {
        return [...mockAdminJobs]
            // DO: Add comment above each fix.
            // FIX: Explicitly cast `applicantsCount` to Number to resolve arithmetic operation error in strict type environments.
            .sort((a, b) => Number(b.applicantsCount) - Number(a.applicantsCount))
            .slice(0, 5)
            .map(job => ({
                name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
                Applicants: job.applicantsCount,
            }));
    }, []);

    const topHiringCompanies = useMemo(() => {
        const companyJobCounts = mockAdminJobs.reduce((acc, job) => {
            if (job.status === 'active') {
                acc[job.companyId] = (acc[job.companyId] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(companyJobCounts)
            // DO: Add comment above each fix.
            // FIX: The type checker is having trouble with arithmetic operations. Explicitly cast to Number to resolve.
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 5)
            .map(([companyId, count]) => ({
                name: mockCompanies.find(c => c.id === companyId)?.name || 'Unknown',
                'Active Jobs': count,
            }));
    }, []);

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
    

    const jobPostingChartData = useMemo(() => [{ name: 'Jan', Active: 12, Pending: 3, Expired: 5 }, { name: 'Feb', Active: 15, Pending: 1, Expired: 2 }, { name: 'Mar', Active: 18, Pending: 4, Expired: 4 }, { name: 'Apr', Active: 14, Pending: 2, Expired: 5 }, { name: 'May', Active: 16, Pending: 3, Expired: 6 }, { name: 'Jun', Active: company.jobs.active, Pending: company.jobs.pending, Expired: company.jobs.expired }], [company.jobs]);
    const applicationsChartData = useMemo(() => jobPostingChartData.map(d => ({ name: d.name, Applications: (d.Active + d.Expired) * (Math.random() * 15 + 10) })), [jobPostingChartData]);
    const sourceChartData = useMemo(() => [{ name: 'Direct Search', value: 400 }, { name: 'Recommendation', value: 300 }, { name: 'Referral', value: 300 }, { name: 'Campaign', value: 200 }], []);
    const categoryChartData = useMemo(() => [{ name: 'Engineering', value: 400 }, { name: 'Design', value: 150 }, { name: 'Sales', value: 300 }, { name: 'Marketing', value: 200 }], []);

    return (
        <>
        <div className="space-y-6">
            <Link to="/jobs" className="flex items-center text-sm font-semibold text-light-text hover:text-dark-text">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to All Jobs
            </Link>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <img src={company.logo} alt={company.name} className="w-16 h-16 rounded-lg" />
                    <div>
                        <h1 className="text-2xl font-bold text-dark-text">{job.title}</h1>
                        <p className="text-light-text"><Link to={`/companies/${company.id}`} className="hover:underline">{company.name}</Link> - {job.location}</p>
                    </div>
                </div>
                {!isEditing && (
                    <button onClick={() => { setActiveTab('details'); setIsEditing(true); }} className="flex items-center py-2 px-4 text-sm font-semibold rounded-lg bg-primary-light text-primary hover:bg-primary/20">
                        <PencilIcon className="w-5 h-5 mr-2" /> Edit Job
                    </button>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h3 className="font-bold text-dark-text text-lg mb-4">Job Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {job.status === 'pending' && (
                        <>
                            <ActionButton
                                icon={<CheckCircleIcon />}
                                text="Approve & Activate"
                                onClick={() => handleStatusChange(job.id, 'active', 'Job has been approved and is now active.')}
                                color="bg-green-100 text-green-800 hover:bg-green-200"
                            />
                            <ActionButton
                                icon={<BanIcon />}
                                text="Reject"
                                onClick={() => handleStatusChange(job.id, 'rejected', 'Job has been rejected.')}
                                color="bg-red-100 text-red-800 hover:bg-red-200"
                            />
                        </>
                    )}
                    {job.status === 'active' && (
                        <>
                            <ActionButton
                                icon={<PauseIcon />}
                                text="Suspend (Pause)"
                                onClick={() => handleStatusChange(job.id, 'paused', 'Job has been paused.')}
                                color="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            />
                            <ActionButton
                                icon={<ArchiveBoxIcon />}
                                text="Close Job"
                                onClick={() => handleStatusChange(job.id, 'closed', 'Job has been closed.')}
                                color="bg-gray-100 text-gray-800 hover:bg-gray-200"
                            />
                        </>
                    )}
                    {job.status === 'paused' && (
                        <ActionButton
                            icon={<PlayIcon />}
                            text="Re-activate Job"
                            onClick={() => handleStatusChange(job.id, 'active', 'Job has been re-activated.')}
                            color="bg-green-100 text-green-800 hover:bg-green-200"
                        />
                    )}
                    {(job.status === 'closed' || job.status === 'rejected' || job.status === 'expired') && (
                        <ActionButton
                            icon={<ClockIcon />}
                            text="Re-list (Set to Pending)"
                            onClick={() => handleStatusChange(job.id, 'pending', 'Job has been re-listed and is pending review.')}
                            color="bg-orange-100 text-orange-800 hover:bg-orange-200"
                        />
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-dark-text">Performance Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard title="Views & Applications Over Time">
                        <div className="flex justify-end gap-1 mb-2">
                            {[7, 30, 90].map(days => (
                                <button key={days} onClick={() => setChartTimeFilter(days as ChartTimeFilter)} className={`px-2 py-0.5 text-xs rounded ${chartTimeFilter === days ? 'bg-primary text-white' : 'bg-light'}`}>{days}d</button>
                            ))}
                        </div>
                        <ResponsiveContainer><LineChart data={filteredChartData}><CartesianGrid vertical={false} /><XAxis dataKey="date" tick={{fontSize: 10}} /><YAxis /><Tooltip /><Legend /><Line type="monotone" dataKey="views" stroke="#4b2fdb" /><Line type="monotone" dataKey="applications" stroke="#34a853" /></LineChart></ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Recruitment Funnel">
                         <ResponsiveContainer><BarChart data={job.performanceData.recruitmentFunnel} layout="vertical" margin={{left: 10}}><CartesianGrid horizontal={false} /><XAxis type="number" /><YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}}/><Tooltip /><Bar dataKey="value" fill="#4b2fdb" /></BarChart></ResponsiveContainer>
                    </ChartCard>
                    <ChartCard title="Applicant Sources">
                        <ResponsiveContainer><PieChart><Pie data={job.performanceData.applicantSources} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} fill="#8884d8" paddingAngle={5} label={p => p.name}>{job.performanceData.applicantSources.map((_, index) => <Cell key={`cell-${index}`} fill={['#4b2fdb', '#f9ab00', '#34a853'][index % 3]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm">
                <div className="border-b px-6">
                    <nav className="-mb-px flex space-x-6">
                        <button onClick={() => setActiveTab('details')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'details' ? 'border-primary text-primary' : 'border-transparent text-light-text'}`}>Job Details</button>
                        <button onClick={() => setActiveTab('applications')} className={`py-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'applications' ? 'border-primary text-primary' : 'border-transparent text-light-text'}`}>Applications ({job.applications.length})</button>
                    </nav>
                </div>
                <div className="p-6">
                    {activeTab === 'details' ? (
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold text-light-text">DESCRIPTION</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <textarea rows={5} value={editedJob.description} onChange={e => handleFieldChange('description', e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.description}</p></div>
                            <div><label className="text-xs font-bold text-light-text">SKILLS</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <input value={editedJob.requiredSkills.join(', ')} onChange={e => handleFieldChange('requiredSkills', e.target.value.split(',').map(s=>s.trim()))} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.requiredSkills.join(', ')}</p></div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div><label className="text-xs font-bold text-light-text">SALARY</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <input value={editedJob.salaryRange} onChange={e => handleFieldChange('salaryRange', e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.salaryRange}</p></div>
                                 <div><label className="text-xs font-bold text-light-text">LOCATION</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <input value={editedJob.location} onChange={e => handleFieldChange('location', e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.location}</p></div>
                                 <div><label className="text-xs font-bold text-light-text">EXPERIENCE</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <input value={editedJob.experienceRequired} onChange={e => handleFieldChange('experienceRequired', e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.experienceRequired}</p></div>
                                 <div><label className="text-xs font-bold text-light-text">JOB TYPE</label><p className={`mt-1 p-2 w-full rounded-md ${isEditing ? 'bg-light border' : ''}`}>{isEditing ? <input value={editedJob.jobType} onChange={e => handleFieldChange('jobType', e.target.value)} className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm"/> : job.jobType}</p></div>
                            </div>
                            {isEditing && (
                                <div className="flex justify-end gap-3 pt-4">
                                    <button onClick={handleCancelEdit} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-lg">Cancel</button>
                                    <button onClick={handleAttemptSave} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-lg">Save Changes</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-4 mb-4">
                                <input type="text" placeholder="Search by name or email" value={applicantSearchTerm} onChange={e => setApplicantSearchTerm(e.target.value)} className="flex-grow bg-light border border-gray-200 rounded-lg text-sm px-4 py-2"/>
                                <select value={applicantStatusFilter} onChange={e => setApplicantStatusFilter(e.target.value as any)} className="bg-light border border-gray-200 rounded-lg text-sm px-4 py-2">
                                    <option value="all">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Shortlisted">Shortlisted</option>
                                    <option value="Hired">Hired</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                                {filteredApplicants.map(app => {
                                    const user = usersByEmail[app.email];
                                    return (
                                        <div key={app.id} className="p-3 bg-light rounded-lg flex justify-between items-center border border-gray-200">
                                            <div>
                                                {user ? (
                                                    <Link to={`/users/${user.id}`} className="font-semibold text-dark-text hover:text-primary">{app.name}</Link>
                                                ) : (
                                                    <p className="font-semibold text-dark-text">{app.name}</p>
                                                )}
                                                <p className="text-sm text-light-text">{app.email}</p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="text-sm text-light-text">Applied: {app.date}</p>
                                                <span className="text-xs font-bold px-2 py-1 rounded-full bg-blue-100 text-blue-800">{app.status}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredApplicants.length === 0 && (
                                    <div className="text-center py-8 text-light-text">
                                        No applicants found matching your criteria.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
        <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmSave} changes={changes} title="Confirm Job Changes"/>
        </>
    );
};

export default JobDetailPage;