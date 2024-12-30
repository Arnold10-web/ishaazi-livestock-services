import React from 'react';
import { Link } from 'react-router-dom';
import '../css/NewsList.css'; // Make sure to create this CSS file

const NewsList = ({ news, apiBaseUrl, isAdmin, onDelete, onEdit }) => {
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
    <div className="news-list">
      {news.length > 0 ? (
        news.map((newsItem) => (
          <article key={newsItem._id} className="news-item">
            {newsItem.imageUrl && (
              <div className="news-image-container">
                <img
                  src={`${apiBaseUrl}${newsItem.imageUrl}`}
                  alt={newsItem.title}
                  className="news-image"
                  onError={handleImageError}
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="news-content">
              <Link to={`/news/${newsItem._id}`} className="news-link">
                <h2 className="news-title">{newsItem.title}</h2>
              </Link>
              <p className="news-date">{formatDate(newsItem.createdAt)}</p>
              <p className="news-excerpt">{truncateContent(newsItem.content)}</p>
              <Link to={`/news/${newsItem._id}`} className="read-more">
                Read More
              </Link>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(newsItem._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(newsItem._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-news">No news available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default NewsList;