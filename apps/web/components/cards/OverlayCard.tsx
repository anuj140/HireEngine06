// Overlay Card Variant - Image with gradient overlay
import React from 'react';
import ModernCard, { ModernCardProps } from './ModernCard';

interface OverlayCardProps extends Omit<ModernCardProps, 'variant'> {
    height?: string;
}

const OverlayCard: React.FC<OverlayCardProps> = ({
    height = '300px',
    ...props
}) => {
    return (
        <div style={{ height }}>
            <ModernCard
                {...props}
                variant="overlay"
                hoverEffect="lift"
            />
        </div>
    );
};

export default OverlayCard;
