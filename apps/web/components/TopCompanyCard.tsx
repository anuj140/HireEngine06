import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Company } from '../../../packages/types';
import { StarIcon } from './Icons';

interface TopCompanyCardProps {
  company: Pick<Company, 'id' | 'logoUrl' | 'name' | 'rating' | 'reviews'>;
  className?: string;
}

const formatReviews = (reviews: number): string => {
  if (reviews >= 1000) {
    const thousands = reviews / 1000;
    // Use toFixed(1) and remove .0 if it exists
    const formatted = thousands.toFixed(1).replace(/\.0$/, '');
    return `${formatted}K+`;
  }
  return reviews.toString();
};

const TopCompanyCard: React.FC<TopCompanyCardProps> = ({ company, className = "w-52" }) => {
  return (
    <motion.div
      className={`flex-shrink-0 bg-white p-4 rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/80 text-center flex flex-col justify-between h-full ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -8, scale: 1.03 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-grow">
        <motion.img
          src={company.logoUrl}
          alt={`${company.name} logo`}
          className="w-14 h-14 mx-auto mb-3 rounded-lg object-contain"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        />
        <h3 className="font-bold text-dark-gray text-base leading-tight truncate">{company.name}</h3>
        <div className="flex items-center justify-center text-sm text-gray-600 mt-1.5">
          <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
          <span className="font-semibold">{company.rating}</span>
          <span className="mx-1 text-gray-300">|</span>
          <span>{formatReviews(company.reviews)} reviews</span>
        </div>
      </div>
      <Link
        to={`/company/${company.id}`}
        className="mt-4 text-primary font-semibold hover:underline text-sm block"
      >
        View jobs
      </Link>
    </motion.div>
  );
};

export default TopCompanyCard;
