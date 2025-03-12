import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Beef, ArrowLeft, Share2, Tag, Scale, Award, DollarSign } from 'lucide-react';

const BeefPost = () => {
  const [beef, setBeef] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';
  
  useEffect(() => {
    const fetchBeef = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/beefs/${id}`);
        setBeef(response.data.data);
        setLoading(false);
        // Update page title with beef title
        document.title = `${response.data.data.title} | Ishaazi Livestock`;
      } catch (err) {
        console.error('Error fetching beef post:', err);
        setError('Failed to fetch beef information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBeef();
    
    // Scroll to top when beef post changes
    window.scrollTo(0, 0);
  }, [id, API_BASE_URL]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-xl bg-white shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-red-600" />
          <p className="text-lg font-medium text-gray-600">Loading beef information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-6 bg-white rounded-xl shadow-sm">
          <div className="flex items-center p-4 bg-red-50 rounded-lg border border-red-100">
            <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700 font-medium">{error}</p>
          </div>
          <div className="mt-6 text-center">
            <Link to="/beef" className="inline-flex items-center text-red-600 hover:text-red-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all beef products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!beef) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Product Not Found</h2>
          <p className="mt-3 text-gray-500">We couldn't find the beef product you're looking for.</p>
          <div className="mt-6">
            <Link to="/beef" className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse all beef products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-8">
          <Link to="/beef" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all beef products
          </Link>
        </div>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
          {/* Product Header */}
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 p-3 rounded-full">
                <Beef className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{beef.title}</h1>
                <p className="text-gray-500">
                  Posted on {formatDate(beef.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          {/* Product Content */}
          <div className="p-6 md:p-8">
            <div className="space-y-8">
              {/* Image Section */}
              {beef.image && (
                <div className="relative">
                  <img
                    src={beef.image}
                    alt={beef.title}
                    className="w-full h-80 object-cover rounded-lg shadow-md"
                  />
                  {beef.cutType && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-sm">
                      {beef.cutType}
                    </div>
                  )}
                </div>
              )}
              
              {/* Description */}
              <div className="prose max-w-none">
                <p className="text-gray-700 text-lg leading-relaxed">{beef.description}</p>
              </div>
              
              {/* Tags */}
              {beef.tags && beef.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  {beef.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm border border-red-100 hover:bg-red-100 transition-colors cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Details Section */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <span className="mr-2">Product Details</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cut Type */}
                  {beef.cutType && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-start">
                      <div className="bg-red-50 p-2 rounded-full mr-4">
                        <Beef className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Cut Type</p>
                        <p className="font-semibold text-gray-900">{beef.cutType}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Grade */}
                  {beef.grade && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-start">
                      <div className="bg-red-50 p-2 rounded-full mr-4">
                        <Award className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Grade</p>
                        <p className="font-semibold text-gray-900">{beef.grade}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Weight */}
                  {beef.weight && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-start">
                      <div className="bg-red-50 p-2 rounded-full mr-4">
                        <Scale className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Weight</p>
                        <p className="font-semibold text-gray-900">{beef.weight}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Price */}
                  {beef.pricePerPound && (
                    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex items-start">
                      <div className="bg-red-50 p-2 rounded-full mr-4">
                        <DollarSign className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price per lb</p>
                        <p className="font-semibold text-gray-900">${beef.pricePerPound}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Share section */}
              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                <p className="text-gray-500 text-sm">
                  Share this product with others
                </p>
                <button className="inline-flex items-center px-4 py-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeefPost;