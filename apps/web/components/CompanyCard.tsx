import React from 'react';
import { Link } from 'react-router-dom';
import { Company } from '../../../packages/types';
import { StarIcon, ChevronRightIcon } from './Icons';

interface CompanyCardProps {
  company: Company;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company }) => {
  return (
    <Link 
      to={`/company/${company.id}`} 
      className="block bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-200 group h-full"
    >
      <div className="flex items-start space-x-4 h-full">
        <div className="w-14 h-14 flex-shrink-0 rounded-lg border border-gray-100 flex items-center justify-center bg-white p-1">
            <img src={company.logoUrl} alt={`${company.name} logo`} className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="flex justify-between items-start">
             <div className="flex-1 mr-2">
                <h3 className="text-base font-bold text-dark-gray truncate group-hover:text-primary leading-tight">{company.name}</h3>
                <div className="flex items-center text-xs text-gray-500 mt-1.5">
                    <StarIcon className="w-3.5 h-3.5 text-yellow-400 mr-1" />
                    <span className="font-bold text-dark-gray mr-1">{company.rating}</span>
                    <span className="text-gray-300 mx-1.5">|</span>
                    <span>{company.reviews} reviews</span>
                </div>
             </div>
             <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors transform group-hover:translate-x-0.5" />
          </div>
          
          <div className="mt-auto pt-3 flex flex-wrap gap-2">
             {/* Tags based on company data */}
             {company.companyType && (
                 <span className="text-[10px] font-medium text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full bg-gray-50/50 whitespace-nowrap">
                    {company.companyType}
                 </span>
             )}
             {(company.tags || []).slice(0, 2).map(tag => (
                <span key={tag} className="text-[10px] font-medium text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full bg-gray-50/50 whitespace-nowrap">
                  {tag}
                </span>
             ))}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CompanyCard;