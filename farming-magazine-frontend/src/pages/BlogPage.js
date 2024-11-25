import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';

const BlogPage = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.GET_BLOGS);
        setBlogs(response.data);
      } catch (error) {
        console.error('Error fetching blogs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  if (loading) {
    return <p>Loading blogs...</p>;
  }

  return (
    <div>
      <h2>Blogs</h2>
      {blogs.length === 0 ? (
        <p>No blogs available.</p>
      ) : (
        blogs.map((blog) => (
          <div key={blog._id} style={{ marginBottom: '20px' }}>
            <h3>{blog.title}</h3>
            {blog.imageUrl && <img src={blog.imageUrl} alt={blog.title} style={{ width: '100%', maxWidth: '500px' }} />}
            <div dangerouslySetInnerHTML={{ __html: blog.content }}></div>
          </div>
        ))
      )}
    </div>
  );
};

export default BlogPage;
