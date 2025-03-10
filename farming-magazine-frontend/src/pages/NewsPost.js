import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Calendar, RefreshCw } from 'lucide-react';

const NewsPost = () => {
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/news/${id}`);
        setNews(response.data.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchNews();
  }, [id, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600">Loading news article...</p>
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

  if (!news) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">News Article Not Found</h2>
          <p className="mt-2 text-gray-500">The requested news article could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      {/* Article Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
          {news.title}
        </h1>
        
        {/* Metadata */}
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-6 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Published: {new Date(news.createdAt).toLocaleDateString()}</span>
          </div>
          {news.updatedAt && (
            <div className="flex items-center">
              <RefreshCw className="w-4 h-4 mr-2" />
              <span>Updated: {new Date(news.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </header>
      
      {/* Featured Image */}
      {news.imageUrl && (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-lg">
          <img
            src={`${API_BASE_URL}${news.imageUrl}`}
            alt={news.title}
            className="w-full h-auto object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}
      
      {/* Article Content */}
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: news.content }} 
      />
      
      {/* Additional Metadata */}
      <footer className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {news.category && (
            <div className="px-3 py-1 bg-gray-100 rounded-full">
              {news.category}
            </div>
          )}
          {news.author && (
            <div className="flex items-center">
              <span className="font-medium">By {news.author}</span>
            </div>
          )}
        </div>
      </footer>
    </article>
  );
};

export default NewsPost;