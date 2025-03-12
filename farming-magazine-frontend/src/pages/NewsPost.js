import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Calendar, RefreshCw, ArrowLeft, User, Share2, Bookmark, Tag } from 'lucide-react';

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
        // Update page title with news title
        document.title = `${response.data.data.title} | Latest News`;
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to fetch news. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchNews();
    
    // Scroll to top when news article changes
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

  const estimateReadTime = (content) => {
    if (!content) return '1 min read';
    // Average reading speed: 200 words per minute
    const wordCount = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    const readTime = Math.ceil(wordCount / 200);
    return `${readTime} min read`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4 p-8 rounded-xl bg-white shadow-sm">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
          <p className="text-lg font-medium text-gray-600">Loading news article...</p>
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
            <Link to="/news" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all news
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Article Not Found</h2>
          <p className="mt-3 text-gray-500">We couldn't find the news article you're looking for.</p>
          <div className="mt-6">
            <Link to="/news" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse all news
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
          <Link to="/news" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all news
          </Link>
        </div>

        <article>
          {/* Article Header */}
          <header className="mb-8">
            {news.category && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                  {news.category}
                </span>
              </div>
            )}
            
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              {news.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                <span>Published: {formatDate(news.createdAt)}</span>
              </div>
              
              {news.updatedAt && news.updatedAt !== news.createdAt && (
                <div className="flex items-center">
                  <RefreshCw className="w-4 h-4 mr-2 text-blue-500" />
                  <span>Updated: {formatDate(news.updatedAt)}</span>
                </div>
              )}
              
              {news.author && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-2 text-blue-500" />
                  <span>By {news.author}</span>
                </div>
              )}
              
              {news.content && (
                <div className="flex items-center">
                  <span>{estimateReadTime(news.content)}</span>
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
                <Share2 className="w-4 h-4 mr-2 text-gray-500" />
                Share
              </button>
              <button className="inline-flex items-center px-3 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors text-sm">
                <Bookmark className="w-4 h-4 mr-2 text-gray-500" />
                Save
              </button>
            </div>
          </header>
          
          {/* Featured Image */}
          {news.imageUrl && (
            <div className="relative w-full mb-10 rounded-xl overflow-hidden shadow-lg">
              <img
                src={`${API_BASE_URL}${news.imageUrl}`}
                alt={news.title}
                className="w-full h-auto max-h-96 object-cover"
                crossOrigin="anonymous"
              />
              {news.imageCaption && (
                <figcaption className="text-sm text-gray-500 italic mt-2 text-center">
                  {news.imageCaption}
                </figcaption>
              )}
            </div>
          )}
          
          {/* Article Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-blue-600 prose-img:rounded-lg prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: news.content }} 
          />
          
          {/* Article Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {news.tags && news.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
              
              {news.source && (
                <div className="text-sm text-gray-500">
                  Source: <a href={news.sourceUrl} className="text-blue-600 hover:underline">{news.source}</a>
                </div>
              )}
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
};

export default NewsPost;