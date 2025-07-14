/**
 * Enhanced Responsive Utilities
 * Provides comprehensive responsive design utilities, mobile detection,
 * and responsive behavior helpers for the entire application.
 */

import { useState, useEffect } from 'react';

// Responsive breakpoints (matching Tailwind CSS defaults)
export const BREAKPOINTS = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
};

/**
 * Hook for detecting current screen size and breakpoint
 * @returns {Object} Current screen info and responsive utilities
 */
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Debounced resize handler for better performance
    let timeoutId;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedHandleResize);
    
    // Initial call
    handleResize();

    return () => {
      window.removeEventListener('resize', debouncedHandleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  // Determine current breakpoint
  const getCurrentBreakpoint = () => {
    const width = windowSize.width;
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  };

  // Responsive state helpers
  const breakpoint = getCurrentBreakpoint();
  const isMobile = windowSize.width < BREAKPOINTS.md;
  const isTablet = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg;
  const isDesktop = windowSize.width >= BREAKPOINTS.lg;
  const isLargeDesktop = windowSize.width >= BREAKPOINTS.xl;

  // Device orientation
  const isLandscape = windowSize.width > windowSize.height;
  const isPortrait = windowSize.width <= windowSize.height;

  // Safe area detection (for iOS devices with notches)
  const hasSafeArea = typeof window !== 'undefined' && 
    window.CSS && 
    window.CSS.supports && 
    window.CSS.supports('padding-top: env(safe-area-inset-top)');

  return {
    windowSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isLandscape,
    isPortrait,
    hasSafeArea,
    // Utility functions
    isBreakpoint: (bp) => breakpoint === bp,
    isMinBreakpoint: (bp) => windowSize.width >= BREAKPOINTS[bp],
    isMaxBreakpoint: (bp) => windowSize.width <= BREAKPOINTS[bp],
  };
};

/**
 * Device detection utilities
 */
export const deviceDetection = {
  // User agent based detection
  getUserAgent: () => typeof navigator !== 'undefined' ? navigator.userAgent : '',
  
  // Mobile device detection
  isMobileDevice: () => {
    const userAgent = deviceDetection.getUserAgent();
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  },
  
  // Tablet detection
  isTabletDevice: () => {
    const userAgent = deviceDetection.getUserAgent();
    return /iPad|Android(?!.*Mobile)/i.test(userAgent);
  },
  
  // Touch device detection
  isTouchDevice: () => {
    return typeof window !== 'undefined' && 
           ('ontouchstart' in window || navigator.maxTouchPoints > 0);
  },
  
  // iOS device detection
  isIOS: () => {
    const userAgent = deviceDetection.getUserAgent();
    return /iPad|iPhone|iPod/.test(userAgent);
  },
  
  // Android device detection
  isAndroid: () => {
    const userAgent = deviceDetection.getUserAgent();
    return /Android/i.test(userAgent);
  },
  
  // Desktop detection
  isDesktopDevice: () => {
    return !deviceDetection.isMobileDevice() && !deviceDetection.isTabletDevice();
  }
};

/**
 * Responsive image utilities
 */
export const getResponsiveImageSizes = (breakpoints = {}) => {
  const defaultBreakpoints = {
    mobile: '(max-width: 767px) 100vw',
    tablet: '(max-width: 1023px) 50vw',
    desktop: '33vw'
  };
  
  const mergedBreakpoints = { ...defaultBreakpoints, ...breakpoints };
  
  return Object.values(mergedBreakpoints).join(', ');
};

/**
 * Responsive grid column calculator (hook version)
 */
export const useResponsiveColumns = (totalItems, breakpointColumns = {}) => {
  const { breakpoint } = useResponsive();
  
  const defaultColumns = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4
  };
  
  const columns = { ...defaultColumns, ...breakpointColumns };
  return Math.min(columns[breakpoint] || 1, totalItems);
};

/**
 * Responsive grid column calculator (utility function)
 */
export const getResponsiveColumns = (windowWidth, totalItems, breakpointColumns = {}) => {
  const getBreakpoint = (width) => {
    if (width >= BREAKPOINTS['2xl']) return '2xl';
    if (width >= BREAKPOINTS.xl) return 'xl';
    if (width >= BREAKPOINTS.lg) return 'lg';
    if (width >= BREAKPOINTS.md) return 'md';
    if (width >= BREAKPOINTS.sm) return 'sm';
    return 'xs';
  };
  
  const breakpoint = getBreakpoint(windowWidth);
  
  const defaultColumns = {
    xs: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
    '2xl': 4
  };
  
  const columns = { ...defaultColumns, ...breakpointColumns };
  return Math.min(columns[breakpoint] || 1, totalItems);
};

/**
 * Responsive font size calculator (hook version)
 */
export const useResponsiveFontSize = (baseSize = 16, scaleFactor = 0.1) => {
  const { windowSize } = useResponsive();
  
  // Scale font size based on screen width
  const scale = 1 + (windowSize.width - BREAKPOINTS.sm) * scaleFactor / 1000;
  return Math.max(baseSize * 0.8, Math.min(baseSize * scale, baseSize * 1.5));
};

/**
 * Responsive font size calculator
 */
export const getResponsiveFontSize = (windowWidth, baseSize = 16, scaleFactor = 0.1) => {
  // Calculate responsive font size using viewport width
  const minSize = baseSize * 0.75;
  const maxSize = baseSize * 1.25;
  
  const calculatedSize = baseSize + (windowWidth - 320) * scaleFactor;
  
  return Math.max(minSize, Math.min(maxSize, calculatedSize));
};

/**
 * Responsive spacing calculator
 */
export const getResponsiveSpacing = (windowWidth, baseSpacing = 16) => {
  const isMobile = windowWidth < BREAKPOINTS.md;
  const isTablet = windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg;
  
  if (isMobile) return baseSpacing * 0.75;
  if (isTablet) return baseSpacing * 0.875;
  return baseSpacing;
};

/**
 * Modal responsive positioning
 */
export const getModalPosition = (windowWidth) => {
  const isMobile = windowWidth < BREAKPOINTS.md;
  
  return {
    position: 'fixed',
    top: isMobile ? '10px' : '20px',
    left: isMobile ? '10px' : '50%',
    right: isMobile ? '10px' : 'auto',
    transform: isMobile ? 'none' : 'translateX(-50%)',
    maxWidth: isMobile ? 'none' : '90vw',
    maxHeight: isMobile ? 'calc(100vh - 20px)' : 'calc(100vh - 40px)',
    width: isMobile ? 'auto' : 'auto'
  };
};

/**
 * Table responsive utilities
 */
export const getResponsiveTableProps = (windowWidth) => {
  const isMobile = windowWidth < BREAKPOINTS.md;
  
  return {
    containerStyle: {
      overflowX: 'auto',
      WebkitOverflowScrolling: 'touch',
      width: '100%'
    },
    tableStyle: {
      minWidth: isMobile ? '600px' : '100%',
      width: '100%'
    },
    cellPadding: isMobile ? '0.5rem' : '1rem',
    fontSize: isMobile ? '0.875rem' : '1rem'
  };
};

/**
 * Navigation responsive utilities
 */
export const getNavigationLayout = (windowWidth) => {
  const { isMobile, isTablet } = {
    isMobile: windowWidth < BREAKPOINTS.md,
    isTablet: windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg
  };
  
  return {
    showMobileMenu: isMobile,
    showTabletLayout: isTablet,
    showDesktopLayout: !isMobile && !isTablet,
    menuStyle: isMobile ? 'drawer' : isTablet ? 'dropdown' : 'horizontal'
  };
};

/**
 * Dashboard responsive utilities
 */
export const getDashboardLayout = (windowWidth) => {
  const isMobile = windowWidth < BREAKPOINTS.md;
  const isTablet = windowWidth >= BREAKPOINTS.md && windowWidth < BREAKPOINTS.lg;
  const isDesktop = windowWidth >= BREAKPOINTS.lg;
  
  return {
    sidebarCollapsed: isMobile,
    showMobileDashboard: isMobile,
    cardColumns: isMobile ? 1 : isTablet ? 2 : isDesktop ? 3 : 4,
    tableScrollable: isMobile || isTablet,
    showCompactMode: isMobile
  };
};

/**
 * Performance-optimized responsive image component
 */
export const ResponsiveImage = ({
  src,
  alt,
  className = '',
  sizes,
  loading = 'lazy',
  ...props
}) => {
  const { isMobile } = useResponsive();
  
  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || getResponsiveImageSizes();
  
  // Apply mobile-specific optimizations
  const optimizedProps = isMobile ? {
    loading: 'lazy',
    decoding: 'async',
    ...props
  } : props;
  
  return (
    <img
      src={src}
      alt={alt}
      className={`responsive-image ${isMobile ? 'mobile-optimized' : ''} ${className}`}
      sizes={responsiveSizes}
      loading={loading}
      style={{
        width: '100%',
        height: 'auto',
        maxWidth: '100%',
        objectFit: 'cover',
        ...optimizedProps.style
      }}
      {...optimizedProps}
    />
  );
};

/**
 * Responsive container component
 */
export const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = '1200px',
  padding = true,
  ...props 
}) => {
  const { isMobile } = useResponsive();
  
  const containerStyles = {
    width: '100%',
    maxWidth,
    margin: '0 auto',
    paddingLeft: padding ? (isMobile ? '1rem' : '2rem') : '0',
    paddingRight: padding ? (isMobile ? '1rem' : '2rem') : '0',
    boxSizing: 'border-box'
  };
  
  return (
    <div 
      className={`responsive-container ${className}`}
      style={{ ...containerStyles, ...props.style }}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Responsive grid component
 */
export const ResponsiveGrid = ({ 
  children, 
  columns = { xs: 1, sm: 2, md: 2, lg: 3, xl: 4 },
  gap = '1rem',
  className = '',
  ...props 
}) => {
  const { breakpoint } = useResponsive();
  
  const currentColumns = columns[breakpoint] || columns.xs || 1;
  
  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: `repeat(${currentColumns}, 1fr)`,
    gap,
    width: '100%'
  };
  
  return (
    <div 
      className={`responsive-grid ${className}`}
      style={{ ...gridStyles, ...props.style }}
      {...props}
    >
      {children}
    </div>
  );
};

// Export all utilities as default
const responsiveUtilities = {
  useResponsive,
  deviceDetection,
  getResponsiveImageSizes,
  getResponsiveColumns,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getModalPosition,
  getResponsiveTableProps,
  getNavigationLayout,
  getDashboardLayout,
  ResponsiveImage,
  ResponsiveContainer,
  ResponsiveGrid,
  BREAKPOINTS
};

export default responsiveUtilities;
