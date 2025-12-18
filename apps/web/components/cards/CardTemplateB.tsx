import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';
import { ChevronRightIcon } from '../Icons';

const CardTemplateB: React.FC<{ card: CmsCard }> = ({ card }) => {
  return (
    <div
      className="relative rounded-xl shadow-lg overflow-hidden h-full flex flex-col justify-end p-6 bg-cover bg-center transition-transform duration-300 hover:-translate-y-1"
      style={{
        backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 60%), url(${card.imageUrl})`,
        color: card.colors.text,
        minHeight: '20rem'
      }}
    >
      <div className="relative z-10">
        <h3 className="text-2xl font-bold">{card.title}</h3>
        <p className="mt-1 text-base opacity-90">{card.text}</p>
        <div className="mt-4">
          <Link
            to={card.cta.link}
            className="inline-flex items-center font-semibold bg-white text-dark-gray px-5 py-2 rounded-full shadow hover:bg-gray-200 transition-colors"
          >
            {card.cta.text}
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CardTemplateB;