import React, { useState, useEffect } from 'react';
import { MailOpenIcon, PencilIcon, TrashIcon, PlusCircleIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { JobAlert } from '../../../packages/types';
import { fetchJobAlerts, createJobAlert, updateJobAlert, deleteJobAlert } from '../../../packages/api-client';
import { useToast } from '../contexts/ToastContext';
import JobAlertModal from '../components/JobAlertModal';

const JobAlertsPage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [alerts, setAlerts] = useState<JobAlert[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAlert, setEditingAlert] = useState<JobAlert | null>(null);

    useEffect(() => {
        setCrumbs([{ name: 'Home', path: '/' }, { name: 'Job Alerts' }]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        fetchJobAlerts().then(data => {
            setAlerts(data);
            setIsLoading(false);
        }).catch(() => {
            addToast('Could not load job alerts.', 'error');
            setIsLoading(false);
        });
    }, [addToast]);

    const handleOpenModal = (alert: JobAlert | null = null) => {
        setEditingAlert(alert);
        setIsModalOpen(true);
    };

    const handleSave = async (alertData: Omit<JobAlert, 'id' | 'createdDate'>) => {
        try {
            if (editingAlert) {
                const updatedAlert = await updateJobAlert(editingAlert.id, alertData);
                setAlerts(alerts.map(a => a.id === editingAlert.id ? updatedAlert : a));
                addToast('Job alert updated successfully!');
            } else {
                const newAlert = await createJobAlert(alertData);
                setAlerts([newAlert, ...alerts]);
                addToast('Job alert created successfully!');
            }
            setIsModalOpen(false);
            setEditingAlert(null);
        } catch (e: any) {
            addToast(e.message || 'Failed to save alert.', 'error');
            // Re-throw error so the modal can catch it and reset its submitting state
            throw e;
        }
    };

    const handleDelete = async (alertId: string) => {
        if (window.confirm('Are you sure you want to delete this job alert?')) {
            try {
                await deleteJobAlert(alertId);
                setAlerts(alerts.filter(a => a.id !== alertId));
                addToast('Job alert deleted.', 'info');
            } catch (e: any) {
                addToast(e.message || 'Failed to delete alert.', 'error');
            }
        }
    };

    return (
        <>
            <div className="bg-light-gray min-h-[80vh] py-12">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h1 className="text-3xl font-bold text-dark-gray">My Job Alerts</h1>
                            <button onClick={() => handleOpenModal()} className="flex items-center bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors">
                                <PlusCircleIcon className="w-5 h-5 mr-2" />
                                Create Alert
                            </button>
                        </div>
                        
                        {isLoading ? (
                            <div className="text-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div></div>
                        ) : alerts.length > 0 ? (
                            <div className="space-y-4">
                                {alerts.map(alert => (
                                    <div key={alert.id} className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-lg font-bold text-dark-gray">{alert.name}</h2>
                                                <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-4">
                                                    <span>Keywords: <span className="font-semibold">{alert.keywords}</span></span>
                                                    <span>Location: <span className="font-semibold">{alert.location || 'Any'}</span></span>
                                                </div>
                                                 <div className="mt-2 flex flex-wrap gap-2">
                                                    {alert.jobTypes.map(jt => <span key={jt} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{jt}</span>)}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                                                <button onClick={() => handleOpenModal(alert)} className="text-gray-500 hover:text-primary p-1"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleDelete(alert.id)} className="text-gray-500 hover:text-red-500 p-1"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t text-sm text-gray-500 flex justify-between">
                                            <span>Frequency: <span className="font-semibold capitalize">{alert.frequency}</span></span>
                                            <span>Created: {new Date(alert.createdDate).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                                <MailOpenIcon className="w-16 h-16 mx-auto text-gray-300" />
                                <h2 className="text-xl font-semibold mt-4">You have no job alerts.</h2>
                                <p className="text-gray-600 mt-2">Create an alert to receive the latest jobs straight to your inbox.</p>
                                 <button onClick={() => handleOpenModal()} className="mt-6 flex items-center mx-auto bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
                                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                                    Create Your First Alert
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <JobAlertModal 
                isOpen={isModalOpen} 
                onClose={() => { setIsModalOpen(false); setEditingAlert(null); }} 
                onSave={handleSave} 
                initialData={editingAlert} 
            />
        </>
    );
};

export default JobAlertsPage;