import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Milk } from 'lucide-react';

const DairyPost = () => {
  const [dairy, setDairy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchDairy = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/dairy/${id}`);
        setDairy(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching dairy post:', err);
        setError('Failed to fetch dairy information. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDairy();
  }, [id, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600">Loading dairy information...</p>
        </div>
      </div>
    );
  }

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

  if (!dairy) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Dairy Post Not Found</h2>
          <p className="mt-2 text-gray-500">The requested dairy information could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <div className="flex items-center mb-6">
        <Milk className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          {dairy.title}
        </h1>
      </div>
      
      {dairy.imageUrl && (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-lg">
          <img
            src={`${API_BASE_URL}${dairy.imageUrl}`}
            alt={dairy.title}
            className="w-full h-auto object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}
      
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: dairy.content }} 
      />
      
      {dairy.productionStats && (
        <div className="mt-8 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">Production Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dairy.productionStats).map(([key, value]) => (
              <div key={key} className="bg-white p-4 rounded-md shadow">
                <p className="text-sm text-gray-600">{key}</p>
                <p className="text-lg font-medium text-blue-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};

export default DairyPost;