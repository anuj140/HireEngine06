
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Company, CmsData, CmsPage } from '../../../packages/types';
import CompanyCard from '../components/CompanyCard';
import CompanyFilterSidebar from '../components/CompanyFilterSidebar';
import { ChevronRightIcon, ChevronLeftIcon } from '../components/Icons';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import { fetchCompanies, fetchCmsContent } from '../../../packages/api-client';
// DO: Add comment above each fix.
// FIX: `MOCK_CMS_CONTENT` is now exported from the api-client/cms-data file.
import { MOCK_CMS_CONTENT } from '../../../packages/api-client/cms-data';

interface AppliedFilters {
    companyType: string[];
    location: string[];
    industry: string[];
}

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void }> = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 10;
    
    for (let i = 1; i <= Math.min(totalPages, maxPagesToShow); i++) {
        pageNumbers.push(i);
    }
    
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 sm:mb-0">
                Page {currentPage} of {totalPages}
            </p>
            <div className="flex items-center space-x-1">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="px-3 py-1.5 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    &lt; Previous
                </button>
                <div className="hidden md:flex items-center space-x-1">
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        className={`w-8 h-8 text-sm font-medium border rounded-md flex items-center justify-center ${
                            currentPage === number
                                ? 'bg-white text-primary border-primary ring-1 ring-primary'
                                : 'text-dark-gray bg-white border-gray-300 hover:bg-gray-100'
                        }`}
                    >
                        {number}
                    </button>
                ))}
                </div>
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="px-3 py-1.5 text-sm font-medium text-dark-gray bg-white border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next &gt;
                </button>
            </div>
        </div>
    );
};

interface CompaniesPageProps {
    pageContent?: CmsPage;
}

const CompaniesPage: React.FC<CompaniesPageProps> = ({ pageContent }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Partial<AppliedFilters>>({});
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cmsData, setCmsData] = useState<CmsData | null>(null);

  const companiesPerPage = 20;
  const { setCrumbs } = useBreadcrumbs();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    setCrumbs([
      { name: 'Home', path: '/' },
      { name: 'Companies' }
    ]);
    return () => setCrumbs([]);
  }, [setCrumbs]);

  useEffect(() => {
    const getData = async () => {
        setIsLoading(true);
        try {
            const [companiesData, cmsContent] = await Promise.all([
                fetchCompanies(),
                pageContent ? Promise.resolve({ ...MOCK_CMS_CONTENT, webCompaniesPage: pageContent }) : fetchCmsContent()
            ]);
            setAllCompanies(companiesData);
            setCmsData(cmsContent);
        } catch (error) {
            console.error("Failed to fetch page data", error);
        } finally {
            setIsLoading(false);
        }
    };
    getData();
  }, [pageContent]);

  const { pageTitle, companyCategories } = useMemo(() => {
      const content = cmsData?.webCompaniesPage;
      const title = "Top companies hiring now";
      // Default fallback categories if CMS doesn't have them or they are empty
      let categories = content?.featuredItems?.[0]?.items.map(item => ({ name: item.name, count: item.countLabel })) || [];
      
      if (categories.length === 0) {
          categories = [
              { name: 'All', count: 'Show All' },
              { name: 'MNCs', count: '2.1K+ Companies' },
              { name: 'Edtech', count: '160 Companies' },
              { name: 'Healthcare', count: '647 Companies' },
              { name: 'Unicorns', count: '89 Companies' },
              { name: 'Internet', count: '236 Companies' },
              { name: 'Product', count: '450 Companies' },
          ];
      } else {
          // Ensure 'All' category is present
          if (!categories.some(c => c.name === 'All')) {
             categories.unshift({ name: 'All', count: 'Show All' });
          }
      }
      
      return { pageTitle: title, companyCategories: categories };
  }, [cmsData]);

  const handleApplyFilters = useCallback((newFilters: Partial<AppliedFilters>) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset page when filters change
  }, []);

  const filteredCompanies = useMemo(() => {
    return allCompanies.filter(company => {
      const categoryMatch = (() => {
          if (!activeCategory || activeCategory === 'All') return true;
          if (activeCategory === 'MNCs') return company.companyType?.includes('MNC');
          if (activeCategory === 'Product') return company.industry === 'Software Product';
          if (activeCategory === 'Unicorns') return company.tags?.includes('Unicorn');
          if (activeCategory === 'Internet') return company.industry === 'Internet' || company.tags?.includes('Internet');
          if (activeCategory === 'Edtech') return company.industry === 'Edtech' || company.tags?.includes('Edtech');
          if (activeCategory === 'Healthcare') return company.industry === 'Healthcare' || company.tags?.includes('Healthcare');
          if (activeCategory === 'Fintech') return company.industry?.toLowerCase().includes('fintech') || company.tags?.includes('Fintech');
          
          // Fallback rough matching
          return (company.industry && company.industry.includes(activeCategory)) || (company.tags && company.tags.some(t => t.includes(activeCategory)));
      })();
      
      const companyTypeMatch = filters.companyType?.length ? company.companyType && filters.companyType.includes(company.companyType) : true;
      const industryMatch = filters.industry?.length ? company.industry && filters.industry.includes(company.industry) : true;
      
      return categoryMatch && companyTypeMatch && industryMatch;
    });
  }, [filters, activeCategory, allCompanies]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  const checkForScrollability = useCallback(() => {
      const el = scrollContainerRef.current;
      if (el) {
          const hasOverflow = el.scrollWidth > el.clientWidth;
          setCanScrollLeft(el.scrollLeft > 0);
          setCanScrollRight(hasOverflow && el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
      }
  }, []);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    checkForScrollability();
    const timeoutId = setTimeout(checkForScrollability, 100);
    const observer = new ResizeObserver(checkForScrollability);
    observer.observe(scrollContainer);
    scrollContainer.addEventListener('scroll', checkForScrollability);
    return () => {
        scrollContainer.removeEventListener('scroll', checkForScrollability);
        observer.unobserve(scrollContainer);
        clearTimeout(timeoutId);
    };
  }, [checkForScrollability]);

  const handleScroll = (direction: 'left' | 'right') => {
      const el = scrollContainerRef.current;
      if (el) {
          const scrollAmount = el.clientWidth * 0.6;
          el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
      }
  };

  const totalPages = Math.ceil(filteredCompanies.length / companiesPerPage);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * companiesPerPage, currentPage * companiesPerPage);
  
  return (
    <div className="bg-white">
      <div className="bg-white pt-8 pb-6">
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold text-dark-gray mb-6">{pageTitle}</h1>
            <div className="relative group">
                {canScrollLeft && (
                    <button onClick={() => handleScroll('left')} className="absolute left-[-15px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border hover:bg-gray-50 transition-all">
                        <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                )}
                <div ref={scrollContainerRef} className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    <div className="flex space-x-4">
                        {companyCategories.map(category => (
                            <button 
                                key={category.name} 
                                onClick={() => setActiveCategory(category.name)} 
                                className={`
                                    min-w-[180px] p-4 rounded-xl text-left transition-all duration-200 border relative overflow-hidden group
                                    ${activeCategory === category.name 
                                        ? 'bg-white border-primary ring-1 ring-primary shadow-md' 
                                        : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <h3 className={`text-lg font-bold mb-1 ${activeCategory === category.name ? 'text-dark-gray' : 'text-dark-gray'}`}>
                                    {category.name}
                                </h3>
                                <div className="flex items-center text-xs font-medium text-gray-500 group-hover:text-primary transition-colors">
                                    <span>{category.count}</span>
                                    <ChevronRightIcon className="w-3 h-3 ml-1" />
                                </div>
                                {activeCategory === category.name && <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-l-[20px] border-t-primary border-l-transparent"></div>}
                            </button>
                        ))}
                    </div>
                </div>
                {canScrollRight && (
                    <button onClick={() => handleScroll('right')} className="absolute right-[-15px] top-1/2 -translate-y-1/2 z-10 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-md border hover:bg-gray-50 transition-all">
                        <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                    </button>
                )}
            </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <aside className="hidden lg:block lg:col-span-3 sticky top-24">
                <CompanyFilterSidebar onApplyFilters={handleApplyFilters} />
            </aside>

            <main className="lg:col-span-9">
                <div className="mb-5">
                    <h2 className="text-base text-gray-600">Showing <span className="font-bold text-dark-gray">{filteredCompanies.length}</span> companies</h2>
                </div>
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-pulse h-32">
                                <div className="flex items-start space-x-4">
                                    <div className="w-14 h-14 bg-gray-100 rounded-lg"></div>
                                    <div className="flex-1 min-w-0 space-y-3">
                                        <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                        <div className="flex gap-2 pt-2">
                                             <div className="h-6 bg-gray-100 rounded w-16"></div>
                                             <div className="h-6 bg-gray-100 rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {paginatedCompanies.map(company => (
                            <CompanyCard key={company.id} company={company} />
                        ))}
                    </div>
                )}
                
                {!isLoading && totalPages > 0 && (
                  <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage}/>
                )}
            </main>
        </div>
      </div>
    </div>
  );
};

export default CompaniesPage;
