import React, { useState, useEffect } from 'react';
import { CloseIcon, MailIcon, BellIcon, UserGroupIcon as UsersIcon, SparklesIcon, SendIcon } from './Icons';
import { Broadcast } from '../data/mockData';
import RichTextInput from './RichTextInput';

interface CreateBroadcastModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (broadcast: Omit<Broadcast, 'id' | 'sentDate' | 'openRate' | 'clickRate'>) => void;
}

const STEPS = [
    { number: 1, title: 'Compose Message' },
    { number: 2, title: 'Define Audience' },
    { number: 3, title: 'Select Channels' },
    { number: 4, title: 'Review & Send' },
];

const AudienceOption: React.FC<{ label: string; checked: boolean; onChange: () => void; }> = ({ label, checked, onChange }) => (
    <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-light">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded text-primary focus:ring-primary/50 border-gray-300" />
        <span className="ml-3 font-semibold text-dark-text">{label}</span>
    </label>
);

const ChannelOption: React.FC<{ icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: () => void; }> = ({ icon, label, description, checked, onChange }) => (
    <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-light">
        <input type="checkbox" checked={checked} onChange={onChange} className="h-5 w-5 rounded text-primary focus:ring-primary/50 border-gray-300 mt-1" />
        <div className="ml-4">
            <div className="flex items-center font-semibold text-dark-text">
                {icon}
                <span className="ml-2">{label}</span>
            </div>
            <p className="text-sm text-light-text">{description}</p>
        </div>
    </label>
);

const CreateBroadcastModal: React.FC<CreateBroadcastModalProps> = ({ isOpen, onClose, onSave }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<any>({
        name: '',
        subject: '',
        body: 'Start writing your message here...',
        ctaText: '',
        ctaUrl: '',
        audience: [],
        channels: [],
    });

    useEffect(() => {
        if (!isOpen) {
            setTimeout(() => { // Reset after animation
                setCurrentStep(1);
                setData({ name: '', subject: '', body: '', ctaText: '', ctaUrl: '', audience: [], channels: [] });
            }, 300);
        }
    }, [isOpen]);

    const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setData({ ...data, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        const audienceString = data.audience.join(', ');
        const finalBroadcast = {
            name: data.name,
            subject: data.subject,
            body: data.body, // The HTML content from RichTextInput
            audience: audienceString,
            channels: data.channels,
            status: 'Scheduled' as 'Scheduled'
        };
        onSave(finalBroadcast);
        onClose();
    };

    if (!isOpen) return null;

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="space-y-4">
                        <input type="text" name="name" value={data.name} onChange={handleChange} placeholder="Campaign Name (e.g., Q3 Promo)" className="w-full border-gray-300 rounded-md" />
                        <input type="text" name="subject" value={data.subject} onChange={handleChange} placeholder="Email Subject Line" className="w-full border-gray-300 rounded-md" />
                        <RichTextInput label="Message Body" value={data.body} onChange={(v) => setData({...data, body: v})} />
                        <div className="grid grid-cols-2 gap-4">
                           <input type="text" name="ctaText" value={data.ctaText} onChange={handleChange} placeholder="CTA Button Text (Optional)" className="w-full border-gray-300 rounded-md" />
                           <input type="text" name="ctaUrl" value={data.ctaUrl} onChange={handleChange} placeholder="CTA Button URL (Optional)" className="w-full border-gray-300 rounded-md" />
                        </div>
                    </div>
                );
            case 2:
                const toggleAudience = (audience: string) => setData({ ...data, audience: data.audience.includes(audience) ? data.audience.filter((a: string) => a !== audience) : [...data.audience, audience] });
                return (
                    <div className="space-y-3">
                         <AudienceOption label="All Job Seekers" checked={data.audience.includes('All Job Seekers')} onChange={() => toggleAudience('All Job Seekers')} />
                         <AudienceOption label="All Recruiters" checked={data.audience.includes('All Recruiters')} onChange={() => toggleAudience('All Recruiters')} />
                         <div className="p-4 bg-light rounded-lg border text-center text-light-text text-sm">
                             <SparklesIcon className="w-6 h-6 mx-auto mb-2 text-primary"/>
                             Advanced segmentation based on user activity, location, and skills is coming soon!
                         </div>
                    </div>
                );
            case 3:
                const toggleChannel = (channel: 'email' | 'notification') => setData({ ...data, channels: data.channels.includes(channel) ? data.channels.filter((c: string) => c !== channel) : [...data.channels, channel] });
                return (
                    <div className="space-y-3">
                        <ChannelOption icon={<MailIcon/>} label="Email" description="Send a formatted email to the user's inbox." checked={data.channels.includes('email')} onChange={() => toggleChannel('email')} />
                        <ChannelOption icon={<BellIcon/>} label="On-Site Notification" description="Push a notification to the user's account." checked={data.channels.includes('notification')} onChange={() => toggleChannel('notification')} />
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-4">
                        <div className="p-4 border rounded-lg bg-light">
                           <p><strong>Campaign:</strong> {data.name}</p>
                           <p><strong>Audience:</strong> {data.audience.join(', ') || 'None'}</p>
                           <p><strong>Channels:</strong> {data.channels.join(', ') || 'None'}</p>
                        </div>
                        <p className="font-semibold">Preview:</p>
                        <div className="border rounded-lg p-4">
                            <h3 className="text-lg font-bold">{data.subject}</h3>
                            <div className="mt-2 text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: data.body }} />
                            {data.ctaText && data.ctaUrl && (
                                <div className="mt-4">
                                    <a href={data.ctaUrl} target="_blank" rel="noopener noreferrer" className="inline-block bg-primary text-white px-4 py-2 rounded-md text-sm font-semibold">{data.ctaText}</a>
                                </div>
                            )}
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text">Create Broadcast</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><CloseIcon className="w-6 h-6 text-gray-600"/></button>
                </header>
                
                <div className="p-6 border-b">
                    <div className="flex justify-between">
                        {STEPS.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${currentStep >= step.number ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {step.number}
                                </div>
                                <div className="ml-3">
                                    <p className={`font-semibold ${currentStep >= step.number ? 'text-dark-text' : 'text-gray-500'}`}>{step.title}</p>
                                </div>
                                {index < STEPS.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-4"></div>}
                            </div>
                        ))}
                    </div>
                </div>

                <main className="p-6 flex-grow overflow-y-auto" style={{minHeight: '400px'}}>
                    {renderStepContent()}
                </main>
                
                <footer className="p-4 bg-light rounded-b-2xl flex justify-between items-center">
                    <div>
                        {currentStep > 1 && <button onClick={handleBack} className="px-5 py-2 text-sm font-semibold text-dark-text bg-white border rounded-lg hover:bg-gray-100">Back</button>}
                    </div>
                    <div>
                        {currentStep < STEPS.length ? (
                            <button onClick={handleNext} className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90">Next</button>
                        ) : (
                            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2">
                                <SendIcon className="w-5 h-5"/> Schedule Broadcast
                            </button>
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default CreateBroadcastModal;
