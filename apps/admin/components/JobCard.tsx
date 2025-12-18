import React, { useState, useEffect } from 'react';
import * as ReactRouterDom from 'react-router-dom';
import { Job } from '../../../packages/types';
import { 
    BriefcaseIcon, 
    LocationMarkerIcon, 
    BookmarkIcon, 
    BookmarkSolidIcon,
    LightningBoltIcon,
    DocumentTextIcon,
    CheckCircleIcon
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

  return (
    <ReactRouterDom.Link 
      to={`/job/${job.id}`} 
      className="block group bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-primary/50 relative overflow-hidden"
    >
      {job.applicants > 200 && (
        <div className="absolute top-0 left-0 bg-secondary/90 text-white text-xs font-bold px-3 py-1 rounded-br-lg flex items-center gap-1 z-10">
            <LightningBoltIcon className="w-3 h-3" />
            Trending
        </div>
      )}
      
      <div className="flex flex-col h-full">
        {/* Top Section: Title/Company and Logo */}
        <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
                <h3 className="text-lg font-bold text-dark-gray group-hover:text-primary transition-colors line-clamp-2">{job.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{job.company.name}</p>
            </div>
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center">
                <span className="text-xl font-bold text-red-500">{getCompanyInitial(job.company.name)}</span>
            </div>
        </div>

        {/* Middle Section: Details */}
        <div className="mt-4 space-y-2 text-sm text-gray-700">
            <div className="flex items-center">
                <div className="flex items-center mr-4 pr-4 border-r">
                    <BriefcaseIcon className="w-4 h-4 mr-1.5 text-gray-500"/>
                    <span>{job.experience}</span>
                </div>
                <div className="flex items-center">
                    <LocationMarkerIcon className="w-4 h-4 mr-1.5 text-gray-500"/>
                    <span className="truncate">{job.location}</span>
                </div>
            </div>
             <div className="flex items-start">
                <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-500 flex-shrink-0 mt-0.5"/>
                <p className="line-clamp-1">{job.description}</p>
            </div>
        </div>

        {/* Skills Section */}
        <div className="mt-3">
             <p className="text-gray-500 text-xs line-clamp-1">
                {job.skills.join('  ·  ')}
            </p>
        </div>

        {/* Spacer to push bottom content down */}
        <div className="flex-grow"></div>

        {/* Bottom Section: Posted Date and Save */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{job.postedDate}</p>
            
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
    </ReactRouterDom.Link>
  );
};

export default JobCard;
