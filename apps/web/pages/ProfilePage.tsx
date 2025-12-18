
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
    PencilIcon,
    LocationMarkerIcon,
    PhoneIcon,
    CheckCircleIcon,
    BriefcaseIcon,
    MailIcon,
    ArrowUpIcon,
    TrashIcon,
    CloseIcon,
    LogoutIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    PlusCircleIcon,
    EyeIcon,
    GlobeAltIcon,
    ScaleIcon,
} from '../components/Icons';
import { User, Employment, Education, OnlineProfile, Certification, CareerProfile, UserProfile, PrivacySettings, ITSkill } from '../../../packages/types';
import { useToast } from '../contexts/ToastContext';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import ProfileCompletionCircle from '../components/ProfileCompletionCircle';
import { useUserActivity } from '../contexts/UserActivityContext';
import BasicDetailsModal from '../components/BasicDetailsModal';
import ResumePreviewModal from '../components/ResumePreviewModal';

// Reusable components
const DetailRow: React.FC<{ icon: React.ReactNode; text: string; verified?: boolean }> = ({ icon, text, verified }) => (
    <div className="flex items-center text-sm text-dark-gray">
        <span className="text-gray-400 mr-3">{icon}</span>
        {text}
        {verified && <CheckCircleIcon className="w-4 h-4 text-green-500 ml-2" />}
    </div>
);

const QuickLinkItem: React.FC<{ label: string; actionText: 'Update' | 'Add' | 'View'; onClick: () => void; }> = ({ label, actionText, onClick }) => (
    <div className="flex justify-between items-center text-dark-gray">
        <span className="font-medium text-sm">{label}</span>
        <button onClick={onClick} className="text-sm font-semibold text-blue-600 hover:underline">{actionText}</button>
    </div>
)

const SkillTag: React.FC<{ skill: string }> = ({ skill }) => (
    <span className="bg-gray-100 text-dark-gray text-sm font-medium px-3 py-1.5 rounded-full">
        {skill}
    </span>
);

const CollapsibleCard: React.FC<{
    title: string;
    onAdd?: () => void;
    onEdit?: () => void;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, onAdd, onEdit, children, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-dark-gray">{title}</h2>
                <div className="flex items-center space-x-4">
                    {onAdd && <button onClick={onAdd} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><PlusCircleIcon className="w-5 h-5" /> Add</button>}
                    {onEdit && <button onClick={onEdit} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1"><PencilIcon className="w-4 h-4" /> Edit</button>}
                    <button onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Collapse section' : 'Expand section'}>
                        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-600" /> : <ChevronDownIcon className="w-5 h-5 text-gray-600" />}
                    </button>
                </div>
            </div>
            {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in" style={{ animationDuration: '300ms' }}>
                    {children}
                </div>
            )}
        </div>
    );
};

const FormRow: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>;

const inputClasses = "w-full border border-gray-200 rounded-xl px-4 py-3.5 text-sm text-dark-gray placeholder-gray-400 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200";
const labelClasses = "block text-sm font-bold text-dark-gray mb-2";

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, ...props }) => (
    <div className="mb-1">
        {label && <label htmlFor={props.name} className={labelClasses}>{label}{props.required && <span className="text-red-500 ml-1">*</span>}</label>}
        <input {...props} id={props.name} className={inputClasses} />
    </div>
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, ...props }) => (
    <div className="mb-1">
        {label && <label htmlFor={props.name} className={labelClasses}>{label}{props.required && <span className="text-red-500 ml-1">*</span>}</label>}
        <select {...props} id={props.name} className={`${inputClasses} appearance-none bg-white`}>
            {children}
        </select>
    </div>
);

const FormCheckbox: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <label className="flex items-center cursor-pointer group">
        <div className="relative flex items-center">
            <input type="checkbox" {...props} className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 checked:border-primary checked:bg-primary transition-all" />
            <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-dark-gray">{label}</span>
    </label>
);

const FormTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }> = ({ label, ...props }) => (
    <div className="mb-1">
        {label && <label htmlFor={props.name} className={labelClasses}>{label}</label>}
        <textarea {...props} id={props.name} className={inputClasses} />
    </div>
);

const ITSkillsFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ITSkill) => void;
    onDelete?: () => void;
    initialData?: ITSkill;
    isSubmitting: boolean;
}> = ({ isOpen, onClose, onSave, onDelete, initialData, isSubmitting }) => {
    const [formData, setFormData] = useState<ITSkill>({
        name: initialData?.name || '',
        version: initialData?.version || '',
        lastUsed: initialData?.lastUsed || '',
        experienceYears: initialData?.experienceYears || '',
        experienceMonths: initialData?.experienceMonths || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const years = Array.from({ length: 31 }, (_, i) => i.toString());
    const months = Array.from({ length: 12 }, (_, i) => i.toString());
    const lastUsedYears = Array.from({ length: 35 }, (_, i) => (new Date().getFullYear() - i).toString());

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl animate-scale-in overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b flex justify-between items-start bg-white">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-xl text-dark-gray">IT skills</h3>
                            <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-0.5 rounded-md">Add 10%</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1.5">Mention skills like programming languages (Java, Python), softwares (Microsoft Word, Excel) and more, to show your technical expertise.</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <FormInput label="Skill / Software name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Java, AWS" required />
                    <div className="grid grid-cols-2 gap-6">
                        <FormInput label="Software version" name="version" value={formData.version} onChange={handleChange} placeholder="e.g. 11.0" />
                        <FormSelect label="Last used" name="lastUsed" value={formData.lastUsed} onChange={handleChange}>
                            <option value="">Select Year</option>
                            {lastUsedYears.map(y => <option key={y} value={y}>{y}</option>)}
                        </FormSelect>
                    </div>
                    <div>
                        <label className={labelClasses}>Experience</label>
                        <div className="grid grid-cols-2 gap-6">
                            <FormSelect name="experienceYears" value={formData.experienceYears} onChange={handleChange} aria-label="Experience Years">
                                <option value="">Years</option>
                                {years.map(y => <option key={y} value={y}>{y} Year{y !== '1' ? 's' : ''}</option>)}
                            </FormSelect>
                            <FormSelect name="experienceMonths" value={formData.experienceMonths} onChange={handleChange} aria-label="Experience Months">
                                <option value="">Months</option>
                                {months.map(m => <option key={m} value={m}>{m} Month{m !== '1' ? 's' : ''}</option>)}
                            </FormSelect>
                        </div>
                    </div>
                </form>
                <div className="px-8 py-5 bg-gray-50 border-t flex justify-between items-center">
                    {onDelete ? (
                        <button type="button" onClick={onDelete} className="text-red-600 font-bold text-sm hover:underline">Delete</button>
                    ) : <span></span>}
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button>
                        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const SkillsEditorModal: React.FC<{
    title: string;
    onSave: (skills: string[]) => void;
    onClose: () => void;
    initialSkills: string[];
    isSubmitting: boolean;
}> = ({ title, onSave, onClose, initialSkills, isSubmitting }) => {
    const [skills, setSkills] = useState<string[]>(initialSkills);
    const [inputValue, setInputValue] = useState('');
    const allSuggestions = useMemo(() => ['Vue.Js', 'Node.Js', 'Nestjs', 'Mern', 'Redux', 'Graphql', 'Ember.Js', 'React Native', 'Typescript', 'Docker', 'Kubernetes', 'Go', 'SQL', 'NoSQL', 'CI/CD', 'Git', 'Agile'], []);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddSkill = (skillValue: string) => {
        const newSkills = skillValue.split(',').map(s => s.trim()).filter(s => s && !skills.find(os => os.toLowerCase() === s.toLowerCase()));
        if (newSkills.length > 0) setSkills(prev => [...prev, ...newSkills]);
        setInputValue('');
    };

    const handleRemoveSkill = (skillToRemove: string) => setSkills(prev => prev.filter(s => s !== skillToRemove));
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddSkill(inputValue); } };

    const availableSuggestions = useMemo(() => {
        const currentSkillsLower = new Set(skills.map(s => s.toLowerCase()));
        return allSuggestions.filter(s => !currentSkillsLower.has(s.toLowerCase()));
    }, [skills, allSuggestions]);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-xl text-dark-gray">{title}</h3>
                        <p className="text-sm text-gray-500 mt-1">Add skills that best define your expertise. (Minimum 1)</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>

                <div className="p-8 overflow-y-auto">
                    <div>
                        <label className={labelClasses}>Skills</label>
                        <div className="mt-2 p-4 border border-gray-200 rounded-xl min-h-[8rem] flex flex-wrap gap-2 items-start content-start bg-white focus-within:ring-4 focus-within:ring-primary/10 focus-within:border-primary transition-all" onClick={() => inputRef.current?.focus()}>
                            {skills.map(skill => (<span key={skill} className="flex items-center bg-primary/10 text-primary text-sm font-bold px-3 py-1.5 rounded-full border border-primary/20"> {skill} <button onClick={(e) => { e.stopPropagation(); handleRemoveSkill(skill); }} className="ml-2 text-primary/60 hover:text-primary"> <CloseIcon className="w-3.5 h-3.5" /> </button> </span>))}
                            <input ref={inputRef} type="text" value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="flex-grow outline-none bg-transparent min-w-[120px] text-sm py-1" placeholder={skills.length === 0 ? "Type skill and press Enter" : ""} />
                        </div>
                    </div>

                    <div className="mt-8">
                        <p className="text-dark-gray font-bold text-sm mb-3">Suggested skills based on your profile</p>
                        <div className="flex flex-wrap gap-3">
                            {availableSuggestions.map(suggestion => (<button key={suggestion} onClick={() => handleAddSkill(suggestion)} className="flex items-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full px-4 py-2 hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"> {suggestion} <span className="ml-2 text-lg leading-none text-gray-400 font-light">+</span> </button>))}
                        </div>
                    </div>
                </div>

                <div className="px-8 py-5 bg-gray-50 border-t flex justify-end gap-4 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button>
                    <button type="button" disabled={isSubmitting} onClick={() => onSave(skills)} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg"> {isSubmitting ? 'Saving...' : 'Save'} </button>
                </div>
            </div>
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const { user, logout, updateUserProfile, uploadResume, uploadProfilePhoto, deleteResume } = useAuth();
    const { savedJobs, appliedJobIds } = useUserActivity();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { setCrumbs } = useBreadcrumbs();
    const resumeFileRef = useRef<HTMLInputElement>(null);
    const photoFileRef = useRef<HTMLInputElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPhotoSubmitting, setIsPhotoSubmitting] = useState(false);
    const { section, index } = useParams<{ section: string; index?: string }>();
    const itemIndex = useMemo(() => (index && index !== 'new' && !isNaN(parseInt(index, 10)) ? parseInt(index, 10) : null), [index]);
    const [isBasicDetailsModalOpen, setIsBasicDetailsModalOpen] = useState(false);
    const [isResumePreviewOpen, setIsResumePreviewOpen] = useState(false);

    const handleCloseModal = () => navigate('/profile');

    const handleSave = async (updates: Partial<User>) => {
        setIsSubmitting(true);
        try {
            await updateUserProfile(updates);
            addToast('Profile updated successfully!');
            handleCloseModal();
            setIsBasicDetailsModalOpen(false);
        } catch (e: any) {
            addToast(`Error: ${e.message}`, 'error');
            throw e;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsSubmitting(true);
            try {
                await uploadResume(file);
                addToast('Resume uploaded successfully!');
            } catch (error) {
                addToast('Failed to upload resume.', 'error');
            } finally {
                setIsSubmitting(false);
                if (resumeFileRef.current) resumeFileRef.current.value = '';
            }
        }
    };

    const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setIsPhotoSubmitting(true);
            try {
                await uploadProfilePhoto(file);
                addToast('Profile photo updated!');
            } catch (error) {
                addToast('Failed to upload photo.', 'error');
            } finally {
                setIsPhotoSubmitting(false);
                if (photoFileRef.current) photoFileRef.current.value = '';
            }
        }
    };

    const handleDeleteResume = async () => {
        if (window.confirm('Are you sure you want to delete your resume?')) {
            setIsSubmitting(true);
            try {
                await deleteResume();
                addToast('Resume deleted successfully.');
            } catch (error) {
                addToast('Failed to delete resume.', 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    useEffect(() => {
        setCrumbs([{ name: 'Home', path: '/' }, { name: 'Profile' }]);
        return () => setCrumbs([]);
    }, [setCrumbs]);

    // Parse accomplishment params (e.g., 'online-profile-0' -> type: 'online-profile', index: 0)
    const accParams = useMemo(() => {
        if (section !== 'accomplishments' || !index) return null;
        if (index.startsWith('online-profile-')) {
            const suffix = index.replace('online-profile-', '');
            return { type: 'online-profile', isNew: suffix === 'new', index: suffix === 'new' ? null : parseInt(suffix, 10) };
        }
        if (index.startsWith('certification-')) {
            const suffix = index.replace('certification-', '');
            return { type: 'certification', isNew: suffix === 'new', index: suffix === 'new' ? null : parseInt(suffix, 10) };
        }
        return null;
    }, [section, index]);

    const itSkillsParams = useMemo(() => {
        if (section !== 'it-skills' || !index) return null;
        return { isNew: index === 'new', index: index === 'new' ? null : parseInt(index, 10) };
    }, [section, index]);

    // If user or user.profile is not available, it might mean the user data is being fetched or an error occurred.
    if (!user || !user.profile) {
        return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
    }

    const { name, email, profile, profilePhoto, phone } = user;
    const { profileCompletion, headline, skills = [], itSkills = [], location, profileSummary, employment = [], education = [], careerProfile } = profile;
    // Safe destructuring for nested objects that might be missing from backend response
    const accomplishments = profile.accomplishments || { onlineProfiles: [], certifications: [] };
    const onlineProfiles = accomplishments.onlineProfiles || [];
    const certifications = accomplishments.certifications || [];

    const normalizedITSkills: ITSkill[] = (itSkills || []).filter(Boolean).map(s => {
        if (typeof s === 'string') return { name: s, version: '', lastUsed: '', experienceYears: '', experienceMonths: '' };
        return s;
    });

    const formattedLocation = useMemo(() => {
        if (profile.currentLocation && profile.currentLocation.city) {
            return `${profile.currentLocation.city}${profile.currentLocation.area ? `, ${profile.currentLocation.area}` : ''}`;
        }
        return profile.location || 'Not specified';
    }, [profile.currentLocation, profile.location]);

    const resumeFilename = useMemo(() => {
        if (!profile.resumeUrl) return '';
        try {
            const urlParts = profile.resumeUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            const nameParts = decodeURIComponent(lastPart).split('_');
            if (nameParts.length > 2) {
                return nameParts.slice(2).join('_');
            }
            return lastPart;
        } catch (e) { return 'resume.pdf'; }
    }, [profile.resumeUrl]);

    const InfoItem: React.FC<{ label: string, value: string | string[], icon: React.ReactNode }> = ({ label, value, icon }) => (
        <div className="flex items-start">
            <span className="w-5 h-5 text-gray-500 mr-3 mt-0.5 flex-shrink-0">{icon}</span>
            <div>
                <p className="font-semibold text-dark-gray">{label}</p>
                <p className="text-gray-600">{Array.isArray(value) ? value.join(', ') : (value || 'Not specified')}</p>
            </div>
        </div>
    );

    const Modal: React.FC<{ title: string, subtitle?: string, children: React.ReactNode }> = ({ title, subtitle, children }) => (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={handleCloseModal}>
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-scale-in flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="px-8 py-6 border-b flex justify-between items-center bg-white rounded-t-2xl">
                    <div>
                        <h3 className="font-bold text-xl text-dark-gray">{title}</h3>
                        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
                    </div>
                    <button onClick={handleCloseModal} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"><CloseIcon className="w-6 h-6 text-gray-500" /></button>
                </div>
                {children}
            </div>
        </div>
    );

    const ModalForm: React.FC<{
        initialData: any;
        fields: { name: string, label: string, type: 'text' | 'select' | 'textarea' | 'checkbox' | 'month-year', options?: (string | { label: string, value: string })[] }[];
        onSave: (data: any) => void;
        onDelete?: () => void;
        isSubmitting: boolean;
        gridCols?: 1 | 2;
    }> = ({ initialData, fields, onSave, onDelete, isSubmitting, gridCols = 2 }) => {
        const [formData, setFormData] = useState(initialData || {});
        const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
            const { name, value, type } = e.target;
            const checked = (e.target as HTMLInputElement).checked;
            setFormData((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        };
        const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

        return (
            <>
                <div className="p-8 overflow-y-auto custom-scrollbar flex-grow">
                    <form id="modal-form" onSubmit={handleSubmit}>
                        <div className={`grid grid-cols-1 md:grid-cols-${gridCols} gap-6`}>
                            {fields.map(field => {
                                const commonProps = { name: field.name, label: field.label, onChange: handleChange, value: formData[field.name] || '', defaultValue: formData[field.name] || '' };
                                if (field.type === 'textarea') return <div key={String(field.name)} className={`md:col-span-${gridCols}`}><FormTextArea {...commonProps} rows={4} /></div>;
                                if (field.type === 'checkbox') return <div key={String(field.name)} className={`md:col-span-${gridCols} flex items-center pt-2`}><FormCheckbox label={field.label} name={field.name} checked={!!formData[field.name]} onChange={handleChange} /></div>;
                                if (field.type === 'select') return <div key={String(field.name)}><FormSelect {...commonProps}> {field.options?.map((opt: any) => <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>)}</FormSelect></div>;
                                return <div key={String(field.name)}><FormInput {...commonProps} type={field.type} /></div>;
                            })}
                        </div>
                    </form>
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t flex justify-between items-center rounded-b-2xl">
                    <div>
                        {onDelete ? (
                            <button type="button" onClick={onDelete} className="text-red-600 font-bold text-sm hover:underline">{isSubmitting ? 'Deleting...' : 'Delete'}</button>
                        ) : <span></span>}
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button>
                        <button type="submit" form="modal-form" disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">{isSubmitting ? 'Saving...' : 'Save'}</button>
                    </div>
                </div>
            </>
        );
    };

    return (
        <div className="bg-light-gray">
            <input type="file" ref={resumeFileRef} onChange={handleResumeUpload} className="hidden" accept=".pdf,.doc,.docx" />
            <input type="file" ref={photoFileRef} onChange={handlePhotoChange} className="hidden" accept="image/png, image/jpeg, image/gif" />

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <aside className="lg:col-span-3 space-y-6 lg:sticky lg:top-24">
                        <div className="bg-white p-4 rounded-2xl shadow-sm text-center">
                            <div className="relative group w-32 h-32 mx-auto mb-4">
                                <label htmlFor="photo-upload" className="cursor-pointer">
                                    <ProfileCompletionCircle progress={profileCompletion} size={128}>
                                        {isPhotoSubmitting ? <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div> : <img src={profilePhoto || `https://i.pravatar.cc/150?u=${user.email}`} alt={user.name} className="w-full h-full object-cover" />}
                                    </ProfileCompletionCircle>
                                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"> <PencilIcon className="w-6 h-6" /> </div>
                                </label>
                                <input id="photo-upload" type="file" ref={photoFileRef} onChange={handlePhotoChange} className="hidden" accept="image/png, image/jpeg, image/gif" />
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1.5 rounded-full shadow-md border-2 border-white">
                                    <span className={`text-lg font-extrabold ${profileCompletion >= 75 ? 'text-green-600' : profileCompletion >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                                        {profileCompletion}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-center items-center gap-2">
                                <p className="text-lg font-bold mt-4">{name}</p>
                                <button onClick={() => setIsBasicDetailsModalOpen(true)} className="mt-4 text-primary hover:text-primary-dark" aria-label="Edit basic details">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-600 px-4">{headline || 'Add a professional headline'}</p>
                            <div className="mt-4 text-left space-y-2">
                                <DetailRow icon={<LocationMarkerIcon className="w-4 h-4" />} text={formattedLocation} />
                                <DetailRow icon={<PhoneIcon className="w-4 h-4" />} text={phone || 'Not specified'} verified={user.isPhoneVerified} />
                                <DetailRow icon={<MailIcon className="w-4 h-4" />} text={email} verified={user.isEmailVerified} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm">
                            <h3 className="font-bold text-dark-gray text-base mb-3">Quick links</h3>
                            <div className="space-y-3">
                                <QuickLinkItem label="Resume headline" actionText="Update" onClick={() => navigate('/profile/edit/headline')} />
                                <QuickLinkItem label="Profile summary" actionText="Update" onClick={() => navigate('/profile/edit/summary')} />
                                <QuickLinkItem label="Key skills" actionText="Update" onClick={() => navigate('/profile/edit/skills')} />
                                <QuickLinkItem label="Education" actionText="Add" onClick={() => navigate('/profile/edit/education/new')} />
                                <QuickLinkItem label="Employment" actionText="Add" onClick={() => navigate('/profile/edit/employment/new')} />
                                <QuickLinkItem label="Career Profile" actionText="Update" onClick={() => navigate('/profile/edit/career')} />
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-2xl shadow-sm"> <button onClick={logout} className="w-full flex items-center justify-center text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg p-2 transition-colors"> <LogoutIcon className="w-5 h-5 mr-2" /> Logout </button> </div>
                    </aside>
                    <main className="lg:col-span-9 space-y-6">
                        <CollapsibleCard title="Resume">
                            {profile.resumeUrl ? (<div> <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg"> <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 flex-shrink-0" /> <div> <p className="font-semibold text-green-800">Resume Uploaded</p> <p className="text-sm text-green-700 break-all">{resumeFilename || 'resume.pdf'}</p> </div> </div> <div className="mt-4 flex flex-wrap gap-3">

                                <button onClick={() => setIsResumePreviewOpen(true)} className="flex items-center px-4 py-2 text-sm font-semibold bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"> <EyeIcon className="w-4 h-4 mr-2" /> View </button>

                                <button onClick={() => resumeFileRef.current?.click()} disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-semibold bg-blue-100 text-primary rounded-lg hover:bg-blue-200 disabled:opacity-50"> <ArrowUpIcon className="w-4 h-4 mr-2" /> {isSubmitting ? 'Uploading...' : 'Replace'} </button> <button onClick={handleDeleteResume} disabled={isSubmitting} className="flex items-center px-4 py-2 text-sm font-semibold bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"> <TrashIcon className="w-4 h-4 mr-2" /> Delete </button> </div> </div>) : (<div className="text-center py-4"> <p className="text-gray-500 mb-4">You have not uploaded a resume yet.</p> <button onClick={() => resumeFileRef.current?.click()} disabled={isSubmitting} className="flex items-center mx-auto px-6 py-2 text-sm font-semibold bg-primary text-white rounded-full hover:bg-primary-dark disabled:opacity-50"> <ArrowUpIcon className="w-5 h-5 mr-2" /> {isSubmitting ? 'Uploading...' : 'Upload Resume'} </button> </div>)}
                        </CollapsibleCard>
                        <CollapsibleCard title="Profile summary" onEdit={() => navigate('/profile/edit/summary')}> <p className="text-dark-gray whitespace-pre-line">{profileSummary || 'Add a profile summary.'}</p> </CollapsibleCard>
                        <CollapsibleCard title="Key skills" onEdit={() => navigate('/profile/edit/skills')}> <div className="flex flex-wrap gap-3"> {skills.length > 0 ? skills.map(skill => <SkillTag key={skill} skill={skill} />) : <p className="text-gray-500 text-sm">Add your key skills.</p>} </div> </CollapsibleCard>

                        {/* IT Skills Section */}
                        <CollapsibleCard title="IT skills" onAdd={() => navigate('/profile/edit/it-skills/new')}>
                            {normalizedITSkills.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm text-left text-dark-gray">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                                            <tr>
                                                <th className="px-4 py-3">Skills</th>
                                                <th className="px-4 py-3">Version</th>
                                                <th className="px-4 py-3">Last Used</th>
                                                <th className="px-4 py-3">Experience</th>
                                                <th className="px-4 py-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {normalizedITSkills.map((skill, i) => (
                                                <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium">{skill.name}</td>
                                                    <td className="px-4 py-3 text-gray-600">{skill.version || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600">{skill.lastUsed || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {skill.experienceYears ? `${skill.experienceYears} Year(s)` : ''}
                                                        {skill.experienceYears && skill.experienceMonths ? ' ' : ''}
                                                        {skill.experienceMonths ? `${skill.experienceMonths} Month(s)` : ''}
                                                        {!skill.experienceYears && !skill.experienceMonths ? '-' : ''}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <button onClick={() => navigate(`/profile/edit/it-skills/${i}`)} className="text-primary hover:bg-blue-50 p-1.5 rounded-full">
                                                            <PencilIcon className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">Add details of programming languages, software, and tools you know.</p>
                            )}
                        </CollapsibleCard>

                        <CollapsibleCard title="Career Profile" onEdit={() => navigate('/profile/edit/career')}>
                            {careerProfile && careerProfile.currentIndustry ? (<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"> <InfoItem icon={<GlobeAltIcon />} label="Industry" value={careerProfile.currentIndustry} /> <InfoItem icon={<BriefcaseIcon />} label="Desired Job Types" value={careerProfile.desiredJobTypes || []} /> <InfoItem icon={<ScaleIcon />} label="Employment Type" value={careerProfile.desiredEmploymentTypes || []} /> <InfoItem icon={<LocationMarkerIcon />} label="Preferred Locations" value={careerProfile.preferredLocations || []} /> <InfoItem icon={<BriefcaseIcon />} label="Expected Salary" value={`${careerProfile.expectedSalaryCurrency || ''} ${careerProfile.expectedSalaryAmount || ''}`} /> </div>) : (<p className="text-gray-500 text-sm">Add your career preferences.</p>)}
                        </CollapsibleCard>
                        <CollapsibleCard title="Employment" onAdd={() => navigate('/profile/edit/employment/new')}>
                            <div className="space-y-4">
                                {employment.length > 0 ? employment.map((emp, i) => (<div key={i} className={`pt-4 ${i > 0 ? "mt-4 border-t" : ""}`}> <div className="flex items-start justify-between"> <div> <h4 className="font-semibold text-dark-gray">{emp.jobTitle}</h4> <p className="text-sm text-dark-gray">{emp.companyName}</p> <p className="text-xs text-gray-600 mt-1">{emp.joiningMonth} {emp.joiningYear} - {emp.isCurrent ? 'Present' : `${emp.workedTillMonth} ${emp.workedTillYear}`}</p> </div> <button onClick={() => navigate(`/profile/edit/employment/${i}`)}><PencilIcon className="w-4 h-4 text-primary" /></button> </div> </div>)) : <p className="text-gray-500 text-sm">Add your employment history.</p>}
                            </div>
                        </CollapsibleCard>
                        <CollapsibleCard title="Education" onAdd={() => navigate('/profile/edit/education/new')}>
                            <div className="space-y-4">
                                {education.length > 0 ? education.map((edu, i) => (<div key={i} className={`pt-4 ${i > 0 ? "mt-4 border-t" : ""}`}> <div className="flex items-start justify-between"> <div> <h4 className="font-semibold text-dark-gray">{edu.educationLevel} in {edu.specialization}</h4> <p className="text-sm text-dark-gray">{edu.institution}</p> <p className="text-xs text-gray-600 mt-1">{edu.startYear} - {edu.endYear}</p> </div> <button onClick={() => navigate(`/profile/edit/education/${i}`)}><PencilIcon className="w-4 h-4 text-primary" /></button> </div> </div>)) : <p className="text-gray-500 text-sm">Add your qualifications.</p>}
                            </div>
                        </CollapsibleCard>

                        {/* Enhanced Accomplishments Section */}
                        <CollapsibleCard title="Accomplishments">
                            <div className="space-y-6 divide-y">
                                <div>
                                    <div className="flex justify-between items-center mb-3 pt-2">
                                        <h4 className="font-semibold text-base">Online Profiles</h4>
                                        <button onClick={() => navigate('/profile/edit/accomplishments/online-profile-new')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <PlusCircleIcon className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {onlineProfiles.length > 0 ? (
                                        <div className="space-y-4">
                                            {onlineProfiles.map((p: any, i: number) => (
                                                <div key={i} className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-sm">{p.name}</p>
                                                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all block">{p.url}</a>
                                                        {p.description && <p className="text-sm text-gray-500 mt-1">{p.description}</p>}
                                                    </div>
                                                    <button onClick={() => navigate(`/profile/edit/accomplishments/online-profile-${i}`)} className="text-gray-500 hover:text-primary ml-4 p-1 hover:bg-gray-100 rounded-full">
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">Add links to your online profiles (e.g., LinkedIn, GitHub, Portfolio).</p>
                                    )}
                                </div>

                                <div className="pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="font-semibold text-base">Certifications</h4>
                                        <button onClick={() => navigate('/profile/edit/accomplishments/certification-new')} className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                                            <PlusCircleIcon className="w-4 h-4" /> Add
                                        </button>
                                    </div>
                                    {certifications.length > 0 ? (
                                        <div className="space-y-4">
                                            {certifications.map((c: any, i: number) => (
                                                <div key={i} className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-medium text-sm">{c.name}</p>
                                                        {c.completionId && <p className="text-xs text-gray-500">ID: {c.completionId}</p>}
                                                        {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline break-all block mt-1">Certificate URL</a>}
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {c.doesNotExpire ? 'Does not expire' : `${c.fromMonth} ${c.fromYear} - ${c.toMonth} ${c.toYear}`}
                                                        </p>
                                                    </div>
                                                    <button onClick={() => navigate(`/profile/edit/accomplishments/certification-${i}`)} className="text-gray-500 hover:text-primary ml-4 p-1 hover:bg-gray-100 rounded-full">
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">Add details of your certifications and licenses.</p>
                                    )}
                                </div>
                            </div>
                        </CollapsibleCard>
                    </main>
                </div>
            </div>

            <BasicDetailsModal
                isOpen={isBasicDetailsModalOpen}
                onClose={() => setIsBasicDetailsModalOpen(false)}
                user={user}
                onSave={handleSave}
            />

            {/* Resume Preview Modal for User */}
            {isResumePreviewOpen && profile.resumeUrl && (
                <ResumePreviewModal
                    resumeUrl={profile.resumeUrl}
                    title="My Resume"
                    onClose={() => setIsResumePreviewOpen(false)}
                />
            )}

            {section === 'headline' && (<Modal title="Edit Resume Headline"> <form id="modal-form" onSubmit={e => { e.preventDefault(); handleSave({ profile: { ...user.profile!, headline: (e.target as any).headline.value } }); }}> <div className="p-8 flex-grow"> <FormInput label="Headline" name="headline" defaultValue={headline} autoFocus required /> </div> <div className="px-8 py-5 bg-gray-50 border-t flex justify-end gap-4 rounded-b-2xl"> <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button> <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">{isSubmitting ? 'Saving...' : 'Save'}</button> </div> </form> </Modal>)}
            {section === 'summary' && (<Modal title="Edit Profile Summary"> <form id="modal-form" onSubmit={e => { e.preventDefault(); handleSave({ profile: { ...user.profile!, profileSummary: (e.target as any).summary.value } }); }}> <div className="p-8 flex-grow"> <FormTextArea name="summary" defaultValue={profileSummary} rows={8} autoFocus label="Profile Summary" /> </div> <div className="px-8 py-5 bg-gray-50 border-t flex justify-end gap-4 rounded-b-2xl"> <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button> <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">{isSubmitting ? 'Saving...' : 'Save'}</button> </div> </form> </Modal>)}
            {section === 'skills' && (<SkillsEditorModal title="Key Skills" onSave={(newSkills) => handleSave({ profile: { ...user.profile!, skills: newSkills } })} onClose={handleCloseModal} initialSkills={skills || []} isSubmitting={isSubmitting} />)}

            {/* IT Skills Modal */}
            {itSkillsParams && (
                <ITSkillsFormModal
                    isOpen={true}
                    onClose={handleCloseModal}
                    isSubmitting={isSubmitting}
                    initialData={!itSkillsParams.isNew && itSkillsParams.index !== null ? normalizedITSkills[itSkillsParams.index] : undefined}
                    onSave={(data) => {
                        const newITSkills = [...normalizedITSkills];
                        if (itSkillsParams.isNew || itSkillsParams.index === null) {
                            newITSkills.push(data);
                        } else {
                            newITSkills[itSkillsParams.index] = data;
                        }
                        handleSave({ profile: { ...user.profile!, itSkills: newITSkills } });
                    }}
                    onDelete={(!itSkillsParams.isNew && itSkillsParams.index !== null) ? () => {
                        if (window.confirm('Are you sure you want to remove this skill?')) {
                            const newITSkills = normalizedITSkills.filter((_, i) => i !== itSkillsParams.index);
                            handleSave({ profile: { ...user.profile!, itSkills: newITSkills } });
                        }
                    } : undefined}
                />
            )}

            {section === 'career' && (<Modal title="Edit Career Profile"> <form id="modal-form" onSubmit={e => { e.preventDefault(); const formData = new FormData(e.currentTarget); handleSave({ profile: { ...user.profile!, careerProfile: { currentIndustry: formData.get('currentIndustry') as string, department: formData.get('department') as string, roleCategory: formData.get('roleCategory') as string, jobRole: formData.get('jobRole') as string, desiredJobTypes: ((formData.get('desiredJobTypes') as string) || '').split(',').map(s => s.trim()).filter(Boolean), desiredEmploymentTypes: ['Full-time', 'Contract', 'Internship'].filter(type => formData.get(`employmentType-${type}`)), preferredShift: formData.get('preferredShift') as any, preferredLocations: ((formData.get('preferredLocations') as string) || '').split(',').map(s => s.trim()).filter(Boolean), expectedSalaryCurrency: formData.get('expectedSalaryCurrency') as string, expectedSalaryAmount: formData.get('expectedSalaryAmount') as string, } } }); }}> <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar"> <FormRow> <FormInput label="Current Industry" name="currentIndustry" defaultValue={careerProfile?.currentIndustry} /> <FormInput label="Department" name="department" defaultValue={careerProfile?.department} /> </FormRow> <FormRow> <FormInput label="Role Category" name="roleCategory" defaultValue={careerProfile?.roleCategory} /> <FormInput label="Job Role" name="jobRole" defaultValue={careerProfile?.jobRole} /> </FormRow> <FormInput label="Desired Job Types (comma-separated)" name="desiredJobTypes" defaultValue={careerProfile?.desiredJobTypes?.join(', ')} /> <div> <label className={labelClasses}>Desired Employment Type</label> <div className="mt-2 flex gap-6"> <FormCheckbox label="Full-time" name="employmentType-Full-time" defaultChecked={careerProfile?.desiredEmploymentTypes?.includes('Full-time')} /> <FormCheckbox label="Contract" name="employmentType-Contract" defaultChecked={careerProfile?.desiredEmploymentTypes?.includes('Contract')} /> <FormCheckbox label="Internship" name="employmentType-Internship" defaultChecked={careerProfile?.desiredEmploymentTypes?.includes('Internship')} /> </div> </div> <FormSelect label="Preferred Shift" name="preferredShift" defaultValue={careerProfile?.preferredShift}> <option value="">Select Shift</option> <option value="Day">Day</option> <option value="Night">Night</option> <option value="Flexible">Flexible</option> </FormSelect> <FormInput label="Preferred Locations (comma-separated)" name="preferredLocations" defaultValue={careerProfile?.preferredLocations?.join(', ')} /> <FormRow> <FormSelect label="Expected Salary Currency" name="expectedSalaryCurrency" defaultValue={careerProfile?.expectedSalaryCurrency || 'INR'}> <option value="INR">INR (₹)</option> <option value="USD">USD ($)</option> </FormSelect> <FormInput label="Expected Salary (Lakhs P.A.)" name="expectedSalaryAmount" defaultValue={careerProfile?.expectedSalaryAmount} /> </FormRow> </div> <div className="px-8 py-5 bg-gray-50 border-t flex justify-end gap-4 rounded-b-2xl"> <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 rounded-full font-bold text-primary hover:bg-blue-50 transition-colors">Cancel</button> <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 rounded-full bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:bg-gray-400 shadow-md hover:shadow-lg">{isSubmitting ? 'Saving...' : 'Save'}</button> </div> </form> </Modal>)}
            {section === 'education' && (<Modal title={itemIndex !== null ? 'Edit Education' : 'Add Education'}> <ModalForm isSubmitting={isSubmitting} initialData={itemIndex !== null ? education[itemIndex] : {}} fields={[{ name: 'educationLevel', label: 'Education Level', type: 'text' }, { name: 'institution', label: 'Institution', type: 'text' }, { name: 'course', label: 'Course', type: 'text' }, { name: 'specialization', label: 'Specialization', type: 'text' }, { name: 'courseType', label: 'Course Type', type: 'select', options: ['Full time', 'Part time', 'Correspondence/Distance learning'] }, { name: 'startYear', label: 'Start Year', type: 'text' }, { name: 'endYear', label: 'End Year', type: 'text' },]} onSave={(data: Education) => { const newEducation = [...education]; if (itemIndex !== null) newEducation[itemIndex] = data; else newEducation.push(data); handleSave({ profile: { ...user.profile!, education: newEducation } }); }} onDelete={itemIndex !== null ? () => { if (window.confirm('Are you sure?')) { const newEducation = education.filter((_, i) => i !== itemIndex); handleSave({ profile: { ...user.profile!, education: newEducation } }); } } : undefined} /> </Modal>)}
            {section === 'employment' && (<Modal title={itemIndex !== null ? 'Edit Employment' : 'Add Employment'}> <ModalForm isSubmitting={isSubmitting} initialData={itemIndex !== null ? employment[itemIndex] : { isCurrent: index === 'new' }} fields={[{ name: 'jobTitle', label: 'Job Title', type: 'text' }, { name: 'companyName', label: 'Company Name', type: 'text' }, { name: 'employmentType', label: 'Employment Type', type: 'select', options: ['', 'Full-time', 'Contract', 'Internship'] }, { name: 'isCurrent', label: 'This is my current job', type: 'checkbox' }, { name: 'joiningYear', label: 'Joining Year', type: 'text' }, { name: 'joiningMonth', label: 'Joining Month', type: 'text' }, { name: 'workedTillYear', label: 'Worked Till Year', type: 'text' }, { name: 'workedTillMonth', label: 'Worked Till Month', type: 'text' }, { name: 'jobProfile', label: 'Job Profile', type: 'textarea' },]} onSave={(data: Employment) => { const newEmployment = [...employment]; if (itemIndex !== null) newEmployment[itemIndex] = data; else newEmployment.push(data); handleSave({ profile: { ...user.profile!, employment: newEmployment } }); }} onDelete={itemIndex !== null ? () => { if (window.confirm('Are you sure?')) { const newEmployment = employment.filter((_, i) => i !== itemIndex); handleSave({ profile: { ...user.profile!, employment: newEmployment } }); } } : undefined} /> </Modal>)}

            {section === 'accomplishments' && accParams && (
                <Modal title={(accParams.isNew ? 'Add ' : 'Edit ') + (accParams.type === 'online-profile' ? 'Online Profile' : 'Certification')}>
                    <ModalForm
                        isSubmitting={isSubmitting}
                        initialData={
                            !accParams.isNew && accParams.index !== null
                                ? (accParams.type === 'online-profile' ? onlineProfiles[accParams.index] : certifications[accParams.index])
                                : {}
                        }
                        gridCols={2}
                        fields={
                            accParams.type === 'online-profile'
                                ? [
                                    { name: 'name', label: 'Profile Name', type: 'text' },
                                    { name: 'url', label: 'URL', type: 'text' },
                                    { name: 'description', label: 'Description', type: 'textarea' },
                                ]
                                : [
                                    { name: 'name', label: 'Certification Name', type: 'text' },
                                    { name: 'completionId', label: 'Completion ID', type: 'text' },
                                    { name: 'url', label: 'URL', type: 'text' },
                                    { name: 'doesNotExpire', label: 'Does Not Expire', type: 'checkbox' },
                                    { name: 'fromMonth', label: 'Start Month', type: 'text' },
                                    { name: 'fromYear', label: 'Start Year', type: 'text' },
                                    { name: 'toMonth', label: 'End Month', type: 'text' },
                                    { name: 'toYear', label: 'End Year', type: 'text' },
                                ]
                        }
                        onSave={(data: any) => {
                            const newAccomplishments = {
                                onlineProfiles: user.profile?.accomplishments?.onlineProfiles ? [...user.profile.accomplishments.onlineProfiles] : [],
                                certifications: user.profile?.accomplishments?.certifications ? [...user.profile.accomplishments.certifications] : []
                            };

                            if (accParams.type === 'online-profile') {
                                if (accParams.index !== null && !accParams.isNew) newAccomplishments.onlineProfiles[accParams.index] = data;
                                else newAccomplishments.onlineProfiles.push(data);
                            } else {
                                if (accParams.index !== null && !accParams.isNew) newAccomplishments.certifications[accParams.index] = data;
                                else newAccomplishments.certifications.push(data);
                            }
                            handleSave({ profile: { ...user.profile!, accomplishments: newAccomplishments } });
                        }}
                        onDelete={(!accParams.isNew && accParams.index !== null) ? () => {
                            if (window.confirm('Are you sure?')) {
                                const newAccomplishments = {
                                    onlineProfiles: user.profile?.accomplishments?.onlineProfiles ? [...user.profile.accomplishments.onlineProfiles] : [],
                                    certifications: user.profile?.accomplishments?.certifications ? [...user.profile.accomplishments.certifications] : []
                                };

                                if (accParams.type === 'online-profile') {
                                    newAccomplishments.onlineProfiles = newAccomplishments.onlineProfiles.filter((_, i) => i !== accParams.index);
                                } else {
                                    newAccomplishments.certifications = newAccomplishments.certifications.filter((_, i) => i !== accParams.index);
                                }
                                handleSave({ profile: { ...user.profile!, accomplishments: newAccomplishments } });
                            }
                        } : undefined}
                    />
                </Modal>
            )}
        </div>
    );
};
export default ProfilePage;
