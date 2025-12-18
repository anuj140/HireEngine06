

import React, { useState, useEffect } from 'react';
import JobCard from './JobCard';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with a named import for Link.
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchRecommendedJobs } from '../../../packages/api-client';
import { Job } from '../../../packages/types';
import TopCompaniesSection from './TopCompaniesSection';

const RecommendedJobsFeed: React.FC = () => {
    const { user } = useAuth();
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        fetchRecommendedJobs()
            .then(jobs => {
                setRecommendedJobs(jobs);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch recommended jobs:", err);
                setIsLoading(false);
            });
    }, [user]);

    return (
        <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-gray">Jobs Recommended For You</h2>
                    <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">View All</Link>
                </div>
                 <p className="text-sm text-gray-500 mt-1">Based on your profile and activity</p>
            </div>
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
            ) : (
                <>
                    <div className="space-y-4">
                        {recommendedJobs.length > 0 ? (
                            recommendedJobs.slice(0, 15).map((job, index) => (
                                <React.Fragment key={job.id}>
                                    <JobCard job={job} />
                                    {/* DO: Add comment above each fix. */}
                                    {/* FIX: Pass `recommendedJobs` prop to `TopCompaniesSection` component to resolve missing property error. */}
                                    {index === 3 && <TopCompaniesSection recommendedJobs={recommendedJobs} />}
                                </React.Fragment>
                            ))
                        ) : (
                            <div className="bg-white p-6 rounded-2xl text-center">
                                <p>No recommendations yet. Update your profile to get personalized job suggestions!</p>
                            </div>
                        )}
                    </div>
                    {recommendedJobs.length > 0 && (
                        <div className="mt-6 text-center">
                            <Link 
                                to="/jobs" 
                                className="inline-block bg-white px-8 py-3 text-base font-bold text-primary rounded-full border-2 border-primary hover:bg-primary hover:text-white transition-colors duration-300 shadow-sm hover:shadow-md"
                            >
                                View More Jobs
                            </Link>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RecommendedJobsFeed;