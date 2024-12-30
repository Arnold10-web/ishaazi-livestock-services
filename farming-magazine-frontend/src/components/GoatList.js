import React from 'react';
import { Link } from 'react-router-dom';
import '../css/GoatList.css';

const GoatList = ({ goats, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg'; // Replace with a default placeholder image
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    
    let text = tempElement.textContent || tempElement.innerText;
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
    <div className="goat-list">
      {goats.length > 0 ? (
        goats.map((goat) => (
          <article key={goat._id} className="goat-item">
            {goat.imageUrl && (
              <div className="goat-image-container">
                <img
                  src={`${apiBaseUrl}${goat.imageUrl}`}
                  alt={goat.title}
                  className="goat-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="goat-content">
              <Link to={`/goat/${goat._id}`} className="goat-link">
                <h2 className="goat-title">{goat.title}</h2>
              </Link>
              <p className="goat-date">{formatDate(goat.createdAt)}</p>
              <p className="goat-excerpt">{truncateContent(goat.content)}</p>
              <Link to={`/goat/${goat._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(goat._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(goat._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-goats">No goat farming content available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default GoatList;