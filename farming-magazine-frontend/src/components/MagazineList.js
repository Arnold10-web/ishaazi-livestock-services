/**
 * MagazineList Component
 * 
 * Renders a grid of magazine items with purchase/download functionality and admin controls.
 * Handles free and paid magazines, displays discounts, and provides skeleton loaders
 * during loading states.
 * 
 * @module components/MagazineList
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Edit2, Trash2 } from 'lucide-react';


/**
 * Renders a list of magazine items with purchase/download functionality
 * 
 * @param {Object} props - Component props
 * @param {Array} props.magazines - Array of magazine objects to display
 * @param {string} props.apiBaseUrl - Base URL for API requests (used for image paths)
 * @param {boolean} props.isAdmin - Whether to display admin controls
 * @param {Function} props.onDelete - Callback for delete action
 * @param {Function} props.onEdit - Callback for edit action
 * @param {Array} props.purchasedMagazines - Array of magazine IDs purchased by user
 * @param {Function} props.onPurchase - Callback for purchase action
 * @param {Function} props.onDownload - Callback for download action
 * @param {boolean} props.processingPurchase - Whether a purchase is in progress
 * @param {boolean} props.isLoading - Whether data is currently loading
 * @returns {JSX.Element} Rendered magazine list component
 */
const MagazineList = ({ 
  magazines, 
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit,
  purchasedMagazines = [],
  onPurchase,
  onDownload,
  processingPurchase,
  isLoading
}) => {
  /**
   * Handles image loading errors by replacing with default placeholder
   * @param {Event} e - Image error event
   */
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  /**
   * Formats date strings into localized, human-readable format
   * @param {string} dateString - ISO date string to format
   * @returns {string} Formatted date string (e.g., "January 1, 2023")
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  /**
   * Formats price values with currency symbol and thousands separators
   * @param {number} price - Price value to format
   * @returns {string} Formatted price string (e.g., "shs25,000")
   */
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `shs${price.toLocaleString()}`;
  };

  /**
   * Determines if a magazine is available for download
   * @param {Object} magazine - Magazine object to check
   * @returns {boolean} True if magazine is free or already purchased
   */
  const canDownload = (magazine) => {
    return magazine.currentPrice === 0 || purchasedMagazines.includes(magazine._id);
  };

  /**
   * Calculates discount percentage for time-based pricing
   * @param {number} currentPrice - Current discounted price
   * @param {number} basePrice - Original base price
   * @returns {number} Calculated discount percentage
   */
  const calculateDiscount = (currentPrice, basePrice) => {
    return Math.round((1 - currentPrice / basePrice) * 100);
  };

  /**
   * Skeleton loader component for magazine items during loading state
   * Creates a placeholder UI with pulsing animation for better UX
   * @returns {JSX.Element} Animated skeleton loader
   */
  const MagazineSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
      </div>
    </div>
  );

  // Empty state when no magazine data is available
  if (magazines.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <AlertCircle className="w-16 h-16 text-blue-500 mb-6" />
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">No Magazines Available</h3>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Check back soon for updates!</p>
      </div>
    );
  }

  // Render the loading state with a grid of skeleton loaders
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map(i => (
          <MagazineSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {magazines.map((magazine) => (
          <article
            key={magazine._id}
            className="group relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="magazine-image-container relative mb-6">
                <div className="relative overflow-hidden rounded-xl">
                  <img
                    src={`${apiBaseUrl}${magazine.imageUrl}`}
                    alt={magazine.title}
                    className="magazine-image w-full h-48 object-cover"
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                </div>
                
                {/* Discount badge */}
                {magazine.pricingStrategy?.type === 'time-based' && 
                  magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                    <div className="discount-badge absolute -top-2 -left-2 bg-red-500 text-white px-3 py-1.5 text-sm font-bold rounded-full shadow-lg">
                      {calculateDiscount(magazine.currentPrice, magazine.pricingStrategy.basePrice)}% OFF
                    </div>
                )}
                
                {/* Free badge */}
                {magazine.currentPrice === 0 && (
                  <div className="absolute -top-2 -right-2 bg-emerald-500 text-white px-3 py-1.5 text-sm font-bold rounded-full shadow-lg">
                    FREE
                  </div>
                )}
              </div>
              
              <div className="magazine-content space-y-4">
                <Link to={`/magazine/${magazine._id}`} className="magazine-link block group/link">
                  <h2 className="magazine-title text-xl font-bold text-gray-800 dark:text-white group-hover/link:text-emerald-600 dark:group-hover/link:text-emerald-400 transition-colors duration-300 line-clamp-2">
                    {magazine.title}
                  </h2>
                </Link>
                
                <div className="flex items-center justify-between">
                  <p className="magazine-issue text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
                    Issue: {magazine.issue}
                  </p>
                  <p className="magazine-date text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(magazine.createdAt)}
                  </p>
                </div>
                
                <div className="magazine-pricing">
                  {magazine.currentPrice > 0 ? (
                    <div className="flex items-center space-x-2">
                      <p className="magazine-price text-lg font-bold text-gray-800 dark:text-white">
                        {formatPrice(magazine.currentPrice)}
                      </p>
                      {magazine.pricingStrategy?.type === 'time-based' && 
                        magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                          <span className="original-price text-sm text-gray-500 dark:text-gray-400 line-through">
                            {formatPrice(magazine.pricingStrategy.basePrice)}
                          </span>
                      )}
                    </div>
                  ) : (
                    <p className="magazine-price free text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      FREE DOWNLOAD
                      </p>
                  )}
                </div>
                
                <div className="magazine-actions space-y-3 pt-2">
                  {!canDownload(magazine) ? (
                    <button
                      onClick={() => onPurchase(magazine._id, magazine.currentPrice)}
                      className={`purchase-btn w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 ${processingPurchase ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={processingPurchase}
                    >
                      <span className="flex items-center justify-center">
                        {processingPurchase ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            Buy Now {formatPrice(magazine.currentPrice)}
                          </>
                        )}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onDownload(magazine._id)}
                      className="download-btn w-full py-3 px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <span className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Magazine
                      </span>
                    </button>
                  )}
                </div>
                
                {isAdmin && (
                  <div className="admin-actions flex gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => onEdit(magazine._id)}
                      className="edit-btn flex-1 py-2 px-4 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                      aria-label="Edit magazine"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(magazine._id)}
                      className="delete-btn flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                      aria-label="Delete magazine"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default MagazineList;
