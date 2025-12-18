
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    UserIcon, BriefcaseIcon, BuildingOfficeIcon, CalendarIcon,
    EnvelopeIcon, PhoneIcon, MapPinIcon, ShieldCheckIcon,
    ArrowLeftIcon, CheckCircleIcon, XCircleIcon
} from '@heroicons/react/24/outline'; // Adjust imports based on available icons or use local components
import { fetchUserDetails } from '../services/api';
import { useToast } from '../hooks/useToast';
import StatCard from '../components/StatCard'; // Reusing existing component if suitable or creating new inline

// Mock icons if imports fail - replacing with generic divs in real code if needed, 
// but assuming Heroicons or similar are available or I will use text for now to be safe if I don't know the exact library version.
// Checking previous files: UserManagementPage used '../components/Icons'. I should use that.

import {
    CheckCircleIcon as CheckIcon,
    ShieldExclamationIcon,
    ClockIcon,
    UserGroupIcon,
    UserPlusIcon
} from '../components/Icons';

// Helper for status badge
const StatusBadge = ({ status }: { status: string }) => {
    const styles: Record<string, string> = {
        Active: 'bg-green-100 text-green-800',
        Blocked: 'bg-red-100 text-red-800',
        Pending: 'bg-yellow-100 text-yellow-800',
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
            {status}
        </span>
    );
};

const UserDetailsPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const [userData, setUserData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const { addToast } = useToast();

    useEffect(() => {
        if (!userId) return;
        setLoading(true);
        fetchUserDetails(userId)
            .then(data => {
                if (data.success) {
                    setUserData(data);
                } else {
                    addToast('Failed to fetch user details', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                addToast('Error loading user', 'error');
            })
            .finally(() => setLoading(false));
    }, [userId, addToast]);

    if (loading) return <div className="p-8 text-center">Loading profile...</div>;
    if (!userData) return <div className="p-8 text-center">User not found.</div>;

    const { user, activity, reports } = userData;
    const isRecruiter = user.role === 'Recruiter';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link to="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <span className="sr-only">Back</span>
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
                    <p className="text-sm text-gray-500">Manage and view user information</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                        {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl font-bold">
                                {user.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                            <span className="px-2 py-0.5 rounded border text-xs font-medium bg-gray-50 text-gray-600 uppercase tracking-wide">
                                {user.role}
                            </span>
                            <StatusBadge status={user.isActive ? 'Active' : 'Blocked'} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-8 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                {user.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                Joined: {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                {user.profile?.location || 'Location not set'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm font-medium text-gray-500">{isRecruiter ? 'Jobs Posted' : 'Applications'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activity.applications || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm font-medium text-gray-500">{isRecruiter ? 'Active Jobs' : 'Interviews'}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activity.interviews || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm font-medium text-gray-500">Saved Items</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activity.savedJobs || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border">
                    <p className="text-sm font-medium text-gray-500">Profile Views</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activity.profileViews || 0}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                <div className="border-b px-6 flex gap-8">
                    {['overview', 'applications', 'security'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`py-4 text-sm font-medium border-b-2 capitalize transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Professional Summary</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {user.profile?.about || "No summary provided."}
                                </p>
                            </div>

                            {user.profile?.skills && user.profile.skills.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Skills</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {user.profile.skills.map((skill: string, i: number) => (
                                            <span key={i} className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-sm">{skill}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {user.profile?.experience && user.profile.experience.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-3">Experience</h3>
                                    <div className="space-y-4">
                                        {user.profile.experience.map((exp: any, i: number) => (
                                            <div key={i} className="border-l-2 border-gray-200 pl-4 py-1">
                                                <p className="font-semibold text-gray-900">{exp.position}</p>
                                                <p className="text-sm text-gray-600">{exp.company}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{exp.startDate} - {exp.endDate || 'Present'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'applications' && (
                        <div>
                            <h3 className="text-lg font-medium text-gray-900 mb-4">
                                {isRecruiter ? 'Posted Jobs' : 'Applied Jobs'}
                            </h3>
                            {user.appliedJobs && user.appliedJobs.length > 0 ? (
                                <div className="overflow-hidden border rounded-lg">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {user.appliedJobs.map((job: any, index: number) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {job.job?.title || 'Unknown Job'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {job.job?.companyName || 'Unknown Company'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {job.appliedAt ? new Date(job.appliedAt).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {job.status || 'Applied'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">No {isRecruiter ? 'posted jobs' : 'applications'} found.</p>
                            )}
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Reports & Flags</h3>
                                {reports && reports.length > 0 ? (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-red-800 font-medium">User has reported {reports.length} issues.</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500">No reports associated with this user.</p>
                                )}
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-gray-900 mb-3">Admin Notes</h3>
                                <textarea
                                    className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    rows={4}
                                    placeholder="Add internal notes about this user..."
                                    defaultValue={userData.adminNotes}
                                ></textarea>
                                <button className="mt-2 text-sm text-blue-600 font-medium hover:text-blue-700">Save Note</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailsPage;
