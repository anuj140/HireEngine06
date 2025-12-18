import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Job } from '../../../packages/types';
import { StarIcon, LocationMarkerIcon } from './Icons';

interface CompactJobCardProps {
    job: Job;
    className?: string;
}

const CompactJobCard: React.FC<CompactJobCardProps> = ({ job, className = '' }) => (
    <motion.div
        className={`bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:border-primary group h-full ${className}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.3 }}
    >
        <div>
            <div className="flex justify-between items-start mb-3">
                <motion.div
                    className="w-11 h-11 p-1 bg-white rounded-md border flex items-center justify-center"
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                >
                    <img src={job.company.logoUrl} alt={job.company.name} className="w-full h-full object-contain" />
                </motion.div>
                <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-full">{job.postedDate}</span>
            </div>
            <Link to={`/job/${job.id}`}>
                <h4 className="font-bold text-dark-gray text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors" title={job.title}>
                    {job.title}
                </h4>
            </Link>
            <div className="flex items-center text-xs mt-1 text-gray-600">
                <p className="truncate mr-2 font-medium max-w-[60%]">{job.company.name}</p>
                {job.company.rating > 0 && (
                    <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded">
                        <StarIcon className="w-3 h-3 text-yellow-500 mr-1 flex-shrink-0" />
                        <span className="font-semibold">{job.company.rating}</span>
                    </div>
                )}
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center text-xs text-gray-500">
                <LocationMarkerIcon className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span className="truncate">{job.location}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
                {job.skills.slice(0, 2).map(skill => (
                    <motion.span
                        key={skill}
                        className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md truncate max-w-[100px]"
                        whileHover={{ scale: 1.05, backgroundColor: '#e0e7ff' }}
                    >
                        {skill}
                    </motion.span>
                ))}
                {job.skills.length > 2 && (
                    <span className="text-[10px] text-gray-400 px-1 py-1">+{job.skills.length - 2}</span>
                )}
            </div>
        </div>
    </motion.div>
);

export default CompactJobCard;
