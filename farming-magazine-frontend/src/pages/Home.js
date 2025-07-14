/**
 * Home Page Component
 * 
 * Main landing page for the Online Farming Magazine, featuring a hero section,
 * services overview, recent blog posts, and strategically placed advertisements.
 * Tracks page views via analytics service.
 * 
 * @module pages/Home
 */
import React, { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import ServicesSection from '../components/ServicesSection';
import RecentPosts from '../components/RecentPosts';
import DynamicAdComponent from '../components/DynamicAdComponent';
import { analytics } from '../utils/analytics';

/**
 * Home page component displaying the main landing experience
 * 
 * @returns {JSX.Element} Rendered home page with multiple sections
 */
const Home = () => {
  /**
   * Effect for page initialization tasks:
   * - Tracking page view in analytics
   * - Setting the document title
   */
  useEffect(() => {
    // Track home page view in analytics system
    analytics.trackArticleView('home', 'homepage', 'Ishaazi Livestock Services - Home');

    // Set page title for SEO and browser tab
    document.title = 'Ishaazi Livestock Services - Empowering Farmers';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto">
        {/* Hero banner with featured content and call-to-action */}
        <HeroSection />
        
        {/* Header advertisement placement */}
        <div className="py-4">
          <DynamicAdComponent 
            adSlot="1234567890"
            adFormat="horizontal"
            adStyle={{ minHeight: '90px' }}
          />
        </div>
        
        {/* Overview of farming services provided */}
        <ServicesSection />
        
        {/* Mid-content advertisement for revenue generation */}
        <div className="py-6">
          <DynamicAdComponent 
            adSlot="1122334455"
            adFormat="rectangle"
            adStyle={{ minHeight: '200px' }}
          />
        </div>
        
        {/* Recent blog posts and featured articles */}
        <RecentPosts />
      </main>
    </div>
  );
};

export default Home;