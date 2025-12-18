import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { PencilIcon } from './Icons';

const PreferencesSidebar: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    if (!user) {
        return null; // Don't show for logged-out users
    }

    const { careerProfile } = user.profile || {};
    const { jobRole, preferredLocations, expectedSalaryAmount } = careerProfile || {};

    const formatSalary = (amount: string | undefined) => {
        if (!amount) return null;
        try {
            const number = parseInt(amount.replace(/,/g, ''), 10);
            if (isNaN(number)) return null;
            return new Intl.NumberFormat('en-IN').format(number);
        } catch {
            return null;
        }
    };

    const handleApplyPreferences = () => {
        const params = new URLSearchParams();
        if (jobRole) {
            params.set('keywords', jobRole);
        }
        if (preferredLocations && preferredLocations.length > 0) {
            params.set('location', preferredLocations.join(','));
        }
        if (expectedSalaryAmount) {
            const salaryNum = parseInt(expectedSalaryAmount.replace(/,/g, ''), 10);
            if (!isNaN(salaryNum)) {
                // Find the closest salary range from the options
                const salaryLakhs = salaryNum / 100000;
                if (salaryLakhs >= 20) params.set('salary', '20');
                else if (salaryLakhs >= 10) params.set('salary', '10-20');
                else if (salaryLakhs >= 5) params.set('salary', '5-10');
                else if (salaryLakhs > 0) params.set('salary', '0-5');
            }
        }
        navigate(`/jobs?${params.toString()}`);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 sticky top-24">
            <h3 className="text-lg font-bold text-dark-gray">Add preferences to get matching jobs</h3>

            <div className="mt-6 space-y-6">
                {/* Preferred Job Role */}
                <div>
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">Preferred job role</label>
                    </div>
                    <div className="mt-2">
                        {jobRole ? (
                             <button onClick={() => navigate('/profile/edit/career')} className="bg-gray-100 text-dark-gray text-sm font-medium px-3 py-1.5 rounded-full inline-block hover:bg-gray-200">
                                {jobRole}
                            </button>
                        ) : (
                            <button onClick={() => navigate('/profile/edit/career')} className="px-5 py-1.5 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors">
                                Add
                            </button>
                        )}
                    </div>
                </div>

                {/* Preferred Work Location */}
                <div>
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">Preferred work location</label>
                        <button onClick={() => navigate('/profile/edit/career')} className="text-primary hover:text-primary-dark p-1" aria-label="Edit preferred work location">
                           <PencilIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {(preferredLocations && preferredLocations.length > 0) ? (
                            preferredLocations.map(loc => (
                                <span key={loc} className="bg-gray-100 text-dark-gray text-sm font-medium px-3 py-1.5 rounded-full">
                                    {loc}
                                </span>
                            ))
                        ) : (
                             <p className="text-sm text-gray-400">Not specified</p>
                        )}
                    </div>
                </div>

                {/* Preferred Salary */}
                <div>
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-semibold text-gray-700">Preferred salary</label>
                         <button onClick={() => navigate('/profile/edit/career')} className="text-primary hover:text-primary-dark p-1" aria-label="Edit preferred salary">
                           <PencilIcon className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="mt-2">
                        {expectedSalaryAmount && formatSalary(expectedSalaryAmount) ? (
                             <span className="bg-gray-100 text-dark-gray text-sm font-medium px-3 py-1.5 rounded-full">
                                ₹ {formatSalary(expectedSalaryAmount)}
                            </span>
                        ) : (
                             <p className="text-sm text-gray-400">Not specified</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t pt-6">
                 <button onClick={handleApplyPreferences} className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-dark transition-colors">
                    Find Matching Jobs
                </button>
            </div>
        </div>
    );
};

export default PreferencesSidebar;