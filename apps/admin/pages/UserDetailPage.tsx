import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    UserIcon, BriefcaseIcon, AcademicCapIcon, LocationMarkerIcon, PhoneIcon, MailIcon,
    CalendarIcon, GlobeAltIcon, ChartBarIcon, ClockIcon, CheckCircleIcon, BanIcon,
    KeyIcon, TrashIcon, PencilIcon, CloseIcon
} from '../components/Icons';
import { fetchUserById, updateUserStatus, updateUserDetails } from '../services/api';
import { User } from '../../../packages/types';
import { useToast } from '../contexts/ToastContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock Data for Analytics
const applicationActivityData = [
    { name: 'Jan', applications: 4 },
    { name: 'Feb', applications: 3 },
    { name: 'Mar', applications: 2 },
    { name: 'Apr', applications: 7 },
    { name: 'May', applications: 5 },
    { name: 'Jun', applications: 8 },
];

const activityLogData = [
    { id: 1, action: 'Applied to "Senior React Developer"', date: '2 hours ago', icon: BriefcaseIcon, color: 'text-blue-500 bg-blue-100' },
    { id: 2, action: 'Updated Profile Skills', date: '1 day ago', icon: UserIcon, color: 'text-green-500 bg-green-100' },
    { id: 3, action: 'Logged in from New Device', date: '3 days ago', icon: KeyIcon, color: 'text-yellow-500 bg-yellow-100' },
    { id: 4, action: 'Saved "Product Manager" Job', date: '1 week ago', icon: BriefcaseIcon, color: 'text-purple-500 bg-purple-100' },
];

const UserDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'analytics' | 'activity'>('overview');
    const { addToast } = useToast();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        loadUser();
    }, [id]);

    const loadUser = async () => {
        try {
            setLoading(true);
            if (id) {
                const data = await fetchUserById(id);
                setUser(data.user);
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
            addToast('Failed to load user details', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (action: 'block' | 'unblock') => {
        if (!user?._id) return;
        try {
            await updateUserStatus(user._id, action);
            addToast(`User ${action === 'block' ? 'suspended' : 'activated'} successfully`, 'success');
            loadUser(); // Refresh data
        } catch (error) {
            console.error("Failed to update status:", error);
            addToast('Failed to update user status', 'error');
        }
    };

    const handleUpdateProfile = async (updates: Partial<User>) => {
        if (!user?._id) return;
        try {
            await updateUserDetails(user._id, updates);
            addToast('User profile updated successfully', 'success');
            setIsEditModalOpen(false);
            loadUser();
        } catch (error) {
            console.error("Failed to update profile:", error);
            addToast('Failed to update user profile', 'error');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    if (!user) return <div className="text-center text-red-500">User not found</div>;

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                            {user.profilePhoto ? (
                                <img src={user.profilePhoto} alt={user.name} className="h-full w-full object-cover" />
                            ) : (
                                <UserIcon className="h-10 w-10 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <p className="text-gray-500">{user.profile?.headline || 'No headline'}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {user.isActive ? 'Active' : 'Suspended'}
                                </span>
                                <span className="text-gray-400 text-sm">•</span>
                                <span className="text-gray-500 text-sm flex items-center gap-1">
                                    <LocationMarkerIcon className="h-3 w-3" /> {user.location || 'Location not set'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-2 text-sm font-medium"
                        >
                            <PencilIcon className="h-4 w-4" /> Edit Profile
                        </button>
                        {user.isActive ? (
                            <button
                                onClick={() => handleStatusUpdate('block')}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <BanIcon className="h-4 w-4" /> Suspend Account
                            </button>
                        ) : (
                            <button
                                onClick={() => handleStatusUpdate('unblock')}
                                className="px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 text-sm font-medium"
                            >
                                <CheckCircleIcon className="h-4 w-4" /> Activate Account
                            </button>
                        )}
                        <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium">
                            <KeyIcon className="h-4 w-4" /> Reset Password
                        </button>
                        <button className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 text-sm font-medium">
                            <MailIcon className="h-4 w-4" /> Message
                        </button>
                        <button className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium">
                            <TrashIcon className="h-4 w-4" /> Delete
                        </button>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <MailIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                        </div>
                        {user.emailVerified && <CheckCircleIcon className="h-4 w-4 text-green-500 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                            <PhoneIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="text-sm font-medium text-gray-900">{user.phone || 'N/A'}</p>
                        </div>
                        {user.phoneVerified && <CheckCircleIcon className="h-4 w-4 text-green-500 ml-auto" />}
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Joined</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {['Overview', 'Profile Details', 'Analytics', 'Activity Log'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase().split(' ')[0] as any)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.toLowerCase().split(' ')[0]
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Stats & About */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <StatItem label="Applications" value={user.appliedJobs?.length || 0} icon={BriefcaseIcon} color="blue" />
                                <StatItem label="Saved Jobs" value={user.bookmarks?.length || 0} icon={ChartBarIcon} color="purple" />
                                <StatItem label="Profile Views" value={12} icon={UserIcon} color="green" />
                            </div>

                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {user.profile?.about || "No summary provided by the user."}
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Recent Activity (Mini) */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Applications</h3>
                                <div className="space-y-4">
                                    {user.appliedJobs && user.appliedJobs.length > 0 ? (
                                        user.appliedJobs.slice(0, 3).map((app: any, index: number) => (
                                            <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div className="p-2 bg-gray-50 rounded text-gray-500">
                                                    <BriefcaseIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{app.job?.title || 'Unknown Job'}</p>
                                                    <p className="text-xs text-gray-500">{app.job?.companyName || 'Unknown Company'}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{new Date(app.appliedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500">No applications yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="space-y-6">
                        {/* Experience Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BriefcaseIcon className="h-5 w-5 text-gray-400" /> Experience
                            </h3>
                            <div className="space-y-6">
                                {user.profile?.experience && user.profile.experience.length > 0 ? (
                                    user.profile.experience.map((exp: any, index: number) => (
                                        <div key={index} className="flex gap-4 relative">
                                            <div className="flex flex-col items-center">
                                                <div className="h-3 w-3 rounded-full bg-indigo-500 mt-1.5"></div>
                                                {index !== user.profile!.experience!.length - 1 && (
                                                    <div className="w-0.5 bg-gray-200 flex-1 my-1"></div>
                                                )}
                                            </div>
                                            <div>
                                                <h4 className="text-base font-medium text-gray-900">{exp.title}</h4>
                                                <p className="text-sm text-gray-600">{exp.company}</p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {new Date(exp.startDate).getFullYear()} - {exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">{exp.description}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No experience details added.</p>
                                )}
                            </div>
                        </div>

                        {/* Education Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <AcademicCapIcon className="h-5 w-5 text-gray-400" /> Education
                            </h3>
                            <div className="space-y-6">
                                {user.profile?.education && user.profile.education.length > 0 ? (
                                    user.profile.education.map((edu: any, index: number) => (
                                        <div key={index} className="flex gap-4">
                                            <div className="p-2 bg-indigo-50 rounded-lg h-fit text-indigo-600">
                                                <AcademicCapIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-medium text-gray-900">{edu.degree} in {edu.fieldOfStudy}</h4>
                                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                                <p className="text-xs text-gray-400 mt-1">{new Date(edu.startDate).getFullYear()} - {new Date(edu.endDate).getFullYear()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No education details added.</p>
                                )}
                            </div>
                        </div>

                        {/* Skills Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.profile?.skills && user.profile.skills.length > 0 ? (
                                    user.profile.skills.map((skill: string, index: number) => (
                                        <span key={index} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                            {skill}
                                        </span>
                                    ))
                                ) : (
                                    <p className="text-gray-500 italic">No skills listed.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'analytics' && (
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-6">Application Activity (Last 6 Months)</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={applicationActivityData}>
                                        <defs>
                                            <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: '#111827', fontWeight: 600 }}
                                        />
                                        <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">User Activity Log</h3>
                        <div className="space-y-8">
                            {activityLogData.map((log) => (
                                <div key={log.id} className="flex gap-4 relative">
                                    <div className="flex flex-col items-center">
                                        <div className={`p-2 rounded-full ${log.color} z-10`}>
                                            <log.icon className="h-4 w-4" />
                                        </div>
                                        {log.id !== activityLogData.length && (
                                            <div className="w-0.5 bg-gray-100 absolute top-8 bottom-[-32px] left-[15px]"></div>
                                        )}
                                    </div>
                                    <div className="pb-1">
                                        <p className="text-sm font-medium text-gray-900">{log.action}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">{log.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {isEditModalOpen && (
                <EditUserModal
                    user={user}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleUpdateProfile}
                />
            )}
        </div>
    );
};

const StatItem: React.FC<{ label: string; value: string | number; icon: any; color: string }> = ({ label, value, icon: Icon, color }) => {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        orange: 'bg-orange-50 text-orange-600',
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{label}</p>
            </div>
        </div>
    );
};

const EditUserModal: React.FC<{ user: User; onClose: () => void; onSave: (updates: Partial<User>) => void }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        headline: user.profile?.headline || '',
        about: user.profile?.about || '',
        skills: user.profile?.skills?.join(', ') || ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            profile: {
                ...user.profile,
                headline: formData.headline,
                about: formData.about,
                skills: formData.skills.split(',').map(s => s.trim()).filter(s => s)
            }
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Edit User Profile</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                        <input
                            type="text"
                            name="headline"
                            value={formData.headline}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                        <textarea
                            name="about"
                            value={formData.about}
                            onChange={handleChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Skills (comma separated)</label>
                        <input
                            type="text"
                            name="skills"
                            value={formData.skills}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserDetailPage;
