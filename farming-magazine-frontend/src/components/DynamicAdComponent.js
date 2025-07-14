/**
 * DynamicAdComponent.js
 * 
 * A flexible advertising component that supports both Google AdSense and custom ads
 * with configurable formats, styles, and fallback behavior.
 * 
 * This component implements:
 * - Fault-tolerant ad loading with error handling and fallbacks
 * - Development mode detection with test placeholders
 * - Responsive ad support with various formats
 * - Performance optimization with lazy loading and cleanup
 * 
 * @module DynamicAdComponent
 * @requires React
 */

import React, { useEffect, useRef, useState } from 'react';

/**
 * Dynamic Advertisement Component
 * 
 * @param {string} adSlot - Ad slot ID from AdSense
 * @param {string} adFormat - Ad format ('auto', 'rectangle', 'horizontal', etc.)
 * @param {Object} adStyle - Custom styles for the ad container
 * @param {React.ReactNode} customAd - Optional custom ad component to display instead of AdSense
 * @param {boolean} testMode - Forces test mode to show placeholders instead of real ads
 * @returns {JSX.Element} Rendered ad component
 */
const DynamicAdComponent = ({ 
  adSlot, 
  adFormat = 'auto', 
  adStyle = {}, 
  customAd = null,
  testMode = process.env.NODE_ENV === 'development' || !process.env.REACT_APP_ADSENSE_CLIENT_ID 
}) => {
  // State management for ad loading status
  const adRef = useRef(null);
  const [, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);

  /**
   * Ad loading effect handles:
   * - AdSense script loading
   * - Ad initialization and pushing to AdSense
   * - Error detection and handling
   * - Cleanup on component unmount
   */
  useEffect(() => {
    // Skip ad loading in test mode or when using custom ad content
    if (testMode || customAd) return;

    /**
     * Asynchronously loads AdSense script and initializes the ad
     */
    const loadAd = async () => {
      try {
        // Validate AdSense client ID configuration
        const clientId = process.env.REACT_APP_ADSENSE_CLIENT_ID;
        if (!clientId || clientId === 'ca-pub-YOUR_PUBLISHER_ID') {
          console.warn('AdSense client ID not configured, showing placeholder');
          setAdError(true);
          return;
        }

        // Dynamic script loading for AdSense
        // Only injects script if not already present to prevent duplication
        if (!window.adsbygoogle) {
          const script = document.createElement('script');
          script.async = true; // Non-blocking load
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
          script.crossOrigin = 'anonymous'; // Required for CORS compliance
          
          // Success handler initializes ad after script loads
          script.onload = () => {
            console.log('AdSense script loaded successfully');
            pushAd();
          };
          
          // Error handler shows fallback content on script failure
          script.onerror = () => {
            console.error('Failed to load AdSense script');
            setAdError(true);
          };

          document.head.appendChild(script);
        } else {
          // If script already exists, attempt to push ad directly
          pushAd();
        }
      } catch (error) {
        // Global error handling for the entire loading process
        console.error('Ad loading error:', error);
        setAdError(true);
      }
    };

    /**
     * Pushes the ad to Google AdSense for rendering
     * Uses the global adsbygoogle array as per Google's implementation guidelines
     */
    const pushAd = () => {
      try {
        // Ensure both DOM reference and AdSense library are available
        if (adRef.current && window.adsbygoogle) {
          // Standard AdSense initialization pattern
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setAdLoaded(true);
        }
      } catch (err) {
        // Handle ad push failures gracefully
        console.error('Ad failed to load:', err);
        setAdError(true);
      }
    };

    // Initiate ad loading process
    loadAd();
    
    // Cleanup function runs on component unmount
    return () => {
      // Potential cleanup tasks could be added here if needed
      // Currently AdSense doesn't require explicit cleanup
    };
  }, [customAd, testMode, adSlot]);

  /**
   * Custom Advertisement Rendering
   * 
   * Renders a manually configured advertisement when provided instead of AdSense
   * Supports both image ads and text+button ads with configurable properties
   * 
   * @returns {JSX.Element} Custom advertisement component
   */
  if (customAd) {
    return (
      <div 
        className="ad-container my-4" 
        role="banner" 
        aria-label="Advertisement"
      >
        {/* Ad label for transparency and accessibility */}
        <div className="text-xs text-gray-400 text-center mb-2">Advertisement</div>
        
        <div className="bg-gray-100 rounded-lg p-4 text-center" style={adStyle}>
          {/* Image advertisement with click handling */}
          {/* Conditional rendering based on ad type */}
          {customAd.type === 'image' ? (
            <img 
              src={customAd.imageUrl} 
              alt={customAd.title || 'Advertisement'}
              className="w-full h-auto rounded cursor-pointer"
              onClick={() => customAd.link && window.open(customAd.link, '_blank', 'noopener,noreferrer')}
              loading="lazy" // Performance optimization
            />
          ) : (
            <div className="space-y-2">
              <h3 className="font-bold text-gray-800">{customAd.title}</h3>
              <p className="text-gray-600">{customAd.description}</p>
              {customAd.link && (
                <button 
                  onClick={() => window.open(customAd.link, '_blank', 'noopener,noreferrer')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label={`Learn more about ${customAd.title}`}
                >
                  Learn More
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show fallback if ad failed to load or in test mode
  if (adError || testMode) {
    return (
      <div className="ad-container my-4" role="banner" aria-label="Advertisement space">
        <div className="text-xs text-gray-400 text-center mb-2">Advertisement</div>
        <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500" style={adStyle}>
          {testMode ? 'Ad Placeholder (Test Mode)' : 'Advertisement temporarily unavailable'}
        </div>
      </div>
    );
  }

  // Render Google AdSense ad
  return (
    <div className="ad-container my-4" role="banner" aria-label="Advertisement">
      <div className="text-xs text-gray-400 text-center mb-2">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', ...adStyle }}
        data-ad-client={process.env.REACT_APP_ADSENSE_CLIENT_ID || 'ca-pub-YOUR_PUBLISHER_ID'}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
};

// Enhanced ad configuration with environment variable support
export const adSlots = {
  header: {
    slot: process.env.REACT_APP_HEADER_AD_SLOT || '1234567890',
    format: 'horizontal',
    style: { minHeight: '90px' }
  },
  sidebar: {
    slot: process.env.REACT_APP_SIDEBAR_AD_SLOT || '0987654321', 
    format: 'vertical',
    style: { minHeight: '250px' }
  },
  inContent: {
    slot: process.env.REACT_APP_CONTENT_AD_SLOT || '1122334455',
    format: 'rectangle',
    style: { minHeight: '200px' }
  }
};

export default DynamicAdComponent;
