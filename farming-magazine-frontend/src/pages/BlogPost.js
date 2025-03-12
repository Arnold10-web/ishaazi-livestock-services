import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2, Calendar, User, Clock, ArrowLeft, Share2 } from 'lucide-react';

const BlogPost = () => {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/content/blogs/${id}`);
        setBlog(response.data.data);
        setLoading(false);
        // Update page title with blog title
        document.title = `${response.data.data.title} | Your Blog Name`;
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to fetch blog. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBlog();
    
    // Scroll to top when blog post changes
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
          <p className="text-lg font-medium text-gray-600">Loading your article...</p>
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
            <Link to="/blogs" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to all articles
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-sm text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Article Not Found</h2>
          <p className="mt-3 text-gray-500">We couldn't find the article you're looking for.</p>
          <div className="mt-6">
            <Link to="/blogs" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse all articles
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
          <Link to="/blogs" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all articles
          </Link>
        </div>
        
        {/* Article header */}
        <header className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-blue-600 mb-3">
            {blog.category && (
              <span className="bg-blue-50 px-3 py-1 rounded-full font-medium">
                {blog.category}
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          
          {blog.subtitle && (
            <p className="text-xl md:text-2xl text-gray-600 mb-6 leading-relaxed">
              {blog.subtitle}
            </p>
          )}
          
          <div className="flex flex-wrap items-center text-sm text-gray-500 space-x-4 mb-6">
            {blog.author && (
              <div className="flex items-center">
                <User className="w-4 h-4 mr-1" />
                <span>{blog.author}</span>
              </div>
            )}
            
            {blog.publishedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>{formatDate(blog.publishedAt)}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              <span>{estimateReadTime(blog.content)}</span>
            </div>
          </div>
        </header>
        
        {/* Featured image with enhanced presentation */}
        {blog.imageUrl && (
          <div className="relative w-full mb-10 rounded-xl overflow-hidden shadow-lg">
            <img
              src={`${API_BASE_URL}${blog.imageUrl}`}
              alt={blog.title}
              className="w-full h-auto object-cover"
              crossOrigin="anonymous"
            />
            {blog.imageCaption && (
              <figcaption className="text-sm text-gray-500 italic mt-2 text-center">
                {blog.imageCaption}
              </figcaption>
            )}
          </div>
        )}
        
        {/* Article content with enhanced typography */}
        <div 
          className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-img:rounded-lg prose-img:shadow-md"
          dangerouslySetInnerHTML={{ __html: blog.content }} 
        />
        
        {/* Social sharing */}
        <div className="mt-12 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {blog.tags.map((tag, index) => (
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

export default BlogPost;