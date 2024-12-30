import React from 'react';
import '../css/NewsletterList.css';

const NewsletterList = ({ newsletters, apiBaseUrl, isAdmin, onDelete, onEdit, onSend }) => {
  const truncateContent = (content, maxLength = 150) => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="newsletter-list">
      {newsletters.length > 0 ? (
        newsletters.map((newsletter) => (
          <article key={newsletter._id} className="newsletter-item">
            <div className="newsletter-content">
              <h2 className="newsletter-title">{newsletter.title}</h2>
              <p className="newsletter-date">{formatDate(newsletter.createdAt)}</p>
              <p className="newsletter-excerpt">{truncateContent(newsletter.body)}</p>
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(newsletter)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(newsletter._id)} className="delete-btn">
                    Delete
                  </button>
                  {!newsletter.sentAt && (
                    <button onClick={() => onSend(newsletter._id)} className="send-btn">
                      Send
                    </button>
                  )}
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-newsletters">No newsletters available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default NewsletterList;
