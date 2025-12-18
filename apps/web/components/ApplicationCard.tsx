
import React from 'react';
import { Link } from 'react-router-dom';
import { Application } from '../../../packages/types';
import { CalendarIcon } from './Icons';

const statusStyles: { [key in Application['status']]: string } = {
  Applied: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  Viewed: 'bg-indigo-100 text-indigo-800 ring-indigo-600/20',
  Shortlisted: 'bg-green-100 text-green-800 ring-green-600/20',
  'Interview Scheduled': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
  Hired: 'bg-purple-100 text-purple-800 ring-purple-600/20',
  Rejected: 'bg-red-100 text-red-800 ring-red-600/20',
};

interface ApplicationCardProps {
  application: Application;
  onWithdraw: (jobId: string) => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onWithdraw }) => {
  const handleWithdrawClick = () => {
    if (window.confirm(`Are you sure you want to withdraw your application for "${application.jobTitle}"?`)) {
      onWithdraw(application.jobId);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <Link to={`/job/${application.jobId}`} className="text-lg font-bold text-dark-gray hover:text-primary transition-colors">
            {application.jobTitle}
          </Link>
          <p className="text-base text-gray-700 mt-1">{application.companyName}</p>
        </div>
        <div className={`mt-1 sm:mt-0 text-xs font-bold px-3 py-1 rounded-full ring-1 whitespace-nowrap ${statusStyles[application.status] || 'bg-gray-100 text-gray-800'}`}>
          {application.status}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center text-sm text-gray-600">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-400" />
          <span>Applied on <span className="font-semibold text-dark-gray">{formatDate(application.appliedDate)}</span></span>
        </div>
        <button 
            onClick={handleWithdrawClick} 
            className="px-4 py-2 text-xs font-semibold border border-gray-300 text-gray-600 rounded-full hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
};

export default ApplicationCard;
