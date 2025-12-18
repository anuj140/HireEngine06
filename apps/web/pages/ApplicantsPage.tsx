import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Job, Applicant } from '../../../packages/types';
import { fetchJobById } from '../../../packages/api-client';
import ApplicantCard from '../components/ApplicantCard';
// DO: Add comment above each fix.
// FIX: `ALL_RECRUITER_APPLICANTS` is now exported from the api-client/cms-data file.
import { ALL_RECRUITER_APPLICANTS } from '../../../packages/api-client/cms-data';
import { CheckCircleIcon, DownloadIcon, MailIcon } from '../components/Icons';
import { addNotification } from '../services/notificationService';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';

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
    const [job, setJob] = useState<Job | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [activeFilter, setActiveFilter] = useState<Applicant['status'] | 'All'>('All');
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const { setCrumbs } = useBreadcrumbs();
    
    useEffect(() => {
        if (id) {
            setIsLoading(true);
            fetchJobById(id)
                .then(data => {
                    setJob(data || null);
                     if (data) {
                        setCrumbs([
                            { name: 'Dashboard', path: '/recruiter' },
                            { name: 'Jobs', path: '/recruiter/jobs' },
                            { name: data.title },
                        ]);
                    }
                    const jobApplicants = ALL_RECRUITER_APPLICANTS.filter(app => app.jobId === id);
                    setApplicants(jobApplicants);
                    setIsLoading(false);
                })
                .catch(error => {
                    console.error("Failed to fetch job:", error);
                    setIsLoading(false);
                });
        }
         return () => setCrumbs([]);
    }, [id, setCrumbs]);

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
        const applicantToUpdate = ALL_RECRUITER_APPLICANTS.find(a => a.applicationId === applicationId);
        if(applicantToUpdate) {
            applicantToUpdate.status = newStatus;
    
            if(job) {
                // Create notification for job seeker using the new service
                addNotification(applicantToUpdate.id, {
                    message: `Your application for <b>${job.title}</b> was updated to: <b>${newStatus}</b>`,
                    link: `/applied-jobs`,
                    type: 'status_update'
                });
            }
        }
        setApplicants(prev => prev.map(app => app.applicationId === applicationId ? { ...app, status: newStatus } : app));
    };

    const handleAddNote = (applicationId: string, note: string) => {
        const applicantToUpdate = ALL_RECRUITER_APPLICANTS.find(a => a.applicationId === applicationId);
        if (applicantToUpdate) {
            const formattedNote = `${note} (${new Date().toISOString().split('T')[0]})`;
            applicantToUpdate.notes.push(formattedNote);
            setApplicants(prev => prev.map(app => app.applicationId === applicationId ? {...app, notes: [...app.notes, formattedNote]} : app));
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
    
    const handleBulkShortlist = () => {
        if (window.confirm(`Are you sure you want to shortlist ${selectedApplicants.length} candidates?`)) {
            selectedApplicants.forEach(appId => handleStatusChange(appId, 'Shortlisted'));
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
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-dark-gray">Applicants for {job.title}</h1>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center space-x-1 border-b mb-6 overflow-x-auto scrollbar-hide">
                    {statusFilters.map(status => (
                        <button
                            key={status}
                            onClick={() => { setActiveFilter(status); setSelectedApplicants([]); }}
                            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 ${
                                activeFilter === status
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
                        <div className="space-x-2">
                            <button onClick={() => alert('Downloading resumes...')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><DownloadIcon className="w-4 h-4 mr-1.5"/>Download Resumes</button>
                            <button onClick={handleBulkShortlist} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1.5"/>Shortlist</button>
                            <button onClick={() => alert('Opening email client...')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><MailIcon className="w-4 h-4 mr-1.5"/>Send Email</button>
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
                                    // DO: Add comment above each fix.
                                    // FIX: Changed property from 'recruiterQuestions' to 'questions' and mapped the array to pass question strings.
                                    questions={job.questions ? job.questions.map(q => q.question) : []}
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