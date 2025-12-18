
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Company, Job } from '../../../packages/types';
import { fetchCompanyById } from '../../../packages/api-client';
import {
    StarIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    PlayIcon,
    CompanyCultureIcon,
    JobSecurityIcon,
    YouTubeIcon,
    XIcon,
    FacebookIcon,
    InstagramIcon,
    LinkedInIcon,
    WorkLifeIcon,
    BriefcaseIcon,
    UsersIcon,
    CalendarIcon,
    LocationMarkerIcon,
    GlobeAltIcon,
    SearchIcon
} from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import JobCard from '../components/JobCard';

const getYouTubeThumbnail = (url: string): string => {
    let videoId;
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes('youtube.com')) {
            videoId = urlObj.searchParams.get('v');
        } else if (urlObj.hostname === 'youtu.be') {
            videoId = urlObj.pathname.substring(1);
        }
    } catch (e) {
        videoId = url;
    }

    if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }

    return 'https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=800&auto=format&fit=crop';
};

const Section: React.FC<{ title: string, children: React.ReactNode, className?: string, titleClassName?: string }> = ({ title, children, className, titleClassName }) => (
    <div className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 ${className}`}>
        <h2 className={`text-xl font-bold text-dark-gray mb-4 ${titleClassName}`}>{title}</h2>
        {children}
    </div>
);

const HorizontalScroller: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkForScrollability = useCallback(() => {
        const el = scrollContainerRef.current;
        if (el) {
            const hasOverflow = el.scrollWidth > el.clientWidth + 2;
            setCanScrollLeft(el.scrollLeft > 0);
            setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
        }
    }, []);

    useEffect(() => {
        const scrollContainer = scrollContainerRef.current;
        if (!scrollContainer) return;

        checkForScrollability();

        const observer = new ResizeObserver(checkForScrollability);
        observer.observe(scrollContainer);
        scrollContainer.addEventListener('scroll', checkForScrollability);

        return () => {
            if (scrollContainer) {
                observer.unobserve(scrollContainer);
                scrollContainer.removeEventListener('scroll', checkForScrollability);
            }
        };
    }, [checkForScrollability, children]);

    const handleScroll = (direction: 'left' | 'right') => {
        const el = scrollContainerRef.current;
        if (el) {
            const scrollAmount = el.clientWidth * 0.8;
            el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative group">
            {canScrollLeft && (
                <button
                    onClick={() => handleScroll('left')}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 -translate-x-1/2 border border-gray-100"
                    aria-label="Scroll left"
                >
                    <ChevronLeftIcon className="w-6 h-6 text-dark-gray" />
                </button>
            )}
            <div ref={scrollContainerRef} className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2">
                {children}
            </div>
            {canScrollRight && (
                <button
                    onClick={() => handleScroll('right')}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shadow-md hover:bg-white transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50 translate-x-1/2 border border-gray-100"
                    aria-label="Scroll right"
                >
                    <ChevronRightIcon className="w-6 h-6 text-dark-gray" />
                </button>
            )}
        </div>
    );
};

const TabButton: React.FC<{ label: string, activeTab: string, setActiveTab: (label: string) => void }> = ({ label, activeTab, setActiveTab }) => (
    <button
        onClick={() => setActiveTab(label)}
        className={`px-4 py-3 font-semibold text-base whitespace-nowrap transition-all duration-200 border-b-2 ${activeTab === label ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark-gray hover:border-gray-300'}`}
    >
        {label}
    </button>
);

const RatingBar: React.FC<{ label: string, rating: number }> = ({ label, rating }) => {
    const percentage = (rating / 5) * 100;
    return (
        <div>
            <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-gray-700">{label}</span>
                <span className="font-bold text-dark-gray flex items-center">
                    <StarIcon className="w-4 h-4 text-yellow-400 mr-1" />
                    {rating.toFixed(1)}
                </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
    <div className="flex items-start p-3 border rounded-lg bg-gray-50 hover:bg-white transition-colors duration-200">
        <div className="text-primary/70 w-5 h-5 mr-3 mt-0.5 flex-shrink-0">{icon}</div>
        <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
            <div className="text-sm font-semibold text-dark-gray mt-0.5">{value || 'N/A'}</div>
        </div>
    </div>
);


const CompanyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { setCrumbs } = useBreadcrumbs();
    const [activeTab, setActiveTab] = useState('Overview');
    const [playVideo, setPlayVideo] = useState(false);
    const [jobSearchQuery, setJobSearchQuery] = useState('');

    useEffect(() => {
        if (id) {
            setIsLoading(true);
            window.scrollTo(0, 0);
            fetchCompanyById(id)
                .then(data => {
                    setCompany(data);
                    if (data) {
                        setCrumbs([{ name: 'Home', path: '/' }, { name: 'Companies', path: '/companies' }, { name: data.name }]);
                    }
                })
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
        return () => setCrumbs([]);
    }, [id, setCrumbs]);

    const filteredJobs = useMemo(() => {
        if (!company?.jobs) return [];
        if (!jobSearchQuery.trim()) return company.jobs;

        const query = jobSearchQuery.toLowerCase();
        return company.jobs.filter(job =>
            job.title.toLowerCase().includes(query) ||
            job.location.toLowerCase().includes(query) ||
            job.skills.some(skill => skill.toLowerCase().includes(query))
        );
    }, [company, jobSearchQuery]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div></div>;
    }

    if (!company) {
        return <div className="text-center py-20 text-gray-500 text-lg">Company not found or profile is private.</div>;
    }

    const highlightIcons: { [key: string]: React.ReactNode } = {
        'Work Life': <WorkLifeIcon className="w-6 h-6 text-primary" />,
        'Company Culture': <CompanyCultureIcon className="w-6 h-6 text-primary" />,
        'Job Security': <JobSecurityIcon className="w-6 h-6 text-primary" />,
    };

    const awardsByYear = company.whyJoinUs?.awards?.reduce((acc, award) => {
        (acc[award.year] = acc[award.year] || []).push(award.title);
        return acc;
    }, {} as Record<number, string[]>);

    const sortedYears = awardsByYear ? Object.keys(awardsByYear).map(Number).sort((a, b) => b - a) : [];

    return (
        <div className="bg-light-gray min-h-screen pb-12">
            {/* --- Banner Area --- */}
            <div className="h-64 relative bg-gray-800">
                {company.bannerUrl ? (
                    <img src={company.bannerUrl} alt={`${company.name} banner`} className="w-full h-full object-cover opacity-90" />
                ) : (
                    <div className="w-full h-full bg-gradient-to-r from-primary to-accent opacity-80"></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4">
                {/* --- Company Header Card --- */}
                <div className="relative -mt-20 bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        <div className="w-32 h-32 rounded-xl border-4 border-white shadow-md bg-white flex items-center justify-center overflow-hidden flex-shrink-0 -mt-16 md:mt-0">
                            <img src={company.logoUrl} alt={`${company.name} logo`} className="w-full h-full object-contain p-2" />
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-dark-gray">{company.name}</h1>
                                    {company.tagline && <p className="text-gray-600 mt-1">{company.tagline}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="px-6 py-2.5 font-semibold bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-sm">
                                        + Follow
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                                {company.rating > 0 && (
                                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded border border-yellow-100">
                                        <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                                        <span className="font-bold text-dark-gray">{company.rating}</span>
                                        <span className="text-gray-400 mx-1.5">|</span>
                                        <span className="text-primary hover:underline cursor-pointer">{company.reviews} Reviews</span>
                                    </div>
                                )}
                                {company.followers && <span>{company.followers.toLocaleString()} followers</span>}
                                {company.headquarters && <span><LocationMarkerIcon className="w-4 h-4 inline mr-1 mb-0.5" />{company.headquarters}</span>}
                            </div>

                            {company.tags && company.tags.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {company.tags.map(tag => (
                                        <span key={tag} className="bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1 rounded-full border border-gray-200">{tag}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- Tabs Navigation --- */}
                <div className="bg-white rounded-t-xl shadow-sm border-b border-gray-200 mb-6 sticky top-16 z-10">
                    <nav className="flex space-x-1 px-4 overflow-x-auto scrollbar-hide">
                        <TabButton label="Overview" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton label="Why Join Us" activeTab={activeTab} setActiveTab={setActiveTab} />
                        <TabButton label="Jobs" activeTab={activeTab} setActiveTab={setActiveTab} />
                    </nav>
                </div>

                {/* --- Main Content Grid --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Content Column */}
                    <main className="lg:col-span-8 space-y-8">
                        {activeTab === 'Overview' && (
                            <>
                                {/* About Section */}
                                {(company.overview?.about?.text || company.description) && (
                                    <Section title="About us">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                            {company.overview?.about?.videoUrl && (
                                                <div className="relative aspect-video rounded-lg overflow-hidden group cursor-pointer shadow-sm border border-gray-100">
                                                    {playVideo ? (
                                                        <iframe
                                                            width="100%"
                                                            height="100%"
                                                            src={`https://www.youtube.com/embed/${company.overview.about.videoUrl}?autoplay=1`}
                                                            title="YouTube video player"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        ></iframe>
                                                    ) : (
                                                        <div onClick={() => setPlayVideo(true)} className="w-full h-full relative">
                                                            <img src={getYouTubeThumbnail(company.overview.about.videoUrl)} alt="About us video" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                                    <PlayIcon className="w-8 h-8 text-primary ml-1" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
                                                {company.overview?.about?.text || company.description}
                                            </div>
                                        </div>
                                    </Section>
                                )}

                                {/* Diversity Section */}
                                {company.overview?.diversityInclusion && company.overview.diversityInclusion.text && (
                                    <Section title={company.overview.diversityInclusion.title || "Diversity & Inclusion"}>
                                        <div className="flex flex-col md:flex-row gap-6 items-start">
                                            {company.overview.diversityInclusion.imageUrl && (
                                                <img
                                                    src={company.overview.diversityInclusion.imageUrl}
                                                    alt={company.overview.diversityInclusion.title}
                                                    className="rounded-lg shadow-sm object-cover w-full md:w-1/3 h-48"
                                                />
                                            )}
                                            <p className="text-gray-700 leading-relaxed flex-1 whitespace-pre-line">
                                                {company.overview.diversityInclusion.text}
                                            </p>
                                        </div>
                                    </Section>
                                )}

                                {/* Community / Gallery Section */}
                                {company.overview?.communityEngagement && company.overview.communityEngagement.images && company.overview.communityEngagement.images.length > 0 && (
                                    <Section title={company.overview.communityEngagement.title || "Life at Company"}>
                                        <HorizontalScroller>
                                            {company.overview.communityEngagement.images.map((img, index) => (
                                                <div key={index} className="w-72 h-48 flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 shadow-sm snap-center">
                                                    <img src={img} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                                </div>
                                            ))}
                                        </HorizontalScroller>
                                        {company.overview.communityEngagement.text && (
                                            <p className="text-gray-700 leading-relaxed mt-4">
                                                {company.overview.communityEngagement.text}
                                            </p>
                                        )}
                                    </Section>
                                )}

                                {/* Leadership Section */}
                                {company.overview?.leaders && company.overview.leaders.length > 0 && (
                                    <Section title="Leadership Team">
                                        <HorizontalScroller>
                                            {company.overview.leaders.map((leader, index) => (
                                                <div key={index} className="flex-shrink-0 w-48 text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                    <img
                                                        src={leader.imageUrl || "https://via.placeholder.com/150"}
                                                        alt={leader.name}
                                                        className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-white shadow-sm"
                                                    />
                                                    <h4 className="font-bold text-sm text-dark-gray line-clamp-1">{leader.name}</h4>
                                                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{leader.title}</p>
                                                </div>
                                            ))}
                                        </HorizontalScroller>
                                    </Section>
                                )}
                            </>
                        )}

                        {activeTab === 'Jobs' && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                                    <h2 className="text-xl font-bold text-dark-gray">
                                        Open Positions <span className="text-gray-400 text-base font-normal ml-1">({filteredJobs.length})</span>
                                    </h2>
                                    <div className="relative w-full sm:w-64">
                                        <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search in jobs..."
                                            value={jobSearchQuery}
                                            onChange={(e) => setJobSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                        />
                                    </div>
                                </div>

                                {filteredJobs.length > 0 ? (
                                    <div className="space-y-4">
                                        {filteredJobs.map(job => (
                                            <JobCard key={job.id} job={job} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                        <BriefcaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">
                                            {jobSearchQuery ? `No jobs found matching "${jobSearchQuery}"` : "No open positions at the moment."}
                                        </p>
                                        {jobSearchQuery ? (
                                            <button onClick={() => setJobSearchQuery('')} className="text-primary text-sm font-semibold mt-2 hover:underline">
                                                Clear Search
                                            </button>
                                        ) : (
                                            <p className="text-sm text-gray-400 mt-1">Please check back later.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Why Join Us' && (
                            <>
                                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
                                    <h2 className="text-2xl font-bold text-dark-gray mb-2">Why Join {company.name}?</h2>
                                    <p className="text-gray-600">Discover what makes us a great place to work.</p>
                                </div>

                                {/* Fallback message if no specific "Why Join Us" content exists but tab is clicked */}
                                {(!company.whyJoinUs?.keyHighlights?.length && !company.whyJoinUs?.employeeSpeaks?.length) && (
                                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-blue-800">
                                        Information about company culture and benefits will appear here once added by the company.
                                    </div>
                                )}
                            </>
                        )}
                    </main>

                    {/* Right Sidebar Column */}
                    <aside className="lg:col-span-4 space-y-6 sticky top-24">
                        {/* Company Details Card */}
                        <Section title="Company Details">
                            <div className="space-y-3">
                                <DetailItem icon={<BriefcaseIcon />} label="Type" value={company.companyType} />
                                <DetailItem icon={<UsersIcon />} label="Company Size" value={company.companySize} />
                                <DetailItem icon={<CalendarIcon />} label="Founded" value={company.foundedYear} />
                                <DetailItem icon={<GlobeAltIcon />} label="Website" value={
                                    company.website ? (
                                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block w-48">
                                            {company.website.replace(/^https?:\/\//, '')}
                                        </a>
                                    ) : null
                                } />
                            </div>
                        </Section>

                        {/* Key Highlights */}
                        {company.whyJoinUs?.keyHighlights && company.whyJoinUs.keyHighlights.length > 0 && (
                            <Section title="Key Highlights">
                                <div className="space-y-3">
                                    {company.whyJoinUs.keyHighlights.map((highlight, index) => (
                                        <div key={index} className="flex items-center p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                                            {highlightIcons[highlight.title] || <StarIcon className="w-6 h-6 text-yellow-500" />}
                                            <div className="ml-3">
                                                <h4 className="font-bold text-sm text-dark-gray">{highlight.title}</h4>
                                                <p className="text-xs text-gray-500">{highlight.subtitle}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Employee Speaks / Ratings */}
                        {company.whyJoinUs?.employeeSpeaks && company.whyJoinUs.employeeSpeaks.length > 0 && (
                            <Section title="Employee Ratings">
                                <div className="space-y-4">
                                    {company.whyJoinUs.employeeSpeaks.map(item => (
                                        <RatingBar key={item.category} label={item.category} rating={item.rating} />
                                    ))}
                                </div>
                            </Section>
                        )}

                        {/* Awards */}
                        {sortedYears.length > 0 && (
                            <Section title="Awards">
                                <ul className="space-y-4 relative border-l-2 border-gray-100 ml-3 pl-5">
                                    {sortedYears.map(year => (
                                        <li key={year} className="relative">
                                            <div className="absolute -left-[27px] top-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white ring-2 ring-gray-100"></div>
                                            <p className="font-bold text-primary text-sm">{year}</p>
                                            <ul className="mt-1 space-y-1">
                                                {awardsByYear?.[year].map((title, i) => (
                                                    <li key={i} className="text-sm text-gray-600 font-medium">{title}</li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </Section>
                        )}

                        {/* Social Links */}
                        {company.whyJoinUs?.socialLinks && Object.values(company.whyJoinUs.socialLinks).some(l => l) && (
                            <Section title="Connect">
                                <div className="flex items-center gap-4 justify-center">
                                    {company.whyJoinUs.socialLinks.linkedin && <a href={company.whyJoinUs.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0A66C2] transition-colors transform hover:scale-110"><LinkedInIcon className="w-8 h-8" /></a>}
                                    {company.whyJoinUs.socialLinks.x && <a href={company.whyJoinUs.socialLinks.x} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-black transition-colors transform hover:scale-110"><XIcon className="w-6 h-6" /></a>}
                                    {company.whyJoinUs.socialLinks.facebook && <a href={company.whyJoinUs.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#1877F2] transition-colors transform hover:scale-110"><FacebookIcon className="w-7 h-7" /></a>}
                                    {company.whyJoinUs.socialLinks.instagram && <a href={company.whyJoinUs.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-colors transform hover:scale-110"><InstagramIcon className="w-7 h-7" /></a>}
                                    {company.whyJoinUs.socialLinks.youtube && <a href={company.whyJoinUs.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#FF0000] transition-colors transform hover:scale-110"><YouTubeIcon className="w-8 h-8" /></a>}
                                </div>
                            </Section>
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
};

export default CompanyDetailPage;
