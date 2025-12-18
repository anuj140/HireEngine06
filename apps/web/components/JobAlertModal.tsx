import React, { useState, useEffect } from 'react';
import { JobAlert, Job } from '../../../packages/types';
import { CloseIcon } from './Icons';

const jobTypeOptions: Job['jobType'][] = ['Full-time', 'Part-time', 'Contract', 'Internship'];

export interface JobAlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (alertData: Omit<JobAlert, 'id' | 'createdDate'>) => Promise<void>;
    initialData?: Partial<Omit<JobAlert, 'id' | 'createdDate' | 'name'>> & { name?: string } | null;
}

const TagInput: React.FC<{
  label: string;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder: string;
}> = ({ label, tags, onTagsChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim();
      if (newTag && !tags.find(t => t.toLowerCase() === newTag.toLowerCase())) {
        onTagsChange([...tags, newTag]);
      }
      setInputValue('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-600">{label}</label>
      <div className="w-full border-gray-300 rounded-md shadow-sm p-2 flex flex-wrap gap-2 items-center border mt-1">
        {tags.map(tag => (
          <span key={tag} className="flex items-center bg-blue-100 text-primary text-sm font-medium px-2 py-1 rounded-md">
            {tag}
            <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-primary/70 hover:text-primary">
              <CloseIcon className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-grow bg-transparent border-none focus:ring-0 text-sm p-1"
        />
      </div>
    </div>
  );
};

const JobAlertModal: React.FC<JobAlertModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
    const [alertData, setAlertData] = useState({
        name: '',
        keywords: [] as string[],
        location: [] as string[],
        jobTypes: [] as Job['jobType'][],
        frequency: 'daily' as 'daily' | 'weekly',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setAlertData({
                name: initialData?.name || '',
                keywords: (typeof initialData?.keywords === 'string') ? initialData.keywords.split(',').map(s => s.trim()).filter(Boolean) : [],
                location: (typeof initialData?.location === 'string') ? initialData.location.split(',').map(s => s.trim()).filter(Boolean) : [],
                jobTypes: initialData?.jobTypes || [],
                frequency: initialData?.frequency || 'daily',
            });
        }
    }, [initialData, isOpen]);
    
    if (!isOpen) return null;

    const handleJobTypeChange = (jobType: Job['jobType']) => {
        setAlertData(prev => {
            const newJobTypes = prev.jobTypes.includes(jobType)
                ? prev.jobTypes.filter(jt => jt !== jobType)
                : [...prev.jobTypes, jobType];
            return { ...prev, jobTypes: newJobTypes };
        });
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSave = {
                ...alertData,
                keywords: alertData.keywords.join(','),
                location: alertData.location.join(','),
            };
            await onSave(dataToSave);
        } catch (error) {
            // Error is handled by parent toast, we just need to reset submitting state
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-bold text-dark-gray">{initialData ? 'Edit Job Alert' : 'Create Job Alert'}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><CloseIcon className="w-5 h-5 text-gray-500"/></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label className="text-sm font-semibold text-gray-700">Alert Name</label>
                            <input type="text" name="name" value={alertData.name} onChange={(e) => setAlertData(p => ({...p, name: e.target.value}))} placeholder="e.g., Remote React Jobs" required className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-primary/50 focus:border-primary"/>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">Search Criteria</label>
                           <TagInput 
                                label="Keywords"
                                tags={alertData.keywords}
                                onTagsChange={(tags) => setAlertData(prev => ({ ...prev, keywords: tags }))}
                                placeholder="Type a keyword and press Enter"
                            />
                             <TagInput 
                                label="Location"
                                tags={alertData.location}
                                onTagsChange={(tags) => setAlertData(prev => ({ ...prev, location: tags }))}
                                placeholder="Type a location and press Enter"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Job Type</label>
                            <div className="flex flex-wrap gap-2">
                                {jobTypeOptions.map(type => (
                                    <label key={type} className={`cursor-pointer px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${alertData.jobTypes.includes(type) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                                        <input type="checkbox" checked={alertData.jobTypes.includes(type)} onChange={() => handleJobTypeChange(type)} className="sr-only"/>
                                        {type}
                                    </label>
                                ))}
                            </div>
                        </div>

                         <div>
                            <label className="text-sm font-semibold text-gray-700 block mb-2">Frequency</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                               <label className={`w-1/2 cursor-pointer text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${alertData.frequency === 'daily' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                    <input type="radio" name="frequency" value="daily" checked={alertData.frequency === 'daily'} onChange={(e) => setAlertData(p => ({...p, frequency: 'daily'}))} className="sr-only"/>
                                    Daily
                                </label>
                                 <label className={`w-1/2 cursor-pointer text-center px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${alertData.frequency === 'weekly' ? 'bg-white text-primary shadow-sm' : 'bg-transparent text-gray-600'}`}>
                                    <input type="radio" name="frequency" value="weekly" checked={alertData.frequency === 'weekly'} onChange={(e) => setAlertData(p => ({...p, frequency: 'weekly'}))} className="sr-only"/>
                                    Weekly
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 p-4 bg-gray-50 rounded-b-lg border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark ml-3 disabled:bg-gray-400">
                            {isSubmitting ? 'Saving...' : 'Save Alert'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default JobAlertModal;