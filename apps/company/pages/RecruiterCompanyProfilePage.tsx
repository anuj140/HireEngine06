
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { fetchCompanyProfile, updateCompanyProfile, fetchRecruiterJobs } from '../../../packages/api-client';
import { useToast } from '../hooks/useToast';
import {
    PencilIcon,
    BuildingOfficeIcon,
    UsersIcon,
    CalendarIcon,
    GlobeAltIcon,
    TrashIcon,
    BriefcaseIcon,
    LocationMarkerIcon,
    PlayIcon,
    UploadIcon
} from '../components/Icons';
import { Company, Job } from '../../../packages/types';

// Reusable Form Components defined locally
const InputField: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-dark-gray">{label}</label>
        <input id={props.name} {...props} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
    </div>
);
const TextAreaField: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, ...props }) => (
    <div>
        <label htmlFor={props.name} className="block text-sm font-medium text-dark-gray">{label}</label>
        <textarea id={props.name} {...props} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm" />
    </div>
);
const Section: React.FC<{ title: string, children: React.ReactNode, className?: string }> = ({ title, children, className }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border ${className}`}>
        <h2 className="text-xl font-bold text-dark-gray mb-4">{title}</h2>
        {children}
    </div>
);
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start">
        <div className="text-gray-500 w-5 h-5 mr-3 mt-0.5 flex-shrink-0">{icon}</div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-sm font-semibold text-dark-gray">{value || 'N/A'}</p>
        </div>
    </div>
);
const ImageUpload: React.FC<{ label: string; currentImageUrl?: string; onImageChange: (file: File) => void; recommendedSize?: string; className?: string }> = ({ label, currentImageUrl, onImageChange, recommendedSize, className = '' }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
        <div className={`flex items-center space-x-4 ${className}`}>
            <img src={currentImageUrl || 'https://via.placeholder.com/150'} alt={label} className="w-20 h-20 rounded-lg object-cover bg-gray-100 border" />
            <div>
                <p className="font-semibold">{label}</p>
                {recommendedSize && <p className="text-xs text-gray-500">{recommendedSize}</p>}
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-semibold text-primary hover:underline mt-1 flex items-center gap-1">
                    <UploadIcon className="w-4 h-4" /> Upload
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => e.target.files && onImageChange(e.target.files[0])} className="hidden" accept="image/*" />
            </div>
        </div>
    );
};
const getYouTubeThumbnail = (url: string): string => {
    if (!url) return 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop';
    let videoId;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) videoId = urlObj.searchParams.get('v');
        else if (urlObj.hostname === 'youtu.be') videoId = urlObj.pathname.substring(1);
    } catch (e) { videoId = url; }
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop';
};

const RecruiterCompanyProfilePage: React.FC = () => {
    const { setCrumbs } = useBreadcrumbs();
    const { addToast } = useToast();

    const [company, setCompany] = useState<Company | null>(null);
    const [profileData, setProfileData] = useState<Company | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [playVideo, setPlayVideo] = useState(false);

    useEffect(() => {
        setCrumbs([
            { name: 'Dashboard', path: '/dashboard' },
            { name: 'Company Profile' }
        ]);
        setIsLoading(true);
        fetchCompanyProfile()
            .then(data => {
                const companyData = (data as any).recruiter || (data as any).company || data;
                setCompany(companyData);
                setProfileData(JSON.parse(JSON.stringify(companyData))); // deep copy for editing
            })
            .catch(err => addToast(`Failed to load company profile: ${err.message}`, 'error'))
            .finally(() => setIsLoading(false));
        return () => setCrumbs([]);
    }, [setCrumbs, addToast]);

    const handleNestedChange = useCallback((path: string, value: any) => {
        setProfileData(prev => {
            if (!prev) return null;
            const keys = path.split(/[.\[\]]+/).filter(Boolean);
            const newState = JSON.parse(JSON.stringify(prev));
            let current: any = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                const nextKeyIsNumber = !isNaN(Number(keys[i + 1]));
                if (current[key] === undefined || current[key] === null) current[key] = nextKeyIsNumber ? [] : {};
                current = current[key];
            }
            const lastKey = keys[keys.length - 1];
            if (current && lastKey) {
                const lastKeyAsNum = Number(lastKey);
                if (!isNaN(lastKeyAsNum) && Array.isArray(current)) current[lastKeyAsNum] = value;
                else current[lastKey] = value;
            }
            return newState;
        });
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleNestedChange(e.target.name, e.target.value);
    const handleArrayItemChange = useCallback((path: string, index: number, field: string, value: any) => handleNestedChange(`${path}[${index}].${field}`, value), [handleNestedChange]);
    const addArrayItem = useCallback((path: string, newItem: any) => {
        let currentArray = profileData as any;
        path.split('.').forEach(key => { if (currentArray) currentArray = currentArray[key]; });
        handleNestedChange(path, [...(currentArray || []), newItem]);
    }, [profileData, handleNestedChange]);
    const removeArrayItem = useCallback((path: string, index: number) => {
        let currentArray = profileData as any;
        path.split('.').forEach(key => { if (currentArray) currentArray = currentArray[key]; });
        if (currentArray) handleNestedChange(path, currentArray.filter((_: any, i: number) => i !== index));
    }, [profileData, handleNestedChange]);

    const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const handleImageChange = async (file: File, path: string) => {
        if (file) {
            try {
                const base64Image = await fileToBase64(file);
                handleNestedChange(path, base64Image);
            } catch (error) { addToast('Failed to process image.', 'error'); }
        }
    };

    const handleCommunityImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && profileData) {
            const files = Array.from(e.target.files);
            try {
                const base64Images = await Promise.all(files.map(fileToBase64));
                const currentImages = profileData.overview?.communityEngagement?.images || [];
                handleNestedChange('overview.communityEngagement.images', [...currentImages, ...base64Images]);
            } catch (error) { addToast('Failed to process one or more images.', 'error'); }
        }
    };

    const handleSave = async () => {
        if (!profileData) return;
        setIsSubmitting(true);
        try {
            const updatedCompanyResponse = await updateCompanyProfile(profileData);
            const updatedCompany = (updatedCompanyResponse as any).recruiter || (updatedCompanyResponse as any).company || updatedCompanyResponse;
            setCompany(updatedCompany);
            setProfileData(JSON.parse(JSON.stringify(updatedCompany)));
            setIsEditing(false);
            addToast('Profile updated successfully!');
        } catch (error: any) {
            addToast(`Error updating profile: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setProfileData(company);
        setIsEditing(false);
    };

    if (isLoading) return <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div></div>;
    if (!company || !profileData) return <div className="text-center p-8 bg-white rounded-lg shadow-sm">Could not load company profile.</div>;

    const renderViewMode = () => (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border flex items-start space-x-6">
                <img src={company.logoUrl} alt={`${company.name} logo`} className="w-28 h-28 rounded-lg border flex-shrink-0 bg-white shadow-md" />
                <div className="flex-1 w-full pt-2">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl font-bold text-dark-gray">{company.name}</h1>
                            <p className="mt-2 text-sm text-gray-700">{company.tagline}</p>
                        </div>
                        <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors"><PencilIcon className="w-4 h-4 mr-2" /> Edit Profile</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <main className="lg:col-span-2 space-y-8">
                    {company.overview?.about && <Section title="About Us">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <div className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer shadow-md">
                                {playVideo ? (<iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${company.overview.about.videoUrl}?autoplay=1`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
                                ) : (<div onClick={() => setPlayVideo(true)} className="w-full h-full"><img src={getYouTubeThumbnail(company.overview.about.videoUrl)} alt="About us video" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/20"></div><div className="absolute inset-0 flex items-center justify-center"><div className="w-14 h-14 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm"><PlayIcon className="w-7 h-7 text-white" style={{ transform: 'translateX(2px)' }} /></div></div></div>)}
                            </div>
                            <p className="text-gray-700 leading-relaxed text-sm">{company.overview.about.text}</p>
                        </div>
                    </Section>}
                    {company.overview?.diversityInclusion && <Section title={company.overview.diversityInclusion.title}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                            {company.overview.diversityInclusion.imageUrl && (
                                <div className="relative aspect-video rounded-lg overflow-hidden shadow-md">
                                    <img
                                        src={company.overview.diversityInclusion.imageUrl}
                                        alt={company.overview.diversityInclusion.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{company.overview.diversityInclusion.text}</p>
                        </div>
                    </Section>}
                    {company.overview?.communityEngagement && <Section title={company.overview.communityEngagement.title}>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">{company.overview.communityEngagement.text}</p>
                        {company.overview.communityEngagement.images && company.overview.communityEngagement.images.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                                {company.overview.communityEngagement.images.map((img, index) => (
                                    <div key={index} className="relative aspect-video rounded-lg overflow-hidden shadow-md group">
                                        <img
                                            src={img}
                                            alt={`Community engagement ${index + 1}`}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>}
                    {company.overview?.leaders && <Section title={`Leaders at ${company.name}`}><div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">{company.overview.leaders.map((leader, i) => (<div key={i} className="flex-shrink-0 w-48 text-center p-4 border rounded-lg"><img src={leader.imageUrl} alt={leader.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-3" /><h4 className="font-bold text-sm text-dark-gray">{leader.name}</h4><p className="text-xs text-gray-600">{leader.title}</p></div>))}</div></Section>}
                    {company.whyJoinUs?.awards && <Section title="Awards & Recognitions"><ul className="list-disc list-inside">{company.whyJoinUs.awards.map((award, i) => <li key={i}><span className="font-semibold">{award.year}:</span> {award.title}</li>)}</ul></Section>}
                </main>
                <aside className="space-y-8"><Section title="Company Details"><div className="space-y-4"><DetailItem icon={<BriefcaseIcon />} label="Type" value={company.companyType} /><DetailItem icon={<UsersIcon />} label="Company Size" value={company.companySize} /><DetailItem icon={<CalendarIcon />} label="Founded" value={company.foundedYear} /><DetailItem icon={<LocationMarkerIcon />} label="Headquarters" value={company.headquarters} /><DetailItem icon={<GlobeAltIcon />} label="Website" value={<a href={company.website} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{company.website}</a>} /></div></Section></aside>
            </div>
        </div>
    );

    const renderEditMode = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-dark-gray">Editing Company Profile</h1><div className="space-x-3"><button onClick={handleCancel} className="px-4 py-2 text-sm font-semibold bg-gray-200 rounded-lg">Cancel</button><button onClick={handleSave} disabled={isSubmitting} className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg disabled:bg-gray-400">{isSubmitting ? 'Saving...' : 'Save Changes'}</button></div></div>
            <div className="space-y-6">
                <Section title="Branding"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ImageUpload label="Banner Image" currentImageUrl={profileData.bannerUrl} onImageChange={(file) => handleImageChange(file, 'bannerUrl')} recommendedSize="1600x400px" /><ImageUpload label="Company Logo" currentImageUrl={profileData.logoUrl} onImageChange={(file) => handleImageChange(file, 'logoUrl')} recommendedSize="200x200px" /></div></Section>
                <Section title="Header"><div className="space-y-4"><InputField label="Company Name" name="name" value={profileData.name} onChange={handleInputChange} /><InputField label="Tagline" name="tagline" value={profileData.tagline || ''} onChange={handleInputChange} /></div></Section>
                <Section title="About Us"><TextAreaField label="Description" value={profileData.overview?.about?.text || ''} onChange={(e) => handleNestedChange('overview.about.text', e.target.value)} rows={5} /><InputField label="YouTube Video URL or ID" value={profileData.overview?.about?.videoUrl || ''} onChange={(e) => handleNestedChange('overview.about.videoUrl', e.target.value)} placeholder="e.g., https://www.youtube.com/watch?v=VIDEO_ID" /></Section>
                <Section title="Diversity, Equity, and Inclusion"><InputField label="Section Title" value={profileData.overview?.diversityInclusion?.title || 'Diversity, Equity, and Inclusion'} onChange={(e) => handleNestedChange('overview.diversityInclusion.title', e.target.value)} /><ImageUpload label="Section Image" currentImageUrl={profileData.overview?.diversityInclusion?.imageUrl} onImageChange={(file) => handleImageChange(file, 'overview.diversityInclusion.imageUrl')} /><TextAreaField label="Section Text" value={profileData.overview?.diversityInclusion?.text || ''} onChange={(e) => handleNestedChange('overview.diversityInclusion.text', e.target.value)} rows={5} /></Section>
                <Section title="Community Engagement"><InputField label="Section Title" value={profileData.overview?.communityEngagement?.title || 'Community Engagement'} onChange={(e) => handleNestedChange('overview.communityEngagement.title', e.target.value)} /><TextAreaField label="Section Text" value={profileData.overview?.communityEngagement?.text || ''} onChange={(e) => handleNestedChange('overview.communityEngagement.text', e.target.value)} rows={4} /><div><label className="block text-sm font-medium text-gray-700 mb-1">Images</label><div className="grid grid-cols-3 gap-4">{(profileData.overview?.communityEngagement?.images || []).map((img, index) => (<div key={index} className="relative group"><img src={img} className="w-full h-24 object-cover rounded-lg" /><button type="button" onClick={() => removeArrayItem('overview.communityEngagement.images', index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100"><TrashIcon className="w-4 h-4" /></button></div>))}<div className="mt-2"><label className="text-sm font-semibold text-primary hover:underline cursor-pointer">+ Add Images<input type="file" multiple onChange={handleCommunityImagesChange} className="hidden" accept="image/*" /></label></div></div></div></Section>
                <Section title="Leaders"><div className="space-y-4">{(profileData.overview?.leaders || []).map((leader, index) => (<div key={index} className="flex items-center gap-4 p-3 border rounded-lg"><ImageUpload label="Photo" className="flex-shrink-0" currentImageUrl={leader.imageUrl} onImageChange={(file) => handleImageChange(file, `overview.leaders[${index}].imageUrl`)} /><div className="flex-grow space-y-2"><InputField label="Leader's Name" value={leader.name} onChange={(e) => handleArrayItemChange('overview.leaders', index, 'name', e.target.value)} /><InputField label="Leader's Title" value={leader.title} onChange={(e) => handleArrayItemChange('overview.leaders', index, 'title', e.target.value)} /></div><button onClick={() => removeArrayItem('overview.leaders', index)} className="text-red-500 p-2"><TrashIcon className="w-5 h-5" /></button></div>))}<button type="button" onClick={() => addArrayItem('overview.leaders', { name: '', title: '', imageUrl: 'https://via.placeholder.com/150' })} className="mt-4 text-sm font-semibold text-primary">+ Add Leader</button></div></Section>
                <Section title="Awards & Recognitions"><div className="space-y-4">{(profileData.whyJoinUs?.awards || []).map((award, index) => (<div key={index} className="flex items-center gap-4 p-3 border rounded-lg"><div className="flex-grow grid grid-cols-2 gap-4"><InputField label="Year" type="number" value={award.year || ''} onChange={(e) => handleArrayItemChange('whyJoinUs.awards', index, 'year', parseInt(e.target.value) || new Date().getFullYear())} /><InputField label="Title" value={award.title} onChange={(e) => handleArrayItemChange('whyJoinUs.awards', index, 'title', e.target.value)} /></div><button type="button" onClick={() => removeArrayItem('whyJoinUs.awards', index)} className="text-red-500 p-2"><TrashIcon className="w-5 h-5" /></button></div>))}<button type="button" onClick={() => addArrayItem('whyJoinUs.awards', { year: new Date().getFullYear(), title: '' })} className="mt-4 text-sm font-semibold text-primary">+ Add Award</button></div></Section>
                <Section title="Company Details"><div className="grid grid-cols-2 gap-4"><InputField label="Type" name="companyType" value={profileData.companyType || ''} onChange={handleInputChange} /><InputField label="Founded Year" name="foundedYear" type="number" value={profileData.foundedYear || ''} onChange={handleInputChange} /><InputField label="Company Size" name="companySize" value={profileData.companySize || ''} onChange={handleInputChange} /><InputField label="Headquarters" name="headquarters" value={profileData.headquarters || ''} onChange={handleInputChange} /><InputField label="Website" name="website" value={profileData.website || ''} onChange={handleInputChange} className="col-span-2" /></div></Section>
                <Section title="Social Media Links"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="YouTube" value={profileData.whyJoinUs?.socialLinks?.youtube || ''} onChange={(e) => handleNestedChange('whyJoinUs.socialLinks.youtube', e.target.value)} /><InputField label="X (Twitter)" value={profileData.whyJoinUs?.socialLinks?.x || ''} onChange={(e) => handleNestedChange('whyJoinUs.socialLinks.x', e.target.value)} /><InputField label="Facebook" value={profileData.whyJoinUs?.socialLinks?.facebook || ''} onChange={(e) => handleNestedChange('whyJoinUs.socialLinks.facebook', e.target.value)} /><InputField label="Instagram" value={profileData.whyJoinUs?.socialLinks?.instagram || ''} onChange={(e) => handleNestedChange('whyJoinUs.socialLinks.instagram', e.target.value)} /><InputField label="LinkedIn" value={profileData.whyJoinUs?.socialLinks?.linkedin || ''} onChange={(e) => handleNestedChange('whyJoinUs.socialLinks.linkedin', e.target.value)} /></div></Section>
            </div>
        </div>
    );

    return (
        <>
            {isEditing ? renderEditMode() : renderViewMode()}
        </>
    );
};

export default RecruiterCompanyProfilePage;
