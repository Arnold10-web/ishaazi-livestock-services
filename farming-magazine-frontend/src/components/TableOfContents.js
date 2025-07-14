/**
 * TableOfContents Component
 * 
 * Renders an interactive, animated table of contents that highlights
 * the current section as the user scrolls through the content.
 * Features expandable/collapsible navigation, smooth scrolling,
 * and active section tracking.
 * 
 * @module components/TableOfContents
 */
import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Dynamic table of contents with scroll tracking and animation
 * 
 * @param {Object} props - Component props
 * @param {Array} props.headings - Array of heading objects with id and text properties
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} Animated table of contents component
 */
const TableOfContents = ({ headings, className = "" }) => {
  // Track the currently active heading based on scroll position
  const [activeHeading, setActiveHeading] = useState('');
  // Control whether the TOC is expanded or collapsed
  const [isExpanded, setIsExpanded] = useState(true);

  /**
   * Effect hook to track scroll position and highlight the active heading
   * Adds scroll listener that updates active heading state when scrolling
   */
  useEffect(() => {
    // Skip if no headings are provided
    if (!headings || headings.length === 0) return;

    /**
     * Handle scroll events and determine which heading is currently active
     * Based on the scroll position relative to each heading's position
     */
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 100; // Offset for better UX
      
      let currentHeading = '';
      
      // Find the heading that's currently in view
      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (element) {
          const elementTop = element.offsetTop;
          // If we've scrolled past this heading, mark it as current
          if (scrollPosition >= elementTop) {
            currentHeading = heading.id;
          } else {
            // Stop at the first heading we haven't scrolled past yet
            break;
          }
        }
      }
      
      setActiveHeading(currentHeading);
    };

    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Set initial active heading
    
    // Clean up event listener on unmount
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  /**
   * Scrolls the page to the selected heading with smooth animation
   * Accounts for fixed header offset when scrolling
   * 
   * @param {string} id - HTML ID of the heading to scroll to
   */
  const scrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      
      window.scrollTo({
        top: y,
        behavior: 'smooth'
      });
    }
  };

  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div 
        className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
            Table of Contents
          </h3>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </motion.div>
        </div>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <nav className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {headings.map((heading, index) => {
                const isActive = activeHeading === heading.id;
                const isH3 = heading.level === 'h3';
                
                return (
                  <motion.button
                    key={heading.id}
                    onClick={() => scrollToHeading(heading.id)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200
                      ${isH3 ? 'ml-4 border-l-2 border-gray-200 dark:border-gray-600 pl-3' : ''}
                      ${isActive 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 font-medium border-l-2 border-blue-500' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-start">
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-blue-500 rounded-full mr-2 mt-1.5 flex-shrink-0"
                        />
                      )}
                      <span className={`leading-relaxed ${isActive ? '' : isH3 ? 'ml-4' : ''}`}>
                        {heading.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
      
      {headings.length > 5 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 text-center">
          {headings.length} sections • {Math.ceil(headings.length * 1.5)} min read
        </div>
      )}
    </div>
  );
};

export default TableOfContents;
