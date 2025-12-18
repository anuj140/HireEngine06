import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Applicant, Job } from '../../../packages/types';
// DO: Add comment above each fix.
// FIX: `ALL_RECRUITER_APPLICANTS` and `RECRUITER_POSTED_JOBS` are now exported from the api-client/cms-data file.
import { ALL_RECRUITER_APPLICANTS, RECRUITER_POSTED_JOBS } from '../../../packages/api-client/cms-data';
import ApplicantCard from '../components/ApplicantCard';
import SendMessageModal from '../components/SendMessageModal';
import { addNotification } from '../services/notificationService';
import { sendMessage } from '../services/messageService';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { UsersIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const ShortlistedCandidatesPage: React.FC = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setCrumbs } = useBreadcrumbs();
    const [allApplicants, setAllApplicants] = useState<Applicant[]>(ALL_RECRUITER_APPLICANTS);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

    useEffect(() => {
        setCrumbs([
          { name: 'Dashboard', path: '/recruiter' },
          { name: 'Shortlisted' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    const jobsById = useMemo(() => {
        return RECRUITER_POSTED_JOBS.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {} as { [key: string]: Job });
    }, []);

    const shortlistedApplicants = useMemo(() => {
        return allApplicants
            .filter(app => app.status === 'Shortlisted')
            .map(applicant => {
                const job = jobsById[applicant.jobId];
                const jobSkills = job?.skills || [];
                // In a real app, match score would be pre-calculated
                const matchScore = 76; 
                return { ...applicant, matchScore };
            });
    }, [allApplicants, jobsById]);

    const handleStatusChange = (applicationId: string, newStatus: Applicant['status']) => {
        setAllApplicants(prev => prev.map(app => app.applicationId === applicationId ? { ...app, status: newStatus } : app));
    };

    const handleAddNote = (applicationId: string, note: string) => {
        const formattedNote = `${note} (${new Date().toISOString().split('T')[0]})`;
        setAllApplicants(prev => prev.map(app => app.applicationId === applicationId ? {...app, notes: [...app.notes, formattedNote]} : app));
    };

    const openMessageModal = (applicant: Applicant) => {
        setSelectedApplicant(applicant);
        setIsMessageModalOpen(true);
    };

    const handleSendMessage = (messageContent: string) => {
        if (!selectedApplicant || !user) return;
        
        const job = jobsById[selectedApplicant.jobId];
        if (!job) return;

        sendMessage(
            user,
            { id: selectedApplicant.id, name: selectedApplicant.name },
            { id: job.id, title: job.title },
            messageContent
        );

        addNotification(selectedApplicant.id, {
            message: `You have a new message from <b>${user.name}</b> regarding <b>${job.title}</b>.`,
            link: '/profile',
            type: 'new_message',
        });
        
        addToast(`Message sent to ${selectedApplicant.name}`);
        setIsMessageModalOpen(false);
        setSelectedApplicant(null);
    };

    return (
        <>
            <div className="space-y-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-dark-gray">Shortlisted Candidates</h1>
                </div>
                {shortlistedApplicants.length > 0 ? (
                    <div className="space-y-4">
                        {shortlistedApplicants.map(applicant => {
                            const job = jobsById[applicant.jobId];
                            return (
                                <ApplicantCard 
                                    key={applicant.applicationId} 
                                    applicant={applicant} 
                                    // DO: Add comment above each fix.
                                    // FIX: Changed property from 'recruiterQuestions' to 'questions' and mapped the array to pass question strings.
                                    questions={job?.questions ? job.questions.map(q => q.question) : []}
                                    jobSkills={job?.skills || []}
                                    onStatusChange={handleStatusChange}
                                    onAddNote={handleAddNote}
                                    isSelected={false} // Selection not needed on this page
                                    onSelect={() => {}}
                                    showContactSection={true}
                                    onContact={openMessageModal}
                                    showPhoneNumber={true}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                        <UsersIcon className="w-16 h-16 mx-auto text-gray-300" />
                        <h2 className="text-xl font-semibold mt-4">No candidates have been shortlisted yet.</h2>
                        <p className="text-gray-600 mt-2">Review your applicants and shortlist the best ones to see them here.</p>
                    </div>
                )}
            </div>
            {selectedApplicant && (
                <SendMessageModal
                    isOpen={isMessageModalOpen}
                    onClose={() => setIsMessageModalOpen(false)}
                    onSend={handleSendMessage}
                    applicantName={selectedApplicant.name}
                />
            )}
        </>
    );
};

export default ShortlistedCandidatesPage;