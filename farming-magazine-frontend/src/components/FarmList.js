import React from 'react';
import { Link } from 'react-router-dom';
import '../css/FarmList.css';

const FarmList = ({ farms, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-farm-image.jpg'; // Replace with a default placeholder image
  };

  const truncateDescription = (description, maxLength = 150) => {
    if (!description) return '';

    // Create a temporary element to parse the HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = description;

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
    <div className="farm-list">
      {farms.length > 0 ? (
        farms.map((farm) => (
          <article key={farm._id} className="farm-item">
            {farm.imageUrl && (
              <div className="farm-image-container">
                <img
                  src={`${apiBaseUrl}${farm.imageUrl}`}
                  alt={farm.name}
                  className="farm-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="farm-content">
              <Link to={`/farm/${farm._id}`} className="farm-link">
                <h2 className="farm-name">{farm.name}</h2>
              </Link>
              <p className="farm-date">{formatDate(farm.createdAt)}</p>
              <p className="farm-price">Price: ${farm.price}</p>
              <p className="farm-location">Location: {farm.location}</p>
              <p className="farm-description">
                {truncateDescription(farm.description)}
              </p>
              <Link to={`/farm/${farm._id}`} className="view-details">
                View Details
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(farm._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(farm._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-farms">No farms available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default FarmList;