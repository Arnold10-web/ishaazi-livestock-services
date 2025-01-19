import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import MagazineList from '../components/MagazineList';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../css/MagazinePage.css';

const MagazinePage = () => {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPurchase, setProcessingPurchase] = useState(false);

  // Store purchased magazines in session storage to persist during browser session
  const [purchasedMagazines, setPurchasedMagazines] = useState(() => {
    const saved = sessionStorage.getItem('purchasedMagazines');
    return saved ? JSON.parse(saved) : [];
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.ishaazilivestockservices.com';

  const fetchMagazines = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/magazines`);
      const magazinesWithPricing = response.data.data.magazines.map((magazine) => ({
        ...magazine,
        currentPrice: calculateCurrentPrice(magazine),
      }));
      setMagazines(magazinesWithPricing);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching magazines:', err);
      setError('Failed to fetch magazines. Please try again later.');
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchMagazines();
  }, [fetchMagazines]);

  useEffect(() => {
    sessionStorage.setItem('purchasedMagazines', JSON.stringify(purchasedMagazines));
  }, [purchasedMagazines]);

  const calculateCurrentPrice = (magazine) => {
    if (!magazine.pricingStrategy) return 0;

    if (magazine.pricingStrategy.type === 'free') return 0;

    if (magazine.pricingStrategy.type === 'time-based') {
      const daysOld = Math.floor((new Date() - new Date(magazine.createdAt)) / (1000 * 60 * 60 * 24));
      const applicableDiscount = magazine.pricingStrategy.discountSchedule
        ?.sort((a, b) => b.days - a.days)
        .find((discount) => daysOld >= discount.days);

      if (applicableDiscount) {
        const discountedPrice =
          magazine.pricingStrategy.basePrice * (1 - applicableDiscount.percentage / 100);
        return Math.max(0, discountedPrice);
      }
    }

    return parseFloat(magazine.pricingStrategy.basePrice || 0);
  };

  const handlePurchase = async (magazineId, price) => {
    if (processingPurchase) return;

    setProcessingPurchase(true);
    try {
      alert('This is a dummy payment implementation. Replace with actual payment gateway integration.');
      setPurchasedMagazines((prev) => [...prev, magazineId]);
      alert('Purchase successful! You can now download the magazine.');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(error.message || 'Failed to process purchase');
    } finally {
      setProcessingPurchase(false);
    }
  };

  const handleDownload = async (magazineId) => {
    try {
      alert('Download started! (Demo implementation)');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to start download. Please try again.');
    }
  };

  if (loading) return <div>Loading...</div>;

  if (error) return <div>{error}</div>;

  return (
    <div className="magazine-page">
      <Header />
      <main>
        <h1>Magazines</h1>
        <MagazineList
          magazines={magazines}
          purchasedMagazines={purchasedMagazines}
          onPurchase={handlePurchase}
          onDownload={handleDownload}
        />
      </main>
      <Footer />
    </div>
  );
};

export default MagazinePage;
