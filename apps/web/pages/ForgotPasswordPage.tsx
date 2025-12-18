
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { NaukriLogo, MailIcon } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';
import { forgotPassword } from '../../../packages/api-client';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { addToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await forgotPassword(email);
            // Always show success to prevent email enumeration
            setIsSubmitted(true);
        } catch (error: any) {
            // Log the actual error for debugging, but show a generic message to the user.
            console.error("Forgot password error:", error);
            setIsSubmitted(true);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-gray py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <NaukriLogo className="mx-auto h-9" />
                
                {isSubmitted ? (
                    <div className="text-center animate-fade-in">
                        <MailIcon className="mx-auto h-12 w-12 text-primary" />
                        <h2 className="mt-4 text-center text-2xl font-extrabold text-dark-gray">
                            Check your email
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            If an account exists for <span className="font-medium">{email}</span>, you will receive an email with a link to reset your password.
                        </p>
                        <div className="mt-6">
                            <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                                &larr; Back to Login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div>
                        <h2 className="mt-6 text-center text-2xl font-extrabold text-dark-gray">
                            Forgot your password?
                        </h2>
                        <p className="mt-2 text-center text-sm text-gray-600">
                            Enter your email address and we'll send you a link to reset it.
                        </p>
                        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="email-address" className="sr-only">Email address</label>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Email address"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                                >
                                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                                </button>
                            </div>
                        </form>
                         <div className="mt-6 text-center">
                            <Link to="/login" className="font-medium text-primary hover:text-primary-dark text-sm">
                                &larr; Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
