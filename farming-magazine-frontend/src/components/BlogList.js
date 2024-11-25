import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth'; // Helper for Authorization header

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBlogs = async (page) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.GET_BLOGS}?page=${page}&limit=5`);
      const { blogs, total } = response.data.data;
      setBlogs(blogs);
      setTotalPages(Math.ceil(total / 5));
    } catch (error) {
      console.error('Error fetching blogs:', error);
      alert('Failed to fetch blogs');
    }
  };

  const deleteBlog = async (id) => {
    if (!getAuthHeader().Authorization) {
      alert('Unauthorized. Please login as admin.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this blog?')) {
      try {
        await axios.delete(API_ENDPOINTS.DELETE_BLOG(id), {
          headers: getAuthHeader(),
        });
        fetchBlogs(page);
        alert('Blog deleted successfully.');
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert(error.response?.data?.message || 'Failed to delete blog');
      }
    }
  };

  useEffect(() => {
    fetchBlogs(page);
  }, [page]);

  return (
    <div>
      <h3>Blog List</h3>
      {blogs.map((blog) => (
        <div key={blog._id}>
          <h4>{blog.title}</h4>
          <p>{blog.content.slice(0, 100)}...</p>
          {blog.imageUrl && <img src={blog.imageUrl} alt={blog.title} width="100" />}
          <button onClick={() => deleteBlog(blog._id)}>Delete</button>
        </div>
      ))}
      <div>
        <button disabled={page === 1} onClick={() => setPage((prev) => prev - 1)}>Previous</button>
        <span> Page {page} of {totalPages} </span>
        <button disabled={page === totalPages} onClick={() => setPage((prev) => prev + 1)}>Next</button>
      </div>
    </div>
  );
};

export default BlogList;
