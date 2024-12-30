import React from 'react';
import { Link } from 'react-router-dom';
import '../css/MagazineList.css';

const MagazineList = ({ 
  magazines, 
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit,
  purchasedMagazines,
  onPurchase,
  onDownload,
  processingPurchase
}) => {
  const handleImageError = (e) => {
    console.error('Image failed to load:', e.target.src);
    e.target.src = '/placeholder-image.jpg';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return `shs${price.toLocaleString()}`;
  };

  const canDownload = (magazine) => {
    return magazine.currentPrice === 0 || 
           purchasedMagazines.includes(magazine._id);
  };

  const calculateDiscount = (currentPrice, basePrice) => {
    return Math.round((1 - currentPrice / basePrice) * 100);
  };

  return (
    <div className="magazine-list">
      {magazines.length > 0 ? (
        magazines.map((magazine) => (
          <article key={magazine._id} className="magazine-item">
            <div className="magazine-image-container">
              <img
                src={`${apiBaseUrl}${magazine.imageUrl}`}
                alt={magazine.title}
                className="magazine-image"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
              {magazine.pricingStrategy?.type === 'time-based' && 
               magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                <div className="discount-badge">
                  {calculateDiscount(magazine.currentPrice, magazine.pricingStrategy.basePrice)}% OFF
                </div>
              )}
            </div>
            
            <div className="magazine-content">
              <Link to={`/magazine/${magazine._id}`} className="magazine-link">
                <h2 className="magazine-title">{magazine.title}</h2>
              </Link>
              <p className="magazine-issue">Issue: {magazine.issue}</p>
              
              <div className="magazine-pricing">
                {magazine.currentPrice > 0 ? (
                  <>
                    <p className="magazine-price">
                      Price: {formatPrice(magazine.currentPrice)}
                      {magazine.pricingStrategy?.type === 'time-based' && 
                       magazine.currentPrice < magazine.pricingStrategy.basePrice && (
                        <span className="original-price">
                          {formatPrice(magazine.pricingStrategy.basePrice)}
                        </span>
                      )}
                    </p>
                  </>
                ) : (
                  <p className="magazine-price free">FREE</p>
                )}
              </div>

              <p className="magazine-date">Published: {formatDate(magazine.createdAt)}</p>

              <div className="magazine-actions">
                {!canDownload(magazine) ? (
                  <button
                    onClick={() => onPurchase(magazine._id, magazine.currentPrice)}
                    className={`purchase-btn ${processingPurchase ? 'processing' : ''}`}
                    disabled={processingPurchase}
                  >
                    {processingPurchase ? 'Processing...' : `Buy Now ${formatPrice(magazine.currentPrice)}`}
                  </button>
                ) : (
                  <button
                    onClick={() => onDownload(magazine._id)}
                    className="download-btn"
                  >
                    Download Magazine
                  </button>
                )}
              </div>

              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(magazine._id)} className="edit-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(magazine._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-magazines">No magazines available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default MagazineList;