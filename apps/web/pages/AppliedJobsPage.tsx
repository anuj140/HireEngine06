
import React, { useState, useEffect } from 'react';
import { Application } from '../../../packages/types';
import { fetchAppliedJobs } from '../../../packages/api-client';
import ApplicationCard from '../components/ApplicationCard';
import { useToast } from '../contexts/ToastContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { ClipboardListIcon } from '../components/Icons';
import { useUserActivity } from '../contexts/UserActivityContext';

const AppliedJobsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();
  const { setCrumbs } = useBreadcrumbs();
  // DO: Add comment above each fix.
  // FIX: Use `withdrawApplication` from context for real API calls.
  const { withdrawApplication } = useUserActivity();

   useEffect(() => {
    setCrumbs([
      { name: 'Home', path: '/' },
      { name: 'Applied Jobs' }
    ]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  useEffect(() => {
    setIsLoading(true);
    fetchAppliedJobs()
        .then(data => {
            setApplications(data);
            setIsLoading(false);
        })
        .catch(err => {
            addToast('Failed to load applied jobs.', 'error');
            setIsLoading(false);
        });
  }, [addToast]);

  const handleWithdraw = async (jobId: string) => {
      // Call context function which calls API
      try {
          await withdrawApplication(jobId);
          // If successful, update local state
          setApplications(prev => prev.filter(app => app.jobId !== jobId));
          addToast('Application withdrawn successfully.', 'success');
      } catch (error) {
          // Error handled in context, no additional action needed here
      }
  };

  return (
    <div className="bg-light-gray min-h-[80vh] py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-baseline gap-3 mb-6">
            <h1 className="text-3xl font-bold text-dark-gray">My Applied Jobs</h1>
            {!isLoading && applications.length > 0 && (
                <span className="text-lg text-gray-500 font-medium">({applications.length})</span>
            )}
          </div>
          
          {isLoading ? (
             <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
             </div>
          ) : applications.length > 0 ? (
            <div className="space-y-4">
              {applications.map(app => (
                <ApplicationCard 
                  key={app.jobId} 
                  application={app}
                  onWithdraw={handleWithdraw}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                <ClipboardListIcon className="w-16 h-16 mx-auto text-gray-300" />
                <h2 className="text-xl font-semibold mt-4">You haven't applied to any jobs yet.</h2>
                <p className="text-gray-600 mt-2">Start searching for jobs to apply for your next career move.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppliedJobsPage;
