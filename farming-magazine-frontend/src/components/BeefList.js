import React from 'react';
import { Link } from 'react-router-dom';
import '../css/BeefList.css';

const BeefList = ({ beefs, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
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
    <div className="beef-list">
      {beefs.length > 0 ? (
        beefs.map((beef) => (
          <article key={beef._id} className="beef-item">
            {beef.imageUrl && (
              <div className="beef-image-container">
                <img
                  src={`${apiBaseUrl}${beef.imageUrl}`}
                  alt={beef.title}
                  className="beef-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="beef-content">
              <Link to={`/beef/${beef._id}`} className="beef-link">
                <h2 className="beef-title">{beef.title}</h2>
              </Link>
              <p className="beef-date">{formatDate(beef.createdAt)}</p>
              <p className="beef-excerpt">{truncateContent(beef.content)}</p>
              <Link to={`/beef/${beef._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(beef._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(beef._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-beefs">No beef information available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default BeefList;