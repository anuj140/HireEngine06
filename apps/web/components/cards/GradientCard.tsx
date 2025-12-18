// Gradient Card Variant - Animated gradient background
import React from 'react';
import ModernCard, { ModernCardProps } from './ModernCard';

interface GradientCardProps extends Omit<ModernCardProps, 'variant' | 'imageUrl'> {
    gradientColors?: string[];
}

const GradientCard: React.FC<GradientCardProps> = ({
    gradientColors,
    ...props
}) => {
    return (
        <ModernCard
            {...props}
            variant="gradient"
            hoverEffect="glow"
        />
    );
};

export default GradientCard;
