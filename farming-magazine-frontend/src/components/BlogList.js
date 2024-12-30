import React from 'react';
import { Link } from 'react-router-dom';
import '../css/BlogList.css';

const BlogList = ({ blogs, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg'; // Replace with a default placeholder image
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    
    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    
    // Extract text content
    let text = tempElement.textContent || tempElement.innerText;
    
    // Truncate the text
    text = text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    
    return text;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="blog-list">
      {blogs.length > 0 ? (
        blogs.map((blog) => (
          <article key={blog._id} className="blog-item">
            {blog.imageUrl && (
              <div className="blog-image-container">
                <img
                  src={`${apiBaseUrl}${blog.imageUrl}`}
                  alt={blog.title}
                  className="blog-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="blog-content">
              <Link to={`/blog/${blog._id}`} className="blog-link">
                <h2 className="blog-title">{blog.title}</h2>
              </Link>
              <p className="blog-date">{formatDate(blog.createdAt)}</p>
              <p className="blog-excerpt">{truncateContent(blog.content)}</p>
              <Link to={`/blog/${blog._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(blog._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(blog._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-blogs">No blogs available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default BlogList;