

import React, { useState } from 'react';
// DO: Add comment above each fix.
// FIX: Replaced namespace import with named imports from react-router-dom.
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { GoogleIcon, NaukriLogo } from '../components/Icons';
import { useToast } from '../contexts/ToastContext';
import { sendRegistrationOtp, verifyRegistrationOtp } from '../../../packages/api-client';

const RegisterPage: React.FC = () => {
    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
    });
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register, loginAfterRegister } = useAuth();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDetailsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            addToast('Passwords do not match.', 'error');
            return;
        }
        if (!/^\d{10}$/.test(formData.phone)) {
            addToast('Please enter a valid 10-digit phone number.', 'error');
            return;
        }
        
        const fullPhoneNumber = `+91${formData.phone}`;
        
        setIsLoading(true);
        try {
            const response = await sendRegistrationOtp(fullPhoneNumber);
            addToast(response.message || 'OTP sent successfully!', 'info');
            setStep('otp');
        } catch (error: any) {
            addToast(error.message || 'An unexpected error occurred while sending OTP.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleOtpSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 4) {
            addToast('Please enter a valid OTP.', 'error');
            return;
        }
        setIsLoading(true);
        const fullPhoneNumber = `+91${formData.phone}`;
        try {
            await verifyRegistrationOtp(fullPhoneNumber, otp);
            addToast('Phone number verified successfully!', 'success');
            
            // Final registration call
            const { user, token } = await register(formData.name, formData.email, formData.password, fullPhoneNumber);
            await loginAfterRegister(user, token);
            
            addToast('Registration successful! Welcome.');
            navigate('/', { replace: true });

        } catch (error: any) {
            addToast(error.message || 'An unexpected registration error occurred. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-light-gray py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <NaukriLogo className="mx-auto h-9" />
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-dark-gray">
                        {step === 'details' ? 'Create your account' : 'Verify your phone number'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        {step === 'details' ? (
                            <>
                                Already have an account?{' '}
                                <Link to="/login" className="font-medium text-primary hover:text-primary-dark">
                                    Sign in
                                </Link>
                            </>
                        ) : `Enter the OTP sent to +91 ${formData.phone}`}
                    </p>
                </div>
                
                {step === 'details' ? (
                    <form className="mt-8 space-y-6" onSubmit={handleDetailsSubmit}>
                        <div className="rounded-md shadow-sm space-y-4">
                            <input name="name" type="text" required value={formData.name} onChange={handleChange} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Full Name" />
                            <input name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Email Address" />
                            <div>
                                <label htmlFor="phone" className="sr-only">Phone Number</label>
                                <div className="relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">+91</span>
                                    </div>
                                    <input 
                                        name="phone" 
                                        type="tel" 
                                        id="phone"
                                        autoComplete="tel" 
                                        required 
                                        value={formData.phone} 
                                        onChange={handleChange} 
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm pl-10" 
                                        placeholder="10-digit mobile number"
                                        maxLength={10}
                                    />
                                </div>
                            </div>
                            <input name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Password" />
                            <input name="confirmPassword" type="password" autoComplete="new-password" required value={formData.confirmPassword} onChange={handleChange} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Confirm Password" />
                        </div>
                        <div>
                            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400">
                                {isLoading ? 'Sending OTP...' : 'Continue'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
                        <input name="otp" type="text" maxLength={6} required value={otp} onChange={(e) => setOtp(e.target.value)} className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Enter OTP" autoFocus/>
                        <div>
                            <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400">
                                {isLoading ? 'Verifying...' : 'Verify & Create Account'}
                            </button>
                        </div>
                        <div className="text-center">
                            <button type="button" onClick={() => setStep('details')} className="text-sm font-medium text-primary hover:text-primary-dark">
                                Go Back
                            </button>
                        </div>
                    </form>
                )}

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                    </div>
                </div>

                <div>
                    <button
                        type="button"
                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                        <GoogleIcon className="w-5 h-5 mr-2" />
                        Sign up with Google
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;