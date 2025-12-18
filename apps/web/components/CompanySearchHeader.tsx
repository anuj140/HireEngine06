
import React from 'react';
import { Link } from 'react-router-dom';
import { Company } from '../../../packages/types';
import { StarIcon, LocationMarkerIcon, GlobeAltIcon } from './Icons';

interface CompanySearchHeaderProps {
    company: Company;
}

const CompanySearchHeader: React.FC<CompanySearchHeaderProps> = ({ company }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
            {company.bannerUrl && (
                <div className="h-32 bg-gray-100 w-full overflow-hidden">
                    <img src={company.bannerUrl} alt={`${company.name} banner`} className="w-full h-full object-cover" />
                </div>
            )}
            <div className="px-6 pb-6 relative">
                <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className={`w-24 h-24 rounded-xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0 ${company.bannerUrl ? '-mt-12' : 'mt-6'}`}>
                        <img 
                            src={company.logoUrl || "https://via.placeholder.com/150?text=No+Logo"} 
                            alt={`${company.name} logo`} 
                            className="w-full h-full object-contain p-1"
                        />
                    </div>
                    <div className={`flex-1 w-full ${company.bannerUrl ? 'mt-4' : 'mt-6'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-dark-gray">{company.name}</h1>
                                {company.tagline && <p className="text-sm text-gray-600 mt-1">{company.tagline}</p>}
                                
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                    {company.rating > 0 && (
                                        <div className="flex items-center">
                                            <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                                            <span className="font-bold text-dark-gray">{company.rating}</span>
                                            <span className="mx-2 text-gray-300">|</span>
                                            <span>{company.reviews} Reviews</span>
                                        </div>
                                    )}
                                    {company.headquarters && (
                                        <div className="flex items-center">
                                            <LocationMarkerIcon className="w-4 h-4 mr-1 text-gray-400" />
                                            <span>{company.headquarters}</span>
                                        </div>
                                    )}
                                    {company.website && (
                                        <div className="flex items-center">
                                            <GlobeAltIcon className="w-4 h-4 mr-1 text-gray-400" />
                                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate max-w-xs">
                                                Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 mt-2 md:mt-0">
                                <Link 
                                    to={`/company/${company.id}`}
                                    className="px-5 py-2 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors text-sm"
                                >
                                    View Profile
                                </Link>
                                <button className="px-5 py-2 border border-primary text-primary font-semibold rounded-full hover:bg-primary/5 transition-colors text-sm">
                                    + Follow
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                {company.description && (
                    <div className="mt-6 pt-4 border-t border-gray-100">
                         <h3 className="text-sm font-bold text-dark-gray mb-2">About</h3>
                         <p className="text-sm text-gray-600 line-clamp-2">{company.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CompanySearchHeader;
