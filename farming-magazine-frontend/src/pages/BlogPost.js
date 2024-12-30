import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import '../css/BlogPost.css';

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

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!blog) return <div className="not-found">Blog not found</div>;

  return (
    <article className="blog-post">
      <h1 className="blog-title">{blog.title}</h1>
      {blog.imageUrl && (
        <div className="blog-image-container">
          <img
            src={`${API_BASE_URL}${blog.imageUrl}`}
            alt={blog.title}
            className="blog-image"
            crossOrigin="anonymous"
          />
        </div>
      )}
      <div className="blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />
    </article>
  );
};

export default BlogPost;