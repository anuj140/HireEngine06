import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    GoogleIcon,
    BuildingOfficeIcon,
    NaukriLogo,
    CheckCircleIcon,
    DocumentTextIcon,
    ShieldCheckIcon,
    UserIcon,
    BriefcaseIcon
} from '../components/Icons';
import { useToast } from '../hooks/useToast';
import {
    registerCompanyUser,
    sendRecruiterPhoneOtp,
    verifyRecruiterPhoneOtp,
    sendRecruiterEmailVerification,
    uploadRecruiterDocuments
} from '../../../packages/api-client';

// Types
type CompanyType = 'pvt_ltd' | 'llp' | 'partnership' | 'startup' | 'proprietorship';

interface RegistrationState {
    step: number;
    requestId: string | null;
    formData: {
        name: string;
        email: string;
        countryCode: string;
        phone: string;
        password: string;
        confirmPassword: string;
        companyName: string;
        companyType: CompanyType;
        companyWebsite: string;
        CIN: string;
        LLPIN: string;
        GSTIN: string;
        ownerPAN: string;
        companyPAN: string;
        udyamRegNo: string;
    };
}

const INITIAL_STATE: RegistrationState = {
    step: 1,
    requestId: null,
    formData: {
        name: '',
        email: '',
        countryCode: '+91',
        phone: '',
        password: '',
        confirmPassword: '',
        companyName: '',
        companyType: 'pvt_ltd',
        companyWebsite: '',
        CIN: '',
        LLPIN: '',
        GSTIN: '',
        ownerPAN: '',
        companyPAN: '',
        udyamRegNo: ''
    }
};

const COUNTRY_CODES = [
    { code: '+91', country: 'India' },
    { code: '+1', country: 'USA/Canada' },
    { code: '+44', country: 'UK' },
    { code: '+61', country: 'Australia' },
    { code: '+971', country: 'UAE' },
];

const COMPANY_TYPES: { id: CompanyType; label: string; desc: string }[] = [
    { id: 'proprietorship', label: 'Proprietorship', desc: 'Single owner business' },
    { id: 'partnership', label: 'Partnership', desc: 'Two or more partners' },
    { id: 'pvt_ltd', label: 'Pvt Ltd / OPC', desc: 'Private Limited Company' },
    { id: 'llp', label: 'LLP', desc: 'Limited Liability Partnership' },
    { id: 'startup', label: 'Startup', desc: 'Early stage company' },
];

const REQUIRED_DOCS: Record<CompanyType, string[]> = {
    pvt_ltd: ['Certificate of Incorporation', 'Company PAN', 'GST Certificate', 'Address Proof'],
    llp: ['LLP Agreement', 'Company PAN', 'GST Certificate', 'Address Proof'],
    partnership: ['Partnership Deed', 'Firm PAN', 'Address Proof'],
    proprietorship: ['Proprietor PAN', 'Shop Act / Udyam / GST', 'Address Proof'],
    startup: ['Proprietor / Director PAN', 'Registration Certificate', 'Address Proof']
};

const RegisterPage: React.FC = () => {
    const [state, setState] = useState<RegistrationState>(INITIAL_STATE);
    const [isLoading, setIsLoading] = useState(false);
    const [otp, setOtp] = useState('');
    const [docFiles, setDocFiles] = useState<Record<string, File>>({});
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('company_registration_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (!parsed.formData.countryCode) parsed.formData.countryCode = '+91';
                setState(parsed);
            } catch (e) {
                console.error("Failed to parse saved registration state", e);
            }
        }
    }, []);

    // Save state to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('company_registration_state', JSON.stringify(state));
    }, [state]);

    const updateFormData = (updates: Partial<RegistrationState['formData']>) => {
        setState(prev => ({ ...prev, formData: { ...prev.formData, ...updates } }));
    };

    const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
    const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));

    // --- Step 1: Basic Info & Company Type ---
    const handleBasicInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (state.formData.password !== state.formData.confirmPassword) {
            addToast("Passwords do not match", "error");
            return;
        }
        if (!state.formData.name || !state.formData.email || !state.formData.phone || !state.formData.companyName) {
            addToast("Please fill all required fields", "error");
            return;
        }
        nextStep();
    };

    // --- Step 2: Regulatory Details (Submit to Create Request) ---
    const handleRegulatorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const { confirmPassword, countryCode, phone, ...rest } = state.formData;
            const fullPhone = `${countryCode}${phone}`;

            const payload = {
                ...rest,
                phone: fullPhone
            };

            const response = await registerCompanyUser(payload);
            if (response.success && response.requestId) {
                setState(prev => ({ ...prev, requestId: response.requestId, step: 3 }));
                addToast("Details saved! Please upload documents.", "success");

                // Auto-send OTP
                await sendRecruiterPhoneOtp(response.requestId, fullPhone);
            }
        } catch (error: any) {
            addToast(error.message || "Registration failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 3: Document Upload ---
    const handleFileChange = (docName: string, file: File) => {
        setDocFiles(prev => ({ ...prev, [docName]: file }));
    };

    const handleDocumentUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.requestId) return;

        const requiredDocs = REQUIRED_DOCS[state.formData.companyType];
        const missingDocs = requiredDocs.filter(doc => !docFiles[doc]);

        if (missingDocs.length > 0) {
            addToast(`Please upload: ${missingDocs.join(', ')}`, "error");
            return;
        }

        setIsLoading(true);
        try {
            const formData = new FormData();
            formData.append('requestId', state.requestId);

            // Append all files
            Object.values(docFiles).forEach(file => {
                formData.append('files', file);
            });

            await uploadRecruiterDocuments(state.requestId, formData);
            addToast("Documents uploaded successfully!", "success");

            setState(prev => ({ ...prev, step: 4 })); // Go to Mobile Verify
        } catch (error: any) {
            addToast(error.message || "Upload failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 4: Phone Verification ---
    const handleVerifyPhone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!state.requestId) return;
        setIsLoading(true);
        try {
            const fullPhone = `${state.formData.countryCode}${state.formData.phone}`;
            await verifyRecruiterPhoneOtp(state.requestId, fullPhone, otp);
            addToast("Phone verified successfully!", "success");
            nextStep(); // Go to Email Verify

            // Auto-send Email Verification
            await sendRecruiterEmailVerification(state.requestId, state.formData.email);
        } catch (error: any) {
            addToast(error.message || "OTP verification failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (!state.requestId) return;
        setIsLoading(true);
        try {
            const fullPhone = `${state.formData.countryCode}${state.formData.phone}`;
            await sendRecruiterPhoneOtp(state.requestId, fullPhone);
            addToast("OTP sent again!", "success");
        } catch (error: any) {
            addToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 5: Email Verification ---
    const handleEmailVerificationNext = () => {
        localStorage.removeItem('company_registration_state');
        setState(prev => ({ ...prev, step: 6 })); // Success
    };

    const handleResendEmail = async () => {
        if (!state.requestId) return;
        setIsLoading(true);
        try {
            await sendRecruiterEmailVerification(state.requestId, state.formData.email);
            addToast("Verification email sent!", "success");
        } catch (error: any) {
            addToast(error.message, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <form onSubmit={handleBasicInfoSubmit} className="space-y-6 animate-fade-in">
            <h3 className="text-xl font-bold text-dark-gray">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Company Name" className="input-field" value={state.formData.companyName} onChange={e => updateFormData({ companyName: e.target.value })} required />
                <input type="email" placeholder="Official Email" className="input-field" value={state.formData.email} onChange={e => updateFormData({ email: e.target.value })} required />

                <div className="flex gap-2">
                    <select className="input-field w-24 px-2" value={state.formData.countryCode} onChange={e => updateFormData({ countryCode: e.target.value })}>
                        {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                    <input type="tel" placeholder="Mobile / Landline" className="input-field flex-1" value={state.formData.phone} onChange={e => updateFormData({ phone: e.target.value })} required />
                </div>

                <input type="text" placeholder="Contact Person's Name" className="input-field" value={state.formData.name} onChange={e => updateFormData({ name: e.target.value })} required />
                <input type="password" placeholder="Password" className="input-field" value={state.formData.password} onChange={e => updateFormData({ password: e.target.value })} required />
                <input type="password" placeholder="Confirm Password" className="input-field" value={state.formData.confirmPassword} onChange={e => updateFormData({ confirmPassword: e.target.value })} required />
                <input type="url" placeholder="Company Website (Optional)" className="input-field md:col-span-2" value={state.formData.companyWebsite} onChange={e => updateFormData({ companyWebsite: e.target.value })} />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Company Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {COMPANY_TYPES.map(type => (
                        <div
                            key={type.id}
                            onClick={() => updateFormData({ companyType: type.id })}
                            className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${state.formData.companyType === type.id ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-gray-200 hover:border-primary/50'}`}
                        >
                            <div className="font-semibold text-sm text-gray-800">{type.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            <button type="submit" className="btn-primary w-full">Next: Regulatory Details</button>
        </form>
    );

    const renderStep2 = () => {
        const { companyType } = state.formData;
        return (
            <form onSubmit={handleRegulatorySubmit} className="space-y-6 animate-fade-in">
                <h3 className="text-xl font-bold text-dark-gray">Regulatory Details</h3>
                <p className="text-sm text-gray-600">Provide registration numbers for <strong>{state.formData.companyName}</strong> ({companyType.replace('_', ' ')}).</p>

                <div className="space-y-4">
                    {['pvt_ltd'].includes(companyType) && (
                        <>
                            <input type="text" placeholder="CIN (Corporate Identification Number)" className="input-field w-full" value={state.formData.CIN} onChange={e => updateFormData({ CIN: e.target.value })} required />
                            <input type="text" placeholder="Company PAN" className="input-field w-full" value={state.formData.companyPAN} onChange={e => updateFormData({ companyPAN: e.target.value })} required />
                        </>
                    )}
                    {['llp'].includes(companyType) && (
                        <>
                            <input type="text" placeholder="LLPIN" className="input-field w-full" value={state.formData.LLPIN} onChange={e => updateFormData({ LLPIN: e.target.value })} required />
                            <input type="text" placeholder="Company PAN" className="input-field w-full" value={state.formData.companyPAN} onChange={e => updateFormData({ companyPAN: e.target.value })} required />
                        </>
                    )}
                    {['partnership'].includes(companyType) && (
                        <>
                            <input type="text" placeholder="Firm PAN" className="input-field w-full" value={state.formData.companyPAN} onChange={e => updateFormData({ companyPAN: e.target.value })} required />
                        </>
                    )}
                    {['proprietorship', 'startup'].includes(companyType) && (
                        <input type="text" placeholder="Proprietor / Owner PAN" className="input-field w-full" value={state.formData.ownerPAN} onChange={e => updateFormData({ ownerPAN: e.target.value })} required />
                    )}

                    <input type="text" placeholder="GSTIN (Optional)" className="input-field w-full" value={state.formData.GSTIN} onChange={e => updateFormData({ GSTIN: e.target.value })} />

                    {['proprietorship', 'startup', 'partnership'].includes(companyType) && (
                        <input type="text" placeholder="Udyam Registration / Shop Act (Optional)" className="input-field w-full" value={state.formData.udyamRegNo} onChange={e => updateFormData({ udyamRegNo: e.target.value })} />
                    )}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={prevStep} className="btn-secondary flex-1">Back</button>
                    <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                        {isLoading ? 'Saving...' : 'Save & Upload Docs'}
                    </button>
                </div>
            </form>
        );
    };

    const renderStep3 = () => {
        const { companyType } = state.formData;
        const requiredDocs = REQUIRED_DOCS[companyType];

        return (
            <form onSubmit={handleDocumentUpload} className="space-y-6 animate-fade-in">
                <div className="text-center">
                    <h3 className="text-xl font-bold text-dark-gray">Upload Documents</h3>
                    <p className="text-sm text-gray-500 mt-1">Please upload the following documents for <strong>{companyType.replace('_', ' ')}</strong> verification.</p>
                </div>

                <div className="space-y-4">
                    {requiredDocs.map((docName, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${docFiles[docName] ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <DocumentTextIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-800">{docName}</p>
                                    {docFiles[docName] && <p className="text-xs text-green-600">Uploaded: {docFiles[docName].name}</p>}
                                </div>
                            </div>
                            <label className="btn-secondary text-xs px-3 py-2 cursor-pointer">
                                {docFiles[docName] ? 'Change' : 'Upload'}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) {
                                            handleFileChange(docName, e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button type="button" onClick={prevStep} className="btn-secondary flex-1">Back</button>
                    <button type="submit" disabled={isLoading} className="btn-primary flex-1">
                        {isLoading ? 'Uploading...' : 'Submit Documents'}
                    </button>
                </div>
            </form>
        );
    };

    const renderStep4 = () => (
        <form onSubmit={handleVerifyPhone} className="space-y-6 animate-fade-in">
            <div className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                    <BriefcaseIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-dark-gray">Verify Mobile</h3>
                <p className="text-sm text-gray-600 mt-2">OTP sent to <strong>{state.formData.countryCode} {state.formData.phone}</strong></p>
            </div>

            <input type="text" placeholder="Enter 6-digit OTP" className="input-field w-full text-center tracking-[0.5em] text-2xl font-bold h-14" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required />

            <div className="flex gap-3">
                <button type="button" onClick={prevStep} className="btn-secondary flex-1">Back</button>
                <button type="button" onClick={handleResendOtp} disabled={isLoading} className="btn-secondary flex-1">Resend OTP</button>
                <button type="submit" disabled={isLoading} className="btn-primary flex-1">Verify Mobile</button>
            </div>
        </form>
    );

    const renderStep5 = () => (
        <div className="space-y-6 animate-fade-in text-center">
            <div className="mx-auto w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <GoogleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-dark-gray">Verify Email</h3>
            <p className="text-sm text-gray-600">
                We sent a verification link to <strong>{state.formData.email}</strong>.<br />
                Please check your inbox and click the link.
            </p>
            <div className="flex flex-col gap-3">
                <button onClick={handleResendEmail} disabled={isLoading} className="text-primary hover:underline text-sm">Resend Verification Email</button>
                <div className="flex gap-3">
                    <button onClick={prevStep} className="btn-secondary flex-1">Back</button>
                    <button onClick={handleEmailVerificationNext} className="btn-primary flex-1">I've Verified, Continue</button>
                </div>
            </div>
        </div>
    );

    const renderStep6 = () => (
        <div className="text-center space-y-6 animate-fade-in">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <ShieldCheckIcon className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-dark-gray">Registration Complete!</h2>
            <p className="text-gray-600">
                Your request has been submitted successfully. <br />
                Our admin team will review your documents and approve your account within 24-48 hours.
            </p>
            <Link to="/login" className="btn-primary inline-block">Go to Login</Link>
        </div>
    );

    return (
        <div className="page-gradient-background min-h-screen flex flex-col">
            <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 flex flex-col lg:flex-row">

                    {/* Left Pane: Progress & Info */}
                    <div className="lg:w-1/3 bg-gray-50 p-8 border-r border-gray-100 flex flex-col justify-between">
                        <div>
                            <Link to="/" className="inline-block mb-8"><NaukriLogo className="h-8" /></Link>
                            <h2 className="text-2xl font-bold text-dark-gray mb-2">Partner with us</h2>
                            <p className="text-gray-500 mb-8">Create your employer account in minutes.</p>

                            {/* Steps Indicator */}
                            <div className="space-y-6">
                                {[
                                    { num: 1, label: 'Basic Info', icon: UserIcon },
                                    { num: 2, label: 'Regulatory', icon: BuildingOfficeIcon },
                                    { num: 3, label: 'Documents', icon: DocumentTextIcon },
                                    { num: 4, label: 'Mobile Verify', icon: CheckCircleIcon },
                                    { num: 5, label: 'Email Verify', icon: GoogleIcon },
                                ].map((s) => (
                                    <div key={s.num} className={`flex items-center space-x-3 ${state.step === s.num ? 'text-primary' : state.step > s.num ? 'text-green-600' : 'text-gray-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${state.step === s.num ? 'border-primary bg-primary/10' : state.step > s.num ? 'border-green-600 bg-green-50' : 'border-gray-300'}`}>
                                            {state.step > s.num ? <CheckCircleIcon className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
                                        </div>
                                        <span className={`font-medium ${state.step === s.num ? 'font-bold' : ''}`}>{s.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t">
                            <p className="text-sm text-gray-500">Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Login</Link></p>
                        </div>
                    </div>

                    {/* Right Pane: Form Content */}
                    <div className="lg:w-2/3 p-8 sm:p-12 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            {state.step === 1 && renderStep1()}
                            {state.step === 2 && renderStep2()}
                            {state.step === 3 && renderStep3()}
                            {state.step === 4 && renderStep4()}
                            {state.step === 5 && renderStep5()}
                            {state.step === 6 && renderStep6()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
