import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User } from '../data/mockData';
import { CheckCircleIcon, ShieldExclamationIcon, ClockIcon, UserGroupIcon, UserPlusIcon } from '../components/Icons';
import UserFilterSidebar, { UserFilters, initialFilters } from '../components/UserFilterSidebar';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { fetchAllUsers } from '../services/api';
import { useToast } from '../hooks/useToast';

const UserManagementPage: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<UserFilters>(initialFilters);
    const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all');
    const { addToast } = useToast();

    useEffect(() => {
        setIsLoading(true);
        // Map UI filter to Backend filter
        const rangeMap: Record<string, string> = { 'week': '7d', 'month': '30d', 'year': '1y', 'all': 'all' };
        const backendRange = rangeMap[timeFilter] || 'all';

        fetchAllUsers(backendRange)
            .then((data: any) => setUsers(data.users || data)) // Adapt to backend response
            .catch(err => addToast('Failed to load users', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast, timeFilter]);

    const filteredUsers = useMemo(() => {
        // Basic filtering for demonstration
        return users.filter(user =>
            user.name.toLowerCase().includes(filters.name.toLowerCase()) &&
            user.email.toLowerCase().includes(filters.email.toLowerCase())
        );
    }, [users, filters]);

    const userAnalytics = useMemo(() => {
        // Data for stat cards (always all-time)
        const totalUsers = users.length;
        const activeUsers = users.filter(u => u.status === 'Active').length;
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        const newUsersThisMonth = users.filter(u => new Date(u.registrationDate) >= oneMonthAgo).length;

        const usersForCharts = users; // Simplified for now

        const roleDistribution = usersForCharts.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const roleData = Object.entries(roleDistribution).map(([name, value]) => ({ name, value }));

        const statusDistribution = usersForCharts.reduce((acc, user) => {
            acc[user.status] = (acc[user.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const statusData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

        return { totalUsers, activeUsers, newUsersThisMonth, roleData, statusData };
    }, [users]);

    const PIE_COLORS = ['#4b2fdb', '#f9ab00', '#34a853'];

    const StatusBadge: React.FC<{ status: User['status'] }> = ({ status }) => {
        const styles = {
            Active: 'bg-accent-green/10 text-accent-green',
            Suspended: 'bg-red-100 text-red-600',
            Pending: 'bg-yellow-100 text-yellow-600',
        };
        const icons = {
            Active: <CheckCircleIcon className="w-4 h-4" />,
            Suspended: <ShieldExclamationIcon className="w-4 h-4" />,
            Pending: <ClockIcon className="w-4 h-4" />,
        }
        return (
            <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
                {icons[status]}
                {status}
            </span>
        );
    };

    const TimeFilterButton: React.FC<{ period: 'all' | 'year' | 'month' | 'week', label: string }> = ({ period, label }) => {
        const isActive = timeFilter === period;
        return (
            <button
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${isActive ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border'}`}
            >
                {label}
            </button>
        );
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-dark-text">User Management</h1>

            {/* Analytics Section */}
            <h2 className="text-xl font-bold text-dark-text pt-4">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<UserGroupIcon className="w-6 h-6 text-primary" />} title="Total Users" value={userAnalytics.totalUsers.toLocaleString()} />
                <StatCard icon={<CheckCircleIcon className="w-6 h-6 text-primary" />} title="Active Users" value={userAnalytics.activeUsers.toLocaleString()} />
                <StatCard icon={<UserPlusIcon className="w-6 h-6 text-primary" />} title="New Users (30d)" value={userAnalytics.newUsersThisMonth.toLocaleString()} />
            </div>

            <div className="flex justify-between items-center mt-8">
                <h2 className="text-xl font-bold text-dark-text">Detailed Breakdown</h2>
                <div className="flex items-center gap-2">
                    <TimeFilterButton period="week" label="Last 7 Days" />
                    <TimeFilterButton period="month" label="Last 30 Days" />
                    <TimeFilterButton period="year" label="Last Year" />
                    <TimeFilterButton period="all" label="All Time" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="User Role Distribution">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={userAnalytics.roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label={p => `${p.name} (${p.value})`}>
                                {userAnalytics.roleData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="User Status Breakdown">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={userAnalytics.statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" fill="#4b2fdb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
                <aside className="md:col-span-1 sticky top-8">
                    <UserFilterSidebar filters={filters} onFiltersChange={setFilters} initialFilters={initialFilters} />
                </aside>
                <main className="md:col-span-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-light">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Registered</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr><td colSpan={5} className="text-center p-8">Loading users...</td></tr>
                                    ) : (
                                        filteredUsers.map(user => (
                                            <tr key={user.id}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <Link to={`/users/${user.id}`} className="text-sm font-medium text-dark-text hover:text-primary hover:underline">
                                                                {user.name}
                                                            </Link>
                                                            <div className="text-sm text-light-text">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{user.role}</td>
                                                <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={user.status} /></td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{new Date(user.registrationDate).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <Link to={`/users/${user.id}`} className="text-primary hover:text-primary-dark">View</Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default UserManagementPage;
