import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../../../packages/types';
import { Link } from 'react-router-dom';
import {
  EyeIcon,
  DocumentTextIcon,
  CursorClickIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  PauseIcon,
  PlaySimpleIcon,
  ArchiveBoxIcon,
  DotsVerticalIcon,
  ChevronRightIcon
} from './Icons';

type JobAction = 'edit' | 'duplicate' | 'pause' | 'resume' | 'close';

interface RecruiterJobCardProps {
  job: Job;
  onAction: (action: JobAction, jobId: string) => void;
}

const statusConfig = {
    active: { text: 'Active', bg: 'bg-green-100', text_color: 'text-green-800', dot: 'bg-green-500' },
    paused: { text: 'Paused', bg: 'bg-yellow-100', text_color: 'text-yellow-800', dot: 'bg-yellow-500' },
    closed: { text: 'Closed', bg: 'bg-gray-100', text_color: 'text-gray-800', dot: 'bg-gray-500' },
    expired: { text: 'Expired', bg: 'bg-red-100', text_color: 'text-red-800', dot: 'bg-red-500' },
    pending: { text: 'Pending', bg: 'bg-orange-100', text_color: 'text-orange-800', dot: 'bg-orange-500' },
    rejected: { text: 'Rejected', bg: 'bg-red-100', text_color: 'text-red-800', dot: 'bg-red-500' },
};

const StatItem: React.FC<{ icon: React.ReactNode, value: number, label: string }> = ({ icon, value, label }) => (
    <div className="flex items-center space-x-2 text-sm text-gray-600">
        {icon}
        <span><span className="font-bold text-dark-gray">{value}</span> {label}</span>
    </div>
);

const RecruiterJobCard: React.FC<RecruiterJobCardProps> = ({ job, onAction }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const currentStatus = statusConfig[job.status];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleActionClick = (action: JobAction) => {
    onAction(action, job.id);
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-dark-gray">{job.title}</h3>
          <p className="text-sm text-gray-500">{job.location} • Posted {job.postedDate}</p>
        </div>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0">
          <div className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${currentStatus.bg} ${currentStatus.text_color}`}>
              <span className={`w-2 h-2 rounded-full mr-1.5 ${currentStatus.dot}`}></span>
              {currentStatus.text}
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-1.5 rounded-full hover:bg-gray-100">
              <DotsVerticalIcon className="w-5 h-5 text-gray-600" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border animate-fade-in" style={{animationDuration: '150ms'}}>
                <button onClick={() => handleActionClick('edit')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <PencilIcon className="w-4 h-4 mr-2" /> Edit Job
                </button>
                <button onClick={() => handleActionClick('duplicate')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <DocumentDuplicateIcon className="w-4 h-4 mr-2" /> Duplicate
                </button>
                {job.status === 'active' ? (
                     <button onClick={() => handleActionClick('pause')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <PauseIcon className="w-4 h-4 mr-2" /> Pause
                    </button>
                ) : job.status === 'paused' ? (
                    <button onClick={() => handleActionClick('resume')} className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <PlaySimpleIcon className="w-4 h-4 mr-2" /> Resume
                    </button>
                ) : null}
                {job.status !== 'closed' && (
                    <button onClick={() => handleActionClick('close')} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <ArchiveBoxIcon className="w-4 h-4 mr-2" /> Close Job
                    </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-start sm:items-center">
         <div className="flex flex-wrap gap-x-6 gap-y-2">
            <StatItem icon={<EyeIcon className="w-5 h-5"/>} value={job.views} label="Views" />
            <StatItem icon={<DocumentTextIcon className="w-5 h-5"/>} value={job.applicants} label="Applications" />
            <StatItem icon={<CursorClickIcon className="w-5 h-5"/>} value={job.clicks} label="Clicks" />
         </div>
         <Link to={`/recruiter/job/${job.id}/applicants`} className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-semibold text-sm">
            View Applicants
            <ChevronRightIcon className="w-4 h-4 ml-1" />
         </Link>
      </div>
    </div>
  );
};

export default RecruiterJobCard;