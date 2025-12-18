import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { CheckIcon, XIcon, ArrowLeftIcon } from '../components/Icons';
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
    };
}

interface CurrentSubscription {
    plan: SubscriptionPlan;
    startDate: string;
    endDate: string;
    status: 'active' | 'expired' | 'cancelled';
}

const PlanDetailsPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
    const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Subscription', path: '/dashboard/subscription' },
            { name: 'Plan Details' }
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

                const selectedPlan = plansData.find((p: SubscriptionPlan) => p._id === planId);
                if (!selectedPlan) {
                    addToast('Plan not found', 'error');
                    navigate('/dashboard/subscription');
                    return;
                }

                setPlan(selectedPlan);
                setCurrentSubscription(subscriptionData);
            } catch (error: any) {
                addToast(error.message || 'Failed to load plan details', 'error');
                navigate('/dashboard/subscription');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [planId, addToast, navigate]);

    const handleProceedToPayment = () => {
        navigate(`/dashboard/subscription/payment/${planId}`);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!plan) {
        return null;
    }

    const isCurrentPlan = currentSubscription?.plan?._id === planId;
    const isDowngrade = currentSubscription && currentSubscription.plan.price > plan.price;

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Back Button */}
            <button
                onClick={() => navigate('/dashboard/subscription')}
                className="flex items-center text-primary hover:text-primary-dark transition-colors"
            >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to Plans
            </button>

            {/* Plan Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-2xl p-8 shadow-xl">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2">{plan.displayName}</h1>
                        <p className="text-blue-100 text-lg mb-4">{plan.description}</p>
                        {isCurrentPlan && (
                            <span className="inline-block bg-white text-primary px-4 py-1 rounded-full text-sm font-bold">
                                Your Current Plan
                            </span>
                        )}
                    </div>
                    <div className="text-right">
                        <div className="text-5xl font-bold mb-1">
                            {plan.currency} {plan.price}
                        </div>
                        <div className="text-blue-100">per {plan.duration} days</div>
                    </div>
                </div>
            </div>

            {/* Current Plan Info */}
            {currentSubscription && !isCurrentPlan && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h3 className="font-semibold text-dark-gray dark:text-dark-text mb-2">
                        {isDowngrade ? '⚠️ Downgrade Notice' : '✨ Upgrade Benefits'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-dark-text-secondary">
                        {isDowngrade
                            ? `You are currently on the ${currentSubscription.plan.displayName} plan. Downgrading will reduce your available features.`
                            : `You are currently on the ${currentSubscription.plan.displayName} plan. Upgrading will unlock additional features immediately.`
                        }
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Features Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-dark-light-background rounded-2xl p-6 shadow-sm border dark:border-dark-border">
                        <h2 className="text-2xl font-bold text-dark-gray dark:text-dark-text mb-6">What's Included</h2>

                        <div className="space-y-6">
                            {/* Job Posting Features */}
                            <div>
                                <h3 className="font-semibold text-lg text-dark-gray dark:text-dark-text mb-3 flex items-center">
                                    <span className="bg-primary/10 p-2 rounded-lg mr-3">📝</span>
                                    Job Posting
                                </h3>
                                <div className="space-y-3 ml-11">
                                    <div className="flex items-start">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-dark-gray dark:text-dark-text">
                                                {plan.features.maxActiveJobs === null ? 'Unlimited' : plan.features.maxActiveJobs} Active Jobs
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                Post and manage multiple job listings simultaneously
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-dark-gray dark:text-dark-text">
                                                {plan.features.jobValidityDays} Days Job Validity
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                Each job posting remains active for {plan.features.jobValidityDays} days
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-dark-gray dark:text-dark-text">
                                                {plan.features.maxApplicationsPerJob === null ? 'Unlimited' : plan.features.maxApplicationsPerJob} Applications per Job
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                Receive applications without limits
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Team Collaboration */}
                            <div>
                                <h3 className="font-semibold text-lg text-dark-gray dark:text-dark-text mb-3 flex items-center">
                                    <span className="bg-primary/10 p-2 rounded-lg mr-3">👥</span>
                                    Team Collaboration
                                </h3>
                                <div className="space-y-3 ml-11">
                                    {plan.features.canAddTeamMembers ? (
                                        <div className="flex items-start">
                                            <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-dark-gray dark:text-dark-text">
                                                    Up to {plan.features.maxTeamMembers} Team Members
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                    Collaborate with your hiring team
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start">
                                            <XIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-400">
                                                    No Team Members
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Solo account only
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Analytics & Insights */}
                            <div>
                                <h3 className="font-semibold text-lg text-dark-gray dark:text-dark-text mb-3 flex items-center">
                                    <span className="bg-primary/10 p-2 rounded-lg mr-3">📊</span>
                                    Analytics & Insights
                                </h3>
                                <div className="space-y-3 ml-11">
                                    {plan.features.analyticsAccess ? (
                                        <div className="flex items-start">
                                            <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-dark-gray dark:text-dark-text">
                                                    Full Analytics Dashboard
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                    Track applications, views, and hiring metrics
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-start">
                                            <XIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-gray-400">
                                                    No Analytics Access
                                                </p>
                                                <p className="text-sm text-gray-400">
                                                    Basic metrics only
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Premium Features */}
                            <div>
                                <h3 className="font-semibold text-lg text-dark-gray dark:text-dark-text mb-3 flex items-center">
                                    <span className="bg-primary/10 p-2 rounded-lg mr-3">⭐</span>
                                    Premium Features
                                </h3>
                                <div className="space-y-3 ml-11">
                                    <div className="flex items-start">
                                        {plan.features.featuredJobs ? (
                                            <>
                                                <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-dark-gray dark:text-dark-text">
                                                        Featured Job Listings
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                        Get your jobs highlighted at the top of search results
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-400">
                                                        No Featured Listings
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        Standard visibility only
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-start">
                                        {plan.features.prioritySupport ? (
                                            <>
                                                <CheckIcon className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-dark-gray dark:text-dark-text">
                                                        Priority Customer Support
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-dark-text-secondary">
                                                        Get faster response times and dedicated assistance
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <XIcon className="w-5 h-5 text-gray-300 mr-3 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-400">
                                                        Standard Support
                                                    </p>
                                                    <p className="text-sm text-gray-400">
                                                        Email support with standard response time
                                                    </p>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-dark-light-background rounded-2xl p-6 shadow-sm border dark:border-dark-border sticky top-24">
                        <h2 className="text-xl font-bold text-dark-gray dark:text-dark-text mb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-dark-text-secondary">Plan</span>
                                <span className="font-semibold text-dark-gray dark:text-dark-text">{plan.displayName}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-dark-text-secondary">Duration</span>
                                <span className="font-semibold text-dark-gray dark:text-dark-text">{plan.duration} days</span>
                            </div>
                            <div className="border-t dark:border-dark-border pt-4">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-dark-gray dark:text-dark-text">Total</span>
                                    <span className="text-2xl font-bold text-primary">{plan.currency} {plan.price}</span>
                                </div>
                            </div>
                        </div>

                        {!isCurrentPlan && (
                            <button
                                onClick={handleProceedToPayment}
                                className="w-full bg-primary text-white py-3 px-6 rounded-xl font-bold hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg"
                            >
                                Proceed to Payment
                            </button>
                        )}

                        {isCurrentPlan && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                                <p className="text-green-700 dark:text-green-300 font-semibold">
                                    ✓ This is your current plan
                                </p>
                            </div>
                        )}

                        <div className="mt-6 pt-6 border-t dark:border-dark-border">
                            <p className="text-xs text-gray-500 dark:text-dark-text-secondary text-center">
                                Secure payment powered by Razorpay. Your subscription will be activated immediately after payment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanDetailsPage;
