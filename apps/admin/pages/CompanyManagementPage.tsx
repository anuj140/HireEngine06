import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AdminCompany } from '../data/mockData';
import { CheckCircleIcon, ShieldExclamationIcon, ClockIcon, BanIcon, BuildingOfficeIcon, CheckBadgeIcon, CreditCardIcon } from '../components/Icons';
import CompanyFilterSidebar, { CompanyFilters, initialFilters } from '../components/CompanyFilterSidebar';
import StatCard from '../components/StatCard';
import ChartCard from '../components/ChartCard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../hooks/useToast';
import { adminFetchAllCompanies } from '../../../packages/api-client';

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
    
    return (
        <div className="flex justify-end items-center mt-4">
            <nav className="flex items-center space-x-2">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1 text-sm font-medium rounded-md hover:bg-light disabled:opacity-50"
                >
                    Prev
                </button>
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`w-8 h-8 text-sm font-medium rounded-md ${currentPage === number ? 'bg-primary text-white' : 'hover:bg-light'}`}
                    >
                        {number}
                    </button>
                ))}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1 text-sm font-medium rounded-md hover:bg-light disabled:opacity-50"
                >
                    Next
                </button>
            </nav>
        </div>
    );
};

const CompanyManagementPage: React.FC = () => {
    const [allCompanies, setAllCompanies] = useState<AdminCompany[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filters, setFilters] = useState<CompanyFilters>(initialFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [timeFilter, setTimeFilter] = useState<'all' | 'year' | 'month' | 'week'>('all');
    const { addToast } = useToast();
    const companiesPerPage = 10;

    useEffect(() => {
        setIsLoading(true);
        adminFetchAllCompanies()
            .then((data: any) => {
                const adaptedData = (data.companies || data).map((c: any) => ({
                    id: c._id,
                    name: c.companyName,
                    logo: c.logoUrl || 'https://via.placeholder.com/40',
                    industry: c.industry || 'N/A',
                    contact: { name: c.name, email: c.email, phone: c.phone },
                    plan: (c.plan || 'Free') as AdminCompany['plan'],
                    accountStatus: (c.isActive ? 'Active' : 'Inactive') as AdminCompany['accountStatus'],
                    verificationStatus: (c.verificationStatus.charAt(0).toUpperCase() + c.verificationStatus.slice(1)) as AdminCompany['verificationStatus'],
                    jobs: { active: c.jobsPosted?.length || 0, pending: 0, expired: 0 },
                    applicationsReceived: 0,
                    registrationDate: new Date(c.createdAt).toLocaleDateString(),
                    lastLogin: new Date(c.updatedAt).toLocaleDateString(),
                    flaggedJobs: 0
                }));
                setAllCompanies(adaptedData);
            })
            .catch(err => addToast('Failed to load companies.', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);
    

    const companyAnalytics = useMemo(() => {
        const companies = allCompanies;
        const totalCompanies = companies.length;
        const verifiedCompanies = companies.filter(c => c.verificationStatus === 'Verified').length;
        const premiumPlans = companies.filter(c => c.plan === 'Premium' || c.plan === 'Enterprise').length;
        
        const planDistribution = companies.reduce((acc, company) => {
            acc[company.plan] = (acc[company.plan] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const planData = Object.entries(planDistribution).map(([name, value]) => ({ name, value }));

        const statusDistribution = companies.reduce((acc, company) => {
            acc[company.accountStatus] = (acc[company.accountStatus] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const statusData = Object.entries(statusDistribution).map(([name, value]) => ({ name, value }));

        const industryDistribution = companies.reduce((acc, company) => {
            const industry = company.industry || 'Uncategorized';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        const industryData = Object.entries(industryDistribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => Number(b.value) - Number(a.value));


        return { totalCompanies, verifiedCompanies, premiumPlans, planData, statusData, industryData };
    }, [allCompanies]);

    const PIE_COLORS = ['#4b2fdb', '#f9ab00', '#34a853'];

    const filteredCompanies = useMemo(() => {
        return allCompanies.filter(company => {
            const nameMatch = company.name.toLowerCase().includes(filters.name.toLowerCase());
            const emailMatch = company.contact.email.toLowerCase().includes(filters.email.toLowerCase());
            const statusMatch = filters.status.length > 0 ? filters.status.includes(company.accountStatus) : true;
            const verificationMatch = filters.verification.length > 0 ? filters.verification.includes(company.verificationStatus) : true;
            const planMatch = filters.plan !== 'any' ? company.plan === filters.plan : true;

            return nameMatch && emailMatch && statusMatch && verificationMatch && planMatch;
        });
    }, [allCompanies, filters]);

    const paginatedCompanies = useMemo(() => {
        const startIndex = (currentPage - 1) * companiesPerPage;
        return filteredCompanies.slice(startIndex, startIndex + companiesPerPage);
    }, [filteredCompanies, currentPage, companiesPerPage]);
    
    const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);
    
     const StatusBadge: React.FC<{ status: AdminCompany['accountStatus'] }> = ({ status }) => {
        const styles = {
          Active: 'bg-accent-green/10 text-accent-green',
          Inactive: 'bg-gray-100 text-gray-600',
          Suspended: 'bg-yellow-100 text-yellow-600',
          Banned: 'bg-red-100 text-red-600'
        };
        const icons = {
          Active: <CheckCircleIcon className="w-4 h-4" />,
          Inactive: <ClockIcon className="w-4 h-4" />,
          Suspended: <ShieldExclamationIcon className="w-4 h-4" />,
          Banned: <BanIcon className="w-4 h-4" />
        }
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
            {icons[status]}
            {status}
          </span>
        );
    };

    const VerificationBadge: React.FC<{ status: AdminCompany['verificationStatus'] }> = ({ status }) => {
        const styles = {
          Verified: 'bg-accent-blue/10 text-accent-blue',
          Pending: 'bg-accent-orange/10 text-accent-orange',
          Rejected: 'bg-red-100 text-red-500'
        };
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
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
            <h1 className="text-3xl font-bold text-dark-text">Company Management</h1>

            {/* Analytics Section */}
            <h2 className="text-xl font-bold text-dark-text pt-4">Analytics Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<BuildingOfficeIcon className="w-6 h-6 text-primary"/>} title="Total Companies" value={companyAnalytics.totalCompanies.toLocaleString()} />
                <StatCard icon={<CheckBadgeIcon className="w-6 h-6 text-primary"/>} title="Verified Companies" value={companyAnalytics.verifiedCompanies.toLocaleString()} />
                <StatCard icon={<CreditCardIcon className="w-6 h-6 text-primary"/>} title="Premium/Enterprise" value={companyAnalytics.premiumPlans.toLocaleString()} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <ChartCard title="Companies by Plan">
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie data={companyAnalytics.planData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label>
                                {companyAnalytics.planData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
                <ChartCard title="Company Status">
                     <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={companyAnalytics.statusData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" fill="#4b2fdb" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
                 <ChartCard title="Companies by Industry">
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={companyAnalytics.industryData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10 }} />
                            <Tooltip />
                            <Bar dataKey="value" name="Count" fill="#34a853" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                <aside className="lg:col-span-1 sticky top-8">
                    <CompanyFilterSidebar filters={filters} onFiltersChange={setFilters} />
                </aside>
                <main className="lg:col-span-3">
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        {isLoading ? (
                             <div className="text-center py-16 text-light-text">Loading companies...</div>
                        ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-light">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Plan</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Verification</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Jobs</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedCompanies.map(company => (
                                        <tr key={company.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-lg object-contain" src={company.logo} alt="" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <Link to={`/companies/${company.id}`} className="text-sm font-medium text-dark-text hover:text-primary hover:underline">
                                                            {company.name}
                                                        </Link>
                                                        <div className="text-sm text-light-text">{company.industry}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-dark-text">{company.contact.name}</div>
                                                <div className="text-sm text-light-text">{company.contact.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">{company.plan}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><VerificationBadge status={company.verificationStatus} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={company.accountStatus} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">{company.jobs.active} Active</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/companies/${company.id}`} className="text-primary hover:text-primary-dark">View</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        )}
                        {paginatedCompanies.length === 0 && !isLoading && <p className="text-center py-8 text-light-text">No companies match the current filters.</p>}
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CompanyManagementPage;
