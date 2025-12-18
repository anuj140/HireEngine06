import React, { useState, useMemo, useEffect } from 'react';
import { MailIcon, PhoneIcon, LocationMarkerIcon, DownloadIcon, BriefcaseIcon, CurrencyRupeeIcon, CalendarIcon, ChevronDownIcon, DocumentTextIcon, CloseIcon } from './Icons';
import { Applicant } from '../../../packages/types';

interface ResumePreviewModalProps {
  resumeUrl: string;
  applicantName: string;
  onClose: () => void;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({ resumeUrl, applicantName, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  const renderContent = () => {
    if (resumeUrl.startsWith('data:text/plain;')) {
      try {
        const encodedContent = resumeUrl.split(',')[1];
        const decodedContent = decodeURIComponent(encodedContent);
        return (
          <div className="p-6 overflow-y-auto h-full">
            <pre className="text-sm whitespace-pre-wrap font-sans">{decodedContent}</pre>
          </div>
        );
      } catch (e) {
        console.error("Failed to decode resume content:", e);
        return <div className="p-6">Error displaying resume.</div>;
      }
    }
    // For blob URLs (PDF, DOCX, etc.) or direct links to files.
    // This will render PDFs natively in most modern browsers.
    return <iframe src={resumeUrl} className="w-full h-full border-0" title={`Resume of ${applicantName}`} />;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-lg w-full max-w-4xl h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
          <h3 className="font-bold text-lg text-dark-gray">Resume Preview: {applicantName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <CloseIcon className="w-6 h-6"/>
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};


interface ApplicantCardProps {
  applicant: Applicant;
  questions: string[];
  jobSkills: string[];
  onStatusChange: (applicationId: string, newStatus: Applicant['status']) => void;
  onAddNote: (applicationId: string, note: string) => void;
  isSelected: boolean;
  onSelect: (applicationId: string) => void;
  showContactSection?: boolean;
  onContact?: (applicant: Applicant) => void;
  showPhoneNumber?: boolean;
}

const DetailItem: React.FC<{ label: string; value: string | React.ReactNode; icon?: React.ReactNode; className?: string }> = ({ label, value, icon, className }) => (
    <div className={className}>
        <div className="flex items-center text-xs text-gray-500 mb-1">
            {icon && <span className="mr-1.5">{icon}</span>}
            {label}
        </div>
        <p className="text-sm font-medium text-dark-gray">{value}</p>
    </div>
);

const MatchScoreCircle: React.FC<{ score: number, size?: number }> = ({ score, size = 60 }) => {
    const strokeWidth = 5;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let strokeColor = 'text-green-500';
    if (score < 75) strokeColor = 'text-yellow-500';
    if (score < 50) strokeColor = 'text-red-500';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={size/2} cy={size/2} r={radius} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-200" />
                <circle
                    cx={size/2} cy={size/2} r={radius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size/2} ${size/2})`}
                    className={`transition-all duration-500 ${strokeColor}`}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`font-bold ${strokeColor}`} style={{fontSize: `${size/3.5}px`}}>{score}%</span>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => (
    <details className="group" open={defaultOpen}>
        <summary className="flex justify-between items-center cursor-pointer list-none py-2">
            <h3 className="text-base font-semibold text-dark-gray">{title}</h3>
            <ChevronDownIcon className="w-5 h-5 text-gray-500 transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <div className="pt-2 pb-1 text-sm text-gray-700 leading-relaxed">
            {children}
        </div>
    </details>
);

const statusStyles: { [key in Applicant['status']]: string } = {
    New: 'bg-blue-100 text-blue-800',
    Reviewed: 'bg-indigo-100 text-indigo-800',
    Shortlisted: 'bg-green-100 text-green-800',
    'Interview Scheduled': 'bg-yellow-100 text-yellow-800',
    Hired: 'bg-purple-100 text-purple-800',
    Rejected: 'bg-red-100 text-red-800',
};

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant, questions, jobSkills, onStatusChange, onAddNote, isSelected, onSelect, showContactSection, onContact, showPhoneNumber }) => {
    const [newNote, setNewNote] = useState('');
    const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);

    const settings = applicant.profile.privacySettings;
    const canShowFullName = settings?.showFullName ?? true;
    const canShowContact = settings?.showContactInfo ?? false;
    const canDownloadResume = settings?.allowResumeDownload ?? true;

    const hasResume = applicant.profile?.resumeUrl && applicant.profile.resumeUrl !== '#';
    
    // DO: Add comment above each fix.
    // FIX: The 'experience' property does not exist on the Applicant type. It is derived from the applicant's profile information.
    const experience = useMemo(() => {
        if (applicant.profile.workStatus === 'Fresher') return 'Fresher';
        if (applicant.profile.totalExperience) {
            const { years, months } = applicant.profile.totalExperience;
            const yearText = years && years !== '0' ? `${years} Year${parseInt(years, 10) > 1 ? 's' : ''}` : '';
            const monthText = months && months !== '0' ? `${months} Month${parseInt(months, 10) > 1 ? 's' : ''}` : '';
            return [yearText, monthText].filter(Boolean).join(' ');
        }
        return 'Not specified';
    }, [applicant.profile]);

    const handleAddNote = () => {
        if (newNote.trim()) {
            onAddNote(applicant.applicationId, newNote.trim());
            setNewNote('');
        }
    };
    
    const handleContactClick = () => {
        if (onContact) {
            onContact(applicant);
        }
    };

    const maskName = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
        }
        return parts[0];
    };

  return (
    <>
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        {/* Header */}
        <div className="flex items-start gap-4">
          <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect(applicant.applicationId)}
              className="h-5 w-5 rounded text-primary focus:ring-primary border-gray-300 mt-1"
              aria-label={`Select applicant ${applicant.name}`}
          />
          <div className="flex-1">
              <div className="flex justify-between items-start gap-4">
                  <div>
                      <h2 className="text-lg font-bold text-dark-gray">{canShowFullName ? applicant.name : maskName(applicant.name)}</h2>
                      <p className="text-sm text-gray-600">{applicant.profile.headline}</p>
                  </div>
                  <div className="text-center flex-shrink-0">
                      <MatchScoreCircle score={applicant.matchScore} size={52} />
                      <p className="text-xs text-gray-500 mt-1">Match Score</p>
                  </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-gray-600">
                  <span className="flex items-center"><MailIcon className="w-4 h-4 mr-1.5"/> {canShowContact ? applicant.email : '******@example.com'}</span>
                  {showPhoneNumber && (
                      <span className="flex items-center"><PhoneIcon className="w-4 h-4 mr-1.5"/> {canShowContact && applicant.phone ? applicant.phone : '+91 XXXXX XXXXX'}</span>
                  )}
                  <span className="flex items-center"><LocationMarkerIcon className="w-4 h-4 mr-1.5"/> {applicant.location}</span>
              </div>
          </div>
        </div>
        
        {/* Body */}
        <div className="mt-3 pt-3 border-t">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
              <DetailItem label="Experience" value={experience} icon={<BriefcaseIcon className="w-4 h-4" />} />
              <DetailItem label="Expected Salary" value={applicant.expectedSalary} icon={<CurrencyRupeeIcon className="w-4 h-4" />} />
              <DetailItem label="Notice Period" value={applicant.noticePeriod} icon={<CalendarIcon className="w-4 h-4" />} />
              <div className="flex items-center text-sm font-medium">
                {hasResume ? (
                    <div className="flex items-center space-x-3">
                        <a href={canDownloadResume ? applicant.profile.resumeUrl : undefined} 
                           onClick={!canDownloadResume ? (e) => e.preventDefault() : undefined}
                           download={`Resume-${applicant.name.replace(' ', '_')}.txt`} 
                           className={`flex items-center ${canDownloadResume ? 'text-primary hover:underline' : 'text-gray-400 cursor-not-allowed'}`}
                           title={!canDownloadResume ? "Candidate has disabled resume downloads" : "Download Resume"}
                        >
                            <DownloadIcon className="w-4 h-4 mr-1.5" /> Download
                        </a>
                        <span className="text-gray-200">|</span>
                        <button onClick={() => setIsResumeModalOpen(true)} className="flex items-center text-primary hover:underline">
                            <DocumentTextIcon className="w-4 h-4 mr-1.5" /> Preview
                        </button>
                    </div>
                ) : (
                    <span className="text-gray-400">
                        <DownloadIcon className="w-4 h-4 mr-1.5 inline" /> No Resume
                    </span>
                )}
              </div>
          </div>
          
          <div className="mt-3">
              <h3 className="text-sm font-semibold text-dark-gray mb-2">Skills</h3>
              <div className="flex flex-wrap gap-1.5">
                  {applicant.profile.skills.map(skill => {
                      const isMatch = jobSkills.some(js => js.toLowerCase() === skill.toLowerCase());
                      return (
                          <span key={skill} className={`text-xs font-medium px-2 py-1 rounded-full ${isMatch ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{skill}</span>
                      );
                  })}
              </div>
          </div>

          {questions.length > 0 && applicant.answers.length > 0 && (
               <div className="mt-2">
                   <CollapsibleSection title="Recruiter's questions">
                       <div className="space-y-3">
                          {questions.map((q, index) => (
                               <div key={index}>
                                  <p className="font-semibold text-gray-800 text-sm">{index+1}. {q}</p>
                                  <p className="pl-4 mt-1 text-gray-600 border-l-2 ml-1 text-sm">{applicant.answers[index] || "Not answered"}</p>
                               </div>
                          ))}
                      </div>
                   </CollapsibleSection>
               </div>
          )}

          {applicant.coverLetter && (
               <div className="mt-2">
                   <CollapsibleSection title="Cover Letter">
                       <p className="whitespace-pre-line text-sm">{applicant.coverLetter}</p>
                   </CollapsibleSection>
               </div>
          )}

          <div className="mt-2">
              <CollapsibleSection title="Notes & History">
                  <h4 className="font-semibold text-gray-800 mb-2 text-sm">Notes</h4>
                  {applicant.notes.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 mb-3 text-sm">
                          {applicant.notes.map((note, i) => <li key={i}>{note}</li>)}
                      </ul>
                  ) : <p className="text-gray-500 mb-3 text-xs">No notes added yet.</p>}

                  <div className="flex space-x-2">
                      <input 
                          type="text" 
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          placeholder="Add a new note..."
                          className="flex-grow border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button onClick={handleAddNote} className="px-4 py-1.5 text-sm font-semibold bg-primary text-white rounded-md hover:bg-primary-dark">Add</button>
                  </div>

                  <h4 className="font-semibold text-gray-800 mt-3 mb-2 text-sm">Application History</h4>
                  {applicant.applicationHistory.length > 0 ? (
                       <ul className="space-y-1">
                          {applicant.applicationHistory.map((h, i) => <li key={i} className="text-xs text-gray-500">{h.appliedDate}: Applied for {h.jobTitle} - Status: {h.status}</li>)}
                      </ul>
                  ) : <p className="text-gray-500 text-xs">No previous applications.</p>}
              </CollapsibleSection>
          </div>

        </div>

        {/* Footer / Actions */}
        <div className="mt-3 pt-3 border-t flex justify-between items-center">
          <div>
            {showContactSection && (
              <button 
                  onClick={handleContactClick}
                  className="px-4 py-2 text-sm font-semibold border border-primary text-primary rounded-full hover:bg-primary/5 transition-colors flex items-center"
              >
                  <MailIcon className="w-4 h-4 mr-2" /> 
                  {canShowContact ? 'Send Message' : 'Request Contact'}
              </button>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusStyles[applicant.status]}`}>{applicant.status}</span>
            <select 
                value={applicant.status} 
                onChange={(e) => onStatusChange(applicant.applicationId, e.target.value as Applicant['status'])}
                className="bg-white border border-gray-300 rounded-full px-4 py-2 text-sm font-semibold text-dark-gray focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
                <option disabled>Change Status</option>
                {Object.keys(statusStyles).map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {isResumeModalOpen && hasResume && (
        <ResumePreviewModal
          resumeUrl={applicant.profile.resumeUrl}
          applicantName={applicant.name}
          onClose={() => setIsResumeModalOpen(false)}
        />
      )}
    </>
  );
};

export default ApplicantCard;