import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    UsersIcon,
    SparklesIcon,
    ClipboardListIcon,
    ChartBarIcon,
    QuoteIcon,
    ClockIcon,
    TargetIcon,
    CheckCircleIcon,
    PlusIcon,
    MinusIcon
} from '../components/Icons';
import { CmsPage, CmsContentBlock } from '../../../packages/types';
// DO: Add comment above each fix.
// FIX: `MOCK_HIRING_COMPANIES` is now exported from the api-client/cms-data file.
import { MOCK_HIRING_COMPANIES } from '../../../packages/api-client/cms-data';

// --- Dynamic Components ---

const HeroSection: React.FC<{ block: Extract<CmsContentBlock, { type: 'hero' }> }> = ({ block }) => {
    const icons: { [key: string]: React.ReactNode } = {
        UsersIcon: <UsersIcon className="w-5 h-5 text-white/80" />,
        SparklesIcon: <SparklesIcon className="w-5 h-5 text-white/80" />,
    };

    const heroClasses = block.useDarkOverlay
        ? "relative bg-cover bg-center text-white"
        : "relative bg-cover bg-center text-white [text-shadow:0_2px_4px_rgba(0,0,0,0.5)]";

    return (
        <section
            className={heroClasses}
            style={{
                backgroundImage: block.backgroundImageUrl ? `url(${block.backgroundImageUrl})` : 'none',
                backgroundColor: '#1a1a1a' // Fallback color
            }}
        >
            {/* Overlay for dark mode or just contrast */}
            <div className={`absolute inset-0 ${block.useDarkOverlay ? 'bg-black/70' : 'bg-black/20'}`}></div>

            <div className="relative z-10">
                <div className="container mx-auto px-6 py-24 md:py-32">
                    <div className="max-w-3xl text-center lg:text-left">
                        {block.eyebrow && (
                            <p className="font-bold text-sm tracking-[0.2em] text-white/80 uppercase mb-4">{block.eyebrow}</p>
                        )}
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6"
                            dangerouslySetInnerHTML={{ __html: block.title }}
                        />

                        {block.features && block.features.length > 0 && (
                            <div className="space-y-4 text-left max-w-md mx-auto lg:mx-0 my-8">
                                {block.features.map((feature, index) => (
                                    <div key={index} className="flex items-center text-lg text-white/90">
                                        <div className="w-6 h-6 mr-3 flex-shrink-0">{icons[feature.icon]}</div>
                                        <span>{feature.text}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-4 mt-10">
                            <Link to={block.cta1.url} className="w-full sm:w-auto px-8 py-3.5 text-lg font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-transform hover:scale-105 shadow-lg">
                                {block.cta1.text}
                            </Link>
                            {block.cta2 && (
                                <Link to={block.cta2.url} className="w-full sm:w-auto px-8 py-3.5 text-lg font-semibold bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors border border-white/20">
                                    {block.cta2.text}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};


const StatsSection: React.FC<{ block: Extract<CmsContentBlock, { type: 'stats' }> }> = ({ block }) => {
    const icons: { [key: string]: React.ReactNode } = {
        UsersIcon: <UsersIcon className="w-6 h-6 text-primary" />,
        TargetIcon: <TargetIcon className="w-6 h-6 text-primary" />,
        ClockIcon: <ClockIcon className="w-6 h-6 text-primary" />,
    };

    return (
        <section className="py-16 bg-light-gray/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
                    {block.stats.map(stat => (
                        <div key={stat.label} className="flex items-center">
                            <div className="bg-primary/10 p-3 rounded-full mr-4">{icons[stat.icon]}</div>
                            <div>
                                <p className="text-3xl font-bold text-dark-gray">{stat.value}</p>
                                <p className="text-gray-600">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FeaturesSection: React.FC<{ block: Extract<CmsContentBlock, { type: 'features' }> }> = ({ block }) => {
    const icons: { [key: string]: React.ReactNode } = {
        UsersIcon: <UsersIcon className="w-7 h-7" />,
        SparklesIcon: <SparklesIcon className="w-7 h-7" />,
        ClipboardListIcon: <ClipboardListIcon className="w-7 h-7" />,
        ChartBarIcon: <ChartBarIcon className="w-7 h-7" />,
    };

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold text-dark-gray mb-4">{block.title}</h2>
                    <p className="text-gray-600 text-lg">{block.subtitle}</p>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
                    {block.features.map(feature => (
                        <div key={feature.title} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/80">
                            <div className="text-primary mb-4">{icons[feature.icon]}</div>
                            <h3 className="text-xl font-bold text-dark-gray mb-2">{feature.title}</h3>
                            <p className="text-gray-600">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

const CTASection: React.FC<{ block: Extract<CmsContentBlock, { type: 'cta' }> }> = ({ block }) => (
    <section className="py-16 md:py-24 bg-primary text-white text-center">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold">{block.title}</h2>
            <p className="mt-4 text-lg text-white/80 max-w-2xl mx-auto">{block.subtitle}</p>
            <Link to={block.cta.url} className="mt-8 inline-block bg-white text-primary font-bold px-8 py-3 rounded-md hover:bg-gray-100 transition-colors">
                {block.cta.text}
            </Link>
        </div>
    </section>
);

const TestimonialsSection: React.FC<{ block: Extract<CmsContentBlock, { type: 'testimonials' }> }> = ({ block }) => (
    <section className="py-16 md:py-24 bg-light-gray">
        <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-dark-gray mb-4">{block.title}</h2>
                <p className="text-gray-600 text-lg">{block.subtitle}</p>
            </div>
            <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {block.testimonials.map((t, i) => (
                    <div key={i} className="bg-white p-6 rounded-xl shadow-sm border">
                        <QuoteIcon className="w-8 h-8 text-primary/20 mb-4" />
                        <p className="text-gray-700 italic">"{t.quote}"</p>
                        <div className="flex items-center mt-6">
                            <img src={t.logoUrl} alt={t.company} className="w-10 h-10 rounded-full" />
                            <div className="ml-4">
                                <p className="font-bold text-dark-gray">{t.author}</p>
                                <p className="text-sm text-gray-500">{t.title}, {t.company}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

const FaqSection: React.FC<{ block: Extract<CmsContentBlock, { type: 'faq' }> }> = ({ block }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-6 max-w-4xl">
                <div className="text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-dark-gray mb-4">{block.title}</h2>
                </div>
                <div className="mt-12 space-y-4">
                    {block.faqs.map((faq, index) => (
                        <div key={index} className="border-b">
                            <button onClick={() => toggleFaq(index)} className="w-full flex justify-between items-center text-left py-4">
                                <span className="font-semibold text-lg text-dark-gray">{faq.question}</span>
                                {openIndex === index ? <MinusIcon className="w-6 h-6 text-primary" /> : <PlusIcon className="w-6 h-6 text-gray-500" />}
                            </button>
                            <div className={`grid transition-all duration-300 ease-in-out ${openIndex === index ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                                <div className="overflow-hidden">
                                    <p className="pt-2 pb-4 text-gray-600">{faq.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

interface LandingPageProps {
    pageContent: CmsPage | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ pageContent }) => {
    const [isLoading, setIsLoading] = useState(pageContent === null);

    useEffect(() => {
        setIsLoading(pageContent === null);
    }, [pageContent]);

    const renderBlock = (block: CmsContentBlock, index: number) => {
        switch (block.type) {
            case 'hero': return <HeroSection key={index} block={block} />;
            case 'stats': return <StatsSection key={index} block={block} />;
            case 'features': return <FeaturesSection key={index} block={block} />;
            case 'testimonials': return <TestimonialsSection key={index} block={block} />;
            case 'faq': return <FaqSection key={index} block={block} />;
            case 'cta': return <CTASection key={index} block={block} />;
            default: return null;
        }
    }

    return (
        <div className="bg-light-gray">
            {isLoading ? (
                <div className="flex h-screen items-center justify-center">Loading page content...</div>
            ) : pageContent && pageContent.contentBlocks ? (
                pageContent.contentBlocks.map(renderBlock)
            ) : (
                <div className="text-center p-12">No content configured for this page.</div>
            )}
        </div>
    );
};

export default LandingPage;
