import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Job, Applicant } from '../../../packages/types';
import { fetchJobById, fetchApplicantsForJob, updateApplicantStatus, addApplicantNote } from '../../../packages/api-client';
import ApplicantCard from '../components/ApplicantCard';
import { CheckCircleIcon, DownloadIcon, MailIcon } from '../components/Icons';
import { addNotification } from '../services/notificationService';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useToast } from '../hooks/useToast';

const statusFilters: (Applicant['status'] | 'All')[] = ['All', 'New', 'Reviewed', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'];

const calculateMatchScore = (applicantSkills: string[], jobSkills: string[]): number => {
    if (!jobSkills || jobSkills.length === 0) {
        return 0;
    }
    const jobSkillSet = new Set(jobSkills.map(s => s.toLowerCase()));
    const applicantSkillSet = new Set(applicantSkills.map(s => s.toLowerCase()));

    let matchedCount = 0;
    for (const skill of applicantSkillSet) {
        if (jobSkillSet.has(skill)) {
            matchedCount++;
        }
    }

    const score = (matchedCount / jobSkillSet.size) * 100;
    return Math.min(Math.round(score), 100);
};


const ApplicantsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { addToast } = useToast();
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [activeFilter, setActiveFilter] = useState<Applicant['status'] | 'All'>('All');
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const { setCrumbs } = useBreadcrumbs();

    // Track pending changes for batch saving
    const [pendingChanges, setPendingChanges] = useState<{
        statusChanges: { [applicationId: string]: Applicant['status'] };
        noteChanges: { [applicationId: string]: string };
    }>({
        statusChanges: {},
        noteChanges: {}
    });
    const [isSaving, setIsSaving] = useState(false);

    const hasPendingChanges = Object.keys(pendingChanges.statusChanges).length > 0 || Object.keys(pendingChanges.noteChanges).length > 0;

    useEffect(() => {
        if (id) {
            setIsLoading(true);
            Promise.all([fetchJobById(id), fetchApplicantsForJob(id)])
                .then(([jobData, applicantsData]) => {
                    setJob(jobData || null);
                    if (jobData) {
                        setCrumbs([
                            { name: 'Dashboard', path: '/recruiter' },
                            { name: 'Jobs', path: '/recruiter/jobs' },
                            { name: jobData.title },
                        ]);
                    }
                    setApplicants(applicantsData);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Failed to fetch data:", error);
                    addToast('Failed to load applicants', 'error');
                    setIsLoading(false);
                });
        }
        return () => setCrumbs([]);
    }, [id, setCrumbs, addToast]);

    const filteredApplicants = useMemo(() => {
        if (activeFilter === 'All') return applicants;
        return applicants.filter(app => app.status === activeFilter);
    }, [applicants, activeFilter]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const numSelected = selectedApplicants.length;
            const numVisible = filteredApplicants.length;
            selectAllCheckboxRef.current.checked = numSelected === numVisible && numVisible > 0;
            selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numVisible;
        }
    }, [selectedApplicants, filteredApplicants]);


    const handleStatusChange = (applicationId: string, newStatus: Applicant['status']) => {
        // Update local state immediately for UI feedback
        setApplicants(prev => prev.map(app =>
            app.applicationId === applicationId ? { ...app, status: newStatus } : app
        ));

        // Track the pending change
        setPendingChanges(prev => ({
            ...prev,
            statusChanges: {
                ...prev.statusChanges,
                [applicationId]: newStatus
            }
        }));
    };

    const handleAddNote = (applicationId: string, note: string) => {
        // Track the pending note
        setPendingChanges(prev => ({
            ...prev,
            noteChanges: {
                ...prev.noteChanges,
                [applicationId]: note
            }
        }));
    };

    const handleSaveChanges = async () => {
        if (!hasPendingChanges) return;

        setIsSaving(true);
        let successCount = 0;
        let errorCount = 0;

        try {
            // Save all status changes
            for (const [applicationId, newStatus] of Object.entries(pendingChanges.statusChanges)) {
                try {
                    await updateApplicantStatus(applicationId, newStatus);
                    successCount++;

                    if (job) {
                        addNotification(applicationId, {
                            message: `Your application for <b>${job.title}</b> was updated to: <b>${newStatus}</b>`,
                            link: `/applied-jobs`,
                            type: 'status_update'
                        });
                    }
                } catch (error) {
                    console.error("Failed to update status:", error);
                    errorCount++;
                }
            }

            // Save all notes
            for (const [applicationId, note] of Object.entries(pendingChanges.noteChanges)) {
                try {
                    const response = await addApplicantNote(applicationId, note);
                    // Update the applicant's notes in the UI
                    setApplicants(prev => prev.map(app =>
                        app.applicationId === applicationId
                            ? { ...app, notes: response.notes.map((n: any) => `${n.text} (${new Date(n.date).toISOString().split('T')[0]})`) }
                            : app
                    ));
                    successCount++;
                } catch (error) {
                    console.error("Failed to add note:", error);
                    errorCount++;
                }
            }

            // Clear pending changes
            setPendingChanges({
                statusChanges: {},
                noteChanges: {}
            });

            // Show success message
            if (successCount > 0) {
                addToast(`Successfully saved ${successCount} change${successCount > 1 ? 's' : ''}`, 'success');
            }
            if (errorCount > 0) {
                addToast(`Failed to save ${errorCount} change${errorCount > 1 ? 's' : ''}`, 'error');
            }
        } catch (error: any) {
            addToast(`Failed to save changes: ${error.message}`, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSelect = (applicationId: string) => {
        setSelectedApplicants(prev => prev.includes(applicationId) ? prev.filter(id => id !== applicationId) : [...prev, applicationId]);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedApplicants(filteredApplicants.map(app => app.applicationId));
        } else {
            setSelectedApplicants([]);
        }
    };

    const handleBulkStatusUpdate = (newStatus: Applicant['status']) => {
        if (window.confirm(`Are you sure you want to update ${selectedApplicants.length} applicant(s) to "${newStatus}"?`)) {
            selectedApplicants.forEach(appId => handleStatusChange(appId, newStatus));
            setSelectedApplicants([]);
        }
    };

    const handleContact = (applicant: Applicant) => {
        alert(`A contact request has been sent to ${applicant.name}. They will be notified to share their details if they choose to.`);
    };


    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
    }

    if (!job) {
        return <div className="text-center py-10">Job not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-dark-gray">Applicants for {job.title}</h1>

                {/* Save Changes Button - Always visible */}
                <button
                    onClick={handleSaveChanges}
                    disabled={isSaving || !hasPendingChanges}
                    className={`px-6 py-2.5 font-semibold rounded-lg transition-all shadow-md flex items-center space-x-2 ${hasPendingChanges
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {isSaving ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircleIcon className="w-5 h-5" />
                            <span>
                                {hasPendingChanges
                                    ? `Save Changes (${Object.keys(pendingChanges.statusChanges).length + Object.keys(pendingChanges.noteChanges).length})`
                                    : 'Save Changes'
                                }
                            </span>
                        </>
                    )}
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center space-x-1 border-b mb-6 overflow-x-auto scrollbar-hide">
                    {statusFilters.map(status => (
                        <button
                            key={status}
                            onClick={() => { setActiveFilter(status); setSelectedApplicants([]); }}
                            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${activeFilter === status
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-gray-600 hover:text-dark-gray'
                                }`}
                        >
                            {status} ({status === 'All' ? applicants.length : applicants.filter(a => a.status === status).length})
                        </button>
                    ))}
                </div>

                {selectedApplicants.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-6 flex justify-between items-center border border-primary/20 animate-fade-in">
                        <span className="font-semibold text-primary">{selectedApplicants.length} selected</span>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => alert('Downloading resumes...')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><DownloadIcon className="w-4 h-4 mr-1.5" />Download Resumes</button>

                            {/* Bulk Status Update Dropdown */}
                            <div className="relative">
                                <select
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            handleBulkStatusUpdate(e.target.value as Applicant['status']);
                                            e.target.value = ''; // Reset dropdown
                                        }
                                    }}
                                    className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50"
                                >
                                    <option value="">Update Status</option>
                                    <option value="New">New</option>
                                    <option value="Reviewed">Reviewed</option>
                                    <option value="Shortlisted">Shortlisted</option>
                                    <option value="Interview Scheduled">Interview Scheduled</option>
                                    <option value="Hired">Hired</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <button onClick={() => alert('Opening email client...')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><MailIcon className="w-4 h-4 mr-1.5" />Send Email</button>
                        </div>
                    </div>
                )}

                {filteredApplicants.length > 0 && (
                    <div className="mb-4 flex items-center">
                        <input
                            ref={selectAllCheckboxRef}
                            type="checkbox"
                            id="select-all-job"
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="select-all-job" className="ml-2 text-sm font-medium">Select All ({filteredApplicants.length})</label>
                    </div>
                )}

                {filteredApplicants.length > 0 ? (
                    <div className="space-y-4">
                        {filteredApplicants.map(applicant => {
                            const applicantWithScore = {
                                ...applicant,
                                matchScore: calculateMatchScore(applicant.profile.skills, job.skills),
                            };
                            return (
                                <ApplicantCard
                                    key={applicant.applicationId}
                                    applicant={applicantWithScore}
                                    questions={job.questions || []}
                                    jobSkills={job.skills}
                                    onStatusChange={handleStatusChange}
                                    onAddNote={handleAddNote}
                                    isSelected={selectedApplicants.includes(applicant.applicationId)}
                                    onSelect={handleSelect}
                                    showContactSection={true}
                                    onContact={handleContact}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <h2 className="text-xl font-semibold">No applicants in this category</h2>
                        <p className="text-gray-600 mt-2">Try selecting another status from the filter bar above.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApplicantsPage;