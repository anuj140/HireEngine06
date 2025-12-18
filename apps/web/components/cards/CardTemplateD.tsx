import React from 'react';
import { Link } from 'react-router-dom';
import { CmsCard } from '../../../../packages/types';

const CardTemplateD: React.FC<{ card: CmsCard }> = ({ card }) => {
  const { title, text, imageUrl, cta, colors, imagePosition = 'left', imageStyle = 'default' } = card;

  const imageContainerClasses = `flex items-center justify-center mb-6 md:mb-0 ${
    imagePosition === 'left' ? 'md:pr-8' : 'md:pl-8'
  } ${imageStyle === 'no-bg' ? 'md:w-2/5' : 'md:w-1/3'}`;
  
  let imageClasses = "max-h-48 w-auto object-contain";
  if (imageStyle === 'circle') {
    imageClasses = "rounded-full w-32 h-32 object-cover";
  } else if (imageStyle === 'default') {
    imageClasses = "rounded-lg max-h-48 w-auto object-cover";
  } else {
    // no-bg style
     imageClasses = "max-h-48 w-auto object-contain drop-shadow-lg"
  }
  
  const textContainerClasses = "w-full text-center md:text-left flex-1";
  
  const containerClasses = `rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1 p-6 md:p-8 flex flex-col items-center ${imagePosition === 'left' ? 'md:flex-row' : 'md:flex-row-reverse'}`;

  const ImageComponent = (
    <div className={imageContainerClasses}>
        <div className={imageStyle === 'circle' ? 'p-4 bg-white/20 rounded-full' : ''}>
            <img src={imageUrl} alt={title} className={imageClasses} />
        </div>
    </div>
  );

  const TextComponent = (
    <div className={textContainerClasses}>
      <h3 className="text-2xl font-bold" dangerouslySetInnerHTML={{ __html: card.title }} />
      <p className="mt-2 text-base opacity-90" dangerouslySetInnerHTML={{ __html: card.text }} />
      <div className="mt-6">
        <Link
          to={cta.link}
          className="inline-block font-semibold bg-blue-600 text-white px-6 py-3 rounded-full shadow hover:bg-blue-700 transition-colors"
        >
          {cta.text}
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={containerClasses}
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      {ImageComponent}
      {TextComponent}
    </div>
  );
};

export default CardTemplateD;