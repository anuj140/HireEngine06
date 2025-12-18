import React from 'react';
import { CmsCard } from '../../../../packages/types';
import CardTemplateA from './CardTemplateA';
import CardTemplateB from './CardTemplateB';
import CardTemplateC from './CardTemplateC';
import CardTemplateD from './CardTemplateD';
import CardTemplateE from './CardTemplateE';
import CardTemplateF from './CardTemplateF';

interface CardRendererProps {
  card: CmsCard;
}

const CardRenderer: React.FC<CardRendererProps> = ({ card }) => {
  switch (card.template) {
    case 'standard':
      return <CardTemplateA card={card} />;
    case 'image-background':
      return <CardTemplateB card={card} />;
    case 'promo-banner-a':
      return <CardTemplateC card={card} />;
    case 'split-content':
      return <CardTemplateD card={card} />;
    case 'image-ad':
      return <CardTemplateE card={card} />;
    case 'image-custom-size':
      return <CardTemplateF card={card} />;
    default:
      // Fallback to a default template or null if the template is unknown
      return <CardTemplateA card={card} />;
  }
};

export default CardRenderer;