import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Edit2, Trash2, ArrowRight } from 'lucide-react';


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
  // Utility: Handle image load errors
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  // Utility: Format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Utility: Format price values
  const formatPrice = (price) => {
    if (price === undefined || price === null) return 'N/A';
    return `shs${price.toLocaleString()}`;
  };

  // Determine if the magazine can be downloaded (free or already purchased)
  const canDownload = (magazine) => {
    return magazine.currentPrice === 0 || purchasedMagazines.includes(magazine._id);
  };

  // Calculate discount percentage for time-based pricing
  const calculateDiscount = (currentPrice, basePrice) => {
    return Math.round((1 - currentPrice / basePrice) * 100);
  };

  // Skeleton loader with a shimmer effect for the loading state
  const MagazineSkeleton = () => (
    <div className="relative overflow-hidden rounded-xl bg-white shadow-sm p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-48 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-lg" />
        <div className="space-y-2">
          <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded" />
        </div>
      </div>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );

  // Empty state with an animated icon when no magazine data is available
  if (magazines.length === 0 && !isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
        >
          <AlertCircle className="w-16 h-16 text-blue-400/80" />
        </motion.div>
        <h3 className="mt-6 text-2xl font-semibold text-gray-800">No Magazines Available</h3>
        <p className="mt-2 text-gray-600">Check back soon for updates!</p>
      </motion.div>
    );
  }

  // Render the loading state with a grid of skeleton loaders
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
        {[1, 2, 3].map(i => (
          <MagazineSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {magazines.map((magazine, index) => (
            <motion.article
              key={magazine._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden magazine-item"
            >
              <div className="magazine-image-container relative">
                <motion.img
                  src={`${apiBaseUrl}${magazine.imageUrl}`}
                  alt={magazine.title}
                  className="magazine-image w-full object-cover"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.4 }}
                />
                {magazine.pricingStrategy?.type === 'time-based' && 
                  magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                    <div className="discount-badge absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-sm rounded">
                      {calculateDiscount(magazine.currentPrice, magazine.pricingStrategy.basePrice)}% OFF
                    </div>
                )}
              </div>
              <div className="magazine-content p-6">
                <Link to={`/magazine/${magazine._id}`} className="magazine-link block">
                  <h2 className="magazine-title text-xl font-semibold text-gray-800 group-hover:text-blue-600 transition-colors duration-200">
                    {magazine.title}
                  </h2>
                </Link>
                <p className="magazine-issue text-gray-600 mt-1">Issue: {magazine.issue}</p>
                <div className="magazine-pricing mt-2">
                  {magazine.currentPrice > 0 ? (
                    <p className="magazine-price text-gray-800">
                      Price: {formatPrice(magazine.currentPrice)}
                      {magazine.pricingStrategy?.type === 'time-based' && 
                        magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                          <span className="original-price text-sm text-gray-500 line-through ml-2">
                            {formatPrice(magazine.pricingStrategy.basePrice)}
                          </span>
                      )}
                    </p>
                  ) : (
                    <p className="magazine-price free text-green-600 font-bold">FREE</p>
                  )}
                </div>
                <p className="magazine-date text-sm text-gray-500 mt-2">
                  Published: {formatDate(magazine.createdAt)}
                </p>
                <div className="magazine-actions mt-4">
                  {!canDownload(magazine) ? (
                    <button
                      onClick={() => onPurchase(magazine._id, magazine.currentPrice)}
                      className={`purchase-btn px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${processingPurchase ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={processingPurchase}
                    >
                      {processingPurchase ? 'Processing...' : `Buy Now ${formatPrice(magazine.currentPrice)}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => onDownload(magazine._id)}
                      className="download-btn px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      Download Magazine
                    </button>
                  )}
                </div>
                {isAdmin && (
                  <div className="admin-actions mt-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(magazine._id)}
                      className="edit-btn px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                      aria-label="Edit magazine"
                    >
                      <Edit2 className="w-5 h-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(magazine._id)}
                      className="delete-btn px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      aria-label="Delete magazine"
                    >
                      <Trash2 className="w-5 h-5" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MagazineList;
