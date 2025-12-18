import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Job as AdminJob } from '../../../packages/types';
import { useToast } from '../hooks/useToast';
import { CheckCircleIcon, BanIcon, EyeIcon, BriefcaseIcon, ClockIcon, PlusCircleIcon } from '../components/Icons';
import ChartCard from '../components/ChartCard';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
// DO: Add comment above each fix.
// FIX: The correct function exported from the service is 'fetchAllJobs', not 'adminFetchAllJobs'.
import { adminFetchAllJobs as fetchAllJobs, updateJob as adminUpdateJob } from '../services/api';

type JobStatus = AdminJob['status'] | 'all';

const statusConfig: { [key in AdminJob['status']]: { bg: string; text: string; icon: React.ReactNode } } = {
    active: { bg: 'bg-accent-green/10', text: 'text-accent-green', icon: <CheckCircleIcon className="w-4 h-4" /> },
    pending: { bg: 'bg-accent-orange/10', text: 'text-accent-orange', icon: <ClockIcon className="w-4 h-4" /> },
    paused: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: <ClockIcon className="w-4 h-4" /> },
    closed: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <BriefcaseIcon className="w-4 h-4" /> },
    expired: { bg: 'bg-red-100', text: 'text-red-600', icon: <ClockIcon className="w-4 h-4" /> },
    rejected: { bg: 'bg-red-100', text: 'text-red-600', icon: <BanIcon className="w-4 h-4" /> },
};

const JobManagementPage: React.FC = () => {
    const [jobs, setJobs] = useState<AdminJob[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<JobStatus>('all');
    const { addToast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        fetchAllJobs()
            .then((data: any) => {
                const adaptedJobs = (data.jobs || data).map((j: any) => ({
                    ...j,
                    id: j._id,
                    id: j._id,
                    companyName: j.company?.companyName || j.companyName || 'N/A',
                    companyLogo: j.company?.logoUrl || j.company?.logo || 'https://via.placeholder.com/40',
                    applicantsCount: j.currentApplicationCount ?? j.applicants?.length ?? 0,
                    expiryDate: j.applicationDeadline || new Date().toISOString()
                }));
                setJobs(adaptedJobs);
            })
            .catch(err => addToast('Failed to load jobs.', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const filteredJobs = useMemo(() => {
        if (activeTab === 'all') return jobs;
        return jobs.filter(job => job.status === activeTab);
    }, [jobs, activeTab]);

    const tabs: { id: JobStatus, label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending Review' },
        { id: 'active', label: 'Active' },
        { id: 'paused', label: 'Paused' },
        { id: 'expired', label: 'Expired' },
        { id: 'closed', label: 'Closed' },
        { id: 'rejected', label: 'Rejected' },
    ];

    const jobCounts = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            (acc as any).all = ((acc as any).all || 0) + 1;
            return acc;
        }, {} as Record<JobStatus, number>);
    }, [jobs]);

    const handleStatusChange = async (jobId: string, status: AdminJob['status'], message: string) => {
        const originalJobs = [...jobs];
        setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status } : job));

        try {
            await adminUpdateJob(jobId, { status });
            addToast(message, status === 'rejected' ? 'error' : 'success');
        } catch (err) {
            addToast('Failed to update job status.', 'error');
            setJobs(originalJobs); // Revert on failure
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark-text">Job Management</h1>
                <Link to="/jobs/new" className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Create Job
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-sm transition-colors ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-light-text hover:text-dark-text'
                                    }`}
                            >
                                {tab.label}
                                <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10' : 'bg-gray-100'}`}>
                                    {jobCounts[tab.id] || 0}
                                </span>
                            </button>
                        ))}
                    </nav>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-light-text">Loading jobs...</div>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Job / Company</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Dates</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Applicants</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredJobs.map((job) => {
                                    const statusInfo = statusConfig[job.status];
                                    return (
                                        <tr key={job.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <img className="h-10 w-10 rounded-lg object-contain" src={(job as any).companyLogo} alt={`${(job as any).companyName} logo`} />
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-dark-text">{job.title}</div>
                                                        <div className="text-sm text-light-text">{(job as any).companyName}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                <div>Posted: {new Date(job.postedDate).toLocaleDateString()}</div>
                                                <div>Expires: {new Date((job as any).expiryDate).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text font-semibold">{(job as any).applicantsCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.text}`}>
                                                    {statusInfo.icon} {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Link to={`/jobs/${job.id}`} className="p-2 text-light-text hover:text-primary rounded-md hover:bg-light" title="View Details"><EyeIcon className="w-5 h-5" /></Link>
                                                    {job.status === 'pending' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(job.id, 'active', `Job "${job.title}" approved.`)} className="p-2 text-accent-green hover:bg-accent-green/10 rounded-md" title="Approve"><CheckCircleIcon className="w-5 h-5" /></button>
                                                            <button onClick={() => handleStatusChange(job.id, 'rejected', `Job "${job.title}" rejected.`)} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Reject"><BanIcon className="w-5 h-5" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                {filteredJobs.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-light-text">
                        <p>No jobs found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobManagementPage;
