

import React, { useEffect, useState } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { CogIcon, SunIcon, MoonIcon, ShieldCheckIcon, BellIcon, LockClosedIcon, MailIcon, PhoneIcon, CheckCircleIcon, CloseIcon } from '../components/Icons';
import { useToast } from '../hooks/useToast';

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="bg-white dark:bg-dark-light-background p-6 rounded-xl shadow-sm border border-gray-200 dark:border-dark-border">
        <div className="flex items-center mb-4">
            <div className="text-primary dark:text-accent">{icon}</div>
            <h2 className="text-xl font-bold text-dark-gray dark:text-dark-text ml-3">{title}</h2>
        </div>
        <div className="space-y-4">
            {children}
        </div>
    </div>
);

const SettingsPage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();
    const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
    
    const [alertsEnabled, setAlertsEnabled] = useState(true);
    const [passwordModalStep, setPasswordModalStep] = useState<'closed' | 'send' | 'verify' | 'reset'>('closed');
    const [verificationModal, setVerificationModal] = useState<{ open: boolean; type: 'email' | 'phone' }>({ open: false, type: 'email' });
    const [otp, setOtp] = useState('');

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Settings' }
        ]);
        return () => setCrumbs([]);
    }, [setCrumbs]);
    
    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handlePasswordReset = () => {
        // Mock API calls
        if (passwordModalStep === 'send') {
            addToast('OTP sent to your email.', 'info');
            setPasswordModalStep('verify');
        } else if (passwordModalStep === 'verify') {
             if (otp === '123456') { // Dummy OTP
                addToast('OTP verified successfully.', 'success');
                setPasswordModalStep('reset');
            } else {
                addToast('Invalid OTP. Please try again.', 'error');
            }
        } else if (passwordModalStep === 'reset') {
            addToast('Password has been reset successfully!', 'success');
            setPasswordModalStep('closed');
        }
        setOtp('');
    };

    const handleVerification = () => {
        if (otp === '123456') {
            addToast(`${verificationModal.type === 'email' ? 'Email' : 'Phone'} verified successfully!`, 'success');
            setVerificationModal({ open: false, type: 'email' });
        } else {
            addToast('Invalid OTP.', 'error');
        }
        setOtp('');
    };

    const Modal: React.FC<{ title: string; children: React.ReactNode; onClose: () => void; }> = ({ title, children, onClose }) => (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-dark-light-background rounded-lg w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b dark:border-dark-border flex justify-between items-center">
                    <h3 className="font-bold text-lg text-dark-gray dark:text-dark-text">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><CloseIcon className="w-5 h-5 text-gray-500"/></button>
                </div>
                {children}
            </div>
        </div>
    );

    return (
        <>
            <div className="space-y-8">
                <h1 className="text-3xl font-bold text-dark-gray dark:text-dark-text">Settings</h1>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <SectionCard title="General" icon={<CogIcon className="w-6 h-6"/>}>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="font-semibold text-dark-gray dark:text-dark-text-secondary">Appearance</span>
                             <button onClick={() => setIsDark(!isDark)} className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-primary ${isDark ? 'bg-gray-600' : 'bg-primary'}`}>
                                <span className={`absolute left-1 top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 transform ${isDark ? 'translate-x-6' : ''}`}>
                                    <SunIcon className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-yellow-500 transition-opacity duration-300 ${isDark ? 'opacity-0' : 'opacity-100'}`} />
                                    <MoonIcon className={`w-4 h-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-700 transition-opacity duration-300 ${isDark ? 'opacity-100' : 'opacity-0'}`} />
                                </span>
                            </button>
                        </div>
                    </SectionCard>

                    <SectionCard title="Notifications" icon={<BellIcon className="w-6 h-6"/>}>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="pr-4">
                                <p className="font-semibold text-dark-gray dark:text-dark-text-secondary">Email & In-App Alerts</p>
                                <p className="text-xs text-gray-500 dark:text-dark-text-secondary">Receive notifications for new applicants, job status, and messages.</p>
                            </div>
                            <button onClick={() => setAlertsEnabled(!alertsEnabled)} className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-primary ${alertsEnabled ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 transform ${alertsEnabled ? 'translate-x-6' : ''}`}></span>
                            </button>
                        </div>
                    </SectionCard>

                    <SectionCard title="Password & Security" icon={<ShieldCheckIcon className="w-6 h-6"/>}>
                         <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <span className="font-semibold text-dark-gray dark:text-dark-text-secondary">Change Password</span>
                            <button onClick={() => setPasswordModalStep('send')} className="px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors">
                                Reset
                            </button>
                        </div>
                    </SectionCard>
                    
                    <SectionCard title="Account Information" icon={<LockClosedIcon className="w-6 h-6"/>}>
                         <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                                <MailIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                                <span className="font-semibold text-dark-gray dark:text-dark-text-secondary">admin@example.com</span>
                                <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                            </div>
                            <button onClick={() => setVerificationModal({ open: true, type: 'email' })} className="text-sm font-semibold text-primary hover:underline">Change</button>
                        </div>
                         <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center">
                                <PhoneIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                                <span className="font-semibold text-dark-gray dark:text-dark-text-secondary">+91 98****3210</span>
                                <span className="ml-2 text-xs text-yellow-600 font-semibold bg-yellow-100 px-2 py-0.5 rounded-full">Not Verified</span>
                            </div>
                            <button onClick={() => setVerificationModal({ open: true, type: 'phone' })} className="text-sm font-semibold text-primary hover:underline">Verify</button>
                        </div>
                    </SectionCard>
                </div>
            </div>

            {/* Password Reset Modal */}
            {passwordModalStep !== 'closed' && (
                <Modal title="Reset Password" onClose={() => setPasswordModalStep('closed')}>
                    {passwordModalStep === 'send' && (
                        <div className="p-6">
                            <p className="text-sm text-gray-600 dark:text-dark-text-secondary">An OTP will be sent to your registered email <span className="font-semibold">ad***@example.com</span> to reset your password.</p>
                            <div className="flex justify-end mt-6">
                                <button onClick={handlePasswordReset} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg">Send OTP</button>
                            </div>
                        </div>
                    )}
                     {passwordModalStep === 'verify' && (
                        <div className="p-6 space-y-4">
                             <p className="text-sm text-center text-gray-600 dark:text-dark-text-secondary">Enter the 6-digit OTP sent to your email. <br/>(Hint: use 123456 for this demo)</p>
                            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="Enter OTP" className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" autoFocus/>
                            <div className="flex justify-end">
                                <button onClick={handlePasswordReset} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg">Verify OTP</button>
                            </div>
                        </div>
                    )}
                     {passwordModalStep === 'reset' && (
                        <div className="p-6 space-y-4">
                             <input type="password" placeholder="New Password" className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                             <input type="password" placeholder="Confirm New Password" className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" />
                            <div className="flex justify-end">
                                <button onClick={handlePasswordReset} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg">Reset Password</button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}

             {/* Verification Modal */}
            {verificationModal.open && (
                 <Modal title={`Verify your ${verificationModal.type}`} onClose={() => setVerificationModal({ open: false, type: 'email' })}>
                    <div className="p-6 space-y-4">
                        <p className="text-sm text-gray-600 dark:text-dark-text-secondary">Enter the OTP sent to your {verificationModal.type}. (Hint: use 123456)</p>
                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} placeholder="Enter OTP" className="w-full border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200" autoFocus/>
                        <div className="flex justify-end">
                            <button onClick={handleVerification} className="px-5 py-2 bg-primary text-white font-semibold rounded-lg">Verify</button>
                        </div>
                    </div>
                </Modal>
            )}
        </>
    );
};

export default SettingsPage;