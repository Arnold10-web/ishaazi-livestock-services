import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, ArrowLeft, Share2, Calendar, User, MapPin, BarChart2, Milk } from 'lucide-react';

const DairyPost = () => {
  const [dairy, setDairy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';
  
  useEffect(() => {
    const fetchDairy = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/dairies/${id}`);
        setDairy(response.data.data);
        setLoading(false);
        // Update page title with dairy name
        document.title = `${response.data.data.title} | Ishaazi Livestock Services`;
      } catch (err) {
        console.error('Error fetching dairy post:', err);
        setError('Failed to fetch dairy information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDairy();
    
    // Scroll to top when dairy post changes
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
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-600">Loading dairy information...</p>
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
            <Link to="/dairies" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all dairies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!dairy) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Dairy Not Found</h2>
          <p className="mt-3 text-gray-500">We couldn't find the dairy information you're looking for.</p>
          <div className="mt-6">
            <Link to="/dairies" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse all dairies
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
          <Link to="/dairies" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all dairies
          </Link>
        </div>
        
        {/* Dairy header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-blue-600 mb-3">
            {dairy.type && (
              <span className="bg-blue-50 px-3 py-1 rounded-full font-medium">
                {dairy.type}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {dairy.title}
          </h1>
          
          {dairy.description && (
            <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed">
              {dairy.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-6">
            {dairy.owner && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span>{dairy.owner}</span>
              </div>
            )}
            
            {dairy.establishedDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Established: {formatDate(dairy.establishedDate)}</span>
              </div>
            )}
            
            {dairy.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{dairy.location}</span>
              </div>
            )}
          </div>
        </header>
        
        {/* Featured image with enhanced presentation */}
        {dairy.imageUrl && (
          <div className="relative w-full mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={`${API_BASE_URL}${dairy.imageUrl}`}
              alt={dairy.title}
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
            />
            {dairy.imageCaption && (
              <figcaption className="text-sm text-gray-500 italic mt-2 text-center">
                {dairy.imageCaption}
              </figcaption>
            )}
          </div>
        )}
        
        {/* Dairy content with enhanced typography */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-lg prose-img:shadow-md">
          {dairy.content && (
            <div dangerouslySetInnerHTML={{ __html: dairy.content }} />
          )}
          
          {/* Production Statistics Card */}
          {dairy.productionStats && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart2 className="w-6 h-6 mr-2 text-blue-600" />
                Production Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dairy.productionStats).map(([key, value]) => (
                  <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-gray-800 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Herd Information */}
          {dairy.herdInfo && (
            <div className="mt-8 p-6 bg-blue-50 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Milk className="w-6 h-6 mr-2 text-blue-600" />
                Herd Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(dairy.herdInfo).map(([key, value]) => (
                  <div key={key} className="bg-white p-4 rounded-lg shadow-sm">
                    <h3 className="font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-gray-800 font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Social sharing */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {dairy.tags && dairy.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {dairy.tags.map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-gray-100 rounded-full text-gray-600 text-xs">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DairyPost;