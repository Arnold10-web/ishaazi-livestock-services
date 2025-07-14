import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const ReadingProgress = ({ targetRef, className = "" }) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const calculateProgress = () => {
      if (!targetRef?.current) return;

      const article = targetRef.current;
      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      // Start tracking when article comes into view
      if (scrollTop >= articleTop - windowHeight) {
        setIsVisible(true);
        
        // Calculate reading progress
        const scrolled = scrollTop - articleTop + windowHeight;
        const total = articleHeight;
        const progressPercentage = Math.min(100, Math.max(0, (scrolled / total) * 100));
        
        setProgress(progressPercentage);
      } else {
        setIsVisible(false);
      }
    };

    const handleScroll = () => {
      calculateProgress();
    };

    window.addEventListener('scroll', handleScroll);
    calculateProgress(); // Initial calculation
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  if (!isVisible) return null;

  return (
    <>
      {/* Top progress bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: progress / 100 }}
        className={`fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 z-50 origin-left ${className}`}
        style={{ width: '100%' }}
      />
      
      {/* Circular progress indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-8 right-8 z-40"
      >
        <div className="relative w-12 h-12">
          {/* Background circle */}
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-gray-200 dark:stroke-gray-700"
              strokeWidth="2"
            />
            {/* Progress circle */}
            <circle
              cx="18"
              cy="18"
              r="16"
              fill="none"
              className="stroke-blue-500"
              strokeWidth="2"
              strokeDasharray={`${progress} 100`}
              strokeLinecap="round"
            />
          </svg>
          
          {/* Percentage text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ReadingProgress;
