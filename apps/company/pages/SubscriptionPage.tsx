import React, { useEffect, useState } from 'react';
import './SubscriptionPage.css';
import { useNavigate } from 'react-router-dom';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { CreditCardIcon, CheckIcon, XIcon } from '../components/Icons';
import { fetchSubscriptionPlans, fetchCurrentSubscription } from '../../../packages/api-client';
import { useToast } from '../contexts/ToastContext';

interface SubscriptionPlan {
    _id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    duration: number;
    description: string;
    popularityRank: number;
    features: {
        maxDescriptionLength: number | null;
        maxJobLocations: number;
        maxApplicationsPerJob: number | null;
        jobValidityDays: number;
        maxActiveJobs: number | null;
        prioritySupport: boolean;
        featuredJobs: boolean;
        analyticsAccess: boolean;
        canAddTeamMembers: boolean;
        maxTeamMembers: number;
        maxManagers: number;
    };
}

interface CurrentSubscription {
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled';
}

const SubscriptionPage: React.FC = () => {
    const navigate = useNavigate();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Subscription' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [plansData, subscriptionData] = await Promise.all([
                    fetchSubscriptionPlans(),
                    fetchCurrentSubscription().catch(() => null)
                ]);
                setPlans(plansData.sort((a, b) => a.popularityRank - b.popularityRank));
                setCurrentSubscription(subscriptionData);
            } catch (error: any) {
                addToast(error.message || 'Failed to load subscription data', 'error');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [addToast]);

    const formatFeatureValue = (value: number | null | boolean): string => {
        if (value === null) return 'Unlimited';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        return value.toString();
    };

    const isCurrentPlan = (planId: string) => {
        return currentSubscription?.plan?._id === planId;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Current Subscription Status */}
            {currentSubscription && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-primary/20">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-dark-gray mb-2">Current Plan: {currentSubscription.plan?.displayName || "Some plan is active but cannot fetch right now"}</h2>
                            <p className="text-gray-600 mb-4">{currentSubscription.plan?.description}</p>
                            <div className="flex items-center gap-6 text-sm">
                                <div>
                                    <span className="text-gray-500">Status:</span>
                                    <span className={`ml-2 font-semibold ${currentSubscription.status === 'active' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Expires:</span>
                                    <span className="ml-2 font-semibold text-dark-gray">
                                        {new Date(currentSubscription.endDate).toLocaleDateString('en-GB', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                                {currentSubscription.plan?.currency} {currentSubscription.plan?.price}
                            </div>
                            <div className="text-sm text-gray-500">per {currentSubscription.plan?.duration} days</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Plans Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-dark-gray mb-2">Choose Your Plan</h1>
                <p className="text-gray-600">Select the perfect plan for your hiring needs</p>
            </div>

            {/* Plans Grid */}
            <div className="cards grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const isCurrent = isCurrentPlan(plan._id);
                    const isPopular = plan.name === 'pro';

                    const isProMax = plan.name === 'pro_max';
                    const isStandard = plan.name === 'standard';

                    return (
                        <div
                            key={plan._id}
                            className={`relative w-full rounded-2xl transition-all duration-200 ${isCurrent
                                ? 'bg-white border-primary ring-4 ring-primary/10 shadow-sm'
                                : isStandard
                                    ? 'card-standard'
                                    : 'card'}
                            `}
                        >
                            {/* Popular Badge */}
                            {isPopular && !isCurrent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                                    MOST POPULAR
                                </div>
                            )}

                            {/* Current Plan Badge */}
                            {isCurrent && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                                    CURRENT PLAN
                                </div>
                            )}

                            <div className="p-6 flow">
                                {/* Plan Header */}
                                <div className="text-center mb-6">
                                    <h3 className={`text-xl font-bold text-dark-gray mb-2 ${isPopular ? 'card__heading' : ''}`}>{plan.displayName}</h3>
                                    <p className="text-sm text-gray-500 mb-4">{plan.description}</p>
                                    <div className="mb-4">
                                        <span className={`text-4xl font-bold ${isPopular ? 'card__price' : 'text-primary'}`}>{plan.currency} {plan.price}</span>
                                        <span className="text-gray-500 text-sm">/{plan.duration} days</span>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-3 mb-6 card__bullets">
                                    <div className="flex items-start text-sm">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">
                                            <strong>{formatFeatureValue(plan.features.maxActiveJobs)}</strong> Active Jobs
                                        </span>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">
                                            <strong>{formatFeatureValue(plan.features.maxApplicationsPerJob)}</strong> Applications/Job
                                        </span>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">
                                            <strong>{plan.features.jobValidityDays}</strong> Days Job Validity
                                        </span>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">
                                            <strong>{formatFeatureValue(plan.features.maxDescriptionLength)}</strong> Chars Description
                                        </span>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">
                                            <strong>{formatFeatureValue(plan.features.maxJobLocations)}</strong> Job Locations
                                        </span>
                                    </div>
                                    <div className="flex items-start text-sm">
                                        {plan.features.canAddTeamMembers ? (
                                            <>
                                                <CheckIcon className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-700">
                                                    <strong>{plan.features.maxManagers}</strong> Managers & <strong>{plan.features.maxTeamMembers}</strong> Members
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-5 h-5 text-gray-300 mr-2 flex-shrink-0 mt-0.5" />
                                                <span className="text-gray-400">No Team Addons</span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* CTA Button */}
                                <button
                                    disabled={isCurrent}
                                    onClick={() => !isCurrent && navigate(`/dashboard/subscription/plan/${plan._id}`)}
                                    className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 ${isCurrent
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : isStandard
                                            ? 'btn-standard'
                                            : 'cta'
                                        }`}
                                >
                                    {isCurrent ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'View Details & Upgrade'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feature Comparison Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                <p className="text-sm text-blue-800">
                    <strong>Need help choosing?</strong> Contact our sales team for a personalized recommendation based on your hiring volume.
                </p>
            </div>
        </div>
    );
};

export default SubscriptionPage;
