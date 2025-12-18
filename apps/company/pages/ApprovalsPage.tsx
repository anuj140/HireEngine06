import React, { useEffect, useState, useMemo } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { Job } from '../../../packages/types';
// DO: Add comment above each fix.
// FIX: `fetchPendingJobs` was not exported from `packages/api-client`.
import { approveJob, rejectJob, fetchPendingJobs } from '../../../packages/api-client';
import { useToast } from '../hooks/useToast';
import { Link } from 'react-router-dom';
import { CheckBadgeIcon } from '../components/Icons';

const ApprovalJobCard: React.FC<{
    job: Job;
    onApprove: (jobId: string) => void;
    onReject: (jobId: string) => void;
}> = ({ job, onApprove, onReject }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-dark-gray">{job.title}</h3>
                    <p className="text-sm text-gray-500">
                        Posted by: <span className="font-semibold">{job.postedBy || 'Unknown'}</span> on {new Date(job.postedDate).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                    <button
                        onClick={() => onReject(job.id)}
                        className="px-4 py-2 text-sm font-semibold border border-red-500 text-red-500 rounded-full hover:bg-red-50 transition-colors"
                    >
                        Reject
                    </button>
                    <button
                        onClick={() => onApprove(job.id)}
                        className="px-4 py-2 text-sm font-semibold bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
                    >
                        Approve
                    </button>
                </div>
            </div>
             <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                 <div className="mt-3 flex flex-wrap gap-2">
                    {job.skills.slice(0, 5).map(skill => (
                        <span key={skill} className="bg-blue-100 text-primary text-xs font-medium px-2 py-1 rounded-full">{skill}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ApprovalsPage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Approvals' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    const loadPendingJobs = () => {
        setIsLoading(true);
        fetchPendingJobs()
            .then(data => setPendingJobs(data))
            .catch(err => addToast(err.message, 'error'))
            .finally(() => setIsLoading(false));
    };
    
    useEffect(() => {
        loadPendingJobs();
    }, [addToast]);
    
    const handleApprove = async (jobId: string) => {
        try {
            await approveJob(jobId);
            const approvedJob = pendingJobs.find(j => j.id === jobId);
            addToast(`Job "${approvedJob?.title}" has been approved and is now active.`);
            loadPendingJobs(); // Refresh list
        } catch(e: any) {
            addToast(e.message, 'error');
        }
    };

    const handleReject = async (jobId: string) => {
        const reason = prompt("Please provide a reason for rejection (this will be sent to the HR Manager):");
        if (reason && reason.trim()) {
            try {
                await rejectJob(jobId, reason);
                const rejectedJob = pendingJobs.find(j => j.id === jobId);
                addToast(`Job "${rejectedJob?.title}" has been rejected.`, 'info');
                loadPendingJobs(); // Refresh list
            } catch (e: any) {
                addToast(e.message, 'error');
            }
        } else if (reason !== null) { // Handle case where user clicks OK with no text
            addToast('A reason is required to reject a job post.', 'info');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-gray">Job Post Approvals</h1>
                <div className="text-sm font-semibold text-gray-600">
                    <span className="font-bold text-primary">{pendingJobs.length}</span> jobs waiting for your review
                </div>
            </div>

            {isLoading ? (
                <p>Loading pending jobs...</p>
            ) : pendingJobs.length > 0 ? (
                <div className="space-y-4">
                    {pendingJobs.map(job => (
                        <ApprovalJobCard
                            key={job.id}
                            job={job}
                            onApprove={handleApprove}
                            onReject={handleReject}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                    <CheckBadgeIcon className="w-16 h-16 mx-auto text-green-400" />
                    <h2 className="text-xl font-semibold mt-4">All caught up!</h2>
                    <p className="text-gray-600 mt-2">There are no pending job posts to review at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default ApprovalsPage;