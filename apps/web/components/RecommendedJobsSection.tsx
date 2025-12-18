
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../../../packages/types';
import { fetchRecommendedJobs } from '../../../packages/api-client';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { useAuth } from '../hooks/useAuth';
import CompactJobCard from './CompactJobCard';

const RecommendedJobsSection: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Profile');
    const [allRecommendedJobs, setAllRecommendedJobs] = useState<Job[]>([]);
    const [displayedJobs, setDisplayedJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const tabs = [
        { name: 'Profile' },
        { name: 'You might like' },
    ];
    
    useEffect(() => {
        setIsLoading(true);
        fetchRecommendedJobs()
            .then(jobs => {
                setAllRecommendedJobs(jobs);
            })
            .catch(err => {
                console.error("Failed to fetch recommended jobs for section:", err);
                setAllRecommendedJobs([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [user]);

    useEffect(() => {
        if (allRecommendedJobs.length === 0) {
            setDisplayedJobs([]);
            return;
        }

        if (activeTab === 'Profile') {
            // Show top 10 jobs as they are (sorted by relevance from backend)
            setDisplayedJobs(allRecommendedJobs.slice(0, 10));
        } else if (activeTab === 'You might like') {
            // Take the next 10 and shuffle them for variety, or shuffle the first 10 if not enough jobs
            const sourceJobs = allRecommendedJobs.length > 10 ? allRecommendedJobs.slice(10, 20) : allRecommendedJobs.slice(0, 10);
            const shuffled = [...sourceJobs].sort(() => 0.5 - Math.random());
            setDisplayedJobs(shuffled);
        }
    }, [activeTab, allRecommendedJobs]);

    const checkScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth;
            setCanScrollLeft(el.scrollLeft > 5);
            setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
        }
    }, []);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer || isLoading) return;

        const timer = setTimeout(checkScrollability, 100);
        
        const observer = new ResizeObserver(checkScrollability);
        observer.observe(scrollContainer);
        scrollContainer.addEventListener('scroll', checkScrollability);

        return () => {
            clearTimeout(timer);
            if (scrollContainer) {
                observer.unobserve(scrollContainer);
                scrollContainer.removeEventListener('scroll', checkScrollability);
            }
        };
    }, [checkScrollability, displayedJobs, isLoading]);

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 260; // card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-dark-gray">Recommended jobs for you</h2>
                <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline">View all</Link>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.name}
                            onClick={() => setActiveTab(tab.name)}
                            className={`whitespace-nowrap py-3 px-1 border-b-2 font-semibold text-base ${
                                activeTab === tab.name
                                ? 'border-gray-800 text-gray-800'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                            }`}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="relative mt-4">
                <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 -mx-2 px-2 gap-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center w-full h-[180px]">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                        </div>
                    ) : displayedJobs.length > 0 ? (
                        displayedJobs.map(job => (
                           <div key={`${activeTab}-${job.id}`} className="w-[240px] flex-shrink-0 snap-start">
                                <CompactJobCard job={job} />
                           </div>
                        ))
                    ) : (
                         <div className="flex items-center justify-center w-full h-[180px]">
                            <p className="text-gray-500">No jobs found for this category.</p>
                        </div>
                    )}
                </div>

                {canScrollLeft && (
                    <button onClick={() => handleScroll('left')} className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-10 bg-white w-9 h-9 rounded-full shadow-md border flex items-center justify-center hover:bg-gray-100 transition-all" aria-label="Scroll left">
                        <ChevronLeftIcon className="w-5 h-5"/>
                    </button>
                )}
                {canScrollRight && (
                     <button onClick={() => handleScroll('right')} className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10 bg-white w-9 h-9 rounded-full shadow-md border flex items-center justify-center hover:bg-gray-100 transition-all" aria-label="Scroll right">
                        <ChevronRightIcon className="w-5 h-5"/>
                    </button>
                )}
            </div>
        </div>
    );
}

export default RecommendedJobsSection;
