
import React, { useState, useEffect } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Job, Application, User } from '../../../packages/types';
import { fetchJobById, fetchRecommendedJobs } from '../../../packages/api-client';
import { 
    BriefcaseIcon, 
    CurrencyRupeeIcon, 
    LocationMarkerIcon, 
    StarIcon, 
    BookmarkIcon, 
    BookmarkSolidIcon,
    CheckCircleIcon,
    UsersIcon,
    CloseIcon
} from '../components/Icons';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { useBreadcrumbs, Crumb } from '../contexts/BreadcrumbContext';
import { useUserActivity } from '../contexts/UserActivityContext';

const SimilarJobCard: React.FC<{ job: Job }> = ({ job }) => (
  <Link to={`/job/${job.id}`} className="block p-4 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="flex items-start justify-between">
      <div>
        <h4 className="font-semibold text-dark-gray hover:text-primary">{job.title}</h4>
        <p className="text-sm text-dark-gray">{job?.company?.name || 'Confidential'}</p>
        <div className="flex items-center text-xs text-gray-600 mt-1">
          <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />
          <span>{job?.company?.rating || 0}</span>
          <span className="mx-1">|</span>
          <span>{job?.company?.reviews || 0} Reviews</span>
        </div>
        <div className="flex items-center text-sm text-dark-gray mt-2">
            <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-500"/>
            {job.location}
        </div>
      </div>
      {job?.company?.logoUrl && (
          <img src={job.company.logoUrl} alt={job.company.name} className="w-12 h-12 rounded-md flex-shrink-0 ml-4 object-contain" />
      )}
    </div>
    <p className="text-xs text-gray-500 text-right mt-2">Posted {job.postedDate}</p>
  </Link>
);

// DO: Add comment above each fix.
// FIX: Added 'Interview Scheduled' and 'Hired' to the statusStyles object to match the Application['status'] type definition.
const statusStyles: { [key in Application['status']]: string } = {
  Applied: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  Viewed: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  Shortlisted: 'bg-green-100 text-green-800 ring-green-600/20',
  'Interview Scheduled': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  Hired: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  Rejected: 'bg-red-100 text-red-800 ring-red-600/20',
};

const ApplicationStatusCard: React.FC<{ application: Application }> = ({ application }) => (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold text-dark-gray mb-3">Your Application</h3>
        <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Applied on:</span>
                <span className="font-semibold text-dark-gray">
                    {new Date(application.appliedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ring-1 ${statusStyles[application.status]}`}>
                    {application.status}
                </span>
            </div>
        </div>
        <Link to="/applied-jobs" className="block text-center mt-4 text-primary font-semibold text-sm hover:underline">
            View all applications
        </Link>
    </div>
);

// --- Job Match Score Component ---
const MatchItem: React.FC<{ label: string; isMatch: boolean }> = ({ label, isMatch }) => (
    <div className="flex items-center gap-2">
        {isMatch ? (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
        ) : (
            <div className="w-5 h-5 rounded-full border border-gray-400 flex items-center justify-center">
                 <span className="text-xs text-gray-400 font-bold">✕</span>
            </div>
        )}
        <span className={`text-sm ${isMatch ? 'text-dark-gray font-medium' : 'text-gray-500'}`}>{label}</span>
    </div>
);

const JobMatchScore: React.FC<{ job: Job; user: User }> = ({ job, user }) => {
    // 1. Early Applicant: < 50 applicants OR posted < 7 days ago
    const isEarlyApplicant = (() => {
        if (job.applicants < 50) return true;
        // Note: 'postedDate' in Job type is a relative string (e.g., "2 days ago"). 
        // Real implementation would use 'createdAt' if available, or rely on the string if necessary.
        // Assuming simple string check for now as createdAt isn't always in frontend type
        if (job.postedDate && (job.postedDate.includes('day') || job.postedDate.includes('hour') || job.postedDate.includes('Just now'))) return true;
        return false;
    })();

    // 2. Keyskills: Check overlap
    const isSkillMatch = (() => {
        if (!user.profile?.skills || user.profile.skills.length === 0) return false;
        const userSkills = user.profile.skills.map(s => s.toLowerCase());
        const jobSkills = (job.skills || []).map(s => s.toLowerCase());
        // Match if user has at least one skill required by job
        return jobSkills.some(skill => userSkills.includes(skill));
    })();

    // 3. Location: Fuzzy match
    const isLocationMatch = (() => {
        if (!user.profile?.location && !user.profile?.currentLocation?.city) return false;
        const userLoc = (user.profile.currentLocation?.city || user.profile.location || "").toLowerCase();
        const jobLoc = (job.location || "").toLowerCase();
        return jobLoc.includes(userLoc) || userLoc.includes(jobLoc) || jobLoc.includes('remote');
    })();

    // 4. Work Experience: Parsing comparison
    const isExperienceMatch = (() => {
        const userExpYears = parseInt(user.profile?.totalExperience?.years || '0', 10);
        // Try to extract min years from job string like "3-5 Yrs"
        const jobMinExpMatch = (job.experience || "").match(/(\d+)/);
        const jobMinExp = jobMinExpMatch ? parseInt(jobMinExpMatch[0], 10) : 0;
        
        // Logic: User exp >= Job min exp (-1 year buffer for flexibility)
        return userExpYears >= (jobMinExp - 1);
    })();

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm mt-6">
            <h3 className="text-lg font-bold text-dark-gray mb-4">Job match score</h3>
            <div className="flex flex-wrap gap-6">
                <MatchItem label="Early Applicant" isMatch={isEarlyApplicant} />
                <MatchItem label="Keyskills" isMatch={isSkillMatch} />
                <MatchItem label="Location" isMatch={isLocationMatch} />
                <MatchItem label="Work Experience" isMatch={isExperienceMatch} />
            </div>
        </div>
    );
};


const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { setCrumbs } = useBreadcrumbs();
  const { viewJob, saveJob, unsaveJob, isJobSaved, appliedJobIds } = useUserActivity();

  useEffect(() => {
    return () => setCrumbs([]);
  }, [setCrumbs]);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      window.scrollTo(0, 0);
      viewJob(id);
      
      Promise.all([fetchJobById(id), fetchRecommendedJobs()])
        .then(([jobData, recommendedJobs]) => {
          if (jobData) {
            setJob(jobData);
            setCrumbs([
                { name: 'Home', path: '/' },
                { name: 'Jobs', path: '/jobs' },
                { name: jobData.title }
            ]);
            // Filter similar jobs from recommendations
            const filtered = recommendedJobs.filter(j => j.id !== jobData.id && (j.industry === jobData.industry || j.skills.some(s => jobData.skills.includes(s))));
            setSimilarJobs(filtered.slice(0, 5));
          } else {
            setJob(null);
             setCrumbs([ { name: 'Home', path: '/' }, { name: 'Jobs', path: '/jobs' }, { name: 'Not Found' } ]);
          }
        })
        .catch(error => {
            console.error("Failed to fetch job data:", error);
            setJob(null);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, setCrumbs, viewJob]);

  const handleApplyClick = () => {
    if (!user) {
      navigate(`/login?redirect=/job/${id}`);
      return;
    }

    if ((user.profile?.profileCompletion || 0) < 60) {
        addToast('Please complete your profile to at least 60% before applying.', 'info');
        navigate('/profile');
        return;
    }
    navigate(`/apply/${id}`);
  };
  
  const handleSaveClick = () => {
    if (!job) return;
    if (isJobSaved(job.id)) {
        unsaveJob(job.id);
    } else {
        saveJob(job);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-[80vh]"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (!job) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4">
            <h2 className="text-2xl font-bold text-dark-gray mb-2">Job not found</h2>
            <p className="text-gray-600 mb-6">The job you are looking for might have been removed or expired.</p>
            <Link to="/jobs" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">Browse Jobs</Link>
        </div>
    );
  }
  
  const isSaved = isJobSaved(job.id);
  const hasApplied = appliedJobIds.has(job.id);
  const applicantDisplay = job.applicants >= 100 ? '100+ Applicants' : `${job.applicants} Applicants`;

  // Safety check to prevent white screen if company details are missing
  const companyName = job.company?.name || 'Confidential';
  const logoUrl = job.company?.logoUrl || 'https://via.placeholder.com/150';

  return (
    <div className="bg-light-gray">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-dark-gray">{job.title}</h1>
                        <div className="flex items-center text-dark-gray mt-1">
                            <span>{companyName}</span>
                            {job.company?.rating > 0 && (
                                <>
                                    <span className="flex items-center ml-3">
                                        <StarIcon className="w-4 h-4 text-yellow-500 mr-1" /> {job.company.rating}
                                    </span>
                                    <span className="text-gray-500 ml-2">({job.company.reviews} Reviews)</span>
                                </>
                            )}
                        </div>
                    </div>
                    <img src={logoUrl} alt={companyName} className="w-16 h-16 rounded-md mt-4 sm:mt-0 flex-shrink-0 object-contain" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-dark-gray my-6">
                    <div className="flex items-center"><BriefcaseIcon className="w-5 h-5 mr-2 text-gray-500" />{job.experience}</div>
                    <div className="flex items-center"><CurrencyRupeeIcon className="w-5 h-5 mr-2 text-gray-500" />{job.salary}</div>
                    <div className="flex items-center"><LocationMarkerIcon className="w-5 h-5 mr-2 text-gray-500" />{job.location}{job.location === 'Remote' && ', Hiring office located in India'}</div>
                    <div className="flex items-center"><UsersIcon className="w-5 h-5 mr-2 text-gray-500" />{applicantDisplay}</div>
                </div>

                <div className="flex items-center justify-between border-t pt-4">
                     <div className="text-xs text-gray-500 space-x-4">
                        <span>Posted: {job.postedDate}</span>
                        <span>Openings: {job.openings}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                         <button onClick={handleSaveClick} className={`px-5 py-2 font-semibold border rounded-full transition-colors flex items-center ${isSaved ? 'bg-blue-100 text-primary border-primary/30' : 'text-primary border-primary hover:bg-primary/5'}`}>
                            {isSaved ? <BookmarkSolidIcon className="w-5 h-5 mr-2"/> : <BookmarkIcon className="w-5 h-5 mr-2" />}
                            {isSaved ? 'Saved' : 'Save'}
                        </button>
                        {hasApplied ? (
                            <button disabled className="px-5 py-2 bg-gray-300 text-gray-500 rounded-full font-semibold flex items-center cursor-not-allowed">
                                <CheckCircleIcon className="w-5 h-5 mr-2" />
                                Applied
                            </button>
                        ) : (
                           <button onClick={handleApplyClick} className="px-5 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-semibold">Apply</button>
                        )}
                    </div>
                </div>
            </div>

            {job.jobHighlights && job.jobHighlights.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h2 className="text-lg font-bold text-dark-gray mb-3">Job highlights</h2>
                    <ul className="list-disc list-inside space-y-2 text-dark-gray">
                        {job.jobHighlights.map((highlight, index) => (
                            <li key={index}>{highlight}</li>
                        ))}
                    </ul>
                </div>
            )}

             <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-dark-gray mb-3">Job description</h2>
                <div className="prose prose-sm max-w-none text-dark-gray whitespace-pre-line">
                   {job.description}
                </div>
                <div className="mt-6">
                    <h3 className="font-semibold mb-3">Key Skills</h3>
                    <div className="flex flex-wrap gap-2">
                    {(job.skills || []).map(skill => (
                        <span key={skill} className="bg-blue-50 text-primary-dark text-xs font-semibold px-2.5 py-1 rounded-md">{skill}</span>
                    ))}
                    </div>
                </div>
            </div>

            {/* Job Match Score Section - Displayed if user is logged in */}
            {user && <JobMatchScore job={job} user={user} />}

          </div>
          <aside className="space-y-6 lg:sticky top-24">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
                <h3 className="text-lg font-bold text-dark-gray mb-2 px-4">Jobs you might be interested in</h3>
                <div className="divide-y">
                    {similarJobs.length > 0 ? (
                        similarJobs.map(sjob => (
                            <SimilarJobCard key={sjob.id} job={sjob} />
                        ))
                    ) : (
                        <p className="text-gray-500 text-sm p-4">No similar jobs found at the moment.</p>
                    )}
                </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
