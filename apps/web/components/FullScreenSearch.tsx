import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SearchIcon, LocationMarkerIcon, CloseIcon, BriefcaseIcon, NaukriLogo, SparklesIcon } from './Icons';
import { parseSearchQuery, ParsedSearch } from '../utils/searchParser';

interface FullScreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const trendingSearches = ['Remote', 'React Developer', 'Marketing', 'Data Analyst', 'Work from Home', 'Fresher'];

const FullScreenSearch: React.FC<FullScreenSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [parsedQuery, setParsedQuery] = useState<ParsedSearch | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // When the user types, parse the query in real-time
    const timeoutId = setTimeout(() => {
        if (query) {
            setParsedQuery(parseSearchQuery(query));
        } else {
            setParsedQuery(null);
        }
    }, 200); // Small debounce
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Reconstruct original query from URL params for better UX
      const k = searchParams.get('keywords') || '';
      const l = searchParams.get('location') || '';
      const e = searchParams.get('experience') || '';
      const expMap: Record<string, string> = { '0': 'fresher', '1': '1 year', '3': '3 years', '5': '5 years', '10': '10+ years' };
      const expText = expMap[e] || (e ? `${e} years` : '');
      const initialQuery = [k, l, expText].filter(Boolean).join(' ');
      setQuery(initialQuery);
      setParsedQuery(parseSearchQuery(initialQuery));
      setIsClosing(false); 
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, searchParams]);

  const performSearch = (params: URLSearchParams) => {
    handleClose();
    navigate(`/jobs?${params.toString()}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSearchQuery(query);
    const params = new URLSearchParams();
    if (parsed.keywords) params.set('keywords', parsed.keywords);
    if (parsed.location) params.set('location', parsed.location);
    if (parsed.experience) params.set('experience', parsed.experience);
    if (!params.toString() && query) {
        params.set('keywords', query);
    }
    performSearch(params);
  };
  
  const handleTrendingClick = (term: string) => {
    const parsed = parseSearchQuery(term);
    const params = new URLSearchParams();
    if (parsed.keywords) params.set('keywords', parsed.keywords);
    if (parsed.location) params.set('location', parsed.location);
    if (parsed.experience) params.set('experience', parsed.experience);
    if (!params.toString()) {
        params.set('keywords', term);
    }
    performSearch(params);
  };

  if (!isOpen && !isClosing) {
    return null;
  }

  const hasParsedResult = parsedQuery && (parsedQuery.keywords || parsedQuery.location || parsedQuery.experience);
  const expLabels: Record<string, string> = { '0': 'Fresher', '1': '1 Year', '3': '3 Years', '5': '5 Years', '10': '10+ Years' };

  return (
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex flex-col items-center ${isOpen ? 'animate-fade-in' : 'animate-fade-out'}`}
      style={{animationDuration: '300ms'}}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full bg-white relative shadow-2xl ${isClosing ? 'animate-slide-out-to-top' : 'animate-slide-in-from-top'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="container mx-auto px-4">
             <div className="flex justify-between items-center h-20">
                <NaukriLogo className="h-7" />
                <button
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-800 transition-colors p-2"
                    aria-label="Close search"
                    >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
            <form onSubmit={handleFormSubmit} className="py-4">
                <div className="bg-white p-2 rounded-full shadow-lg flex flex-col md:flex-row items-center w-full max-w-4xl mx-auto space-y-2 md:space-y-0 md:space-x-2 border-2 border-primary/50">
                    <div className="w-full flex-grow flex items-center">
                        <SparklesIcon className="w-5 h-5 text-primary mx-3 flex-shrink-0" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Job title, keywords, company, location, experience..."
                            className="w-full focus:outline-none bg-transparent text-dark-gray text-base py-3"
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full md:w-auto px-8 py-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-semibold flex-shrink-0 flex items-center justify-center gap-2">
                        <SearchIcon className="w-5 h-5" /> Search
                    </button>
                </div>
            </form>
            
            {hasParsedResult && (
                <div className="py-4 text-center max-w-4xl mx-auto">
                    <p className="text-sm font-semibold text-gray-600 mb-3">We are searching for:</p>
                    <div className="flex flex-wrap gap-3 justify-center items-center">
                        {parsedQuery.keywords && <span className="flex items-center gap-2 bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full"><SearchIcon className="w-4 h-4"/> {parsedQuery.keywords}</span>}
                        {parsedQuery.location && <span className="flex items-center gap-2 bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full"><LocationMarkerIcon className="w-4 h-4"/> {parsedQuery.location}</span>}
                        {parsedQuery.experience && <span className="flex items-center gap-2 bg-purple-100 text-purple-800 font-semibold px-3 py-1 rounded-full"><BriefcaseIcon className="w-4 h-4"/> {expLabels[parsedQuery.experience] || `${parsedQuery.experience} yrs`}</span>}
                    </div>
                </div>
            )}


            <div className="py-6 text-center">
                <h4 className="font-semibold text-sm text-gray-600 mb-3">Trending Searches:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                    {trendingSearches.map(term => (
                        <button 
                            key={term}
                            onClick={() => handleTrendingClick(term)}
                            className="px-4 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 hover:text-dark-gray transition-colors"
                        >
                            {term}
                        </button>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FullScreenSearch;