import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAlert } from '../hooks/useAlert';
import MagazineList from '../components/MagazineList';
import DynamicAdComponent from '../components/DynamicAdComponent';



const MagazinePage = () => {
  // State hooks for magazine data, loading, error, and purchase processing
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);
  const alert = useAlert();

  // Persist purchased magazines in session storage
  const [purchasedMagazines, setPurchasedMagazines] = useState(() => {
    const saved = sessionStorage.getItem('purchasedMagazines');
    return saved ? JSON.parse(saved) : [];
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Fetch magazines data from the API
  const fetchMagazines = useCallback(async () => {
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
  }, [API_BASE_URL]);

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
      alert.warning('This is a demo payment implementation. In production, this would integrate with a real payment gateway.');
      
      // Simulate successful payment by storing the purchased magazine ID
      setPurchasedMagazines(prev => [...prev, magazineId]);
      alert.success('Purchase successful! You can now download the magazine.');
    } catch (err) {
      console.error('Purchase failed:', err);
      alert.error(err.message || 'Failed to process purchase');
    } finally {
      setProcessingPurchase(false);
    }
  };

  // Handle magazine download with a dummy implementation
  const handleDownload = async (magazineId) => {
    try {
      // TODO: Replace with an actual secure download implementation
      alert.info('Download started! (Demo implementation)');
    } catch (err) {
      console.error('Download failed:', err);
      alert.error('Failed to start download. Please try again.');
    }
  };

  // Fetch magazines on component mount
  useEffect(() => {
    fetchMagazines();
  }, [fetchMagazines]);

  // Persist purchased magazines to session storage on change
  useEffect(() => {
    sessionStorage.setItem('purchasedMagazines', JSON.stringify(purchasedMagazines));
  }, [purchasedMagazines]);

  // Loading state view with a simple spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-6 text-gray-700 dark:text-gray-300 font-medium text-lg">
            Loading our amazing magazines...
          </p>
        </div>
      </div>
    );
  }

  // Error state view with a simple error container and retry button
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full text-center shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
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
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3">
              Oops! Something went wrong
            </h2>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {error}
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main MagazinePage content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight">
            Premium Agriculture Editions: Your Success Library
          </h1>
          
          <p className="text-gray-700 dark:text-gray-300 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
            Transform your farm with our exclusive collection of expert-curated magazines. 
            <span className="text-emerald-600 dark:text-emerald-400 font-medium"> Instant access to proven strategies, breakthrough techniques, and insider knowledge</span> that successful farmers use to maximize profits and productivity.
          </p>
          
          {/* Decorative elements */}
          <div className="flex justify-center items-center mt-8 space-x-4">
            <div className="w-20 h-0.5 bg-emerald-500"></div>
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <div className="w-20 h-0.5 bg-blue-500"></div>
          </div>
        </div>
        
        {/* Magazine List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <MagazineList 
            magazines={magazines}
            apiBaseUrl={API_BASE_URL}
            purchasedMagazines={purchasedMagazines}
            onPurchase={handlePurchase}
            onDownload={handleDownload}
            processingPurchase={processingPurchase}
          />
        </div>
        
        {/* Content Ad */}
        <div className="mt-16 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <DynamicAdComponent 
              adSlot="1122334455"
              adFormat="rectangle"
              adStyle={{ minHeight: '200px' }}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MagazinePage;
