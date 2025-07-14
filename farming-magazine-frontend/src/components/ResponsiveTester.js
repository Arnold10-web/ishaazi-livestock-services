/**
 * Responsive Design Tester Component
 * Helps identify and fix responsive design issues across the application
 */

import React, { useState } from 'react';
import { useResponsive } from '../utils/responsiveUtils';

const ResponsiveTester = ({ showTester = false }) => {
  const [isVisible, setIsVisible] = useState(showTester);
  const responsive = useResponsive();

  if (!isVisible && !showTester) return null;

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Toggle Button - Always visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={toggleVisibility}
          className="fixed bottom-4 right-4 z-[9999] bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          style={{ fontSize: '12px' }}
        >
          📱
        </button>
      )}

      {/* Responsive Info Panel */}
      {isVisible && (
        <div className="fixed top-0 left-0 z-[9998] bg-black bg-opacity-90 text-white p-4 rounded-br-lg shadow-xl max-w-sm">
          <div className="space-y-2 text-sm">
            <h3 className="font-bold text-yellow-400 border-b border-gray-600 pb-2">
              📱 Responsive Debug Info
            </h3>
            
            {/* Screen Info */}
            <div className="space-y-1">
              <div className="text-blue-300 font-semibold">Screen Info:</div>
              <div>Width: {responsive.windowSize.width}px</div>
              <div>Height: {responsive.windowSize.height}px</div>
              <div>Breakpoint: <span className="text-green-400">{responsive.breakpoint}</span></div>
              <div>Orientation: {responsive.isLandscape ? 'Landscape' : 'Portrait'}</div>
            </div>

            {/* Device Detection */}
            <div className="space-y-1 border-t border-gray-600 pt-2">
              <div className="text-blue-300 font-semibold">Device Type:</div>
              <div>Mobile: {responsive.isMobile ? '✅' : '❌'}</div>
              <div>Tablet: {responsive.isTablet ? '✅' : '❌'}</div>
              <div>Desktop: {responsive.isDesktop ? '✅' : '❌'}</div>
              <div>Touch: {responsive.deviceDetection?.isTouchDevice() ? '✅' : '❌'}</div>
            </div>

            {/* Layout Info */}
            <div className="space-y-1 border-t border-gray-600 pt-2">
              <div className="text-blue-300 font-semibold">Layout:</div>
              <div>Safe Area: {responsive.hasSafeArea ? '✅' : '❌'}</div>
              <div>Viewport Ratio: {(responsive.windowSize.width / responsive.windowSize.height).toFixed(2)}</div>
            </div>

            {/* Responsive Warnings */}
            <div className="space-y-1 border-t border-gray-600 pt-2">
              <div className="text-red-300 font-semibold">Warnings:</div>
              {responsive.windowSize.width < 320 && (
                <div className="text-red-400">⚠️ Very small screen</div>
              )}
              {responsive.windowSize.width > 1920 && (
                <div className="text-orange-400">⚠️ Very large screen</div>
              )}
              {responsive.windowSize.height < 500 && responsive.isLandscape && (
                <div className="text-yellow-400">⚠️ Short landscape</div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={toggleVisibility}
              className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Responsive Grid Overlay - for debugging layouts */}
      {isVisible && process.env.NODE_ENV === 'development' && (
        <div className="fixed inset-0 z-[9990] pointer-events-none">
          {/* Vertical grid lines */}
          <div className="absolute inset-0">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-red-500 opacity-20"
                style={{ left: `${(i + 1) * (100 / 12)}%` }}
              />
            ))}
          </div>
          
          {/* Breakpoint indicators */}
          <div className="absolute top-0 left-0 right-0 h-1">
            <div 
              className="absolute top-0 bottom-0 bg-blue-500 opacity-50"
              style={{ left: '0%', width: `${(640 / responsive.windowSize.width) * 100}%` }}
              title="SM Breakpoint (640px)"
            />
            <div 
              className="absolute top-0 bottom-0 bg-green-500 opacity-50"
              style={{ left: `${(640 / responsive.windowSize.width) * 100}%`, width: `${((768 - 640) / responsive.windowSize.width) * 100}%` }}
              title="MD Breakpoint (768px)"
            />
            <div 
              className="absolute top-0 bottom-0 bg-yellow-500 opacity-50"
              style={{ left: `${(768 / responsive.windowSize.width) * 100}%`, width: `${((1024 - 768) / responsive.windowSize.width) * 100}%` }}
              title="LG Breakpoint (1024px)"
            />
            <div 
              className="absolute top-0 bottom-0 bg-purple-500 opacity-50"
              style={{ left: `${(1024 / responsive.windowSize.width) * 100}%`, width: `${((1280 - 1024) / responsive.windowSize.width) * 100}%` }}
              title="XL Breakpoint (1280px)"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ResponsiveTester;
