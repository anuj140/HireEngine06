import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';
import { ChevronRightIcon } from '../Icons';

const CardTemplateE: React.FC<{ card: CmsCard }> = ({ card }) => {
  return (
    <Link
      to={card.cta.link}
      className="col-span-1 md:col-span-2 group relative block rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
    >
      <div className="aspect-[591/148] w-full bg-gray-200">
        <img 
          src={card.imageUrl} 
          alt={card.title || 'Advertisement'} 
          className="w-full h-full object-cover" 
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6">
        <div className="inline-flex items-center font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg transform transition-transform group-hover:scale-105">
          {card.cta.text}
          <ChevronRightIcon className="w-4 h-4 ml-1.5" />
        </div>
      </div>
    </Link>
  );
};

export default CardTemplateE;