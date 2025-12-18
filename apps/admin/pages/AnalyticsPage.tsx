import React, { useState, useEffect } from 'react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    LineChart, Line, PieChart, Pie, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';
import StatCard from '../components/StatCard';
import {
    UserGroupIcon, BuildingOfficeIcon, BriefcaseIcon, DocumentTextIcon,
    ClockIcon, CurrencyDollarIcon
} from '../components/Icons';
import ChartCard from '../components/ChartCard';
import { Link } from 'react-router-dom';
import { fetchAnalyticsData } from '../services/api';

type TimeFilterLabel = 'Day' | 'Week' | 'Month' | 'Year' | 'All' | 'Custom';

const filterMapping: Record<TimeFilterLabel, string> = {
    'Day': 'day',
    'Week': 'week',
    'Month': 'month',
    'Year': 'year',
    'All': 'all',
    'Custom': 'custom',
};
const filterLabels = Object.keys(filterMapping) as TimeFilterLabel[];

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
);

const AnalyticsPage: React.FC = () => {
    const [data, setData] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState<TimeFilterLabel>('All');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    useEffect(() => {
        const fetchData = async () => {
            if (activeFilter === 'Custom' && (!customDates.start || !customDates.end)) {
                return; // Wait for dates
            }

            setIsLoading(true);
            try {
                const result = await fetchAnalyticsData(
                    filterMapping[activeFilter],
                    activeFilter === 'Custom' ? customDates.start : undefined,
                    activeFilter === 'Custom' ? customDates.end : undefined
                );
                setData(result);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [activeFilter, customDates]);

    const PIE_COLORS = ['#4b2fdb', '#f9ab00', '#34a853', '#dc2626'];

    return (
        <div className="space-y-8">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-dark-text">Platform Analytics</h1>
                    <p className="text-light-text mt-1">An overview of user engagement, job market trends, and platform health.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                    {filterLabels.map(period => (
                        <button key={period} onClick={() => setActiveFilter(period)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeFilter === period ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                            {period}
                        </button>
                    ))}

                    {activeFilter === 'Custom' && (
                        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={customDates.start}
                                onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <span className="text-gray-400">-</span>
                            <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
                                value={customDates.end}
                                onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    )}
                </div>
            </div>

            <section>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {isLoading || !data ? (
                        [...Array(6)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl shadow-sm p-6 animate-pulse"><div className="h-6 w-3/4 bg-gray-200 rounded"></div></div>)
                    ) : (
                        <>
                            <StatCard icon={<UserGroupIcon className="w-6 h-6 text-primary" />} title="Total Users" value={data.kpis.totalUsers.toLocaleString()} />
                            <StatCard icon={<BuildingOfficeIcon className="w-6 h-6 text-primary" />} title="Total Companies" value={data.kpis.totalCompanies.toLocaleString()} />
                            <StatCard icon={<BriefcaseIcon className="w-6 h-6 text-primary" />} title="Active Jobs" value={data.kpis.activeJobs.toLocaleString()} />
                            <StatCard icon={<DocumentTextIcon className="w-6 h-6 text-primary" />} title={`Applications`} value={data.kpis.totalApplications.toLocaleString()} />
                            <StatCard icon={<ClockIcon className="w-6 h-6 text-primary" />} title={`Pending Approvals`} value={data.kpis.pendingJobs.toLocaleString()} />
                            <StatCard icon={<CurrencyDollarIcon className="w-6 h-6 text-primary" />} title={`Revenue`} value={`₹${data.kpis.revenue.toLocaleString()}`} />
                        </>
                    )}
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-dark-text">User Growth & Engagement</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <ChartCard title="New User Signups & Jobs Posted">
                            {isLoading || !data ? <LoadingSpinner /> : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={data.timeSeriesData} margin={{ top: 5, right: 30, left: 20, bottom: 5, }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="userSignups" name="New Users" stroke="#4b2fdb" strokeWidth={2} />
                                        <Line type="monotone" dataKey="jobsPosted" name="Jobs Posted" stroke="#34a853" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>
                    <ChartCard title="User Role Distribution">
                        {isLoading || !data ? <LoadingSpinner /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={data.userRoleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                                        {data.userRoleData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                </div>
            </section>

            <section className="space-y-6">
                <h2 className="text-xl font-bold text-dark-text">Job & Company Analytics</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <ChartCard title="Top Industries by Job Postings">
                        {isLoading || !data ? <LoadingSpinner /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.industryData} layout="vertical" margin={{ left: 100, right: 30 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                                    <Tooltip />
                                    <Bar dataKey="value" name="Job Posts" fill="#34a853" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <ChartCard title="Recruitment Funnel">
                        {isLoading || !data ? <LoadingSpinner /> : (
                            <ResponsiveContainer width="100%" height="100%">
                                <FunnelChart>
                                    <Tooltip />
                                    <Funnel dataKey="value" data={data.pipelineData} isAnimationActive>
                                        <LabelList position="right" fill="#000" stroke="none" dataKey="name" formatter={(value: string) => value} />
                                        <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
                                    </Funnel>
                                </FunnelChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>
                    <div className="lg:col-span-2 xl:col-span-1">
                        <ChartCard title="Top Hiring Companies">
                            {isLoading || !data ? <LoadingSpinner /> : (
                                <div className="space-y-3 overflow-y-auto h-full pr-2 custom-scrollbar">
                                    {data.topCompanies.map((company: any) => (
                                        <div key={company.id} className="flex items-center gap-4 p-2 bg-light rounded-lg">
                                            <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-lg" />
                                            <div>
                                                <Link to={`/companies/${company.id}`} className="font-semibold text-sm hover:underline">{company.name}</Link>
                                                <p className="text-xs text-light-text">{company.activeJobs} active jobs, {company.applications} applications</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ChartCard>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default AnalyticsPage;
