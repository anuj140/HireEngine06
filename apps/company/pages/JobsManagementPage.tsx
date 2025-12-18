import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Job, TeamMember } from '../../../packages/types';
import { PlusCircleIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import RecruiterJobCard from '../components/RecruiterJobCard';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { useToast } from '../hooks/useToast';
import { fetchRecruiterJobs, updateJobStatus } from '../../../packages/api-client';

type JobStatus = 'active' | 'paused' | 'closed' | 'expired' | 'pending' | 'rejected';

interface JobNotesModalProps {
    job: Job | null;
    onClose: () => void;
    onAddNote: (jobId: string, note: string) => void;
}

const JobsManagementPage: React.FC = () => {
    const { user } = useCompanyAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();

    const [notesModalJob, setNotesModalJob] = useState<Job | null>(null);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Jobs' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        setIsLoading(true);
        fetchRecruiterJobs()
            .then(data => setJobs(data))
            .catch(err => addToast(err.message, 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const filteredJobs = useMemo(() => {
        if (activeTab === 'all') return jobs;
        return jobs.filter(job => job.status === activeTab);
    }, [jobs, activeTab]);

    const jobCounts = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            (acc as any).all = ((acc as any).all || 0) + 1;
            return acc;
        }, {} as Record<JobStatus | 'all', number>);
    }, [jobs]);

    const handleJobAction = async (action: 'pause' | 'resume' | 'close' | 'edit' | 'duplicate' | 'notes', jobId: string) => {
        if (action === 'notes') {
            setNotesModalJob(jobs.find(j => j.id === jobId) || null);
            return;
        }

        if (action === 'edit') {
            navigate(`/dashboard/edit-job/${jobId}`);
            return;
        }

        if (action === 'duplicate') {
            addToast(`Action '${action}' is not implemented yet.`, 'info');
            return;
        }

        try {
            const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
            await updateJobStatus(jobId, newStatus);
            setJobs(prevJobs =>
                prevJobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job)
            );
            addToast(`Job status updated to ${newStatus}.`);
        } catch (error: any) {
            addToast(`Failed to update job status: ${error.message}`, 'error');
        }
    };

    const handleAddNote = (jobId: string, noteText: string) => {
        if (!user) return;
        setJobs(prevJobs => prevJobs.map(job => {
            if (job.id === jobId) {
                const newNote = { by: user.name, role: user.role, text: noteText, date: new Date().toISOString() };
                const updatedNotes = [...(job.notes || []), newNote];
                return { ...job, notes: updatedNotes };
            }
            return job;
        }));
        setNotesModalJob(null);
        addToast('Note added successfully!');
    };

    const tabs: { id: JobStatus | 'all', label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'pending', label: 'Pending' },
        { id: 'paused', label: 'Paused' },
        { id: 'closed', label: 'Closed' },
        { id: 'expired', label: 'Expired' },
        { id: 'rejected', label: 'Rejected' },
    ];

    const canPostJob = user?.role === 'Admin' || user?.role === 'HR Manager' || user?.permissions?.canPostJobs;

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-dark-gray">Jobs Management</h1>
                    {canPostJob && (
                        <Link to="/dashboard/post-job" className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                            <PlusCircleIcon className="w-5 h-5 mr-2" />
                            Post New Job
                        </Link>
                    )}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 shadow-md flex items-center justify-between">
                    <div className="text-lg font-medium text-gray-800">
                        <span className="font-bold">{jobCounts['all'] || 0}</span> Jobs Posted
                        <span className="mx-2 text-gray-500">|</span>
                        {/* //! [Frontend] Below line incorrectly calculating (without db call) remaning jobs */}
                        <span className="font-bold">{(jobCounts['all'] || 0) < 10 ? 10 - (jobCounts['all'] || 0) : 0}</span> Jobs Remaining
                    </div>
                    <Link to="/dashboard/subscription" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-5 py-2 rounded-full hover:opacity-90 transition-opacity">Upgrade Plan</Link>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide" aria-label="Tabs">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                >
                                    {tab.label}
                                    <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                                        {jobCounts[tab.id] || 0}
                                    </span>
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-4 space-y-4">
                        {isLoading ? (
                            <div className="text-center py-12 text-gray-500">Loading jobs...</div>
                        ) : filteredJobs.length > 0 ? (
                            filteredJobs.map((job) => (
                                <RecruiterJobCard
                                    key={job.id}
                                    job={job}
                                    onAction={handleJobAction}
                                    userRole={user?.role}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <p>No jobs found in this category.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default JobsManagementPage;