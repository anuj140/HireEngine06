

import React, { useEffect, useState } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with a named import for Link.
import { Link } from 'react-router-dom';
import { MOCK_HIRING_COMPANIES } from '../../../packages/api-client/cms-data';
import { StarIcon, WhatsAppIcon } from './Icons';
import { Company } from '../../../packages/types';
import { useAuth } from '../hooks/useAuth';
import { useUserActivity } from '../contexts/UserActivityContext';
import { fetchRecommendedJobs } from '../../../packages/api-client';

const RightSidebar: React.FC = () => {
    const { user } = useAuth();
    const activity = useUserActivity();
    const [suggestedSkills, setSuggestedSkills] = useState<string[]>([]);
    
    useEffect(() => {
        if (user) {
            fetchRecommendedJobs().then(recommendedJobs => {
                if (!user.profile) return;
                const userSkills = new Set((user.profile.skills || []).map(s => s.toLowerCase()));
                const skillFrequency = new Map<string, number>();

                recommendedJobs.slice(0, 20).forEach(job => {
                    (job.skills || []).forEach(skill => {
                        const skillLower = skill.toLowerCase();
                        if (!userSkills.has(skillLower)) {
                            skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
                        }
                    });
                });

                const sortedSkills = Array.from(skillFrequency.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(entry => entry[0]);

                setSuggestedSkills(sortedSkills.slice(0, 6));
            });
        }
    }, [user, activity]);

    return (
        <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-dark-gray mb-3">Get timely job updates on WhatsApp</h3>
                <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-full">
                        <WhatsAppIcon className="w-6 h-6 text-green-600 flex-shrink-0" />
                    </div>
                    <div>
                        <p className="text-xs text-gray-600">We will send you matching jobs as soon as they are posted.</p>
                    </div>
                </div>
                <button className="w-full mt-4 bg-green-500 text-white font-semibold py-2 rounded-lg text-sm hover:bg-green-600 transition-colors">
                    Enable Now
                </button>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-dark-gray mb-4">Featured companies</h3>
                <div className="space-y-4">
                    {MOCK_HIRING_COMPANIES.slice(0, 4).map((company: Company) => (
                        <div key={company.id} className="flex items-start space-x-3">
                            <img src={company.logoUrl} alt={`${company.name} logo`} className="w-10 h-10 rounded-lg" />
                            <div>
                                <Link to={`/jobs?keywords=${encodeURIComponent(company.name)}`} className="font-semibold text-dark-gray text-sm hover:text-primary leading-tight block">{company.name}</Link>
                                <div className="flex items-center text-xs text-gray-600">
                                    <StarIcon className="w-3 h-3 text-yellow-500 mr-1" />
                                    <span>{company.rating} | {company.reviews} Reviews</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                 <Link to="/companies" className="block text-center text-primary font-semibold text-sm hover:underline mt-4 pt-3 border-t">
                    View all
                 </Link>
            </div>

            {user && suggestedSkills.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-dark-gray mb-4">Top skills to learn</h3>
                    <div className="flex flex-wrap gap-2">
                        {suggestedSkills.map(skill => (
                            <Link to={`/jobs?keywords=${encodeURIComponent(skill)}`} key={skill} className="text-sm font-semibold text-primary bg-blue-100 px-3 py-1.5 rounded-full hover:bg-blue-200 transition-all">
                                {skill}
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RightSidebar;