import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    BuildingOfficeIcon,
    UsersIcon,
    BriefcaseIcon,
    GlobeAltIcon,
    MailIcon as EnvelopeIcon,
    PhoneIcon,
    MapPinIcon,
    CheckBadgeIcon,
    XCircleIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    DocumentTextIcon,
    UserGroupIcon
} from '../components/Icons';
import { fetchCompanyDetails, verifyCompany, suspendCompany } from '../services/api';
import { useToast } from '../hooks/useToast';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CompanyDetailsPage: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'jobs' | 'employees' | 'subscription'>('overview');
    const { addToast } = useToast();

    useEffect(() => {
        if (!companyId) return;

        setLoading(true);
        fetchCompanyDetails(companyId)
            .then(res => {
                if (res.success) {
                    setData(res);
                } else {
                    addToast('Failed to fetch company details', 'error');
                }
            })
            .catch((err) => {
                console.error(err);
                addToast('Error loading company', 'error');
            })
            .finally(() => setLoading(false));
    }, [companyId, addToast]);

    if (loading) {
        return <div className="p-8 text-center animate-pulse">Loading company details...</div>;
    }

    if (!data) {
        return <div className="p-8 text-center text-red-500">Company not found.</div>;
    }

    const { company, stats, relationships, subscription } = data;

    // --- Helpers ---
    const getStatusBadge = (status: string) => {
        const colors: any = {
            active: 'bg-green-100 text-green-800',
            pending: 'bg-yellow-100 text-yellow-800',
            blocked: 'bg-red-100 text-red-800',
            closed: 'bg-gray-100 text-gray-800',
            expired: 'bg-orange-100 text-orange-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${colors[status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                {status}
            </span>
        );
    };

    const chartData = {
        labels: ['6 Months Ago', '5 Months Ago', '4 Months Ago', '3 Months Ago', '2 Months Ago', 'Last Month', 'Current'],
        datasets: [
            {
                label: 'Applicants',
                data: [0, 0, 0, 0, 0, stats.applicantsLast30Days / 2, stats.applicantsLast30Days],
                borderColor: 'rgb(59,130,246)',
                backgroundColor: 'rgba(59,130,246,0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const handleVerify = async () => {
        if (!window.confirm('Are you sure you want to verify this company?')) return;
        try {
            const res = await verifyCompany(companyId!);
            if (res.success) {
                addToast('Company verified successfully', 'success');
                setData((prev: any) => ({
                    ...prev,
                    company: { ...prev.company, verificationStatus: 'verified' }
                }));
            } else {
                addToast('Failed to verify company', 'error');
            }
        } catch (error) {
            addToast('Error verifying company', 'error');
        }
    };

    const handleSuspend = async () => {
        if (!window.confirm('Are you sure you want to suspend this company? account will be deactivated.')) return;
        try {
            const res = await suspendCompany(companyId!);
            if (res.success) {
                addToast('Company suspended successfully', 'success');
                setData((prev: any) => ({
                    ...prev,
                    company: { ...prev.company, isActive: false, status: 'blocked' } // Assuming UI uses these to show blocked state if checked elsewhere
                }));
            } else {
                addToast('Failed to suspend company', 'error');
            }
        } catch (error) {
            addToast('Error suspending company', 'error');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* 1. Hero Banner Section */}
            <div className="relative h-64 w-full bg-gray-300 overflow-hidden group">
                {company.bannerUrl ? (
                    <img src={company.bannerUrl} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-blue-900 to-indigo-900 flex items-center justify-center">
                        <BuildingOfficeIcon className="w-20 h-20 text-white opacity-20" />
                    </div>
                )}
                {/* Back Button Overlay */}
                <Link to="/companies" className="absolute top-4 left-4 bg-white/90 p-2 rounded-full hover:bg-white shadow-sm transition">
                    ← Back
                </Link>
            </div>

            {/* 2. Profile Header (Overlapping Banner) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 md:flex justify-between items-start">
                        <div className="flex gap-6 items-start">
                            {/* Logo */}
                            <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-white border-4 border-white shadow-md overflow-hidden flex-shrink-0">
                                {company.logoUrl ? (
                                    <img src={company.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-4xl font-bold text-indigo-300">
                                        {company.companyName?.charAt(0) || 'C'}
                                    </div>
                                )}
                            </div>

                            {/* Text Info */}
                            <div className="pt-2">
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    {company.companyName || company.name}
                                    {company.verificationStatus === 'verified' && (
                                        <CheckBadgeIcon className="w-6 h-6 text-blue-500" title="Verified Company" />
                                    )}
                                    {company.isActive === false && (
                                        <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full uppercase font-bold tracking-wide">Suspended</span>
                                    )}
                                </h1>
                                <p className="text-gray-500 mt-1 flex items-center gap-2">
                                    {company.tagline || 'Leading the industry'}
                                </p>
                                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
                                    <span className="flex items-center gap-1"><BuildingOfficeIcon className="w-4 h-4" /> {company.industry || 'Industry'}</span>
                                    <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4" /> {company.location || company.headquarters || 'Remote'}</span>
                                    {company.website && (
                                        <a href={company.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                            <GlobeAltIcon className="w-4 h-4" /> Website
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-6 md:mt-2 flex gap-3">
                            {company.verificationStatus !== 'verified' && (
                                <button
                                    onClick={handleVerify}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm transition"
                                >
                                    Verify Company
                                </button>
                            )}
                            {company.isActive !== false && (
                                <button
                                    onClick={handleSuspend}
                                    className="px-4 py-2 border border-red-200 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 font-medium transition"
                                >
                                    Suspend
                                </button>
                            )}
                            {company.isActive === false && (
                                <button disabled className="px-4 py-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed font-medium">
                                    Suspended
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="px-6 border-t flex gap-6 overflow-x-auto text-sm font-medium">
                        {[
                            { id: 'overview', label: 'Overview', icon: <DocumentTextIcon className="w-4 h-4" /> },
                            { id: 'analytics', label: 'Analytics', icon: <ChartBarIcon className="w-4 h-4" /> },
                            { id: 'jobs', label: 'Jobs', icon: <BriefcaseIcon className="w-4 h-4" /> },
                            { id: 'employees', label: 'Employees', icon: <UsersIcon className="w-4 h-4" /> },
                            { id: 'subscription', label: 'Subscription', icon: <CurrencyDollarIcon className="w-4 h-4" /> }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-4 flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* 3. Main Content Area */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* --- TAB: OVERVIEW --- */}
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left: Main Details */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* About Us */}
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-4">About Us</h3>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {company.overview?.about?.text || company.description || "No description provided."}
                                </p>
                            </div>

                            {/* Why Join Us */}
                            {company.whyJoinUs && (
                                <div className="bg-white rounded-xl shadow-sm border p-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-6">Why Join Us</h3>
                                    <div className="grid sm:grid-cols-3 gap-6">
                                        {company.whyJoinUs.keyHighlights?.map((item: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50 p-4 rounded-lg text-center">
                                                <div className="text-2xl mb-2">{item.icon || '✨'}</div>
                                                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{item.subtitle}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {(!company.whyJoinUs.keyHighlights || company.whyJoinUs.keyHighlights.length === 0) && (
                                        <p className="text-gray-500 italic">No highlights added yet.</p>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right: Sidebar Info */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Company Details</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Size</span>
                                        <span className="font-medium">{company.companySize || 'Unknown'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Founded</span>
                                        <span className="font-medium">{company.foundedYear || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-500">Type</span>
                                        <span className="font-medium capitalize">{company.companyType?.replace('_', ' ') || 'Private'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <h3 className="font-bold text-gray-900 mb-4">Contact Info</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                            <EnvelopeIcon className="w-4 h-4" />
                                        </div>
                                        <span>{company.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-600">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                            <PhoneIcon className="w-4 h-4" />
                                        </div>
                                        <span>{company.phone || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: ANALYTICS --- */}
                {activeTab === 'analytics' && (
                    <div className="space-y-6">
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatCard icon={<BriefcaseIcon className="w-5 h-5" />} title="Total Jobs" value={stats.totalJobs} sub={`${stats.activeJobs} Active`} />
                            <StatCard icon={<UserGroupIcon className="w-5 h-5" />} title="Applicants" value={stats.totalApplicants} />
                            <StatCard icon={<CheckBadgeIcon className="w-5 h-5" />} title="Hired" value={stats.hiredCandidates} />
                            <StatCard icon={<UsersIcon className="w-5 h-5" />} title="Employees" value={company.employeesCount || 0} />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border p-6 h-96">
                            <h3 className="font-bold text-gray-900 mb-4">Applicant Growth</h3>
                            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                        </div>
                    </div>
                )}

                {/* --- TAB: JOBS --- */}
                {activeTab === 'jobs' && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-medium text-gray-500">Job Title</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Posted At</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Applicants</th>
                                    <th className="px-6 py-4 font-medium text-gray-500">Views</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {relationships.jobs.map((job: any) => (
                                    <tr key={job.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{job.title}</td>
                                        <td className="px-6 py-4">{getStatusBadge(job.status)}</td>
                                        <td className="px-6 py-4 text-gray-500">{new Date(job.postedAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-500">{job.applicantsCount}</td>
                                        <td className="px-6 py-4 text-gray-500">{job.views}</td>
                                    </tr>
                                ))}
                                {relationships.jobs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No jobs posted yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- TAB: EMPLOYEES --- */}
                {activeTab === 'employees' && (
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-4 border-b bg-gray-50">
                            <h3 className="font-semibold text-gray-700">Team Members</h3>
                        </div>
                        <div className="divide-y">
                            {relationships.employees.map((emp: any) => (
                                <div key={emp._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                            {emp.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{emp.name}</p>
                                            <p className="text-xs text-gray-500">{emp.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-500 capitalize">{emp.role.replace('_', ' ')}</span>
                                        {getStatusBadge(emp.status)}
                                    </div>
                                </div>
                            ))}
                            {relationships.employees.length === 0 && (
                                <div className="p-8 text-center text-gray-500">No team members found.</div>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: SUBSCRIPTION --- */}
                {activeTab === 'subscription' && (
                    <div className="max-w-3xl">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="opacity-80 font-medium mb-1">Current Plan</p>
                                    <h2 className="text-4xl font-bold mb-4">{subscription.planName}</h2>
                                    <div className="flex gap-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/20 backdrop-blur-sm border border-white/30`}>
                                            {subscription.status}
                                        </span>
                                        {subscription.expiry && (
                                            <span className="px-3 py-1 rounded-full text-xs bg-black/20">
                                                Expires: {new Date(subscription.expiry).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-white/10 p-4 rounded-xl">
                                    <CurrencyDollarIcon className="w-12 h-12 text-yellow-300" />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <p className="text-xs opacity-70 mb-1">Credits Left</p>
                                    <p className="text-xl font-bold">{subscription.creditsLeft}</p>
                                </div>
                                {/* Mocking other limits since schema didn't have them all populated yet */}
                                <div>
                                    <p className="text-xs opacity-70 mb-1">Job Posts</p>
                                    <p className="text-xl font-bold">Unlimited</p>
                                </div>
                                <div>
                                    <p className="text-xs opacity-70 mb-1">Candidate Views</p>
                                    <p className="text-xl font-bold">500 / mo</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanyDetailsPage;

/* ---------------- Helper Component ---------------- */

const StatCard = ({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: number; sub?: string }) => (
    <div className="bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                {icon}
            </div>
            <span className="text-sm font-medium text-gray-500">{title}</span>
        </div>
        <div className="pl-12">
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            {sub && <div className="text-xs text-green-600 mt-1">{sub}</div>}
        </div>
    </div>
);

