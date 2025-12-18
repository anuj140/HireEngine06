
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RecruiterDashboardChart from '../components/RecruiterDashboardChart';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { Job, Applicant } from '../../../packages/types';
import { fetchRecruiterJobs, fetchAllApplicants, updateJobStatus } from '../../../packages/api-client';
import { BriefcaseIcon, UsersIcon, CheckCircleIcon, CalendarIcon, DocumentTextIcon, BellIcon } from '../components/Icons';
import RecruiterJobCard from '../components/RecruiterJobCard';
import { addNotification } from '../services/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useToast } from '../hooks/useToast';


const DashboardStatCard: React.FC<{ title: string, value: string, icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-black text-white p-4 rounded-2xl shadow-sm flex items-center space-x-4 h-full border border-gray-700">
        <div className="bg-blue-100 dark:bg-primary/20 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-2xl font-bold">{value}</p>
            <h4 className="text-sm">{title}</h4>
        </div>
    </div>
);

const timeAgo = (isoDate: string) => {
    const date = new Date(isoDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "mo ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return "just now";
};

const DashboardPage: React.FC = () => {
    const { user, isAuthLoading } = useCompanyAuth();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');
    const [candidateFilters, setCandidateFilters] = useState({
        skills: '',
        location: '',
        minExperience: '',
        maxExperience: '',
    });

    const notifications = useNotifications();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();

    useEffect(() => {
        setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        if (isAuthLoading || !user) {
            return;
        }

        setIsDataLoading(true);
        Promise.all([
            fetchRecruiterJobs(),
            fetchAllApplicants()
        ]).then(([jobsData, applicantsData]) => {
            setJobs(jobsData);
            setApplicants(applicantsData);

            const today = new Date();
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(today.getDate() + 7);

            jobsData.forEach(job => {
                if (job.applicationDeadline && job.status === 'active') {
                    const deadline = new Date(job.applicationDeadline);
                    if (deadline > today && deadline <= sevenDaysFromNow) {
                        const formattedDeadline = deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        addNotification(user.id, {
                            id: `expiry-${job.id}`,
                            message: `The job "<b>${job.title}</b>" is expiring soon on ${formattedDeadline}.`,
                            link: `/dashboard/applicants/job/${job.id}`,
                            type: 'job_expiry'
                        });
                    }
                }
            });
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            setIsDataLoading(false);
        });
    }, [user, isAuthLoading]);

    const popularJobRoles = useMemo(() => {
        const counts: { [key: string]: number } = {};
        for (const applicant of applicants) {
            counts[applicant.jobTitle] = (counts[applicant.jobTitle] || 0) + 1;
        }

        const sortedRoles = Object.entries(counts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 5); // Take top 5

        const maxCount = sortedRoles.length > 0 ? sortedRoles[0][1] : 0;

        return sortedRoles.map(([title, count]) => ({
            title,
            count,
            percentage: maxCount > 0 ? (count / maxCount) * 100 : 0,
        }));
    }, [applicants]);

    const newApplicants = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return applicants.filter(applicant => {
            const appDate = new Date(applicant.applicationDate);
            if (isNaN(appDate.getTime())) return false; // Invalid date

            switch (timeFilter) {
                case 'today':
                    return appDate.getFullYear() === today.getFullYear() &&
                        appDate.getMonth() === today.getMonth() &&
                        appDate.getDate() === today.getDate();
                case 'week':
                    const oneWeekAgo = new Date(today);
                    oneWeekAgo.setDate(today.getDate() - 7);
                    return appDate >= oneWeekAgo;
                case 'month':
                    const oneMonthAgo = new Date(today);
                    oneMonthAgo.setMonth(today.getMonth() - 1);
                    return appDate >= oneMonthAgo;
                default:
                    return true;
            }
        }).sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime());
    }, [timeFilter, applicants]);

    const systemAlerts = useMemo(() => {
        if (!notifications) return [];
        return notifications.notifications.filter(n => n.type === 'job_expiry' || n.type === 'general');
    }, [notifications]);

    const handleJobAction = async (action: 'pause' | 'resume' | 'close' | 'edit' | 'duplicate', jobId: string) => {
        if (action === 'edit') {
            navigate(`/dashboard/edit-job/${jobId}`);
            return;
        }
        if (action === 'duplicate') {
            addToast(`Action '${action}' is not implemented yet.`, 'info');
            return;
        }

        const newStatus = action === 'pause' ? 'paused' : action === 'resume' ? 'active' : 'closed';
        const originalJobs = [...jobs];

        // Optimistic update
        setJobs(prevJobs =>
            prevJobs.map(job => job.id === jobId ? { ...job, status: newStatus } : job)
        );

        try {
            await updateJobStatus(jobId, newStatus);
            addToast(`Job status updated to ${newStatus}.`, 'success');
        } catch (error: any) {
            setJobs(originalJobs); // Rollback on error
            addToast(`Failed to update job status: ${error.message}`, 'error');
        }
    };

    const handleCandidateSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const query = new URLSearchParams();
        if (candidateFilters.skills) query.set('skills', candidateFilters.skills);
        if (candidateFilters.location) query.set('location', candidateFilters.location);
        if (candidateFilters.minExperience) query.set('minExperience', candidateFilters.minExperience);
        if (candidateFilters.maxExperience) query.set('maxExperience', candidateFilters.maxExperience);
        navigate(`/dashboard/applicants?${query.toString()}`);
    };

    if (isAuthLoading || isDataLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        // Render nothing while the redirect is happening from ProtectedRoute
        return null;
    }

    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const totalApplicants = applicants.length;
    const shortlisted = applicants.filter(a => a.status === 'Shortlisted').length;
    const interviews = applicants.filter(a => a.status === 'Interview Scheduled').length;

    const TimeFilterButton: React.FC<{ period: 'today' | 'week' | 'month', label: string }> = ({ period, label }) => {
        const isActive = timeFilter === period;
        return (
            <button
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-dark-text-secondary hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
                {label}
            </button>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark-gray dark:text-dark-text">Dashboard</h1>
                <Link to="/dashboard/post-job" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-semibold">
                    Post a New Job
                </Link>
            </div>

            {/* Dashboard Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <DashboardStatCard title="Total Jobs Posted" value={jobs.length.toString()} icon={<BriefcaseIcon className="w-6 h-6 text-primary" />} />
                <DashboardStatCard title="Active Jobs" value={activeJobs.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-green-500" />} />
                <Link to="/dashboard/applicants" className="block hover:shadow-lg rounded-2xl transition-shadow">
                    <DashboardStatCard title="Total Applicants" value={totalApplicants.toString()} icon={<UsersIcon className="w-6 h-6 text-yellow-500" />} />
                </Link>
                <Link to="/dashboard/shortlisted" className="block hover:shadow-lg rounded-2xl transition-shadow">
                    <DashboardStatCard title="Shortlisted" value={shortlisted.toString()} icon={<DocumentTextIcon className="w-6 h-6 text-purple-500" />} />
                </Link>
                <DashboardStatCard title="Interviews" value={interviews.toString()} icon={<CalendarIcon className="w-6 h-6 text-red-500" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div>
                        <h3 className="text-xl font-bold text-dark-gray dark:text-dark-text mb-4">Job Management</h3>
                        <div className="space-y-4">
                            {isDataLoading ? <p>Loading jobs...</p> : (
                                jobs.slice(0, 3).map(job => (
                                    <RecruiterJobCard
                                        key={job.id}
                                        job={job}
                                        onAction={handleJobAction}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-bold text-dark-gray dark:text-dark-text mb-4">Alerts</h3>
                        <div className="bg-white dark:bg-dark-light-background p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border">
                            {systemAlerts.length > 0 ? (
                                <div className="max-h-96 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {systemAlerts.map(alert => (
                                        <Link to={alert.link} key={alert.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                                <BellIcon className="w-5 h-5 text-yellow-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-dark-gray dark:text-dark-text" dangerouslySetInnerHTML={{ __html: alert.message }} />
                                                <p className="text-xs text-gray-500 dark:text-dark-text-secondary mt-1">{timeAgo(alert.timestamp)}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-500 dark:text-dark-text-secondary">
                                    <p>No system alerts at the moment.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-dark-gray dark:text-dark-text">New Applications</h3>
                            <Link to="/dashboard/applicants" className="text-sm font-semibold text-primary hover:underline">
                                View All
                            </Link>
                        </div>
                        <div className="bg-white dark:bg-dark-light-background p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-dark-border">
                            <div className="flex items-center space-x-2 border-b dark:border-dark-border pb-3 mb-3">
                                <TimeFilterButton period="today" label="Today" />
                                <TimeFilterButton period="week" label="This Week" />
                                <TimeFilterButton period="month" label="This Month" />
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                {newApplicants.length > 0 ? (
                                    newApplicants.map(applicant => (
                                        <Link to={`/dashboard/applicants/job/${applicant.jobId}`} key={applicant.applicationId} className="flex items-center space-x-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                                {applicant.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-dark-gray dark:text-dark-text truncate">{applicant.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-dark-text-secondary truncate">Applied for: {applicant.jobTitle}</p>
                                            </div>
                                            <div className="text-right text-xs text-gray-500 dark:text-dark-text-secondary flex-shrink-0">
                                                <p>{new Date(applicant.applicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="text-center py-10 text-gray-500 dark:text-dark-text-secondary">
                                        <p>No new applications in this period.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="sticky top-24 space-y-8">
                    <RecruiterDashboardChart />
                    <div className="bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md border dark:border-dark-border">
                        <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text mb-4">Popular Job Roles</h3>
                        <div className="space-y-4">
                            {popularJobRoles.map(role => (
                                <div key={role.title}>
                                    <div className="flex justify-between items-center mb-1 text-sm">
                                        <span className="font-semibold text-dark-gray dark:text-dark-text">{role.title}</span>
                                        <span className="text-gray-600 dark:text-dark-text-secondary">{role.count} Applicants</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-secondary h-2 rounded-full"
                                            style={{ width: `${role.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-dark-light-background p-6 rounded-2xl shadow-md border dark:border-dark-border">
                        <h3 className="text-lg font-semibold text-dark-gray dark:text-dark-text mb-4">Find Candidates</h3>
                        <form onSubmit={handleCandidateSearch} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Skills, keywords</label>
                                <input
                                    type="text"
                                    value={candidateFilters.skills}
                                    onChange={(e) => setCandidateFilters(prev => ({ ...prev, skills: e.target.value }))}
                                    placeholder="e.g. Java, Python"
                                    className="mt-1 w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Location</label>
                                <input
                                    type="text"
                                    value={candidateFilters.location}
                                    onChange={(e) => setCandidateFilters(prev => ({ ...prev, location: e.target.value }))}
                                    placeholder="e.g. Pune"
                                    className="mt-1 w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-dark-text-secondary">Experience (years)</label>
                                <div className="flex items-center space-x-2 mt-1">
                                    <input
                                        type="number"
                                        value={candidateFilters.minExperience}
                                        min="0"
                                        onChange={(e) => setCandidateFilters(prev => ({ ...prev, minExperience: e.target.value }))}
                                        placeholder="Min"
                                        className="w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700"
                                    />
                                    <span className="text-gray-500 dark:text-dark-text-secondary">-</span>
                                    <input
                                        type="number"
                                        value={candidateFilters.maxExperience}
                                        min="0"
                                        onChange={(e) => setCandidateFilters(prev => ({ ...prev, maxExperience: e.target.value }))}
                                        placeholder="Max"
                                        className="w-full border border-gray-300 dark:border-dark-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary bg-white dark:bg-gray-700"
                                    />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-secondary text-white font-semibold py-2.5 rounded-lg hover:opacity-90 transition-opacity">
                                Search
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
