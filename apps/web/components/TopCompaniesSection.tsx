import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Company, Job } from '../../../packages/types';
import TopCompanyCard from './TopCompanyCard';
import { ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface TopCompaniesSectionProps {
    recommendedJobs: Job[];
}

const TopCompaniesSection: React.FC<TopCompaniesSectionProps> = ({ recommendedJobs }) => {

    const { companies, subtitle } = useMemo(() => {
        if (!recommendedJobs || recommendedJobs.length === 0) {
            return { companies: [], subtitle: 'Hiring for Software Development' };
        }

        const companyFrequency = new Map<string, { company: Company, count: number }>();
        recommendedJobs.forEach(job => {
            if (job.company) {
                const existing = companyFrequency.get(job.company.id);
                if (existing) {
                    existing.count++;
                } else {
                    companyFrequency.set(job.company.id, { company: job.company, count: 1 });
                }
            }
        });
        
        const sortedCompanies = Array.from(companyFrequency.values())
            .sort((a, b) => b.count - a.count)
            .map(item => item.company);

        // Try to get a relevant industry from the top recommended job
        const topIndustry = recommendedJobs[0]?.industry || 'Software Development';

        return {
            companies: sortedCompanies.slice(0, 8),
            subtitle: `Hiring in ${topIndustry}`
        };
    }, [recommendedJobs]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

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
        if (!scrollContainer) return;
        
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
    }, [checkScrollability, companies]);
    
    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = scrollContainerRef.current.clientWidth * 0.9;
            scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };
    
    if (companies.length === 0) return null;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 my-4">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-xl font-bold text-dark-gray">Top companies</h2>
                    <p className="text-sm text-gray-500">{subtitle}</p>
                </div>
                <Link to="/companies" className="text-sm font-semibold text-primary hover:underline">
                    View all
                </Link>
            </div>

            <div className="relative group">
                {canScrollLeft && (
                    <button 
                        onClick={() => handleScroll('left')} 
                        className="absolute top-1/2 -left-5 transform -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-md border flex items-center justify-center hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Scroll left"
                    >
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600"/>
                    </button>
                )}
                <div ref={scrollContainerRef} className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide py-2 gap-4">
                    {companies.map(company => (
                        <div key={company.id} className="snap-start">
                            <TopCompanyCard company={company} />
                        </div>
                    ))}
                </div>
                {canScrollRight && (
                     <button 
                        onClick={() => handleScroll('right')} 
                        className="absolute top-1/2 -right-5 transform -translate-y-1/2 z-10 bg-white w-10 h-10 rounded-full shadow-md border flex items-center justify-center hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Scroll right"
                     >
                        <ChevronRightIcon className="w-5 h-5 text-gray-600"/>
                    </button>
                )}
            </div>
        </div>
    );
}

export default TopCompaniesSection;