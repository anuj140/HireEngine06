
import React, { useEffect } from 'react';
import { CloseIcon, DownloadIcon } from './Icons';

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

  const getFileType = (url: string) => {
      if (!url) return 'other';
      if (url.startsWith('data:text/plain')) return 'text';

      const cleanUrl = url.split('?')[0].toLowerCase();
      if (cleanUrl.match(/\.(jpg|jpeg|png|gif|webp)$/)) return 'image';
      
      return 'document';
  };

  const fileType = getFileType(resumeUrl);

  const renderContent = () => {
    switch (fileType) {
        case 'text':
            try {
                const encodedContent = resumeUrl.split(',')[1];
                const decodedContent = decodeURIComponent(encodedContent);
                return (
                    <div className="p-8 overflow-y-auto h-full bg-white font-mono text-sm whitespace-pre-wrap">
                        {decodedContent}
                    </div>
                );
            } catch (e) {
                 console.error("Resume decoding error", e);
                return <div className="flex items-center justify-center h-full text-red-500">Failed to decode content.</div>;
            }
        case 'image':
             return (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto p-4">
                    <img src={resumeUrl} alt={`Resume of ${applicantName}`} className="max-w-full max-h-full object-contain shadow-md" />
                </div>
             );
        case 'document':
        default:
            const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(resumeUrl)}&embedded=true`;
            return (
                <iframe 
                    src={googleDocsUrl} 
                    className="w-full h-full border-0 bg-white" 
                    title={`Resume of ${applicantName}`}
                />
            );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex justify-between items-center flex-shrink-0 bg-white">
          <h3 className="font-bold text-lg text-dark-gray truncate pr-4">Resume: {applicantName}</h3>
          <div className="flex items-center gap-4 flex-shrink-0">
             <a 
              href={resumeUrl} 
              download 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm font-semibold text-primary hover:underline"
            >
              <DownloadIcon className="w-4 h-4 mr-1.5" /> Download Original
            </a>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
                <CloseIcon className="w-6 h-6"/>
            </button>
          </div>
        </div>
        <div className="flex-grow bg-gray-100 relative overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default ResumePreviewModal;
