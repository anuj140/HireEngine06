import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleIcon, CheckBadgeIcon, NaukriLogo } from '../components/Icons';
import { useCompanyAuth } from '../hooks/useCompanyAuth';
import { useToast } from '../hooks/useToast';

const RecruitmentIllustrator: React.FC = () => (
    <div className="relative w-full min-h-[400px] flex items-center justify-center">
        {/* Background Cards */}
        <div className="absolute w-64 bg-white/70 rounded-xl shadow-lg border p-4 transform -rotate-12 -translate-x-12 -translate-y-4 animate-float-d3 opacity-80">
            <div className="flex items-center space-x-3 opacity-70">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                    <div className="h-2.5 w-24 bg-gray-200 rounded-full"></div>
                    <div className="h-2 w-16 bg-gray-100 rounded-full mt-1.5"></div>
                </div>
            </div>
        </div>
        <div className="absolute w-64 bg-white/70 rounded-xl shadow-lg border p-4 transform rotate-6 translate-x-12 translate-y-8 animate-float-d1 opacity-80">
            <div className="flex items-center space-x-3 opacity-70">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div>
                    <div className="h-2.5 w-24 bg-gray-200 rounded-full"></div>
                    <div className="h-2 w-16 bg-gray-100 rounded-full mt-1.5"></div>
                </div>
            </div>
        </div>

        {/* Main Card */}
        <div className="relative w-72 bg-white rounded-2xl shadow-2xl border p-5 space-y-3 animate-float transition-transform duration-300 hover:scale-105">
            <div className="absolute -top-5 -right-5 transform rotate-12">
                <div className="relative">
                    <CheckBadgeIcon className="w-16 h-16 text-green-500" />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold transform -rotate-12 mt-[-2px]">HIRED</span>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <img src="https://i.pravatar.cc/150?u=candidate-success" alt="Hired Candidate" className="w-14 h-14 rounded-full flex-shrink-0 border-2 border-green-400" />
                <div>
                    <h3 className="text-lg font-bold text-dark-gray">Maria Garcia</h3>
                    <p className="text-sm text-gray-500">Lead Data Scientist</p>
                </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1 pt-2 border-t">
                <p><strong>Match Score:</strong> <span className="font-bold text-green-600">94%</span></p>
                <p><strong>Experience:</strong> 6 Years</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="bg-blue-100 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">Python</span>
                <span className="bg-blue-100 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">Machine Learning</span>
                <span className="bg-blue-100 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">AWS</span>
            </div>
        </div>
    </div>
);

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({ email: '', password: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loginType, setLoginType] = useState<'admin' | 'team_member'>('admin');
    const navigate = useNavigate();
    const { login } = useCompanyAuth();
    const { addToast } = useToast();
    const [searchParams] = useSearchParams();

    const validateForm = () => {
        const newErrors = { email: '', password: '' };
        let isValid = true;
        if (!email) {
            newErrors.email = 'Email address is required.';
            isValid = false;
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address.';
            isValid = false;
        }
        if (!password) {
            newErrors.password = 'Password is required.';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsLoading(true);
        try {
            if (loginType === 'team_member') {
                // For team members, use team member login endpoint
                const response = await fetch('/api/v1/recruiter/team/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                    // Check if the error is due to paused account
                    if (data.message?.includes('not active')) {
                        throw new Error('Your account has been paused. Please contact your administrator.');
                    }
                    throw new Error(data.message || 'Login failed. Please check your credentials.');
                }

                // Store token and set user
                sessionStorage.setItem('company_token', data.token);
                const teamMember = data.teamMember;
                // Convert role for consistency
                teamMember.role = 'HR Manager';

                addToast('Login successful!');

                // Redirect and reload to refresh auth context
                const redirectPath = searchParams.get('redirect') || '/dashboard';
                window.location.href = redirectPath;
                return; // Early return to prevent further execution

            } else {
                // For company admin, use normal login
                await login(email, password);
                addToast('Login successful!');
            }

            const redirectPath = searchParams.get('redirect') || '/dashboard';
            navigate(redirectPath, { replace: true });
        } catch (error: any) {
            addToast(error.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-gradient-background flex items-center justify-center p-4 sm:p-6 lg:p-8" style={{ minHeight: 'calc(100vh - 128px)' }}>
            <div className="w-full max-w-6xl mx-auto bg-gradient-to-br from-primary/20 via-white/50 to-secondary/20 backdrop-blur-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/30">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Left Pane: Job Illustrator */}
                    <div className="hidden lg:flex items-center justify-center p-12 bg-light-gray/50">
                        <RecruitmentIllustrator />
                    </div>

                    {/* Right Pane: Form */}
                    <div className="p-8 sm:p-12 flex flex-col justify-center">
                        <div className="w-full max-w-md mx-auto">
                            <div className="flex justify-center mb-6">
                                <Link to="/">
                                    <NaukriLogo className="h-8" />
                                </Link>
                            </div>
                            <div>
                                <div className="flex border-b mb-4">
                                    <h2 className="text-2xl font-bold text-primary pb-3 border-b-2 border-primary transition-colors duration-300">
                                        Login
                                    </h2>
                                    <Link to="/register" className="text-2xl font-bold text-gray-400 pb-3 ml-6 hover:text-primary transition-colors duration-300">
                                        Register
                                    </Link>
                                </div>

                                {/* Login Type Toggle */}
                                <div className="flex gap-2 mb-4 p-1 bg-gray-100 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setLoginType('admin')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${loginType === 'admin'
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Company Admin
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setLoginType('team_member')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all duration-200 ${loginType === 'team_member'
                                            ? 'bg-white text-primary shadow-sm'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        Team Member
                                    </button>
                                </div>

                                <p className="mt-1 text-sm text-gray-600">
                                    {loginType === 'admin'
                                        ? 'Access your dashboard to manage job postings.'
                                        : 'Team members can access based on assigned permissions.'}
                                </p>
                            </div>

                            <form className="mt-8 space-y-6" onSubmit={handleSubmit} noValidate>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="email-address" className="sr-only">Email address</label>
                                        <input
                                            id="email-address"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Email address"
                                        />
                                        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label htmlFor="password" className="sr-only">Password</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className={`appearance-none relative block w-full px-4 py-3 border placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="Password"
                                        />
                                        {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end">
                                    <div className="text-sm">
                                        <a href="#" className="font-medium text-primary hover:text-primary-dark">
                                            Forgot your password?
                                        </a>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
                                    >
                                        {isLoading ? 'Signing in...' : 'Sign in'}
                                    </button>
                                </div>

                                <div className="flex items-center">
                                    <div className="flex-grow border-t border-gray-300"></div>
                                    <span className="flex-shrink mx-4 text-sm text-gray-500">or</span>
                                    <div className="flex-grow border-t border-gray-300"></div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-dark-gray bg-white hover:bg-gray-50"
                                    >
                                        <GoogleIcon className="w-5 h-5 mr-2" />
                                        Continue with Google
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;