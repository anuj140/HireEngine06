import React, { useEffect, useState } from 'react';
import ProfileSummaryCard from '../components/ProfileSummaryCard';
import RecommendedJobsFeed from '../components/RecommendedJobsFeed';
import RightSidebar from '../components/RightSidebar';
import { useBreadcrumbs } from '../contexts/BreadcrumbContext';
import RecommendedJobsSection from '../components/RecommendedJobsSection';
import PromotionalBanner from '../components/PromotionalBanner';
import { fetchCmsContent, fetchCompanyById } from '../../../packages/api-client';
import { CmsBanner, Company } from '../../../packages/types';

const HomePage: React.FC = () => {
  const { setCrumbs } = useBreadcrumbs();
  const [promoBanner, setPromoBanner] = useState<CmsBanner | null>(null);
  const [promoCompany, setPromoCompany] = useState<Company | null>(null);

  useEffect(() => {
    setCrumbs([]);
  }, [setCrumbs]);

  useEffect(() => {
    fetchCmsContent().then(async (data) => {
      const banner = data.webLoggedInHome.banners?.[0];
      if (banner && banner.companyId) {
        try {
          const company = await fetchCompanyById(banner.companyId);
          if (company) {
            setPromoBanner(banner);
            setPromoCompany(company);
          }
        } catch (error) {
          console.warn("Failed to fetch promo company:", error);
          setPromoBanner(null);
        }
      }
    });
  }, []);

  return (
    <div className="bg-light-gray">
      <div className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24">
            <ProfileSummaryCard />
          </div>
        </aside>
        <main className="lg:col-span-2">
          {promoBanner && promoCompany ? (
            <PromotionalBanner banner={promoBanner} company={promoCompany} />
          ) : (
            <div className="bg-gray-200 rounded-2xl h-64 mb-8 animate-pulse"></div>
          )}
          <RecommendedJobsSection />
          <RecommendedJobsFeed />
        </main>
        <aside className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-24">
            <RightSidebar />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;