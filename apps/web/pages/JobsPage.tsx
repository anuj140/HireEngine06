
import React, { useState, useEffect, useMemo, useCallback } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with a named import for useSearchParams.
import { useSearchParams } from 'react-router-dom';
import JobCard from '../components/JobCard';
import FilterSidebar from '../components/FilterSidebar';
import { Job, Filters, JobAlert, Company } from '../../../packages/types';
import { fetchJobs, createJobAlert } from '../../../packages/api-client';
import PreferencesSidebar from '../components/PreferencesSidebar';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { CloseIcon, SparklesIcon, UserCircleIcon } from '../components/Icons';
import CreateAlertCard from '../components/CreateAlertCard';
import JobAlertModal from '../components/JobAlertModal';
import { useToast } from '../contexts/ToastContext';
import MobileJobFilters from '../components/MobileJobFilters';
import { useAuth } from '../hooks/useAuth';
import { formatSearchDisplay } from '../utils/searchParser';
import CompanySearchHeader from '../components/CompanySearchHeader';

const salaryOptions = [
  { value: '0-5', label: '₹0-5 Lakhs', count: 50 },
  { value: '5-10', label: '₹5-10 Lakhs', count: 110 },
  { value: '10-20', label: '₹10-20 Lakhs', count: 90 },
  { value: '20', label: '₹20+ Lakhs', count: 40 },
];
const jobTypeOptions = [
  { value: 'Full-time', label: 'Full-time', count: 250 },
  { value: 'Contract', label: 'Contract', count: 25 },
  { value: 'Internship', label: 'Internship', count: 15 },
];
const datePostedOptions = [
  { value: '1', label: 'Last 24 hours' },
  { value: '3', label: 'Last 3 days' },
  { value: '7', label: 'Last 7 days' },
  { value: '14', label: 'Last 14 days' },
  { value: '30', label: 'Last 30 days' },
];
const experienceOptions = [
  { value: '0', label: 'Fresher (<1 Year)' },
  { value: '1', label: '1 Year' },
  { value: '3', label: '3 Years' },
  { value: '5', label: '5 Years' },
  { value: '10', label: '10+ Years' },
];
const filterOptionsMap: { [key: string]: { value: string; label: string; count?: number }[] } = {
  salary: salaryOptions,
  jobType: jobTypeOptions,
  postedDate: datePostedOptions,
  experience: experienceOptions
};

const filterKeyToLabelMap: Record<string, string> = {
  keywords: 'Keywords',
  location: 'Location',
  experience: 'Experience',
  salary: 'Salary',
  jobType: 'Job Type',
  postedDate: 'Posted Within'
};

const SubNavTab: React.FC<{
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-full border transition-all ${isActive
        ? 'bg-primary/10 text-primary border-primary/20 shadow-sm'
        : 'text-gray-600 border-transparent hover:bg-gray-100'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);


const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // New state for Company Search view
  const [isCompanySearch, setIsCompanySearch] = useState(false);
  const [companyResult, setCompanyResult] = useState<{ profile: Company, jobs: Job[], relatedJobs: Job[] } | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { setCrumbs } = useBreadcrumbs();
  const { addToast } = useToast();
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const filters: Partial<Filters> = useMemo(() => {
    const newFilters: Partial<Filters> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key === 'jobType' || key === 'salary') {
        newFilters[key] = value.split(',');
      } else {
        (newFilters as any)[key] = value;
      }
    }
    return newFilters;
  }, [searchParams]);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(value => {
      if (Array.isArray(value)) return value.length > 0;
      return !!value;
    });
  }, [filters]);

  const pageTitle = useMemo(() => {
    const displayString = formatSearchDisplay({
      keywords: filters.keywords,
      location: filters.location,
      experience: filters.experience,
    });
    return displayString === 'Search jobs' ? 'All Jobs' : `${displayString} Jobs`;
  }, [filters]);

  useEffect(() => {
    setCrumbs([
      { name: 'Home', path: '/' },
      { name: 'Jobs' }
    ]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  useEffect(() => {
    const fetchAndSetJobs = async () => {
      setIsLoading(true);
      try {
        const data = await fetchJobs(filters);

        if (data.isCompanySearch && data.companyProfile) {
          setIsCompanySearch(true);
          setCompanyResult({
            profile: data.companyProfile,
            jobs: data.companyJobs || [],
            relatedJobs: data.relatedJobs || []
          });
          // Also set main list for fallback if needed, or for sidebar count
          setJobs(data.companyJobs || []);
          setTotalJobs(data.totalJobs || 0);
        } else {
          setIsCompanySearch(false);
          setCompanyResult(null);
          setJobs(data.jobs || []);
          setTotalJobs(data.totalJobs || 0);
        }

      } catch (error) {
        console.error("Failed to fetch jobs:", error);
        setJobs([]);
        setTotalJobs(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndSetJobs();
  }, [filters]);

  const handleSaveAlert = async (alertData: Omit<JobAlert, 'id' | 'createdDate'>) => {
    try {
      await createJobAlert(alertData);
      addToast('Job alert created successfully!');
      setIsAlertModalOpen(false);
    } catch (e) {
      addToast('Failed to create alert.', 'error');
    }
  };

  const handleFiltersChange = useCallback((newFilters: Partial<Filters>) => {
    const newSearchParams = new URLSearchParams();
    for (const key in newFilters) {
      const value = (newFilters as any)[key];
      if (value && value.length > 0) {
        newSearchParams.set(key, Array.isArray(value) ? value.join(',') : value);
      }
    }
    setSearchParams(newSearchParams);
  }, [setSearchParams]);

  const getFilterLabel = (key: string, value: string): string => {
    const options = filterOptionsMap[key];
    if (options) {
      const option = options.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    if (key === 'experience') {
      const option = experienceOptions.find(opt => opt.value === value);
      return option ? option.label : value;
    }
    return value;
  };

  const appliedFilterTags = useMemo(() => {
    const tags: { key: string; value: string; label: string }[] = [];
    for (const [key, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue;

      if (Array.isArray(value)) {
        value.forEach(v => tags.push({ key, value: v, label: getFilterLabel(key, v) }));
      } else {
        tags.push({ key, value, label: getFilterLabel(key, value) });
      }
    }
    return tags;
  }, [filters]);

  const removeFilter = useCallback((key: string, valueToRemove: string) => {
    const currentValues = (filters as any)[key];
    if (Array.isArray(currentValues)) {
      handleFiltersChange({
        ...filters,
        [key]: currentValues.filter(v => v !== valueToRemove),
      });
    } else {
      const newFilters = { ...filters };
      delete (newFilters as any)[key];
      handleFiltersChange(newFilters);
    }
  }, [filters, handleFiltersChange]);

  // --- Personalized Search Logic ---
  const recommendationKeywords = useMemo(() => {
    if (!user?.profile) return '';
    const skills = user.profile.skills || [];
    const itSkills = user.profile.itSkills || [];
    return [...skills, ...itSkills].filter(Boolean).join(',');
  }, [user]);

  const profileKeywords = useMemo(() => {
    if (!user?.profile?.careerProfile) return '';
    const { currentIndustry, department, roleCategory, jobRole } = user.profile.careerProfile;
    return [currentIndustry, department, roleCategory, jobRole].filter(Boolean).join(',');
  }, [user]);

  const handleRecommendationSearch = () => {
    if (recommendationKeywords) {
      handleFiltersChange({ keywords: recommendationKeywords });
    } else {
      addToast("Please add skills to your profile for recommendations.", "info");
    }
  };

  const handleProfileSearch = () => {
    if (profileKeywords) {
      handleFiltersChange({ keywords: profileKeywords });
    } else {
      addToast("Please complete your career profile for suggestions.", "info");
    }
  };

  const activeSubNav = useMemo(() => {
    const currentKeywords = filters.keywords?.split(',').sort().join(',');
    if (!currentKeywords) return null;
    if (currentKeywords === recommendationKeywords.split(',').sort().join(',')) return 'recommendation';
    if (currentKeywords === profileKeywords.split(',').sort().join(',')) return 'profile';
    return null;
  }, [filters.keywords, recommendationKeywords, profileKeywords]);

  return (
    <>
      <div className="bg-light-gray">
        <div className="container mx-auto px-4 py-8">

          {/* Header Section */}
          <div className="mb-4">
            {!isCompanySearch && (
              <h1 className="text-2xl font-bold text-dark-gray mb-4 capitalize">
                {pageTitle}
                {!isLoading && <span className="text-base font-normal text-gray-500 ml-2">({totalJobs.toLocaleString()} results)</span>}
              </h1>
            )}

            {appliedFilterTags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="font-semibold text-sm">Applied filters:</span>
                {appliedFilterTags.map(tag => (
                  <div key={`${tag.key}-${tag.value}`} className="flex items-center bg-blue-100 text-primary text-sm font-medium pl-3 pr-2 py-1 rounded-full">
                    <span>{filterKeyToLabelMap[tag.key]}: {tag.label}</span>
                    <button onClick={() => removeFilter(tag.key, tag.value)} className="ml-2 text-primary/70 hover:text-primary">
                      <CloseIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleFiltersChange({})}
                  className="text-sm font-semibold text-primary hover:underline ml-2"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left Sidebar (Filters) */}
            <aside className="hidden lg:block lg:col-span-3 lg:sticky top-24">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                salaryOptions={salaryOptions}
                jobTypeOptions={jobTypeOptions}
                datePostedOptions={datePostedOptions}
                experienceOptions={experienceOptions}
              />
            </aside>

            {/* Main Content */}
            <main className={user ? "lg:col-span-6" : "lg:col-span-9"}>
              <div className="lg:hidden mb-4">
                <MobileJobFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  options={{
                    salary: salaryOptions,
                    jobType: jobTypeOptions,
                    postedDate: datePostedOptions,
                    experience: experienceOptions,
                  }}
                />
              </div>

              <div className="space-y-4">
                {/* Recommendations Tabs */}
                {!isCompanySearch && user && (
                  <div className="bg-white p-2 rounded-xl shadow-sm border hidden lg:block">
                    <div className="flex items-center space-x-2">
                      <SubNavTab
                        label="Recommendation"
                        icon={<SparklesIcon className="w-5 h-5" />}
                        isActive={activeSubNav === 'recommendation'}
                        onClick={handleRecommendationSearch}
                      />
                      <SubNavTab
                        label="Profile"
                        icon={<UserCircleIcon className="w-5 h-5" />}
                        isActive={activeSubNav === 'profile'}
                        onClick={handleProfileSearch}
                      />
                    </div>
                  </div>
                )}

                {hasActiveFilters && !isLoading && !isCompanySearch && (
                  <CreateAlertCard onClick={() => setIsAlertModalOpen(true)} />
                )}

                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-white p-4 rounded-2xl shadow-sm animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                      </div>
                    ))}
                  </div>
                ) : isCompanySearch && companyResult ? (
                  // --- Company Search View ---
                  <div className="space-y-8">
                    <CompanySearchHeader company={companyResult.profile} />

                    <div>
                      <h2 className="text-xl font-bold text-dark-gray mb-4">Jobs at {companyResult.profile.name}</h2>
                      <div className="space-y-4">
                        {companyResult.jobs.length > 0 ? (
                          companyResult.jobs.map(job => <JobCard key={job.id} job={job} />)
                        ) : (
                          <div className="text-gray-500 text-center py-8 bg-white rounded-lg border">No active jobs found for this company at the moment.</div>
                        )}
                      </div>
                    </div>

                    {companyResult.relatedJobs.length > 0 && (
                      <div>
                        <h2 className="text-xl font-bold text-dark-gray mb-4">Related Jobs in {companyResult.profile.industry || 'Industry'}</h2>
                        <div className="space-y-4">
                          {companyResult.relatedJobs.map(job => <JobCard key={job.id} job={job} />)}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // --- Standard List View ---
                  <div className="space-y-4">
                    {jobs.length > 0 ? (
                      jobs.map(job => <JobCard key={job.id} job={job} />)
                    ) : (
                      <div className="text-center py-10 bg-white rounded-lg">
                        <h2 className="text-xl font-semibold">No jobs found</h2>
                        <p className="text-gray-600 mt-2">Try adjusting your search filters.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </main>

            {/* Right Sidebar (Preferences) - Only show for logged-in users */}
            {user && (
              <aside className="hidden lg:block lg:col-span-3">
                <PreferencesSidebar />
              </aside>
            )}
          </div>
        </div>
      </div>
      <JobAlertModal
        isOpen={isAlertModalOpen}
        onClose={() => setIsAlertModalOpen(false)}
        onSave={handleSaveAlert}
        initialData={{
          name: `Jobs for "${filters.keywords || 'New Search'}" in ${filters.location || 'Any Location'}`,
          keywords: filters.keywords || '',
          location: filters.location || '',
          jobTypes: (filters.jobType as Job['jobType'][]) || [],
          frequency: 'daily'
        }}
      />
    </>
  );
};

export default JobsPage;
