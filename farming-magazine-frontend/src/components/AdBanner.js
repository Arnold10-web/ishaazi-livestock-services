import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdBanner = ({ 
  position = 'inline', // 'header', 'sidebar', 'inline', 'footer'
  size = 'medium', // 'small', 'medium', 'large', 'banner'
  category = 'general', // 'farming', 'livestock', 'equipment', 'general'
  className = '',
  showCloseButton = false,
  autoRotate = false,
  rotationInterval = 30000, // 30 seconds
  respectAdBlocker = true
}) => {
  const [currentAd, setCurrentAd] = useState(null);
  const [adIndex, setAdIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAdBlocker, setHasAdBlocker] = useState(false);
  const adRef = useRef(null);
  const rotationTimer = useRef(null);

  // Sample farming-related ads (in production, these would come from an API)
  const farmingAds = [
    {
      id: 1,
      title: "Premium Livestock Feed",
      description: "Boost your livestock health with our premium organic feed solutions",
      imageUrl: "/images/ads/livestock-feed.jpg",
      clickUrl: "https://example-feed-company.com",
      category: "livestock",
      size: "medium",
      cta: "Shop Now"
    },
    {
      id: 2,
      title: "Modern Farm Equipment",
      description: "Increase productivity with state-of-the-art farming equipment",
      imageUrl: "/images/ads/farm-equipment.jpg",
      clickUrl: "https://example-equipment.com",
      category: "equipment",
      size: "large",
      cta: "Learn More"
    },
    {
      id: 3,
      title: "Agricultural Insurance",
      description: "Protect your farm investment with comprehensive coverage",
      imageUrl: "/images/ads/farm-insurance.jpg",
      clickUrl: "https://example-insurance.com",
      category: "farming",
      size: "banner",
      cta: "Get Quote"
    },
    {
      id: 4,
      title: "Organic Fertilizers",
      description: "Enhance soil quality with our eco-friendly fertilizer range",
      imageUrl: "/images/ads/fertilizer.jpg",
      clickUrl: "https://example-fertilizer.com",
      category: "farming",
      size: "small",
      cta: "Order Today"
    }
  ];

  // Ad size configurations
  const sizeConfig = {
    small: { width: '300px', height: '150px' },
    medium: { width: '350px', height: '200px' },
    large: { width: '400px', height: '250px' },
    banner: { width: '100%', height: '120px' }
  };

  // Position-specific styling
  const positionStyles = {
    header: 'mx-auto max-w-4xl',
    sidebar: 'w-full',
    inline: 'mx-auto my-8',
    footer: 'w-full'
  };

  useEffect(() => {
    // Detect ad blocker
    if (respectAdBlocker) {
      const testAd = document.createElement('div');
      testAd.innerHTML = '&nbsp;';
      testAd.className = 'adsbox';
      testAd.style.position = 'absolute';
      testAd.style.left = '-10000px';
      document.body.appendChild(testAd);
      
      setTimeout(() => {
        if (testAd.offsetHeight === 0) {
          setHasAdBlocker(true);
        }
        document.body.removeChild(testAd);
        setIsLoading(false);
      }, 100);
    } else {
      setIsLoading(false);
    }
  }, [respectAdBlocker]);

  useEffect(() => {
    // Filter ads by category and size
    const filteredAds = farmingAds.filter(ad => 
      (category === 'general' || ad.category === category) &&
      (size === 'banner' || ad.size === size || size === 'medium')
    );

    if (filteredAds.length > 0) {
      setCurrentAd(filteredAds[0]);
      
      // Set up auto-rotation if enabled
      if (autoRotate && filteredAds.length > 1) {
        rotationTimer.current = setInterval(() => {
          setAdIndex(prev => {
            const nextIndex = (prev + 1) % filteredAds.length;
            setCurrentAd(filteredAds[nextIndex]);
            return nextIndex;
          });
        }, rotationInterval);
      }
    }

    return () => {
      if (rotationTimer.current) {
        clearInterval(rotationTimer.current);
      }
    };
  }, [category, size, autoRotate, rotationInterval]);

  const handleAdClick = () => {
    if (currentAd?.clickUrl) {
      // Track ad click (in production, send to analytics)
      console.log('Ad clicked:', currentAd.title);
      window.open(currentAd.clickUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Track ad dismissal (in production, send to analytics)
    console.log('Ad dismissed:', currentAd?.title);
  };

  const handleImageError = (e) => {
    e.target.src = '/images/placeholder-ad.jpg';
  };

  // Don't render if ad blocker detected and we respect it
  if (hasAdBlocker && respectAdBlocker) {
    return (
      <div className={`${positionStyles[position]} ${className} p-4 text-center`}>
        <div className="bg-[#F5F5DC] border border-[#2D5016] border-opacity-20 rounded-lg p-4">
          <p className="text-sm text-[#2D5016] mb-2">
            📢 Support Our Farming Community
          </p>
          <p className="text-xs text-gray-600">
            Consider disabling your ad blocker to help us provide free agricultural content
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`${positionStyles[position]} ${className}`}>
        <div 
          className="bg-gray-100 rounded-lg animate-pulse"
          style={sizeConfig[size]}
        />
      </div>
    );
  }

  if (!isVisible || !currentAd) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`${positionStyles[position]} ${className} relative`}
        ref={adRef}
      >
        <div 
          className="relative bg-white rounded-lg shadow-md border border-[#2D5016] border-opacity-10 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group"
          style={sizeConfig[size]}
          onClick={handleAdClick}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          )}

          {/* Ad label */}
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-[#2D5016] text-white text-xs px-2 py-1 rounded">
              Ad
            </span>
          </div>

          {/* Ad content */}
          <div className="relative h-full flex">
            {/* Image section */}
            <div className="flex-shrink-0 w-1/3">
              <img
                src={currentAd.imageUrl}
                alt={currentAd.title}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>

            {/* Content section */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-[#2D5016] text-sm mb-2 line-clamp-2">
                  {currentAd.title}
                </h3>
                <p className="text-gray-600 text-xs line-clamp-3 mb-3">
                  {currentAd.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between">
                <button className="bg-[#DAA520] text-white text-xs px-3 py-1 rounded-full hover:bg-[#B8860B] transition-colors flex items-center gap-1">
                  {currentAd.cta}
                  <ExternalLink className="h-3 w-3" />
                </button>
                
                {autoRotate && farmingAds.length > 1 && (
                  <div className="flex gap-1">
                    {farmingAds.map((_, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === adIndex ? 'bg-[#DAA520]' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-[#2D5016] bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300" />
        </div>

        {/* Ad performance indicator (for admin/testing) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute -bottom-6 left-0 text-xs text-gray-500">
            Position: {position} | Size: {size} | Category: {category}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default AdBanner;
