import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Applicant, Job } from '../../../packages/types';
import { fetchAllApplicants, fetchRecruiterJobs, updateApplicantStatus, addApplicantNote } from '../../../packages/api-client';
import ApplicantCard from '../components/ApplicantCard';
import SendMessageModal from '../components/SendMessageModal';
import { addNotification } from '../services/notificationService';
import { sendMessage } from '../services/messageService';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { useToast } from '../hooks/useToast';
import { UsersIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

const ShortlistedCandidatesPage: React.FC = () => {
    const { user } = useCompanyAuth();
    const { addToast } = useToast();
    const { setCrumbs } = useBreadcrumbs();
    const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/recruiter' },
            { name: 'Shortlisted' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchAllApplicants(), fetchRecruiterJobs()])
            .then(([applicantsData, jobsData]) => {
                setAllApplicants(applicantsData);
                setJobs(jobsData);
            })
            .catch(err => addToast(`Error loading data: ${err.message} `, 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const jobsById = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {} as { [key: string]: Job });
    }, [jobs]);

    const shortlistedApplicants = useMemo(() => {
        return allApplicants
            .filter(app => app.status === 'Shortlisted')
            .map(applicant => {
                const job = jobsById[applicant.jobId];
                const jobSkills = job?.skills || [];
                // In a real app, match score would be pre-calculated or calculated here
                // For now, let's calculate it if possible or default
                const matchScore = applicant.matchScore || 75;
                return { ...applicant, matchScore };
            });
    }, [allApplicants, jobsById]);

    const handleStatusChange = async (applicationId: string, newStatus: Applicant['status']) => {
        try {
            await updateApplicantStatus(applicationId, newStatus);
            setAllApplicants(prev => prev.map(app => app.applicationId === applicationId ? { ...app, status: newStatus } : app));
            addToast(`Applicant status updated to ${newStatus} `);
        } catch (error: any) {
            addToast(`Failed to update status: ${error.message} `, 'error');
        }
    };

    const handleAddNote = async (applicationId: string, note: string) => {
        try {
            const response = await addApplicantNote(applicationId, note);
            setAllApplicants(prev => prev.map(app =>
                app.applicationId === applicationId
                    ? { ...app, notes: response.notes.map((n: any) => `${n.text} (${new Date(n.date).toISOString().split('T')[0]})`) }
                    : app
            ));
            addToast('Note added successfully');
        } catch (error: any) {
            addToast(`Failed to add note: ${error.message} `, 'error');
        }
    };

    const openMessageModal = (applicant: Applicant) => {
        setSelectedApplicant(applicant);
        setIsMessageModalOpen(true);
    };

    const handleSendMessage = (messageContent: string) => {
        if (!selectedApplicant || !user) return;

        const job = jobsById[selectedApplicant.jobId];
        if (!job) return;

        // DO: Add comment above each fix.
        // FIX: The `sendMessage` function expects a `TeamMember` object. Passing the `user` object directly instead of creating a new object with a non-existent `userType` property.
        sendMessage(
            user,
            { id: selectedApplicant.id, name: selectedApplicant.name },
            { id: job.id, title: job.title },
            messageContent
        );

        addNotification(selectedApplicant.id, {
            message: `You have a new message from < b > ${user.name}</b > regarding < b > ${job.title}</b >.`,
            link: '/profile',
            type: 'new_message',
        });

        addToast(`Message sent to ${selectedApplicant.name} `);
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
                                    questions={job?.questions ? job.questions : []}
                                    jobSkills={job?.skills || []}
                                    onStatusChange={handleStatusChange}
                                    onAddNote={handleAddNote}
                                    isSelected={false} // Selection not needed on this page
                                    onSelect={() => { }}
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
