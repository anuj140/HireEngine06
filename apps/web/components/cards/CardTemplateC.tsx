import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';

const CardTemplateC: React.FC<{ card: CmsCard }> = ({ card }) => {
  const isGradient = card.colors.background.includes('gradient');
  const backgroundStyle = isGradient ? {} : { backgroundColor: card.colors.background };
  const backgroundClasses = isGradient ? card.colors.background : 'bg-teal-500'; // Fallback bg

  return (
    <div
      className={`col-span-1 md:col-span-2 rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 p-8 flex items-center relative ${backgroundClasses}`}
      style={{ ...backgroundStyle, color: card.colors.text }}
    >
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 h-full w-1/2 overflow-hidden rounded-r-2xl opacity-50">
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-white/10 rounded-full"></div>
          <div className="absolute top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
      </div>
      
      <div className="w-full flex justify-between items-center z-10">
        <div className="max-w-md">
          {card.badge && (
            <span className="inline-block bg-white/90 text-teal-800 text-sm font-bold px-4 py-1.5 rounded-full mb-4 shadow">
              {card.badge}
            </span>
          )}
          <h3 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: card.title }} />
          <p className="mt-2 text-lg opacity-90" dangerouslySetInnerHTML={{ __html: card.text }}/>
          <div className="mt-6">
            <Link
              to={card.cta.link}
              className="inline-flex items-center font-semibold bg-blue-600 text-white px-6 py-3 rounded-full shadow hover:bg-blue-700 transition-colors"
            >
              {card.cta.text}
            </Link>
          </div>
        </div>
        {card.imageUrl && (
          <div className="hidden lg:block w-1/3">
              <img src={card.imageUrl} alt={card.title} className="w-full h-auto object-contain drop-shadow-2xl" />
          </div>
        )}
      </div>
    </div>
  );
};

export default CardTemplateC;