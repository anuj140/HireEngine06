import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon } from './Icons';
import { CmsBanner, Company } from '../../../packages/types';

export interface PromotionalBannerProps {
    banner: CmsBanner;
    company: Company;
}

const PromotionalBanner: React.FC<PromotionalBannerProps> = ({ banner, company }) => {
    const [playVideo, setPlayVideo] = useState(false);

    const handlePlayClick = () => {
        setPlayVideo(true);
    };

    if (!banner.videoDetails) {
        return null; // Or some fallback UI if video details are missing
    }

    const isBlobUrl = banner.mediaUrl.startsWith('blob:');

    const renderPlayer = () => {
        if (isBlobUrl) {
            return <video src={banner.mediaUrl} controls autoPlay className="absolute inset-0 w-full h-full object-cover" />;
        }
        return (
            <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${banner.mediaUrl}?autoplay=1`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0"
            ></iframe>
        );
    };

    const renderThumbnail = () => {
        const thumbnailUrl = isBlobUrl ? 'https://via.placeholder.com/800x450/000000/FFFFFF?text=Video+Preview' : `https://img.youtube.com/vi/${banner.mediaUrl}/hqdefault.jpg`;
        return (
             <div onClick={handlePlayClick} className="w-full h-full">
                <img 
                    src={thumbnailUrl}
                    alt="Video Thumbnail"
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/50 transition-all transform group-hover:scale-110">
                        <PlayIcon className="w-7 h-7 text-white" style={{transform: 'translateX(2px)'}} />
                    </div>
                </div>
                 <div className="absolute bottom-4 left-4 text-white">
                    <p className="font-bold drop-shadow-md">{banner.videoDetails.title}</p>
                    <p className="text-xs drop-shadow-md">{banner.videoDetails.subtitle}</p>
                </div>
            </div>
        );
    };

    return (
        <div data-banner-name={banner.name} className="bg-gradient-to-r from-red-900 to-red-600 rounded-2xl shadow-lg p-4 md:p-6 text-white mb-8 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-6 items-center">
                {/* Left Side: Text Content */}
                <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white rounded-xl p-1 flex items-center justify-center flex-shrink-0">
                            <img src={company.logoUrl} alt={company.name} />
                        </div>
                        <div>
                            <p className="font-bold text-lg">{company.name}</p>
                            <div className="flex items-center text-sm">
                                <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                                <span>{company.rating}</span>
                            </div>
                        </div>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-bold capitalize leading-tight">
                        {banner.title}
                    </h2>
                    <Link to={banner.cta.link} className="inline-block text-blue-300 font-semibold hover:text-white hover:underline transition-colors">
                        {banner.cta.text}
                    </Link>
                </div>

                {/* Right Side: Video Player */}
                <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer group bg-black/30 md:col-span-3">
                    {playVideo ? renderPlayer() : renderThumbnail()}
                </div>
            </div>
        </div>
    );
};

export default PromotionalBanner;