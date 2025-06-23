import React, { useState } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';
import { getAuthHeader } from '../utils/auth';

const NewsletterList = ({ newsletters, apiBaseUrl, isAdmin, onDelete, onEdit, onSend, darkMode }) => {
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [expandedNewsletters, setExpandedNewsletters] = useState(new Set());

  // Add styles for newsletter content rendering
  const newsletterContentStyles = `
    .newsletter-content h1, .newsletter-content h2, .newsletter-content h3 {
      font-weight: bold;
      margin: 0.5em 0;
    }
    .newsletter-content h1 { font-size: 1.25em; }
    .newsletter-content h2 { font-size: 1.125em; }
    .newsletter-content h3 { font-size: 1em; }
    .newsletter-content p {
      margin: 0.5em 0;
      line-height: 1.5;
    }
    .newsletter-content ul, .newsletter-content ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }
    .newsletter-content li {
      margin: 0.25em 0;
    }
    .newsletter-content strong, .newsletter-content b {
      font-weight: bold;
    }
    .newsletter-content em, .newsletter-content i {
      font-style: italic;
    }
    .newsletter-content a {
      color: #3B82F6;
      text-decoration: underline;
    }
    .newsletter-content blockquote {
      border-left: 4px solid #E5E7EB;
      padding-left: 1em;
      margin: 1em 0;
      font-style: italic;
    }
  `;

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

  const toggleExpanded = (newsletterId) => {
    setExpandedNewsletters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(newsletterId)) {
        newSet.delete(newsletterId);
      } else {
        newSet.add(newsletterId);
      }
      return newSet;
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = content;
    let text = tempElement.textContent || tempElement.innerText;
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  // For admin view, show more content with HTML formatting
  const renderNewsletterContent = (content, isAdmin = false, isExpanded = false) => {
    if (!content) return '';
    
    if (isAdmin) {
      if (isExpanded) {
        // Show full content when expanded
        return content;
      }
      
      // For admin, show more content with preserved HTML formatting
      const maxLength = 800; // Much longer for admin
      
      // Create element to check text length
      const tempElement = document.createElement('div');
      tempElement.innerHTML = content;
      const textLength = (tempElement.textContent || tempElement.innerText).length;
      
      // If content is very long, truncate the HTML smartly
      if (textLength > maxLength) {
        const textContent = tempElement.textContent || tempElement.innerText;
        const truncatedText = textContent.substring(0, maxLength) + '...';
        return truncatedText;
      }
      
      // For reasonable length content, render the HTML safely
      return content;
    } else {
      // For non-admin (public view), use the existing truncate method
      return truncateContent(content, 150);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'draft':
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent':
        return 'fas fa-check-circle';
      case 'scheduled':
        return 'fas fa-clock';
      case 'draft':
      default:
        return 'fas fa-file-alt';
    }
  };

  const handleSendNewsletter = async (newsletterId) => {
    const newsletter = newsletters.find(n => n._id === newsletterId);
    if (!newsletter) return;

    const confirmSend = window.confirm(
      `Are you sure you want to send "${newsletter.title}"? This action cannot be undone.`
    );

    if (!confirmSend) return;

    setLoading(true);
    try {
      const response = await axios.post(
        API_ENDPOINTS.SEND_NEWSLETTER(newsletterId), 
        {}, 
        { headers: getAuthHeader() }
      );
      
      showNotification(`Newsletter sent successfully! ${response.data.data?.sent || 0} emails sent.`);
      
      // Refresh the newsletter list
      window.location.reload();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to send newsletter', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNewsletter = async (newsletterId) => {
    const newsletter = newsletters.find(n => n._id === newsletterId);
    if (!newsletter) return;

    if (newsletter.status === 'sent') {
      showNotification('Cannot delete newsletters that have been sent', 'error');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${newsletter.title}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(API_ENDPOINTS.DELETE_NEWSLETTER(newsletterId), {
        headers: getAuthHeader()
      });
      
      showNotification('Newsletter deleted successfully');
      if (onDelete) onDelete(newsletterId);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to delete newsletter', 'error');
    }
  };

  return (
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-sm`}>
      {/* Inject CSS for newsletter content styling */}
      <style dangerouslySetInnerHTML={{ __html: newsletterContentStyles }} />
      
      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 border-green-500 text-green-700' 
            : 'bg-red-100 border-red-500 text-red-700'
        } border-l-4`}>
          <div className="flex items-center">
            <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-triangle'} mr-2`}></i>
            {notification.message}
          </div>
        </div>
      )}

      {newsletters.length > 0 ? (
        <div className="space-y-4 p-6">
          {newsletters.map((newsletter) => (
            <article 
              key={newsletter._id} 
              className={`${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                        {newsletter.title}
                      </h2>
                      {newsletter.subject && newsletter.subject !== newsletter.title && (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                          <i className="fas fa-envelope mr-1"></i>
                          Subject: "{newsletter.subject}"
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(newsletter.status)}`}>
                        <i className={`${getStatusIcon(newsletter.status)} mr-1`}></i>
                        {newsletter.status?.charAt(0).toUpperCase() + newsletter.status?.slice(1) || 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Content Preview */}
                  <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-4 leading-relaxed`}>
                    {isAdmin ? (
                      <>
                        <div 
                          className="newsletter-content prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: renderNewsletterContent(newsletter.body, isAdmin, expandedNewsletters.has(newsletter._id)) 
                          }}
                          style={{ 
                            maxHeight: expandedNewsletters.has(newsletter._id) ? 'none' : '200px', 
                            overflow: expandedNewsletters.has(newsletter._id) ? 'visible' : 'hidden',
                            lineHeight: '1.6'
                          }}
                        />
                        {/* Check if content is long enough to show expand button */}
                        {(() => {
                          const tempElement = document.createElement('div');
                          tempElement.innerHTML = newsletter.body || '';
                          const textLength = (tempElement.textContent || tempElement.innerText).length;
                          return textLength > 800;
                        })() && (
                          <button
                            onClick={() => toggleExpanded(newsletter._id)}
                            className={`mt-2 text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium flex items-center`}
                          >
                            <i className={`fas fa-${expandedNewsletters.has(newsletter._id) ? 'chevron-up' : 'chevron-down'} mr-1`}></i>
                            {expandedNewsletters.has(newsletter._id) ? 'Show Less' : 'Read Full Content'}
                          </button>
                        )}
                      </>
                    ) : (
                      <p>{renderNewsletterContent(newsletter.body, isAdmin)}</p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className={`flex flex-wrap items-center gap-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} mb-4`}>
                    <div className="flex items-center">
                      <i className="fas fa-calendar mr-1"></i>
                      Created: {formatDate(newsletter.createdAt)}
                    </div>
                    {newsletter.sentAt && (
                      <div className="flex items-center">
                        <i className="fas fa-paper-plane mr-1"></i>
                        Sent: {formatDate(newsletter.sentAt)}
                      </div>
                    )}
                    {newsletter.sentTo > 0 && (
                      <div className="flex items-center">
                        <i className="fas fa-users mr-1"></i>
                        Recipients: {newsletter.sentTo}
                      </div>
                    )}
                    {newsletter.targetSubscriptionTypes && newsletter.targetSubscriptionTypes.length > 0 && (
                      <div className="flex items-center">
                        <i className="fas fa-bullseye mr-1"></i>
                        Target: {newsletter.targetSubscriptionTypes.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Analytics (if sent) */}
                  {newsletter.status === 'sent' && (
                    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 p-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg mb-4`}>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {newsletter.sentTo || 0}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sent</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          {newsletter.openCount || 0}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Opens</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                          {newsletter.clickCount || 0}
                        </div>
                        <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Clicks</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Actions */}
              {isAdmin && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => onEdit(newsletter._id)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-edit mr-1"></i>
                    Edit
                  </button>
                  
                  {newsletter.status !== 'sent' && (
                    <button
                      onClick={() => handleSendNewsletter(newsletter._id)}
                      disabled={loading}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <i className="fas fa-paper-plane mr-1"></i>
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleDeleteNewsletter(newsletter._id)}
                    disabled={loading || newsletter.status === 'sent'}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Delete
                  </button>
                  
                  {newsletter.status === 'sent' && (
                    <button
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors"
                    >
                      <i className="fas fa-chart-line mr-1"></i>
                      View Analytics
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className={`p-12 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className="flex flex-col items-center">
            <i className="fas fa-newspaper text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-xl font-medium mb-2">No newsletters yet</h3>
            <p className="text-sm max-w-md">
              Start creating engaging newsletters to keep your subscribers informed about farming tips, livestock updates, and industry news.
            </p>
            {isAdmin && (
              <button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                <i className="fas fa-plus mr-2"></i>
                Create Your First Newsletter
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsletterList;
