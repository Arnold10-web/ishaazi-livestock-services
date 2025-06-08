import React, { useState, useEffect } from 'react';
import AdBanner from './AdBanner';

const AdPlacement = ({ 
  strategy = 'balanced', // 'aggressive', 'balanced', 'minimal'
  pageType = 'article', // 'home', 'article', 'listing', 'category'
  contentLength = 'medium', // 'short', 'medium', 'long'
  userEngagement = 'medium', // 'low', 'medium', 'high'
  className = ''
}) => {
  const [adConfig, setAdConfig] = useState({});
  const [shouldShowAds, setShouldShowAds] = useState(true);

  useEffect(() => {
    // Configure ad placement based on strategy and context
    const configureAds = () => {
      let config = {
        showHeaderAd: false,
        showSidebarAds: false,
        showInlineAds: false,
        showFooterAd: false,
        inlineAdFrequency: 0, // paragraphs between ads
        maxAdsPerPage: 0
      };

      // Strategy-based configuration
      switch (strategy) {
        case 'aggressive':
          config = {
            showHeaderAd: true,
            showSidebarAds: true,
            showInlineAds: true,
            showFooterAd: true,
            inlineAdFrequency: 3,
            maxAdsPerPage: 6
          };
          break;
        
        case 'balanced':
          config = {
            showHeaderAd: pageType === 'home',
            showSidebarAds: ['article', 'category'].includes(pageType),
            showInlineAds: pageType === 'article' && contentLength === 'long',
            showFooterAd: true,
            inlineAdFrequency: 5,
            maxAdsPerPage: 3
          };
          break;
        
        case 'minimal':
          config = {
            showHeaderAd: false,
            showSidebarAds: false,
            showInlineAds: false,
            showFooterAd: pageType !== 'article',
            inlineAdFrequency: 0,
            maxAdsPerPage: 1
          };
          break;
      }

      // Adjust based on user engagement
      if (userEngagement === 'low') {
        config.maxAdsPerPage = Math.max(1, config.maxAdsPerPage - 1);
        config.showInlineAds = false;
      } else if (userEngagement === 'high') {
        config.maxAdsPerPage = Math.min(8, config.maxAdsPerPage + 1);
      }

      setAdConfig(config);
    };

    configureAds();
  }, [strategy, pageType, contentLength, userEngagement]);

  // Check if user has premium subscription (mock function)
  const hasPremiumSubscription = () => {
    // In production, check user's subscription status
    return false;
  };

  useEffect(() => {
    setShouldShowAds(!hasPremiumSubscription());
  }, []);

  if (!shouldShowAds) {
    return null;
  }

  return (
    <div className={`ad-placement-container ${className}`}>
      {/* Header Ad */}
      {adConfig.showHeaderAd && (
        <div className="header-ad mb-6">
          <AdBanner
            position="header"
            size="banner"
            category="farming"
            showCloseButton={false}
            autoRotate={true}
            rotationInterval={45000}
          />
        </div>
      )}

      {/* Sidebar Ads */}
      {adConfig.showSidebarAds && (
        <div className="sidebar-ads space-y-6">
          <AdBanner
            position="sidebar"
            size="medium"
            category="livestock"
            showCloseButton={true}
            autoRotate={false}
          />
          
          {strategy === 'aggressive' && (
            <AdBanner
              position="sidebar"
              size="small"
              category="equipment"
              showCloseButton={true}
              autoRotate={true}
              rotationInterval={60000}
            />
          )}
        </div>
      )}

      {/* Inline Ads (for article content) */}
      {adConfig.showInlineAds && (
        <div className="inline-ad-marker" data-frequency={adConfig.inlineAdFrequency}>
          <AdBanner
            position="inline"
            size="large"
            category="farming"
            showCloseButton={false}
            autoRotate={false}
          />
        </div>
      )}

      {/* Footer Ad */}
      {adConfig.showFooterAd && (
        <div className="footer-ad mt-8">
          <AdBanner
            position="footer"
            size="banner"
            category="general"
            showCloseButton={true}
            autoRotate={true}
            rotationInterval={30000}
          />
        </div>
      )}

      {/* Ad Performance Tracking (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs z-50">
          <div>Strategy: {strategy}</div>
          <div>Page: {pageType}</div>
          <div>Max Ads: {adConfig.maxAdsPerPage}</div>
          <div>Engagement: {userEngagement}</div>
        </div>
      )}
    </div>
  );
};

// Hook for inserting inline ads in article content
export const useInlineAds = (contentRef, adFrequency = 5) => {
  useEffect(() => {
    if (!contentRef.current || adFrequency === 0) return;

    const insertInlineAds = () => {
      const paragraphs = contentRef.current.querySelectorAll('p');
      let adCount = 0;
      const maxInlineAds = 3;

      paragraphs.forEach((paragraph, index) => {
        if (
          index > 0 && 
          index % adFrequency === 0 && 
          adCount < maxInlineAds &&
          paragraph.textContent.length > 100 // Only after substantial paragraphs
        ) {
          const adContainer = document.createElement('div');
          adContainer.className = 'inline-ad-container my-8';
          adContainer.innerHTML = `
            <div class="ad-placeholder bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p class="text-gray-500 text-sm mb-2">Advertisement</p>
              <div class="bg-white rounded p-4 shadow-sm">
                <div class="h-32 bg-gradient-to-r from-green-100 to-yellow-100 rounded mb-2 flex items-center justify-center">
                  <span class="text-green-700 font-medium">Farming Equipment Ad</span>
                </div>
                <p class="text-xs text-gray-600">Boost your farm productivity with our latest equipment</p>
              </div>
            </div>
          `;
          
          paragraph.parentNode.insertBefore(adContainer, paragraph.nextSibling);
          adCount++;
        }
      });
    };

    // Delay to ensure content is fully rendered
    const timer = setTimeout(insertInlineAds, 1000);
    return () => clearTimeout(timer);
  }, [contentRef, adFrequency]);
};

// Component for native advertising (sponsored content)
export const SponsoredContent = ({ 
  title, 
  description, 
  imageUrl, 
  sponsorName, 
  clickUrl,
  className = '' 
}) => {
  const handleClick = () => {
    if (clickUrl) {
      window.open(clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`sponsored-content bg-gradient-to-r from-[#F5F5DC] to-white border border-[#2D5016] border-opacity-20 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <span className="bg-[#DAA520] text-white text-xs px-2 py-1 rounded-full font-medium">
            Sponsored
          </span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-2">Sponsored by {sponsorName}</p>
          <h3 className="font-bold text-[#2D5016] mb-2 cursor-pointer hover:text-[#DAA520] transition-colors" onClick={handleClick}>
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">{description}</p>
          <button 
            onClick={handleClick}
            className="text-[#DAA520] text-sm font-medium hover:underline"
          >
            Learn More →
          </button>
        </div>
        {imageUrl && (
          <div className="flex-shrink-0 w-20 h-20">
            <img 
              src={imageUrl} 
              alt={title}
              className="w-full h-full object-cover rounded-lg cursor-pointer"
              onClick={handleClick}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdPlacement;
