import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, ArrowLeft, Share2, Calendar, User, MapPin, Tag } from 'lucide-react';

const PiggeryPost = () => {
  const [piggery, setPiggery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://ishaazi-livestock-services-production.up.railway.app';
  
  useEffect(() => {
    const fetchPiggery = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/piggeries/${id}`);
        setPiggery(response.data.data);
        setLoading(false);
        // Update page title with piggery name
        document.title = `${response.data.data.title} | Ishaazi Livestock Services`;
      } catch (err) {
        console.error('Error fetching piggery post:', err);
        setError('Failed to fetch piggery information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchPiggery();
    
    // Scroll to top when piggery post changes
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
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          <p className="text-lg font-medium text-gray-600">Loading piggery information...</p>
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
            <Link to="/piggeries" className="inline-flex items-center text-green-600 hover:text-green-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all piggeries
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!piggery) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Piggery Not Found</h2>
          <p className="mt-3 text-gray-500">We couldn't find the piggery information you're looking for.</p>
          <div className="mt-6">
            <Link to="/piggeries" className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse all piggeries
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
          <Link to="/piggeries" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-green-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all piggeries
          </Link>
        </div>
        
        {/* Piggery header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-green-600 mb-3">
            {piggery.type && (
              <span className="bg-green-50 px-3 py-1 rounded-full font-medium">
                {piggery.type}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {piggery.title}
          </h1>
          
          {piggery.description && (
            <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed">
              {piggery.description}
            </p>
          )}
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-6">
            {piggery.owner && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span>{piggery.owner}</span>
              </div>
            )}
            
            {piggery.establishedDate && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Established: {formatDate(piggery.establishedDate)}</span>
              </div>
            )}
            
            {piggery.location && (
              <div className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                <span>{piggery.location}</span>
              </div>
            )}
          </div>
        </header>
        
        {/* Featured image with enhanced presentation */}
        {piggery.imageUrl && (
          <div className="relative w-full mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={`${API_BASE_URL}${piggery.imageUrl}`}
              alt={piggery.title}
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
            />
            {piggery.imageCaption && (
              <figcaption className="text-sm text-gray-500 italic mt-2 text-center">
                {piggery.imageCaption}
              </figcaption>
            )}
          </div>
        )}
        
        {/* Piggery content with enhanced typography */}
        <div className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-green-600 prose-img:rounded-lg prose-img:shadow-md">
          {piggery.content && (
            <div dangerouslySetInnerHTML={{ __html: piggery.content }} />
          )}
          
          {/* Breeding Information Card */}
          {piggery.breedingInfo && (
            <div className="mt-8 p-6 bg-green-50 rounded-xl shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <Tag className="w-6 h-6 mr-2 text-green-600" />
                Breeding Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(piggery.breedingInfo).map(([key, value]) => (
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
              {piggery.tags && piggery.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {piggery.tags.map((tag, index) => (
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

export default PiggeryPost;