import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, Loader2 } from 'lucide-react';

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
      } catch (err) {
        console.error('Error fetching blog:', err);
        setError('Failed to fetch blog. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchBlog();
  }, [id, API_BASE_URL]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-lg text-gray-600">Loading blog post...</p>
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

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Blog Not Found</h2>
          <p className="mt-2 text-gray-500">The requested blog post could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8 md:px-8">
      <h1 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
        {blog.title}
      </h1>
      
      {blog.imageUrl && (
        <div className="relative w-full mb-8 rounded-lg overflow-hidden shadow-lg">
          <img
            src={`${API_BASE_URL}${blog.imageUrl}`}
            alt={blog.title}
            className="w-full h-auto object-cover"
            crossOrigin="anonymous"
          />
        </div>
      )}
      
      <div 
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: blog.content }} 
      />
    </article>
  );
};

export default BlogPost;