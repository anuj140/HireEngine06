import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';
import { ChevronRightIcon } from '../Icons';

const CardTemplateA: React.FC<{ card: CmsCard }> = ({ card }) => {
  return (
    <div
      className="rounded-xl shadow-lg overflow-hidden h-full flex flex-col transition-transform duration-300 hover:-translate-y-1"
      style={{ backgroundColor: card.colors.background, color: card.colors.text }}
    >
      <img src={card.imageUrl} alt={card.title} className="w-full h-48 object-cover" />
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold">{card.title}</h3>
        <p className="mt-2 text-base opacity-90 flex-grow">{card.text}</p>
        <div className="mt-4">
          <Link
            to={card.cta.link}
            className="inline-flex items-center font-semibold text-primary bg-white px-5 py-2 rounded-full shadow hover:bg-gray-100 transition-colors"
          >
            {card.cta.text}
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CardTemplateA;