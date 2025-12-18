
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { ChevronRightIcon, StarIcon } from '../components/Icons';
import { CmsPage, CmsFeaturedItem, Job, Company } from '../../../packages/types';
import CardRenderer from '../components/cards/CardRenderer';
import { fetchJobs, fetchCompanies } from '../../../packages/api-client';
import CompactJobCard from '../components/CompactJobCard';
import TopCompanyCard from '../components/TopCompanyCard';

const FeaturedItem: React.FC<{item: CmsFeaturedItem, type: 'category' | 'company'}> = ({ item, type }) => {
  if (type === 'category') {
    return (
      <Link
        to={item.link}
        key={item.name}
        className="group block bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-accent hover:-translate-y-1"
      >
        <div className="flex items-center justify-between">
            <div>
                <h3 className="font-bold text-dark-gray">{item.name}</h3>
                <p className="text-sm text-accent font-semibold">{item.countLabel}</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400 transition-colors group-hover:text-accent" />
        </div>
        <div className="flex -space-x-2 mt-4">
          {item.logoUrls.map((logo, index) => (
            <img key={index} src={logo} alt={`${item.name} logo ${index + 1}`} className="w-8 h-8 rounded-full border-2 border-white object-contain bg-white" />
          ))}
        </div>
      </Link>
    );
  }
  
  // Fallback for CMS company items if needed
  return (
     <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-accent hover:-translate-y-1 flex flex-col">
        <div className="flex items-start space-x-4 flex-grow">
            <img src={item.logoUrls[0]} alt={`${item.name} logo`} className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
                <h3 className="font-semibold text-dark-gray">{item.name}</h3>
                <div className="flex items-center text-sm text-dark-gray/80">
                    <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    <span>{item.countLabel}</span>
                </div>
            </div>
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100 text-right">
            <Link to={item.link} className="bg-accent/10 text-accent font-semibold px-4 py-1.5 rounded-full text-sm hover:bg-accent/20 transition-colors">View jobs</Link>
        </div>
    </div>
  );
};

interface PublicHomePageProps {
    pageContent: CmsPage | null;
}

const PublicHomePage: React.FC<PublicHomePageProps> = ({ pageContent }) => {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [featuredCompanies, setFeaturedCompanies] = useState<Company[]>([]);
  const isLoading = !pageContent;
  const heroBanner = pageContent?.banners?.[0];
  const homeCards = pageContent?.cards;

  useEffect(() => {
    const fetchData = async () => {
        try {
            // Fetch Jobs
            const jobsResponse = await fetchJobs({});
            if (jobsResponse.jobs) {
                setFeaturedJobs(jobsResponse.jobs.slice(0, 8)); // Limit to 8 jobs for grid
            }

            // Fetch Companies
            const companies = await fetchCompanies();
            if (companies) {
                // Filter for active/verified companies if needed, or just take top ones
                // For now taking the first 8
                setFeaturedCompanies(companies.slice(0, 8));
            }
        } catch (error) {
            console.error("Failed to fetch data for homepage", error);
        }
    };
    fetchData();
  }, []);

  const heroStyle = heroBanner?.backgroundImageUrl
    ? { backgroundImage: `url(${heroBanner.backgroundImageUrl})` }
    : {};

  let heroClasses = 'hero-background pt-20 pb-16';
  if (heroBanner?.backgroundImageUrl) {
    heroClasses += ' text-white';
  }
  if (heroBanner && !heroBanner.showIllustration) {
    heroClasses += ' no-illustration';
  }

  return (
    <div className="bg-light-gray">
      {/* Hero Section */}
      <div className={heroClasses} style={heroStyle}>
        {heroBanner?.useDarkOverlay && <div className="absolute inset-0 bg-black/60 z-1"></div>}
        <div className="relative z-10 container mx-auto px-4 text-center">
          {isLoading || !heroBanner ? (
            <>
              <div className="h-14 bg-white/20 rounded-md w-3/4 mx-auto animate-pulse"></div>
              <div className="h-7 bg-white/20 rounded-md w-1/2 mx-auto mt-4 animate-pulse"></div>
            </>
          ) : (
            <>
              {heroBanner.eyebrow && <p className="text-sm font-bold tracking-widest uppercase mb-2">{heroBanner.eyebrow}</p>}
              <h1 className="text-4xl md:text-5xl font-bold mb-4" dangerouslySetInnerHTML={{ __html: heroBanner.title }} />
              <p className="text-lg text-white/80 mb-8" dangerouslySetInnerHTML={{ __html: heroBanner.subtitle }} />
            </>
          )}
          <SearchBar />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Dynamic Cards Section */}
        {homeCards && homeCards.length > 0 && (
          <section className="mb-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {homeCards.map(card => (
                <CardRenderer key={card.id} card={card} />
              ))}
            </div>
          </section>
        )}
        
        {/* Featured Jobs Section - Updated with Compact Cards */}
        {featuredJobs.length > 0 && (
             <section className="mb-16">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-dark-gray">Featured Jobs</h2>
                  <Link to="/jobs" className="text-sm font-semibold text-primary hover:underline flex items-center">
                      View all jobs <ChevronRightIcon className="w-4 h-4 ml-1"/>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {featuredJobs.map(job => (
                        <CompactJobCard key={job.id} job={job} className="h-full" />
                    ))}
                </div>
             </section>
        )}
        
        {/* Featured Companies Section - Dynamic from API */}
        {featuredCompanies.length > 0 && (
            <section className="mb-16">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-dark-gray">Top Companies Hiring</h2>
                  <Link to="/companies" className="text-sm font-semibold text-primary hover:underline flex items-center">
                      View all companies <ChevronRightIcon className="w-4 h-4 ml-1"/>
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {featuredCompanies.map(company => (
                        <TopCompanyCard key={company.id} company={company} className="w-full" />
                    ))}
                </div>
             </section>
        )}
        
        {/* CMS Featured Categories */}
        {pageContent?.featuredItems?.map(section => {
            if (section.title.toLowerCase().includes('compan')) return null; // Skip CMS company section as we use dynamic
            return (
              <section key={section.title} className="mb-16">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-dark-gray">{section.title}</h2>
                  <Link to={section.items[0]?.link || '#'} className="text-sm font-semibold text-primary hover:underline flex items-center">
                      View all <ChevronRightIcon className="w-4 h-4 ml-1"/>
                  </Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                  {section.items.map(item => (
                    <FeaturedItem 
                      key={item.id} 
                      item={item} 
                      type='category'
                    />
                  ))}
                </div>
              </section>
            );
        })}
        
      </div>
    </div>
  );
};

export default PublicHomePage;
