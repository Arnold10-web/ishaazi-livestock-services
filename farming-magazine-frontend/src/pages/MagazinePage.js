import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import MagazineList from '../components/MagazineList';



const MagazinePage = () => {
  // State hooks for magazine data, loading, error, and purchase processing
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  // Persist purchased magazines in session storage
  const [purchasedMagazines, setPurchasedMagazines] = useState(() => {
    const saved = sessionStorage.getItem('purchasedMagazines');
    return saved ? JSON.parse(saved) : [];
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch magazines data from the API
  const fetchMagazines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/magazines`);
      // Map over the fetched magazines to calculate their current price
      const magazinesWithPricing = response.data.data.magazines.map(magazine => ({
        ...magazine,
        currentPrice: calculateCurrentPrice(magazine)
      }));
      setMagazines(magazinesWithPricing);
      setError(null);
    } catch (err) {
      console.error('Error fetching magazines:', err);
      setError('Failed to fetch magazines. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate current price based on the magazine's pricing strategy
  const calculateCurrentPrice = (magazine) => {
    if (!magazine.pricingStrategy) return 0;

    if (magazine.pricingStrategy.type === 'free') return 0;

    if (magazine.pricingStrategy.type === 'time-based') {
      const daysOld = Math.floor((new Date() - new Date(magazine.createdAt)) / (1000 * 60 * 60 * 24));
      
      const applicableDiscount = magazine.pricingStrategy.discountSchedule
        ?.sort((a, b) => b.days - a.days)
        .find(discount => daysOld >= discount.days);

      if (applicableDiscount) {
        const discountedPrice = magazine.pricingStrategy.basePrice * (1 - applicableDiscount.percentage / 100);
        return Math.max(0, discountedPrice);
      }
    }

    return parseFloat(magazine.pricingStrategy.basePrice || 0);
  };

  // Handle magazine purchase with a dummy payment implementation
  const handlePurchase = async (magazineId, price) => {
    if (processingPurchase) return;
    
    setProcessingPurchase(true);
    try {
      // TODO: Replace with actual payment gateway integration
      alert('This is a dummy payment implementation. Replace with actual payment gateway integration.');
      
      // Simulate successful payment by storing the purchased magazine ID
      setPurchasedMagazines(prev => [...prev, magazineId]);
      alert('Purchase successful! You can now download the magazine.');
    } catch (err) {
      console.error('Purchase failed:', err);
      alert(err.message || 'Failed to process purchase');
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Handle magazine download with a dummy implementation
  const handleDownload = async (magazineId) => {
    try {
      // TODO: Replace with an actual secure download implementation
      alert('Download started! (Demo implementation)');
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to start download. Please try again.');
    }
  };

  // Fetch magazines on component mount
  useEffect(() => {
    fetchMagazines();
  }, []);

  // Persist purchased magazines to session storage on change
  useEffect(() => {
    sessionStorage.setItem('purchasedMagazines', JSON.stringify(purchasedMagazines));
  }, [purchasedMagazines]);

  // Loading state view with an animated spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
   
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="w-12 h-12 text-blue-500" />
          </motion.div>
          <p className="mt-4 text-gray-600 font-medium">Loading magazines...</p>
        </div>
    
      </div>
    );
  }

  // Error state view with an animated error container and a retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
      
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-red-50 rounded-lg p-6 max-w-md w-full text-center"
          >
            <svg
              className="w-12 h-12 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </motion.div>
        </div>
    
      </div>
    );
  }

  // Main MagazinePage content with a fade-in transition
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gray-50"
    >
      
      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Magazines</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Explore our latest magazine issues and purchase your favorite edition.
          </p>
        </motion.div>
        {/* Render the MagazineList component with purchase and download functionality */}
        <MagazineList 
          magazines={magazines}
          apiBaseUrl={API_BASE_URL}
          purchasedMagazines={purchasedMagazines}
          onPurchase={handlePurchase}
          onDownload={handleDownload}
          processingPurchase={processingPurchase}
        />
      </main>
   
    </motion.div>
  );
};

export default MagazinePage;
