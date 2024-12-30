import React, { useState, useEffect } from 'react';
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

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchMagazines();
  }, []);

  // Save purchased magazines to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('purchasedMagazines', JSON.stringify(purchasedMagazines));
  }, [purchasedMagazines]);

  const fetchMagazines = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/content/magazines`);
      const magazinesWithPricing = response.data.data.magazines.map(magazine => ({
        ...magazine,
        currentPrice: calculateCurrentPrice(magazine)
      }));
      setMagazines(magazinesWithPricing);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching magazines:', err);
      setError('Failed to fetch magazines. Please try again later.');
      setLoading(false);
    }
  };

  const calculateCurrentPrice = (magazine) => {
    if (!magazine.pricingStrategy) return 0;

    if (magazine.pricingStrategy.type === 'free') return 0;

    if (magazine.pricingStrategy.type === 'time-based') {
      const daysOld = Math.floor((new Date() - new Date(magazine.createdAt)) / (1000 * 60 * 60 * 24));
      
      const applicableDiscount = magazine.pricingStrategy.discountSchedule
        ?.sort((a, b) => b.days - a.days)
        .find(discount => daysOld >= discount.days);

      if (applicableDiscount) {
        const discountedPrice = magazine.pricingStrategy.basePrice * 
          (1 - applicableDiscount.percentage / 100);
        return Math.max(0, discountedPrice);
      }
    }

    return parseFloat(magazine.pricingStrategy.basePrice || 0);
  };

  const handlePurchase = async (magazineId, price) => {
    if (processingPurchase) return;
    
    setProcessingPurchase(true);
    try {
      // TODO: Replace with actual payment gateway integration
      /* 
      Example implementation with a real payment gateway:
      
      const paymentGateway = new PaymentGateway({
        apiKey: process.env.PAYMENT_GATEWAY_KEY,
        merchantId: process.env.MERCHANT_ID
      });

      const paymentSession = await paymentGateway.createPayment({
        amount: price,
        currency: 'UGX',
        description: `Magazine Purchase - ${magazineId}`,
        successUrl: `${window.location.origin}/purchase/success?magazine=${magazineId}`,
        cancelUrl: `${window.location.origin}/purchase/cancel`
      });

      // Redirect to payment gateway
      window.location.href = paymentSession.checkoutUrl;
      */

      // Temporary implementation for demonstration
      alert('This is a dummy payment implementation. Replace with actual payment gateway integration.');
      
      // Simulate successful payment
      setPurchasedMagazines(prev => [...prev, magazineId]);
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
      // TODO: Replace with actual secure download implementation
      /* 
      Example implementation with secure downloads:
      
      // Generate a temporary download URL
      const response = await axios.post(
        `${API_BASE_URL}/api/magazines/${magazineId}/generate-download`,
        { magazineId }
      );

      // Start download using temporary URL
      window.location.href = response.data.downloadUrl;
      */

      alert('Download started! (Demo implementation)');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to start download. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="main-content">
      <Header showAd={true} />
      <div className="magazine-page">
        <h1 className="page-title">Our Magazines</h1>
        <MagazineList 
          magazines={magazines}
          apiBaseUrl={API_BASE_URL}
          purchasedMagazines={purchasedMagazines}
          onPurchase={handlePurchase}
          onDownload={handleDownload}
          processingPurchase={processingPurchase}
        />
      </div>
      <Footer />
    </div>
  );
};

export default MagazinePage;