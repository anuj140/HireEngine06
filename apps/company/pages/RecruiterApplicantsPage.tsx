


import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Job, Applicant, ApplicantFilters } from '../../../packages/types';
import { fetchAllApplicants, fetchRecruiterJobs, bulkUpdateApplicantStatus } from '../../../packages/api-client';
import ApplicantCard from '../components/ApplicantCard';
import ApplicantFilterSidebar from '../components/ApplicantFilterSidebar';
import { CheckCircleIcon, DownloadIcon, MailIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useToast } from '../hooks/useToast';


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

// Helper function to parse experience string like "5 Years" to a number
const parseExperience = (experienceStr: string): number => {
    if (!experienceStr) return 0;
    const match = experienceStr.match(/(\d+)/);
    return match ? parseInt(match[0], 10) : 0;
};

// Helper function to parse salary string like "₹20,00,000 P.A." to a number
const parseSalary = (salaryStr: string): number => {
    if (!salaryStr || salaryStr.toLowerCase().includes('not disclosed')) return 0;
    const numericStr = salaryStr.replace(/[₹,P.A.\s]/g, '');
    return parseInt(numericStr, 10) || 0;
};

const initialFilterState: ApplicantFilters = {
  jobTitle: '',
  applicationDate: '',
  location: '',
  qualification: '',
  status: [],
  minExperience: '',
  maxExperience: '',
  skills: '',
  minSalary: '',
  maxSalary: '',
  noticePeriod: '',
  matchScoreCategory: 'any',
  hasCoverLetter: false,
};

const RecruiterApplicantsPage: React.FC = () => {
    const [allApplicants, setAllApplicants] = useState<Applicant[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredApplicants, setFilteredApplicants] = useState<Applicant[]>([]);
    const [filters, setFilters] = useState<ApplicantFilters>(initialFilterState);
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
    const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
    const [searchParams] = useSearchParams();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    
    useEffect(() => {
        setCrumbs([
          { name: 'Dashboard', path: '/recruiter' },
          { name: 'Applicants' }
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
            .catch(err => addToast(`Error loading data: ${err.message}`, 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const jobsById = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {} as { [key: string]: Job });
    }, [jobs]);

    const applicantsWithScores = useMemo(() => {
        return allApplicants.map(applicant => {
            const job = jobsById[applicant.jobId];
            const jobSkills = job?.skills || [];
            return {
                ...applicant,
                matchScore: calculateMatchScore(applicant.profile.skills, jobSkills),
            };
        });
    }, [allApplicants, jobsById]);

    useEffect(() => {
        const urlFilters: Partial<ApplicantFilters> = {};
        for (const [key, value] of searchParams.entries()) {
            if (key === 'status') {
                urlFilters.status = value.split(',') as Applicant['status'][];
            } else if (key === 'hasCoverLetter') {
                urlFilters.hasCoverLetter = value === 'true';
            } else if (key in initialFilterState) { // ensure only valid filter keys are added
                (urlFilters as any)[key] = value;
            }
        }
        
        if (Object.keys(urlFilters).length > 0) {
            setFilters(prev => ({ ...initialFilterState, ...prev, ...urlFilters }));
        }
    }, [searchParams]);

    useEffect(() => {
        let applicantsToFilter = [...applicantsWithScores];

        // Basic Filters
        if (filters.jobTitle) {
            applicantsToFilter = applicantsToFilter.filter(app => app.jobTitle === filters.jobTitle);
        }
        if (filters.status && filters.status.length > 0) {
            applicantsToFilter = applicantsToFilter.filter(app => filters.status!.includes(app.status));
        }
        if (filters.applicationDate) {
            const daysAgo = parseInt(filters.applicationDate, 10);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
            applicantsToFilter = applicantsToFilter.filter(app => new Date(app.applicationDate) >= cutoffDate);
        }

        // Candidate Profile Filters
        const minExp = filters.minExperience ? parseInt(filters.minExperience, 10) : null;
        const maxExp = filters.maxExperience ? parseInt(filters.maxExperience, 10) : null;
        if (minExp !== null || maxExp !== null) {
            applicantsToFilter = applicantsToFilter.filter(app => {
                // DO: Add comment above each fix.
                // FIX: The 'experience' property does not exist on the Applicant type. The experience value is derived from the applicant's profile.
                const appExp = app.profile.workStatus === 'Fresher' ? 0 : parseExperience(app.profile.totalExperience?.years || '0');
                const minMatch = minExp !== null ? appExp >= minExp : true;
                const maxMatch = maxExp !== null ? appExp <= maxExp : true;
                return minMatch && maxMatch;
            });
        }
        if (filters.skills) {
            const requiredSkills = filters.skills.toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
            if (requiredSkills.length > 0) {
                applicantsToFilter = applicantsToFilter.filter(app => {
                    const applicantSkills = new Set(app.profile.skills.map(s => s.toLowerCase()));
                    return requiredSkills.every(reqSkill => applicantSkills.has(reqSkill));
                });
            }
        }
         if (filters.qualification) {
            // DO: Add comment above each fix.
            // FIX: The 'qualification' property does not exist on the Applicant type. It is derived from the applicant's education history in their profile.
            applicantsToFilter = applicantsToFilter.filter(app => (app.profile.education?.[0]?.educationLevel || '').toLowerCase().includes(filters.qualification!.toLowerCase()));
        }

        // Location Filter
        if (filters.location) {
            applicantsToFilter = applicantsToFilter.filter(app => app.location.toLowerCase().includes(filters.location!.toLowerCase()));
        }

        // Salary & Compensation Filters
        const minSal = filters.minSalary ? parseInt(filters.minSalary, 10) : null;
        const maxSal = filters.maxSalary ? parseInt(filters.maxSalary, 10) : null;
        if (minSal !== null || maxSal !== null) {
            applicantsToFilter = applicantsToFilter.filter(app => {
                const appSal = parseSalary(app.expectedSalary);
                if (appSal === 0) return false;
                const minMatch = minSal !== null ? appSal >= minSal : true;
                const maxMatch = maxSal !== null ? appSal <= maxSal : true;
                return minMatch && maxMatch;
            });
        }
        if (filters.noticePeriod) {
            applicantsToFilter = applicantsToFilter.filter(app => {
                const notice = app.noticePeriod.toLowerCase();
                const filterNotice = filters.noticePeriod;
                if (filterNotice === 'Immediate joiner' || filterNotice === '15 days') return notice.includes('15');
                if (filterNotice === '30 days') return notice.includes('1 month');
                if (filterNotice === '60+ days') return notice.includes('2 month') || notice.includes('3 month') || notice.includes('more');
                return true;
            });
        }
        
        // Application Quality Filters
        if (filters.matchScoreCategory && filters.matchScoreCategory !== 'any') {
            applicantsToFilter = applicantsToFilter.filter(app => {
                const score = app.matchScore;
                const category = filters.matchScoreCategory;
                if (category === 'high') return score >= 80;
                if (category === 'medium') return score >= 50 && score < 80;
                if (category === 'low') return score < 50;
                return true;
            });
        }
        if (filters.hasCoverLetter) {
            applicantsToFilter = applicantsToFilter.filter(app => app.coverLetter && app.coverLetter.trim() !== '');
        }

        setFilteredApplicants(applicantsToFilter);
    }, [filters, applicantsWithScores]);

    useEffect(() => {
        if (selectAllCheckboxRef.current) {
            const numSelected = selectedApplicants.length;
            const numVisible = filteredApplicants.length;
            selectAllCheckboxRef.current.checked = numSelected === numVisible && numVisible > 0;
            selectAllCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numVisible;
        }
    }, [selectedApplicants, filteredApplicants]);
    
    const handleFiltersChange = useCallback((newFilters: ApplicantFilters) => {
        setSelectedApplicants([]);
        setFilters(newFilters);
    }, []);

    const handleStatusChange = (applicationId: string, newStatus: Applicant['status']) => {
        setAllApplicants(prev => prev.map(app => app.applicationId === applicationId ? { ...app, status: newStatus } : app));
    };

    const handleAddNote = (applicationId: string, note: string) => {
        const formattedNote = `${note} (${new Date().toISOString().split('T')[0]})`;
        setAllApplicants(prev => prev.map(app => app.applicationId === applicationId ? {...app, notes: [...app.notes, formattedNote]} : app));
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

    const handleBulkShortlist = async () => {
        if (window.confirm(`Are you sure you want to shortlist ${selectedApplicants.length} candidates?`)) {
            try {
                await bulkUpdateApplicantStatus(selectedApplicants, 'Shortlisted');
                selectedApplicants.forEach(appId => {
                    handleStatusChange(appId, 'Shortlisted');
                });
                addToast(`${selectedApplicants.length} candidates have been shortlisted!`, 'success');
                setSelectedApplicants([]);
            } catch (error: any) {
                 addToast(error.message || 'Failed to perform bulk action.', 'error');
            }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
            <aside className="md:col-span-1 sticky top-24">
                <ApplicantFilterSidebar onFiltersChange={handleFiltersChange} filters={filters} jobs={jobs} />
            </aside>

            <main className="md:col-span-3">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-dark-gray">All Applicants</h1>
                    </div>
                    {selectedApplicants.length > 0 && (
                    <div className="sticky top-24 z-20 bg-blue-50 p-3 rounded-lg shadow-md mb-6 flex justify-between items-center border border-primary/20 animate-fade-in">
                        <span className="font-semibold text-primary">{selectedApplicants.length} selected</span>
                        <div className="space-x-2">
                            <button onClick={() => addToast('This feature is coming soon!', 'info')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><DownloadIcon className="w-4 h-4 mr-1.5"/>Download Resumes</button>
                            <button onClick={handleBulkShortlist} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><CheckCircleIcon className="w-4 h-4 mr-1.5"/>Shortlist</button>
                            <button onClick={() => addToast('This feature is coming soon!', 'info')} className="px-3 py-1.5 text-sm font-semibold border border-primary/50 text-primary bg-white rounded-full hover:bg-blue-100 flex items-center"><MailIcon className="w-4 h-4 mr-1.5"/>Send Email</button>
                        </div>
                    </div>
                )}
                <div className="bg-white p-4 rounded-xl shadow-sm border mb-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-bold text-dark-gray">
                            Showing {filteredApplicants.length} of {allApplicants.length} Applicants
                        </h2>
                        <p className="text-sm text-gray-600">Use the filters to narrow down your search.</p>
                    </div>
                    <div className="flex items-center">
                        <input
                            ref={selectAllCheckboxRef}
                            type="checkbox"
                            id="select-all"
                            onChange={handleSelectAll}
                            className="h-4 w-4 rounded text-primary focus:ring-primary border-gray-300"
                        />
                        <label htmlFor="select-all" className="ml-2 text-sm font-medium">Select All</label>
                    </div>
                </div>
                
                {isLoading ? (
                    <div className="text-center py-16">Loading applicants...</div>
                ) : filteredApplicants.length > 0 ? (
                    <div className="space-y-4">
                        {filteredApplicants.map(applicant => {
                            const job = jobsById[applicant.jobId];
                            const jobSkills = job?.skills || [];
                            return (
                                <ApplicantCard 
                                    key={applicant.applicationId} 
                                    applicant={applicant} 
                                    questions={job?.questions || []}
                                    jobSkills={jobSkills}
                                    onStatusChange={handleStatusChange}
                                    onAddNote={handleAddNote}
                                    isSelected={selectedApplicants.includes(applicant.applicationId)}
                                    onSelect={handleSelect}
                                />
                            );
                        })}
                    </div>
                ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                        <h2 className="text-xl font-semibold">No applicants match your filters</h2>
                        <p className="text-gray-600 mt-2">Try adjusting or clearing your filters.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default RecruiterApplicantsPage;