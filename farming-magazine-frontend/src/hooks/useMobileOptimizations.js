// Mobile-specific performance optimizations
import React, { useState, useEffect, useMemo } from 'react';

const useMobileOptimizations = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [connectionType, setConnectionType] = useState('unknown');
  const [isLowMemory, setIsLowMemory] = useState(false);

  useEffect(() => {
    // Detect mobile devices
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'tablet'];
      return mobileKeywords.some(keyword => userAgent.includes(keyword)) ||
             window.innerWidth <= 768;
    };

    // Check network connection
    const updateConnection = () => {
      if ('connection' in navigator) {
        setConnectionType(navigator.connection.effectiveType);
      }
    };

    // Check device memory
    const checkMemory = () => {
      if ('deviceMemory' in navigator) {
        setIsLowMemory(navigator.deviceMemory <= 2); // 2GB or less
      }
    };

    setIsMobile(checkMobile());
    updateConnection();
    checkMemory();

    // Listen for viewport changes
    window.addEventListener('resize', () => setIsMobile(checkMobile()));
    
    // Listen for connection changes
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnection);
    }

    return () => {
      window.removeEventListener('resize', () => setIsMobile(checkMobile()));
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateConnection);
      }
    };
  }, []);

  const optimizations = useMemo(() => ({
    // Reduce animations on low-end devices
    shouldReduceAnimations: isLowMemory || connectionType === 'slow-2g',
    
    // Limit concurrent image loads
    maxConcurrentImages: isMobile ? (isLowMemory ? 2 : 4) : 8,
    
    // Image quality adjustments
    imageQuality: connectionType === 'slow-2g' ? 50 : 
                  connectionType === '2g' ? 65 : 
                  connectionType === '3g' ? 75 : 85,
    
    // Lazy loading thresholds
    lazyLoadThreshold: isMobile ? '50px' : '100px',
    
    // Debounce scroll events more aggressively on mobile
    scrollDebounce: isMobile ? 100 : 50,
    
    // Reduce bundle size for mobile
    shouldLoadFullFeatures: !isMobile || !isLowMemory
  }), [isMobile, connectionType, isLowMemory]);

  return {
    isMobile,
    connectionType,
    isLowMemory,
    optimizations
  };
};

// Enhanced mobile-optimized image component
const MobileOptimizedImage = ({ 
  src, 
  alt, 
  className = '',
  placeholder = true,
  priority = false,
  ...props 
}) => {
  const { optimizations } = useMobileOptimizations();
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Generate optimized image URL based on device capabilities
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return '';
    
    const url = new URL(originalSrc, window.location.origin);
    url.searchParams.set('q', optimizations.imageQuality);
    
    // Add format preference
    if ('image/webp' in window.HTMLCanvasElement.prototype.toDataURL) {
      url.searchParams.set('f', 'webp');
    }
    
    return url.toString();
  };

  const optimizedSrc = getOptimizedSrc(src);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={() => setIsLoaded(true)}
      onError={() => setHasError(true)}
      style={{
        transition: optimizations.shouldReduceAnimations ? 'none' : 'opacity 0.3s ease',
        opacity: isLoaded ? 1 : 0.7
      }}
      {...props}
    />
  );
};

export { useMobileOptimizations, MobileOptimizedImage };
