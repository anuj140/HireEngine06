import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { useToast } from '../hooks/useToast';
import { fetchSubscriptionPlans, purchaseSubscription, verifyPayment } from '../../../packages/api-client';

// Razorpay types
declare global {
    interface Window {
        Razorpay: any;
    }
}

interface SubscriptionPlan {
    _id: string;
    name: string;
    displayName: string;
    price: number;
    currency: string;
    duration: number;
    description: string;
    features: any;
}

const PaymentPage: React.FC = () => {
    const { planId } = useParams<{ planId: string }>();
    const navigate = useNavigate();
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Subscription', path: '/dashboard/subscription' },
            { name: 'Payment' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    useEffect(() => {
        const loadPlan = async () => {
            try {
                const plans = await fetchSubscriptionPlans();
                const selectedPlan = plans.find((p: SubscriptionPlan) => p._id === planId);

                if (!selectedPlan) {
                    addToast('Plan not found', 'error');
                    navigate('/dashboard/subscription');
                    return;
                }

                setPlan(selectedPlan);
            } catch (error: any) {
                addToast(error.message || 'Failed to load plan', 'error');
                navigate('/dashboard/subscription');
            } finally {
                setIsLoading(false);
            }
        };

        // Load Razorpay script
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        loadPlan();

        return () => {
            // Cleanup script
            const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
            if (existingScript) {
                document.body.removeChild(existingScript);
            }
        };
    }, [planId, addToast, navigate]);

    const handlePayment = async () => {
        if (!plan) return;

        // Check if user is logged in
        const token = sessionStorage.getItem('company_token');
        if (!token) {
            addToast('Please log in to continue with payment', 'error');
            navigate('/login');
            return;
        }

        setIsProcessing(true);

        try {
            // Step 1: Create Razorpay order
            const orderResponse = await purchaseSubscription(plan._id);

            if (!orderResponse.success) {
                throw new Error(orderResponse.message || 'Failed to create order');
            }

            const { order, razorpayKeyId } = orderResponse;

            // Step 2: Open Razorpay checkout
            const options = {
                key: razorpayKeyId,
                amount: order.amount,
                currency: order.currency,
                name: 'JobPortal Pro',
                description: `${plan.displayName} Subscription`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        // Step 3: Verify payment on backend
                        const verificationData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: plan._id,
                        };

                        const verifyResponse = await verifyPayment(verificationData);

                        if (verifyResponse.success) {
                            addToast('Payment successful! Your subscription is now active.', 'success');
                            navigate('/dashboard/subscription');
                        } else {
                            throw new Error('Payment verification failed');
                        }
                    } catch (error: any) {
                        console.error('Payment verification error:', error);
                        addToast(error.message || 'Payment verification failed', 'error');
                        navigate('/dashboard/subscription');
                    }
                },
                prefill: {
                    name: '',
                    email: '',
                    contact: '',
                },
                notes: {
                    plan: plan.displayName,
                },
                theme: {
                    color: '#4A90E2',
                },
                modal: {
                    ondismiss: function () {
                        setIsProcessing(false);
                        addToast('Payment cancelled', 'info');
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error: any) {
            console.error('Payment error:', error);
            addToast(error.message || 'Failed to initiate payment. Please make sure you are logged in.', 'error');
            setIsProcessing(false);
        }
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

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-dark-light-background rounded-2xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-8">
                    <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
                    <p className="text-blue-100">You're one step away from unlocking premium features</p>
                </div>

                {/* Plan Summary */}
                <div className="p-8">
                    <div className="mb-8">
                        <h2 className="text-xl font-bold text-dark-gray dark:text-dark-text mb-4">Order Summary</h2>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-dark-text-secondary">Plan</span>
                                <span className="font-semibold text-dark-gray dark:text-dark-text">{plan.displayName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-dark-text-secondary">Duration</span>
                                <span className="font-semibold text-dark-gray dark:text-dark-text">{plan.duration} days</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-dark-text-secondary">Description</span>
                                <span className="text-sm text-gray-600 dark:text-dark-text-secondary text-right max-w-xs">{plan.description}</span>
                            </div>
                            <div className="border-t dark:border-gray-700 pt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-dark-gray dark:text-dark-text">Total Amount</span>
                                    <span className="text-3xl font-bold text-primary">{plan.currency} {plan.price}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="mb-8">
                        <h3 className="font-semibold text-dark-gray dark:text-dark-text mb-3">Payment Information</h3>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <ul className="space-y-2 text-sm text-gray-700 dark:text-dark-text-secondary">
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Secure payment powered by Razorpay
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Your subscription activates immediately after payment
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    7-day money-back guarantee
                                </li>
                                <li className="flex items-start">
                                    <span className="text-green-500 mr-2">✓</span>
                                    Cancel anytime before renewal
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/dashboard/subscription')}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-6 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-dark-text rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className="flex-1 py-3 px-6 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                `Pay ${plan.currency} ${plan.price}`
                            )}
                        </button>
                    </div>

                    {/* Security Notice */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500 dark:text-dark-text-secondary">
                            🔒 Your payment information is encrypted and secure
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
