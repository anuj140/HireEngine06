// Base Modern Card Component with shared functionality
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export interface ModernCardProps {
    title: string;
    description?: string;
    imageUrl?: string;
    link?: string;
    icon?: React.ReactNode;
    badge?: string;
    variant?: 'overlay' | 'split' | 'floating' | 'gradient' | 'glassmorphic';
    className?: string;
    onClick?: () => void;
    hoverEffect?: 'lift' | 'zoom' | 'tilt' | 'glow';
    animateOnScroll?: boolean;
}

export interface CardConfig {
    backgroundColor?: string;
    gradientColors?: string[];
    borderRadius?: number;
    shadow?: string;
    transitionDuration?: number;
}

const defaultConfig: CardConfig = {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    transitionDuration: 300,
};

const ModernCard: React.FC<ModernCardProps> = ({
    title,
    description,
    imageUrl,
    link,
    icon,
    badge,
    variant = 'overlay',
    className = '',
    onClick,
    hoverEffect = 'lift',
    animateOnScroll = false,
}) => {
    const [isHovered, setIsHovered] = React.useState(false);

    const hoverVariants = {
        lift: {
            rest: { y: 0, scale: 1 },
            hover: { y: -8, scale: 1.02, transition: { duration: 0.3 } },
        },
        zoom: {
            rest: { scale: 1 },
            hover: { scale: 1.05, transition: { duration: 0.3 } },
        },
        tilt: {
            rest: { rotateX: 0, rotateY: 0 },
            hover: { rotateX: 5, rotateY: 5, transition: { duration: 0.3 } },
        },
        glow: {
            rest: { boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' },
            hover: {
                boxShadow: '0 0 30px rgba(102, 126, 234, 0.6)',
                transition: { duration: 0.3 }
            },
        },
    };

    const scrollVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] }
        },
    };

    const cardContent = (
        <motion.div
            className={`modern-card modern-card-${variant} ${className}`}
            initial={animateOnScroll ? 'hidden' : 'rest'}
            whileInView={animateOnScroll ? 'visible' : undefined}
            whileHover="hover"
            variants={animateOnScroll ? scrollVariants : hoverVariants[hoverEffect]}
            viewport={{ once: true, amount: 0.3 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onClick}
        >
            {badge && (
                <div className="modern-card-badge">
                    {badge}
                </div>
            )}

            {icon && (
                <div className="modern-card-icon">
                    {icon}
                </div>
            )}

            {imageUrl && (
                <motion.div
                    className="modern-card-image"
                    animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <img src={imageUrl} alt={title} />
                </motion.div>
            )}

            <div className="modern-card-content">
                <h3 className="modern-card-title">{title}</h3>
                {description && (
                    <p className="modern-card-description">{description}</p>
                )}
            </div>
        </motion.div>
    );

    if (link) {
        return <Link to={link}>{cardContent}</Link>;
    }

    return cardContent;
};

export default ModernCard;
