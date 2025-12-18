
import React, { useState, useEffect, useMemo } from 'react';
// DO: Add comment above each fix.
// FIX: Using named imports for react-router-dom to resolve module errors.
import { Link, useNavigate } from 'react-router-dom';
import RecruiterDashboardChart from '../components/RecruiterDashboardChart';
import { useAuth } from '../hooks/useAuth';
import { Job, Applicant } from '../../../packages/types';
import { fetchRecruiterJobs, updateJobStatus } from '../../../packages/api-client';
// DO: Add comment above each fix.
// FIX: `ALL_RECRUITER_APPLICANTS` is now exported from the api-client/cms-data file.
import { ALL_RECRUITER_APPLICANTS } from '../../../packages/api-client/cms-data';
import { BriefcaseIcon, UsersIcon, CheckCircleIcon, CalendarIcon, DocumentTextIcon, BellIcon } from '../components/Icons';
import RecruiterJobCard from '../components/RecruiterJobCard';
import { addNotification } from '../services/notificationService';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';

const DashboardStatCard: React.FC<{title: string, value: string, icon: React.ReactNode}> = ({title, value, icon}) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm flex items-center space-x-4 h-full">
        <div className="bg-blue-100 p-3 rounded-full">{icon}</div>
        <div>
            <p className="text-2xl font-bold text-dark-gray">{value}</p>
            <h4 className="text-sm text-gray-600">{title}</h4>
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

const RecruiterDashboardPage: React.FC = () => {
  const { user, isAuthLoading } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('week');
  const [candidateFilters, setCandidateFilters] = useState({
    skills: '',
    location: '',
    minExperience: '',
    maxExperience: '',
  });

  const notifications = useNotifications();

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for authentication check to complete
    }

    if (!user || user.role !== 'Recruiter') {
      navigate('/login');
    } else {
      setIsJobsLoading(true);
      // DO: Add comment above each fix.
      // FIX: The `fetchRecruiterJobs` function no longer takes arguments; the user context is derived from the auth token in the API call.
      fetchRecruiterJobs()
        .then(data => {
          setJobs(data);
          // Check for expiring jobs and create notifications
          const today = new Date();
          const sevenDaysFromNow = new Date();
          sevenDaysFromNow.setDate(today.getDate() + 7);

          data.forEach(job => {
            if (job.applicationDeadline && job.status === 'active') {
              const deadline = new Date(job.applicationDeadline);
              if (deadline > today && deadline <= sevenDaysFromNow) {
                const formattedDeadline = deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                addNotification(user.id, {
                  id: `expiry-${job.id}`,
                  message: `The job "<b>${job.title}</b>" is expiring soon on ${formattedDeadline}.`,
                  link: `/recruiter/job/${job.id}/applicants`,
                  type: 'job_expiry'
                });
              }
            }
          });
          setIsJobsLoading(false);
        })
        .catch(err => {
          console.error(err);
          setIsJobsLoading(false);
        });
    }
  }, [user, isAuthLoading, navigate]);
  
  const popularJobRoles = useMemo(() => {
    const counts: { [key: string]: number } = {};
    for (const applicant of ALL_RECRUITER_APPLICANTS) {
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
  }, []);
  
  const newApplicants = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return ALL_RECRUITER_APPLICANTS.filter(applicant => {
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
  }, [timeFilter]);

  const systemAlerts = useMemo(() => {
    if (!notifications) return [];
    return notifications.notifications.filter(n => n.type === 'job_expiry' || n.type === 'general');
  }, [notifications]);

  const handleJobAction = async (action: 'pause' | 'resume' | 'close' | 'edit' | 'duplicate', jobId: string) => {
    if (action === 'edit' || action === 'duplicate') {
      addToast(`Action '${action}' triggered for job ${jobId}. Implementation pending.`, 'info');
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
        addToast(`Job status successfully updated to ${newStatus}.`, 'success');
    } catch (error: any) {
        addToast(`Failed to update job status: ${error.message}`, 'error');
        setJobs(originalJobs); // Rollback on error
    }
  };

  const handleCandidateSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (candidateFilters.skills) query.set('skills', candidateFilters.skills);
    if (candidateFilters.location) query.set('location', candidateFilters.location);
    if (candidateFilters.minExperience) query.set('minExperience', candidateFilters.minExperience);
    if (candidateFilters.maxExperience) query.set('maxExperience', candidateFilters.maxExperience);
    navigate(`/recruiter/applicants?${query.toString()}`);
  };

  if (isAuthLoading || (user && isJobsLoading)) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'Recruiter') {
    // Render nothing while the redirect is happening
    return null;
  }

  const activeJobs = jobs.filter(j => j.status === 'active').length;
  const totalApplicants = ALL_RECRUITER_APPLICANTS.length;
  const shortlisted = ALL_RECRUITER_APPLICANTS.filter(a => a.status === 'Shortlisted').length;
  const upcomingInterviews = 2; // Mock data

  const TimeFilterButton: React.FC<{period: 'today' | 'week' | 'month', label: string}> = ({ period, label }) => {
    const isActive = timeFilter === period;
    return (
        <button
            onClick={() => setTimeFilter(period)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-full transition-colors ${isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark-gray">Recruiter Dashboard</h1>
        <Link to="/recruiter/post-job" className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors font-semibold">
          Post a New Job
        </Link>
      </div>
      
      {/* Dashboard Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        <DashboardStatCard title="Total Jobs Posted" value={jobs.length.toString()} icon={<BriefcaseIcon className="w-6 h-6 text-primary"/>} />
        <DashboardStatCard title="Active Jobs" value={activeJobs.toString()} icon={<CheckCircleIcon className="w-6 h-6 text-green-500"/>} />
        <Link to="/recruiter/applicants" className="block hover:shadow-lg rounded-2xl transition-shadow">
            <DashboardStatCard title="Total Applicants" value={totalApplicants.toString()} icon={<UsersIcon className="w-6 h-6 text-yellow-500"/>} />
        </Link>
        <Link to="/recruiter/shortlisted" className="block hover:shadow-lg rounded-2xl transition-shadow">
            <DashboardStatCard title="Shortlisted" value={shortlisted.toString()} icon={<DocumentTextIcon className="w-6 h-6 text-purple-500"/>} />
        </Link>
        <DashboardStatCard title="Interviews" value={upcomingInterviews.toString()} icon={<CalendarIcon className="w-6 h-6 text-red-500"/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h3 className="text-xl font-bold text-dark-gray mb-4">Job Management</h3>
            <div className="space-y-4">
              {isJobsLoading ? <p>Loading jobs...</p> : (
                  jobs.map(job => (
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
            <h3 className="text-xl font-bold text-dark-gray mb-4">Alerts</h3>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                {systemAlerts.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                        {systemAlerts.map(alert => (
                            <Link to={alert.link} key={alert.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                                    <BellIcon className="w-5 h-5 text-yellow-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-dark-gray" dangerouslySetInnerHTML={{ __html: alert.message }} />
                                    <p className="text-xs text-gray-500 mt-1">{timeAgo(alert.timestamp)}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No system alerts at the moment.</p>
                    </div>
                )}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-dark-gray">New Applications</h3>
                <Link to="/recruiter/applicants" className="text-sm font-semibold text-primary hover:underline">
                    View All
                </Link>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex items-center space-x-2 border-b pb-3 mb-3">
                  <TimeFilterButton period="today" label="Today" />
                  <TimeFilterButton period="week" label="This Week" />
                  <TimeFilterButton period="month" label="This Month" />
              </div>
              <div className="max-h-96 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                {newApplicants.length > 0 ? (
                    newApplicants.map(applicant => (
                        <Link to={`/recruiter/job/${applicant.jobId}/applicants`} key={applicant.applicationId} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-primary flex-shrink-0">
                                {applicant.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-dark-gray truncate">{applicant.name}</p>
                                <p className="text-sm text-gray-600 truncate">Applied for: {applicant.jobTitle}</p>
                            </div>
                            <div className="text-right text-xs text-gray-500 flex-shrink-0">
                                <p>{new Date(applicant.applicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="text-center py-10 text-gray-500">
                        <p>No new applications in this period.</p>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="sticky top-24 space-y-8">
            <RecruiterDashboardChart />
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-semibold text-dark-gray mb-4">Popular Job Roles</h3>
                <div className="space-y-4">
                    {popularJobRoles.map(role => (
                        <div key={role.title}>
                            <div className="flex justify-between items-center mb-1 text-sm">
                                <span className="font-semibold text-dark-gray">{role.title}</span>
                                <span className="text-gray-600">{role.count} Applicants</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-secondary h-2 rounded-full" 
                                    style={{ width: `${role.percentage}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md">
                <h3 className="text-lg font-semibold text-dark-gray mb-4">Find Candidates</h3>
                <form onSubmit={handleCandidateSearch} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Skills, keywords</label>
                        <input
                            type="text"
                            value={candidateFilters.skills}
                            onChange={(e) => setCandidateFilters(prev => ({...prev, skills: e.target.value}))}
                            placeholder="e.g. Java, Python"
                            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Location</label>
                        <input
                            type="text"
                            value={candidateFilters.location}
                            onChange={(e) => setCandidateFilters(prev => ({...prev, location: e.target.value}))}
                            placeholder="e.g. Pune"
                            className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700">Experience (years)</label>
                        <div className="flex items-center space-x-2 mt-1">
                            <input
                                type="number"
                                value={candidateFilters.minExperience}
                                min="0"
                                onChange={(e) => setCandidateFilters(prev => ({...prev, minExperience: e.target.value}))}
                                placeholder="Min"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <span className="text-gray-500">-</span>
                            <input
                                type="number"
                                value={candidateFilters.maxExperience}
                                min="0"
                                onChange={(e) => setCandidateFilters(prev => ({...prev, maxExperience: e.target.value}))}
                                placeholder="Max"
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
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

export default RecruiterDashboardPage;
