import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  AlertCircle, 
  Loader2, 
  Wheat, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Share2, 
  Heart 
} from 'lucide-react';

const FarmPost = () => {
  const [farm, setFarm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';
  
  // Format price in UGX
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-UG', { 
      style: 'currency', 
      currency: 'UGX', 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    }).format(price);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-UG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle sharing
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: farm.title,
          text: `Check out this farm for sale: ${farm.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          alert('Link copied to clipboard');
        })
        .catch(err => {
          console.error('Could not copy text: ', err);
        });
    }
  };

  useEffect(() => {
    const fetchFarm = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/farms/${id}`);
        setFarm(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching farm post:', err);
        setError('Failed to fetch farm information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchFarm();
  }, [id, API_BASE_URL]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-green-500" />
          <p className="text-lg text-gray-600">Loading farm information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center p-4 bg-red-50 rounded-lg">
          <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  // No farm found state
  if (!farm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Farm Post Not Found</h2>
          <p className="mt-2 text-gray-500">The requested farm information could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      {/* Header with title and actions */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Wheat className="w-8 h-8 text-green-600 mr-3" />
          <h1 className="text-4xl font-bold text-gray-900 leading-tight">
            {farm.title}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleShare}
            className="text-gray-600 hover:text-green-600 transition-colors"
            aria-label="Share farm listing"
          >
            <Share2 className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setLiked(!liked)}
            className={`transition-colors ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
            aria-label="Like farm listing"
          >
            <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Farm Image */}
      {farm.imageUrl && (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-lg">
          <img
            src={`${API_BASE_URL}${farm.imageUrl}`}
            alt={farm.title}
            className="w-full h-[500px] object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}
      
      {/* Farm Details */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <DollarSign className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm text-gray-600">Price</h3>
            <p className="text-xl font-bold text-green-800">{formatPrice(farm.price)}</p>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <MapPin className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm text-gray-600">Location</h3>
            <p className="text-xl font-bold text-green-800">{farm.location || 'Not specified'}</p>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg flex items-center">
          <Calendar className="w-6 h-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm text-gray-600">Listed On</h3>
            <p className="text-xl font-bold text-green-800">
              {farm.createdAt ? formatDate(farm.createdAt) : 'Not available'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Farm Description */}
      <div 
        className="prose prose-lg max-w-none mb-8"
        dangerouslySetInnerHTML={{ __html: farm.content }} 
      />
      
      {/* Crop Information */}
      {farm.cropInfo && (
        <div className="mt-8 bg-green-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-green-900 mb-4">Crop Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(farm.cropInfo).map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-md shadow">
                <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                <p className="text-lg font-medium text-green-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Contact and Inquiry */}
      <div className="mt-8 text-center">
        <Link 
          to="/contact" 
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
        >
          Inquire About This Farm
        </Link>
      </div>
    </article>
  );
};

export default FarmPost;