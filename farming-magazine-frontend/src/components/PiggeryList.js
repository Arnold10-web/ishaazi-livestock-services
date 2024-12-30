import React from 'react';
import { Link } from 'react-router-dom';
import '../css/PiggeryList.css';

const PiggeryList = ({ piggeries, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
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
    <div className="piggery-list">
      {piggeries.length > 0 ? (
        piggeries.map((piggery) => (
          <article key={piggery._id} className="piggery-item">
            {piggery.imageUrl && (
              <div className="piggery-image-container">
                <img
                  src={`${apiBaseUrl}${piggery.imageUrl}`}
                  alt={piggery.title}
                  className="piggery-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="piggery-content">
              <Link to={`/piggery/${piggery._id}`} className="piggery-link">
                <h2 className="piggery-title">{piggery.title}</h2>
              </Link>
              <p className="piggery-date">{formatDate(piggery.createdAt)}</p>
              <p className="piggery-excerpt">{truncateContent(piggery.content)}</p>
              <Link to={`/piggery/${piggery._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(piggery._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(piggery._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-piggeries">No piggery information available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default PiggeryList;