
import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../hooks/useToast';
import { adminFetchPendingRecruiters, adminApproveRecruiter, adminRejectRecruiter } from '../services/api';
import { CheckCircleIcon, BanIcon } from '../components/Icons';

interface RecruiterRequest {
    _id: string;
    name: string;
    email: string;
    phone: string;
    companyName: string;
    companyType: string;
    createdAt: string;
}

const RecruiterApprovalsPage: React.FC = () => {
    const [requests, setRequests] = useState<RecruiterRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const loadRequests = useCallback(() => {
        setIsLoading(true);
        adminFetchPendingRecruiters()
            .then(data => {
                // Ensure we handle the case where data might be wrapped or just the array
                const list = Array.isArray(data) ? data : [];
                setRequests(list);
            })
            .catch(err => {
                console.error("Failed to load requests", err);
                addToast('Failed to load pending requests', 'error');
                setRequests([]);
            })
            .finally(() => setIsLoading(false));
    }, [addToast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleApprove = async (requestId: string) => {
        try {
            await adminApproveRecruiter(requestId);
            addToast('Recruiter approved and account created.', 'success');
            loadRequests();
        } catch (err: any) {
            addToast(err.message, 'error');
        }
    };

    const handleReject = async (requestId: string) => {
        const reason = prompt("Please provide a reason for rejection (this will be sent to the applicant):");
        if (reason && reason.trim()) {
            try {
                await adminRejectRecruiter(requestId, reason);
                addToast('Recruiter request rejected.', 'info');
                loadRequests();
            } catch (err: any) {
                addToast(err.message, 'error');
            }
        } else if (reason !== null) {
            addToast('A reason is required to reject a request.', 'info');
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold text-dark-text">Recruiter Approvals</h1>
                <p className="text-light-text mt-1">Review and manage pending registration requests from new recruiters.</p>
            </div>
            
            <div className="bg-white p-4 rounded-xl shadow-sm">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-light">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Company / Contact</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact Info</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date Submitted</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center p-8 text-light-text">Loading requests...</td></tr>
                            ) : requests.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-8 text-light-text">No pending recruiter requests.</td></tr>
                            ) : (
                                requests.map(req => (
                                    <tr key={req._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <p className="font-semibold text-dark-text">{req.companyName}</p>
                                            <p className="text-sm text-light-text">{req.name}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                            <p>{req.email}</p>
                                            <p>{req.phone}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text capitalize">{req.companyType ? req.companyType.replace('_', ' ') : 'Unknown'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{new Date(req.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => handleApprove(req._id)} className="p-2 text-accent-green hover:bg-accent-green/10 rounded-md" title="Approve"><CheckCircleIcon className="w-5 h-5"/></button>
                                                <button onClick={() => handleReject(req._id)} className="p-2 text-red-500 hover:bg-red-100 rounded-md" title="Reject"><BanIcon className="w-5 h-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default RecruiterApprovalsPage;
