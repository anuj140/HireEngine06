import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { UserGroupIcon, BriefcaseIcon, BuildingOfficeIcon, CurrencyDollarIcon } from '../components/Icons';
import ChartCard from '../components/ChartCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { fetchDashboardStats } from '../services/api';
import { useToast } from '../contexts/ToastContext';

type TimeFilter = '7d' | '30d' | '1y' | 'all';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const { addToast } = useToast();

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await fetchDashboardStats(timeFilter);
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error: any) {
        console.error('Failed to load dashboard stats', error);
        addToast('Failed to load dashboard stats', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [addToast, timeFilter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback if stats are missing (shouldn't happen if API works)
  const safeStats = stats || {
    totalUsers: 0,
    totalCompanies: 0,
    activeUsers: 0,
    userGrowth: 0,
    companyGrowth: 0,
    barData: []
  };

  // Format bar data for chart
  const userChartData = safeStats.barData.map((item: any) => ({
    name: item.month,
    users: item.count
  }));

  return (
    <div className="space-y-8">
      <div>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex bg-white rounded-lg p-1 border shadow-sm self-start md:self-auto">
            {(['7d', '30d', '1y', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${timeFilter === period ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                {period === '7d' ? 'Week' : period === '30d' ? 'Month' : period === '1y' ? 'Year' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
          title="Total Users"
          value={safeStats.totalUsers.toLocaleString()}
          change={`${safeStats.userGrowth}%`}
          changeType={parseFloat(safeStats.userGrowth) >= 0 ? "increase" : "decrease"}
        />
        <StatCard
          icon={<BuildingOfficeIcon className="w-6 h-6 text-purple-600" />}
          title="Total Companies"
          value={safeStats.totalCompanies.toLocaleString()}
          change={`${safeStats.companyGrowth}%`}
          changeType={parseFloat(safeStats.companyGrowth) >= 0 ? "increase" : "decrease"}
        />
        <StatCard
          icon={<BriefcaseIcon className="w-6 h-6 text-green-600" />}
          title="Active Users"
          value={safeStats.activeUsers.toLocaleString()}
          change="-"
          changeType="neutral"
        />
        {/* Placeholder for Revenue - API doesn't provide it yet */}
        <StatCard
          icon={<CurrencyDollarIcon className="w-6 h-6 text-yellow-600" />}
          title="Monthly Revenue"
          value="$0"
          change="0%"
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="User Signups (Last 6 Months)">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1F2937' }}
                  cursor={{ fill: '#F3F4F6' }}
                />
                <Bar dataKey="users" fill="#3B82F6" name="New Users" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Placeholder for Revenue Chart - keeping mock data or empty for now as backend doesn't send it */}
        <ChartCard title="Revenue Growth (Mock)">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[{ name: 'Jan', revenue: 0 }, { name: 'Feb', revenue: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: '#1F2937' }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} name="Revenue ($)" dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#FFFFFF' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default DashboardPage;
