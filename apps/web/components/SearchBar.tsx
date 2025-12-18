import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchIcon } from './Icons';
import { parseSearchQuery } from '../utils/searchParser';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSearchQuery(query);
    const params = new URLSearchParams();
    if (parsed.keywords) params.set('keywords', parsed.keywords);
    if (parsed.location) params.set('location', parsed.location);
    if (parsed.experience) params.set('experience', parsed.experience);
    
    // If nothing was parsed but there's raw input, use it as keywords
    if (!parsed.keywords && !parsed.location && !parsed.experience && parsed.rawInput) {
        params.set('keywords', parsed.rawInput);
    }

    navigate(`/jobs?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white/95 backdrop-blur-sm p-2 rounded-full shadow-lg flex items-center w-full max-w-3xl mx-auto border">
      <div className="w-full flex-grow flex items-center px-2">
        <SearchIcon className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs by Skills, Designation, Company, Location..."
          className="w-full focus:outline-none bg-transparent text-dark-gray text-base py-2"
        />
      </div>
      <button type="submit" className="px-8 py-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors font-semibold flex-shrink-0">
        Search
      </button>
    </form>
  );
};

export default SearchBar;