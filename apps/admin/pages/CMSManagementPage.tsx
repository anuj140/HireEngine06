import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CmsData, CmsBanner, CmsNavigation, CmsPage, CmsCard, User, UserProfile } from '../../../packages/types';
import { fetchCmsContent, updateCmsContent } from '../services/api';
import { useToast } from '../hooks/useToast';
import {
    ChevronDownIcon, ChevronUpIcon, UploadIcon, VideoCameraIcon, PhotographIcon, CloseIcon, PlusCircleIcon,
    TrashIcon, DragHandleIcon, InformationCircleIcon, HomeIcon, WindowIcon, GlobeAltIcon, BuildingOfficeIcon,
    DashboardIcon, BriefcaseIcon, EyeIcon
} from '../components/Icons';
import RichTextInput from '../components/RichTextInput';
import NavigationEditor from '../components/NavigationEditor';
// DO: Add comment above each fix.
// FIX: Removed MemoryRouter import as it causes "Router inside Router" error when nested in HashRouter.
// import { MemoryRouter } from 'react-router-dom';

// Web App components for preview
import WebHeader from '../../../apps/web/components/Header';
import WebFooter from '../../../apps/web/components/Footer';
import PublicHomePage from '../../../apps/web/pages/PublicHomePage';
import CompaniesPage from '../../../apps/web/pages/CompaniesPage';
import PromotionalBanner from '../../../apps/web/components/PromotionalBanner';

// Company App components for preview
import CompanyHeader from '../../../apps/company/components/Header';
import CompanyFooter from '../../../apps/company/components/Footer';
import LandingPage from '../../../apps/company/pages/LandingPage';

// Other dependencies for preview
import { MOCK_HIRING_COMPANIES } from '../../../packages/api-client/cms-data';
import { AuthContext } from '../../../apps/web/contexts/AuthContext';
import { ToastProvider } from '../../../apps/web/contexts/ToastContext';
import { BreadcrumbProvider } from '../../../apps/web/contexts/BreadcrumbContext';
import { UserActivityProvider } from '../../../apps/web/contexts/UserActivityContext';
import { NotificationProvider } from '../../../apps/web/contexts/NotificationContext';
import { MessageProvider } from '../../../apps/web/contexts/MessageContext';

// --- Reusable Form Components ---
const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full border-gray-300 rounded-md shadow-sm text-sm focus:ring-primary/50 focus:border-primary" />
    </div>
);
const Checkbox: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
        <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)} className="rounded text-primary focus:ring-primary/50" />
        <span className="text-sm font-medium text-gray-700">{label}</span>
    </label>
);
interface FileUploadInputProps {
    label: string;
    value?: string;
    onChange: (newUrl: string) => void;
    icon: React.ReactNode;
}
const FileUploadInput: React.FC<FileUploadInputProps> = ({ label, value, onChange, icon }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center border overflow-hidden">
                    {value ? <img src={value} alt="preview" className="w-full h-full object-cover" /> : icon}
                </div>
                <input
                    type="text"
                    value={value || ''}
                    onChange={e => onChange(e.target.value)}
                    placeholder="Enter URL or upload"
                    className="flex-grow border-gray-300 rounded-md shadow-sm text-sm"
                />
                <input type="file" ref={fileInputRef} className="hidden" onChange={e => {
                    if (e.target.files?.[0]) {
                        onChange(URL.createObjectURL(e.target.files[0]));
                    }
                }} accept="image/*,video/*" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 bg-gray-200 rounded-md hover:bg-gray-300">
                    <UploadIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>
        </div>
    );
};

// --- Editor Components ---
const SectionEditor: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <div className="border rounded-lg">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-t-lg">
                <h3 className="font-semibold text-dark-text">{title}</h3>
                {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-500" /> : <ChevronDownIcon className="w-5 h-5 text-gray-500" />}
            </button>
            {isOpen && <div className="p-4 space-y-4">{children}</div>}
        </div>
    );
};

const BannerEditor: React.FC<{ banner: CmsBanner; path: string; onUpdate: (path: string, value: any) => void; }> = ({ banner, path, onUpdate }) => {
    return (
        <div className="space-y-3 p-3 border rounded-md">
            <FormInput label="Banner Name" value={banner.name} onChange={e => onUpdate(`${path}.name`, e.target.value)} />
            <RichTextInput label="Title" value={banner.title} onChange={val => onUpdate(`${path}.title`, val)} />
            <RichTextInput label="Subtitle" value={banner.subtitle} onChange={val => onUpdate(`${path}.subtitle`, val)} />
            <div className="grid grid-cols-2 gap-4">
                <FormInput label="CTA Text" value={banner.cta.text} onChange={e => onUpdate(`${path}.cta.text`, e.target.value)} />
                <FormInput label="CTA Link" value={banner.cta.link} onChange={e => onUpdate(`${path}.cta.link`, e.target.value)} />
            </div>
            <FileUploadInput label="Background Image URL" value={banner.backgroundImageUrl} onChange={val => onUpdate(`${path}.backgroundImageUrl`, val)} icon={<PhotographIcon className="w-8 h-8 text-gray-400" />} />
            <div className="flex space-x-4">
                <Checkbox label="Use Dark Overlay" checked={banner.useDarkOverlay || false} onChange={val => onUpdate(`${path}.useDarkOverlay`, val)} />
                <Checkbox label="Show Illustration" checked={banner.showIllustration === undefined ? true : banner.showIllustration} onChange={val => onUpdate(`${path}.showIllustration`, val)} />
            </div>
        </div>
    );
};

const CardEditor: React.FC<{ card: CmsCard; path: string; onUpdate: (path: string, value: any) => void; onRemove: () => void; }> = ({ card, path, onUpdate, onRemove }) => {
    // Basic editor for a card
    return (
        <div className="p-3 border rounded-lg relative">
            <button onClick={onRemove} className="absolute top-2 right-2 text-gray-400 hover:text-red-600"><TrashIcon className="w-5 h-5" /></button>
            <div className="space-y-2">
                <FormInput label="Title" value={card.title} onChange={e => onUpdate(`${path}.title`, e.target.value)} />
                <FormInput label="Text" value={card.text} onChange={e => onUpdate(`${path}.text`, e.target.value)} />
                <FileUploadInput label="Image URL" value={card.imageUrl} onChange={val => onUpdate(`${path}.imageUrl`, val)} icon={<PhotographIcon className="w-8 h-8 text-gray-400" />} />
                <FormInput label="CTA Text" value={card.cta.text} onChange={e => onUpdate(`${path}.cta.text`, e.target.value)} />
                <FormInput label="CTA Link" value={card.cta.link} onChange={e => onUpdate(`${path}.cta.link`, e.target.value)} />
                <div>
                    <label className="text-sm font-medium">Template</label>
                    <select value={card.template} onChange={e => onUpdate(`${path}.template`, e.target.value)} className="w-full border-gray-300 rounded-md text-sm">
                        <option value="standard">Standard</option>
                        <option value="image-background">Image Background</option>
                        <option value="promo-banner-a">Promo Banner</option>
                        <option value="split-content">Split Content</option>
                        <option value="image-ad">Image Ad</option>
                        <option value="image-custom-size">Custom Image Ad</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

const PageEditor: React.FC<{ page: CmsPage; path: string; onUpdate: (path: string, value: any) => void; }> = ({ page, path, onUpdate }) => {
    const handleAddCard = () => {
        const newCard: CmsCard = { id: `card-${Date.now()}`, template: 'standard', placement: 'web-public-home', title: 'New Card', text: '', imageUrl: '', cta: { text: '', link: '' }, colors: { background: '#ffffff', text: '#000000' } };
        onUpdate(`${path}.cards`, [...(page.cards || []), newCard]);
    };

    return (
        <div className="space-y-4">
            {(page.banners || []).map((banner, index) => (
                <SectionEditor key={index} title={`Banner: ${banner.name}`}>
                    <BannerEditor banner={banner} path={`${path}.banners[${index}]`} onUpdate={onUpdate} />
                </SectionEditor>
            ))}
            <SectionEditor title="Cards">
                <div className="space-y-3">
                    {(page.cards || []).map((card, index) => (
                        <CardEditor key={card.id} card={card} path={`${path}.cards[${index}]`} onUpdate={onUpdate} onRemove={() => onUpdate(`${path}.cards`, page.cards?.filter(c => c.id !== card.id))} />
                    ))}
                </div>
                <button onClick={handleAddCard} className="mt-4 text-sm font-semibold text-primary flex items-center gap-2"><PlusCircleIcon className="w-5 h-5" /> Add Card</button>
            </SectionEditor>
        </div>
    );
};

// --- Mock Context for Previews ---
// This mock context provides a shell for components from other apps that rely on AuthContext.
const mockAuthContextValue = {
    user: null as User | null,
    isAuthLoading: false,
    login: async (email: string, password: string) => { },
    logout: () => { },
    updateUserProfile: async (profileUpdates: Partial<UserProfile>) => { },
    register: async (name: string, email: string, password: string, phone: string) => { return { user: {} as User, token: '' } },
    loginAfterRegister: async (user: User, token: string) => { },
    uploadResume: async (file: File) => { },
    uploadProfilePhoto: async (file: File) => { },
    deleteResume: async () => { },
    loginMethod: null as 'email' | 'google' | null,
};

const PreviewWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    // DO: Add comment above each fix.
    // FIX: Removed MemoryRouter wrapper to prevent nesting error. Components will use the parent HashRouter context.
    // <MemoryRouter>
    <ToastProvider>
        <AuthContext.Provider value={mockAuthContextValue as any}>
            <BreadcrumbProvider>
                <UserActivityProvider>
                    <NotificationProvider>
                        <MessageProvider>
                            {children}
                        </MessageProvider>
                    </NotificationProvider>
                </UserActivityProvider>
            </BreadcrumbProvider>
        </AuthContext.Provider>
    </ToastProvider>
    // </MemoryRouter>
);

// --- Main Page Component ---
const CMSManagementPage: React.FC = () => {
    /* ... state and handlers ... */
    const [cmsData, setCmsData] = useState<CmsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeEditor, setActiveEditor] = useState<'webPublicHome' | 'companyLanding' | 'globalHeader' | 'globalFooter'>('webPublicHome');
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    const loadCmsData = useCallback(() => {
        setIsLoading(true);
        fetchCmsContent()
            .then(data => setCmsData(data))
            .catch(err => addToast('Failed to load CMS data', 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    useEffect(() => {
        loadCmsData();
    }, [loadCmsData]);

    const handleUpdate = useCallback((path: string, value: any) => {
        setCmsData(prevData => {
            if (!prevData) return null;
            const keys = path.split(/[.\[\]]+/).filter(Boolean);
            const newData = JSON.parse(JSON.stringify(prevData));
            let current = newData;
            for (let i = 0; i < keys.length - 1; i++) {
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    }, []);

    const handleSave = async () => {
        if (!cmsData) return;
        setIsSaving(true);
        try {
            await updateCmsContent(cmsData);
            addToast('CMS content saved successfully!');
        } catch (err) {
            addToast('Failed to save content.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const editorConfig = {
        webPublicHome: {
            icon: <HomeIcon />,
            label: 'Web: Public Home',
            component: cmsData?.webPublicHome
                ? <PageEditor page={cmsData.webPublicHome} path="webPublicHome" onUpdate={handleUpdate} />
                : null
        },
        companyLanding: {
            icon: <BuildingOfficeIcon />,
            label: 'Company: Landing Page',
            component: cmsData?.companyLanding
                ? <PageEditor page={cmsData.companyLanding} path="companyLanding" onUpdate={handleUpdate} />
                : null
        },
        globalHeader: {
            icon: <WindowIcon />,
            label: 'Global: Header',
            component: cmsData?.globalHeader
                ? <NavigationEditor navigation={cmsData.globalHeader} path="globalHeader" onUpdate={handleUpdate} />
                : null
        },
        globalFooter: {
            icon: <GlobeAltIcon />,
            label: 'Global: Footer',
            component: cmsData?.globalFooter
                ? <NavigationEditor navigation={cmsData.globalFooter} path="globalFooter" onUpdate={handleUpdate} />
                : null
        },
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-dark-text">CMS Management</h1>
                    <p className="text-light-text mt-1">Manage content across all Job Portal Pro applications.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={activeEditor}
                            onChange={(e) => setActiveEditor(e.target.value as any)}
                            className="appearance-none bg-white border border-gray-300 rounded-md py-2 pl-4 pr-10 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            {Object.entries(editorConfig).map(([key, { label }]) => <option key={key} value={key}>{label}</option>)}
                        </select>
                        <ChevronDownIcon className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400">
                        {isSaving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* DO: Add comment above each fix. */}
            {/* FIX: Changed layout to Flexbox to allow 30/70 split. Increased height to fill available screen space (calc(100vh - 180px)). */}
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)]">
                {/* Editor Column - Fixed Width */}
                <div className="bg-white p-6 rounded-2xl shadow-sm space-y-6 h-full overflow-y-auto custom-scrollbar w-full lg:w-[400px] flex-shrink-0">
                    {isLoading || !cmsData ? (
                        <p>Loading editor...</p>
                    ) : (
                        editorConfig[activeEditor].component
                    )}
                </div>
                {/* Preview Column - Flexible Width */}
                <div className="bg-white rounded-2xl shadow-sm h-full overflow-hidden flex-1 flex flex-col border border-gray-200">
                    <div className="p-3 bg-gray-50 border-b flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-dark-text">
                            {editorConfig[activeEditor].icon} {editorConfig[activeEditor].label} Preview
                        </div>
                        <div className="px-2 py-1 bg-white border rounded text-xs text-gray-500 font-medium shadow-sm">Desktop View</div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-100/50">
                        <div className="min-h-full bg-white shadow-sm mx-auto max-w-[1400px]">
                            {isLoading || !cmsData ? <div className="p-8 text-center text-gray-500">Loading preview...</div> : (
                                <PreviewWrapper>
                                    {activeEditor === 'webPublicHome' && (
                                        <>
                                            <WebHeader onSearchClick={() => { }} />
                                            <PublicHomePage pageContent={cmsData.webPublicHome} />
                                            <WebFooter />
                                        </>
                                    )}
                                    {activeEditor === 'companyLanding' && (
                                        <>
                                            <CompanyHeader />
                                            <LandingPage pageContent={cmsData.companyLanding} />
                                            <CompanyFooter />
                                        </>
                                    )}
                                    {(activeEditor === 'globalHeader' || activeEditor === 'globalFooter') && (
                                        <div className="p-8 text-center h-full flex flex-col items-center justify-center">
                                            <div className="p-6 bg-blue-50 rounded-xl border border-blue-100">
                                                <p className="font-semibold mb-4 text-blue-900">Header/Footer components are best previewed within the full page context.</p>
                                                <button onClick={() => setActiveEditor('webPublicHome')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium">Switch to Homepage Preview</button>
                                            </div>
                                        </div>
                                    )}
                                </PreviewWrapper>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CMSManagementPage;