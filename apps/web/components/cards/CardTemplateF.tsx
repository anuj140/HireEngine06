import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';

const CardTemplateF: React.FC<{ card: CmsCard }> = ({ card }) => {
  const { imageUrl, cta, width, height } = card;

  // Use a default aspect ratio if dimensions are not provided or invalid
  const aspectRatio = width && height && width > 0 && height > 0 ? `${width} / ${height}` : '16 / 9';

  const isExternal = cta.link.startsWith('http');
  
  const content = (
    <div className="group relative block rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 w-full">
      <img
        src={imageUrl}
        alt={card.title || 'Custom image card'}
        className="w-full h-auto object-cover bg-gray-200"
        style={{
            aspectRatio: aspectRatio,
            width: '100%',
        }}
        width={width} // Provide attributes for browser hints on layout
        height={height}
      />
    </div>
  );

  if (isExternal) {
    return (
      <a href={cta.link} target="_blank" rel="noopener noreferrer" className="col-span-1 md:col-span-2 block">
        {content}
      </a>
    );
  }

  return (
    <Link to={cta.link} className="col-span-1 md:col-span-2 block">
      {content}
    </Link>
  );
};

export default CardTemplateF;