import React, { lazy, Suspense } from 'react';

/**
 * LazyLoad component for implementing code splitting
 * 
 * @param {Object} props
 * @param {React.ComponentType} props.component - The component to lazy load
 * @param {React.ReactNode} props.fallback - Fallback UI when loading
 * @param {Object} props.componentProps - Props to pass to the lazy-loaded component
 */
const LazyLoad = ({ 
  component,
  fallback = <div className="flex items-center justify-center min-h-[200px]">
               <div className="w-12 h-12 border-4 border-gray-300 border-t-green-600 rounded-full animate-spin"></div>
             </div>,
  componentProps = {}
}) => {
  const LazyComponent = lazy(component);
  
  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...componentProps} />
    </Suspense>
  );
};

export default LazyLoad;
