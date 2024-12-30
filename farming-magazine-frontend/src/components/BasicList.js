import React, { useState } from 'react';
import '../css/BasicList.css';

const BasicList = ({ 
  basics = [], 
  apiBaseUrl, 
  isAdmin, 
  onDelete, 
  onEdit, 
  onDeleteComment, 
  onAddComment 
}) => {
  const [newComment, setNewComment] = useState({});

  // Handle media load errors
  const handleMediaError = (e) => {
    console.error('Media failed to load:', e.target.src);
    e.target.src = '/placeholder-media.jpg'; // Fallback media placeholder
  };

  // Truncate long descriptions
  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    const text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // Format dates
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Update the comment state for a specific Basic item
  const handleCommentChange = (basicId, content) => {
    setNewComment((prev) => ({ ...prev, [basicId]: content }));
  };

  // Submit a new comment for a specific Basic item
  const handleCommentSubmit = (basicId) => {
    const content = newComment[basicId]?.trim();
    if (content) {
      onAddComment(basicId, content); // Call the parent-provided function
      setNewComment((prev) => ({ ...prev, [basicId]: '' })); // Clear the input
    }
  };

  return (
    <div className="basic-list">
      {basics.length > 0 ? (
        basics.map((basic) => (
          <article key={basic._id} className="basic-item">
            {/* Thumbnail or Image */}
            {basic.imageUrl && (
              <div className="basic-image-container">
                <img
                  src={`${apiBaseUrl}${basic.imageUrl}`}
                  alt={basic.title}
                  className="basic-image"
                  onError={handleMediaError}
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Basic Details */}
            <div className="basic-content">
              <h2 className="basic-title">{basic.title}</h2>
              <p className="basic-date">{formatDate(basic.createdAt)}</p>
              <p className="basic-description">{truncateContent(basic.description)}</p>

              {/* Media (Video or Audio) */}
              <div className="basic-media-container">
                {basic.fileType === 'video' ? (
                  <video
                    controls
                    src={`${apiBaseUrl}${basic.fileUrl}`}
                    onError={handleMediaError}
                    className="basic-video"
                  />
                ) : (
                  <audio
                    controls
                    src={`${apiBaseUrl}${basic.fileUrl}`}
                    onError={handleMediaError}
                    className="basic-audio"
                  />
                )}
              </div>

              {/* Comments Section */}
              <h4>Comments:</h4>
              <ul className="basic-comments">
                {basic.comments?.length > 0 ? (
                  basic.comments.map((comment) => (
                    <li key={comment._id} className="basic-comment">
                      <span>{comment.content}</span>
                      {isAdmin && (
                        <button
                          onClick={() => onDeleteComment(basic._id, comment._id)}
                          className="delete-comment-btn"
                        >
                          Delete
                        </button>
                      )}
                    </li>
                  ))
                ) : (
                  <li>No comments yet.</li>
                )}
              </ul>

              {/* Add Comment Section */}
              <div className="add-comment">
                <textarea
                  value={newComment[basic._id] || ''}
                  onChange={(e) => handleCommentChange(basic._id, e.target.value)}
                  placeholder="Write a comment..."
                />
                <button
                  onClick={() => handleCommentSubmit(basic._id)}
                  className="submit-comment-btn"
                  disabled={!newComment[basic._id]?.trim()} // Disable if input is empty
                >
                  Post Comment
                </button>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="admin-actions">
                  <button onClick={() => onEdit(basic._id)} className="update-btn">
                    Edit
                  </button>
                  <button onClick={() => onDelete(basic._id)} className="delete-btn">
                    Delete Basic
                  </button>
                </div>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="no-basics">No basics available at the moment. Check back soon!</p>
      )}
    </div>
  );
};

export default BasicList;
