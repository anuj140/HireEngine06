
import React, { useState, useEffect } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import {
    BriefcaseIcon,
    UsersIcon,
    CheckCircleIcon,
    CalendarIcon,
} from '../components/Icons';
import { fetchRecruiterAnalytics, fetchRecruiterJobs, fetchAllApplicants } from '../../../packages/api-client';
import { useToast } from '../hooks/useToast';


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-dark-light-background p-6 rounded-xl shadow-sm border dark:border-dark-border flex items-start space-x-4">
        <div className={`${color} p-3 rounded-lg`}>
            {icon}
        </div>
        <div>
            <p className="text-3xl font-bold text-dark-gray dark:text-dark-text">{value}</p>
            <h3 className="text-sm text-gray-600 dark:text-dark-text-secondary mt-1">{title}</h3>
        </div>
    </div>
);

const ChartCard: React.FC<{ title: string; children: React.ReactNode; height?: string }> = ({ title, children, height = 'h-[400px]' }) => (
    <div className={`bg-white dark:bg-dark-light-background p-6 rounded-xl shadow-sm border dark:border-dark-border ${height} flex flex-col`}>
        <h3 className="text-lg font-bold text-dark-gray dark:text-dark-text mb-4">{title}</h3>
        <div className="flex-grow">{children}</div>
    </div>
);

const COLORS = ['#4A90E2', '#50C878', '#FFB347', '#FF6B6B', '#9B59B6'];

const AnalyticsPage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [analyticsData, setAnalyticsData] = useState<any | null>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [applicants, setApplicants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Analytics' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([
            fetchRecruiterAnalytics(),
            fetchRecruiterJobs(),
            fetchAllApplicants()
        ])
            .then(([analytics, jobsData, applicantsData]) => {
                console.log("Analytics Response:", analytics);
                if (analytics.success && analytics.analytics) {
                    setAnalyticsData(analytics.analytics);
                }
                setJobs(jobsData);
                setApplicants(applicantsData);
            })
            .catch(err => {
                console.error("Analytics Error:", err);
                addToast('Failed to load analytics data.', 'error');
            })
            .finally(() => setIsLoading(false));
    }, [addToast]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[80vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!analyticsData) {
        return (
            <div className="text-center p-10">
                <p className="text-red-500 text-lg">Could not load analytics data.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                    Retry
                </button>
            </div>
        );
    }

    // Process data for charts
    const statusDistribution = [
        { name: 'New', value: applicants.filter(a => a.status === 'New').length },
        { name: 'Reviewed', value: applicants.filter(a => a.status === 'Reviewed').length },
        { name: 'Shortlisted', value: applicants.filter(a => a.status === 'Shortlisted').length },
        { name: 'Interview Scheduled', value: applicants.filter(a => a.status === 'Interview Scheduled').length },
        { name: 'Hired', value: applicants.filter(a => a.status === 'Hired').length },
        { name: 'Rejected', value: applicants.filter(a => a.status === 'Rejected').length },
    ].filter(item => item.value > 0);

    // Job performance data
    const jobPerformanceData = jobs.slice(0, 10).map(job => {
        const jobApplicants = applicants.filter(a => a.jobId === job.id);
        return {
            name: job.title.length > 20 ? job.title.substring(0, 20) + '...' : job.title,
            applications: jobApplicants.length,
            shortlisted: jobApplicants.filter(a => a.status === 'Shortlisted').length,
        };
    }).sort((a, b) => b.applications - a.applications);

    // Applications over time (last 30 days)
    const getLast30Days = () => {
        const days = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
                applications: applicants.filter(a => {
                    const appDate = new Date(a.applicationDate);
                    return appDate.toDateString() === date.toDateString();
                }).length
            });
        }
        return days;
    };

    const timelineData = getLast30Days();

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark-gray dark:text-dark-text">Recruitment Analytics</h1>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Jobs Posted"
                    value={analyticsData.totalPostedJobs}
                    icon={<BriefcaseIcon className="w-6 h-6 text-white" />}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Active Jobs"
                    value={analyticsData.activeJobs}
                    icon={<CheckCircleIcon className="w-6 h-6 text-white" />}
                    color="bg-green-500"
                />
                <StatCard
                    title="Total Applicants"
                    value={analyticsData.totalApplicants}
                    icon={<UsersIcon className="w-6 h-6 text-white" />}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Interviews Scheduled"
                    value={analyticsData.interviewApplicants}
                    icon={<CalendarIcon className="w-6 h-6 text-white" />}
                    color="bg-purple-500"
                />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Job Performance Chart */}
                <ChartCard title="Top Performing Jobs">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={jobPerformanceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="applications" fill="#4A90E2" name="Applications" />
                            <Bar dataKey="shortlisted" fill="#50C878" name="Shortlisted" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Application Status Distribution */}
                <ChartCard title="Application Status Distribution">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={120}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Applications Timeline */}
                <ChartCard title="Applications Over Last 30 Days" height="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="applications" stroke="#4A90E2" strokeWidth={2} name="Applications" />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Conversion Funnel */}
                <ChartCard title="Recruitment Funnel">
                    <div className="flex flex-col justify-center h-full space-y-4 px-4">
                        {[
                            { label: 'Total Applications', value: analyticsData.totalApplicants, width: 100, color: 'bg-blue-500' },
                            { label: 'Shortlisted', value: analyticsData.shortlistedApplicants, width: analyticsData.totalApplicants > 0 ? (analyticsData.shortlistedApplicants / analyticsData.totalApplicants) * 100 : 0, color: 'bg-green-500' },
                            { label: 'Interviews', value: analyticsData.interviewApplicants, width: analyticsData.totalApplicants > 0 ? (analyticsData.interviewApplicants / analyticsData.totalApplicants) * 100 : 0, color: 'bg-yellow-500' },
                            { label: 'Hired', value: applicants.filter(a => a.status === 'Hired').length, width: analyticsData.totalApplicants > 0 ? (applicants.filter(a => a.status === 'Hired').length / analyticsData.totalApplicants) * 100 : 0, color: 'bg-purple-500' },
                        ].map((stage, index) => (
                            <div key={index} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-semibold text-dark-gray dark:text-dark-text">{stage.label}</span>
                                    <span className="text-gray-600 dark:text-dark-text-secondary">{stage.value} ({stage.width.toFixed(0)}%)</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8">
                                    <div
                                        className={`${stage.color} h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all duration-500`}
                                        style={{ width: `${stage.width}%` }}
                                    >
                                        {stage.width > 15 && `${stage.value}`}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </ChartCard>
            </div>
        </div>
    );
};

export default AnalyticsPage;