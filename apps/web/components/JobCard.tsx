
import React, { useState, useEffect } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with a named import for Link.
import { Link } from 'react-router-dom';
import { Job } from '../../../packages/types';
import { 
    BriefcaseIcon, 
    LocationMarkerIcon, 
    BookmarkIcon, 
    BookmarkSolidIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    StarIcon,
    CurrencyRupeeIcon
} from './Icons';
import { useUserActivity } from '../contexts/UserActivityContext';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const { saveJob, unsaveJob, isJobSaved, appliedJobIds } = useUserActivity();
  const [isSaved, setIsSaved] = useState(isJobSaved(job.id));
  const hasApplied = appliedJobIds.has(job.id);

  useEffect(() => {
    setIsSaved(isJobSaved(job.id));
  }, [isJobSaved, job.id]);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSaved) {
        unsaveJob(job.id);
    } else {
        saveJob(job);
    }
  };

  const getCompanyInitial = (name: string) => {
      if (!name) return '?';
      return name.charAt(0).toUpperCase();
  };

  const applicantText = job.applicants >= 100 ? '100+' : job.applicants;

  return (
    <Link 
      to={`/job/${job.id}`} 
      className="block group bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-primary/50"
    >
      <div className="flex justify-between gap-4">
        {/* Left side details */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex-grow">
            <h3 className="text-lg font-bold text-dark-gray group-hover:text-primary transition-colors truncate">{job.title}</h3>
            
            <div className="flex items-center text-sm text-gray-600 mt-1 flex-wrap">
              <span>{job.company.name}</span>
              {job.company.rating > 0 && (
                <div className="flex items-center ml-3">
                  <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="font-semibold">{job.company.rating}</span>
                  <span className="text-gray-300 mx-1.5">|</span>
                  <span>{job.company.reviews} Reviews</span>
                </div>
              )}
            </div>

            <div className="flex items-center text-sm text-gray-700 mt-4 flex-wrap">
              <div className="flex items-center">
                <BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                <span>{job.experience}</span>
              </div>
              {job.salary && job.salary !== 'Not Disclosed' && (
                <>
                  <div className="w-px h-4 bg-gray-300 mx-3"></div>
                  <div className="flex items-center">
                    <CurrencyRupeeIcon className="w-4 h-4 mr-1 text-gray-500" />
                    <span>{job.salary}</span>
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-gray-300 mx-3"></div>
              <div className="flex items-center min-w-0">
                <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0" />
                <span className="truncate">{job.location}</span>
              </div>
            </div>
            
            <div className="flex items-start mt-3 text-sm text-gray-700">
              <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="line-clamp-1">{job.description}</p>
            </div>

            <div className="mt-3">
               <p className="text-gray-500 text-xs line-clamp-1">
                  {job.skills.join('  ·  ')}
              </p>
          </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-500">
                {job.savedAt 
                    ? `Saved on: ${new Date(job.savedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` 
                    : job.postedDate
                }
            </p>
             <p className="text-xs text-gray-500 font-medium">
                 {applicantText} Applicants
             </p>
          </div>
        </div>
        
        {/* Right side logo and save button */}
        <div className="flex-shrink-0 flex flex-col justify-between items-center">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-100 flex items-center justify-center border border-gray-100">
             {job.company.logoUrl && !job.company.logoUrl.includes('placeholder') ? (
                <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-contain rounded-lg p-1" />
             ) : (
                <span className="text-2xl font-bold text-orange-400">{getCompanyInitial(job.company.name)}</span>
             )}
          </div>
          
          {hasApplied ? (
               <div className="flex items-center text-sm font-semibold text-green-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1.5" />
                  Applied
              </div>
          ) : (
              <button
                  onClick={handleSaveClick}
                  className="flex items-center text-sm font-semibold text-gray-600 hover:text-primary z-20"
                  aria-label={isSaved ? 'Unsave job' : 'Save job'}
              >
                  {isSaved ? (
                      <BookmarkSolidIcon className="w-5 h-5 mr-1.5 text-primary" />
                  ) : (
                      <BookmarkIcon className="w-5 h-5 mr-1.5" />
                  )}
                  Save
              </button>
          )}
        </div>
      </div>
    </Link>
  );
};

export default JobCard;
