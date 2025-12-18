import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../../../../packages/types';
// DO: Add comment above each fix.
// FIX: `RECRUITER_POSTED_JOBS` is now exported from the api-client/cms-data file, not the main api-client index.
import { RECRUITER_POSTED_JOBS } from '../../../../packages/api-client/cms-data';
import { PlusCircleIcon, PencilIcon, DocumentDuplicateIcon, EyeIcon } from '../../components/Icons';
import { useBreadcrumbs } from '../../contexts/BreadcrumbContext';

type JobStatus = 'active' | 'paused' | 'closed' | 'expired' | 'pending' | 'rejected';

const statusStyles: { [key in JobStatus]: string } = {
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-gray-200 text-gray-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-orange-100 text-orange-800',
    rejected: 'bg-red-100 text-red-800',
};


const JobsManagementPage: React.FC = () => {
    const [jobs, setJobs] = useState<Job[]>(RECRUITER_POSTED_JOBS);
    const [activeTab, setActiveTab] = useState<JobStatus | 'all'>('all');
    const { setCrumbs } = useBreadcrumbs();

    useEffect(() => {
        setCrumbs([
          { name: 'Dashboard', path: '/recruiter' },
          { name: 'Jobs' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    const filteredJobs = useMemo(() => {
        if (activeTab === 'all') return jobs;
        return jobs.filter(job => job.status === activeTab);
    }, [jobs, activeTab]);
    
    const jobCounts = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            acc.all = (acc.all || 0) + 1;
            return acc;
        }, {} as Record<JobStatus | 'all', number>);
    }, [jobs]);

    const tabs: { id: JobStatus | 'all', label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'pending', label: 'Pending' },
        { id: 'paused', label: 'Paused' },
        { id: 'closed', label: 'Closed' },
        { id: 'expired', label: 'Expired' },
        { id: 'rejected', label: 'Rejected' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-gray">Jobs Management</h1>
                <Link to="/recruiter/post-job" className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                    Post New Job
                </Link>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`${
                                    activeTab === tab.id
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
                
                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Job Title</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Posted / Expiry</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stats</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredJobs.map((job) => (
                                <tr key={job.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-semibold text-dark-gray">{job.title}</div>
                                        <div className="text-sm text-gray-500">{job.location}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>Posted: {job.postedDate}</div>
                                        <div>Expiry: {new Date(job.applicationDeadline).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div><span className="font-semibold text-dark-gray">{job.views}</span> Views</div>
                                        <div><span className="font-semibold text-dark-gray">{job.applicants}</span> Applicants</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[job.status]}`}>
                                            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex items-center space-x-3">
                                            <Link to={`/recruiter/job/${job.id}/applicants`} className="text-primary hover:text-primary-dark" title="View Applicants">
                                                <EyeIcon className="w-5 h-5"/>
                                            </Link>
                                            <button className="text-gray-500 hover:text-primary-dark" title="Edit Job">
                                                <PencilIcon className="w-5 h-5"/>
                                            </button>
                                            <button className="text-gray-500 hover:text-primary-dark" title="Duplicate Job">
                                                <DocumentDuplicateIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                 {filteredJobs.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No jobs found in this category.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsManagementPage;