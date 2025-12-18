import React, { useState } from 'react';
import { ChartBarIcon, MailIcon, BellIcon, SparklesIcon, SendIcon, EyeIcon, DocumentDuplicateIcon } from '../components/Icons';
import { useBroadcasts } from '../contexts/BroadcastsContext';
import CreateBroadcastModal from '../components/CreateBroadcastModal';

const KpiCard: React.FC<{ title: string; value: string; icon: React.ReactNode; }> = ({ title, value, icon }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4">
        <div className="bg-primary-light p-3 rounded-full text-primary">
            {icon}
        </div>
        <div>
            <p className="text-2xl font-bold text-dark-text">{value}</p>
            <h3 className="text-sm font-medium text-light-text">{title}</h3>
        </div>
    </div>
);

const CommunicationsPage: React.FC = () => {
    const { broadcasts, addBroadcast } = useBroadcasts();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const analytics = {
        sent: broadcasts.filter(b => b.status === 'Sent').length,
        openRate: '34.5%', // Mock
        clickRate: '8.2%', // Mock
        notifications: broadcasts.filter(b => b.status === 'Sent' && b.channels.includes('notification')).length
    };

    const ChannelIcon: React.FC<{ channel: 'email' | 'notification' }> = ({ channel }) => {
        if (channel === 'email') {
            // DO: Add comment above each fix.
            // FIX: The `title` prop is not a valid attribute for the Icon component. Wrapping it in a span to show a tooltip.
            return <span title="Email"><MailIcon className="w-5 h-5 text-gray-500" /></span>;
        }
        // DO: Add comment above each fix.
        // FIX: The `title` prop is not a valid attribute for the Icon component. Wrapping it in a span to show a tooltip.
        return <span title="On-Site Notification"><BellIcon className="w-5 h-5 text-gray-500" /></span>;
    };
    
    const StatusBadge: React.FC<{ status: 'Sent' | 'Scheduled' | 'Draft' }> = ({ status }) => {
        const styles = {
            Sent: 'bg-accent-green/10 text-accent-green',
            Scheduled: 'bg-accent-blue/10 text-accent-blue',
            Draft: 'bg-gray-100 text-gray-600'
        };
        return <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>{status}</span>
    }

    return (
        <>
            <div className="space-y-8 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-dark-text">Communications Hub</h1>
                        <p className="text-light-text mt-1">Engage with your users through targeted announcements and notifications.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 transition-colors shadow-sm">
                        <SendIcon className="w-5 h-5 mr-2" />
                        Create New Broadcast
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Broadcasts Sent" value={analytics.sent.toString()} icon={<SendIcon className="w-6 h-6"/>} />
                    <KpiCard title="Avg. Open Rate" value={analytics.openRate} icon={<MailIcon className="w-6 h-6"/>} />
                    <KpiCard title="Avg. Click Rate" value={analytics.clickRate} icon={<ChartBarIcon className="w-6 h-6"/>} />
                    <KpiCard title="Notifications Pushed" value={analytics.notifications.toString()} icon={<BellIcon className="w-6 h-6"/>} />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold text-dark-text mb-4">Recent Broadcasts</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-light">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Campaign</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Audience</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Channels</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                             <tbody className="bg-white divide-y divide-gray-200">
                                {broadcasts.map(broadcast => (
                                    <tr key={broadcast.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-dark-text">{broadcast.name}</p>
                                            <p className="text-sm text-light-text truncate max-w-xs">{broadcast.subject}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{broadcast.audience}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                {broadcast.channels.map(c => <ChannelIcon key={c} channel={c} />)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={broadcast.status}/></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{broadcast.sentDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-3">
                                                <button className="flex items-center gap-1 text-primary hover:underline font-semibold"><EyeIcon className="w-4 h-4"/> Stats</button>
                                                <button className="flex items-center gap-1 text-primary hover:underline font-semibold"><DocumentDuplicateIcon className="w-4 h-4"/> Duplicate</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <CreateBroadcastModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={addBroadcast}
            />
        </>
    );
};

export default CommunicationsPage;