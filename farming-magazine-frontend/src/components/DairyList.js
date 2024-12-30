import React from 'react';
import { Link } from 'react-router-dom';
import '../css/DairyList.css';

const DairyList = ({ dairies, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
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
    <div className="dairy-list">
      {dairies.length > 0 ? (
        dairies.map((dairy) => (
          <article key={dairy._id} className="dairy-item">
            {dairy.imageUrl && (
              <div className="dairy-image-container">
                <img
                  src={`${apiBaseUrl}${dairy.imageUrl}`}
                  alt={dairy.title}
                  className="dairy-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="dairy-content">
              <Link to={`/dairy/${dairy._id}`} className="dairy-link">
                <h2 className="dairy-title">{dairy.title}</h2>
              </Link>
              <p className="dairy-date">{formatDate(dairy.createdAt)}</p>
              <p className="dairy-excerpt">{truncateContent(dairy.content)}</p>
              <Link to={`/dairy/${dairy._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(dairy._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(dairy._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-dairies">No dairy information available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default DairyList;