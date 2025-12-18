import React, { useEffect } from 'react';
import { useUserActivity } from '../contexts/UserActivityContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import JobCard from '../components/JobCard';
import { BookmarkIcon } from '../components/Icons';

const SavedJobsPage: React.FC = () => {
    // DO: Add comment above each fix.
    // FIX: Destructure isSavedJobsLoading from useUserActivity hook, which is now available in the context type.
    const { savedJobs, isSavedJobsLoading } = useUserActivity();
    const { setCrumbs } = useBreadcrumbs();
    
    useEffect(() => {
        setCrumbs([
            { name: 'Home', path: '/' },
            { name: 'Saved Jobs' },
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    return (
         <div className="bg-light-gray min-h-[80vh] py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-dark-gray mb-6">My Saved Jobs</h1>
                    
                     {isSavedJobsLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : savedJobs.length > 0 ? (
                        <div className="space-y-4">
                            {savedJobs.map(job => (
                                <JobCard key={job.id} job={job} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg shadow-sm border">
                            <BookmarkIcon className="w-16 h-16 mx-auto text-gray-300" />
                            <h2 className="text-xl font-semibold mt-4">You have no saved jobs.</h2>
                            <p className="text-gray-600 mt-2">Click the bookmark icon on a job to save it for later.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SavedJobsPage;