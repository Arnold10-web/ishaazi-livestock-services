import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';

export const useEngagement = (contentType, id, options = {}) => {
  const { trackViewOnMount = false } = options; // Only track view if explicitly requested
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    shares: 0,
    isLiked: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasTrackedView = useRef(false);

  // Early return if no contentType or id to prevent unnecessary processing
  const isEnabled = Boolean(contentType && id);

  // Track a view (manually triggered)
  const trackView = useCallback(async () => {
    if (!isEnabled || hasTrackedView.current) return;
    try {
      await axios.post(API_ENDPOINTS.TRACK_VIEW(contentType, id));
      hasTrackedView.current = true;
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }, [contentType, id, isEnabled]);

  // Fetch current engagement stats
  const fetchStats = useCallback(async () => {
    if (!isEnabled) return;
    try {
      const response = await axios.get(API_ENDPOINTS.GET_ENGAGEMENT_STATS(contentType, id));
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch engagement stats:', err);
      setError('Failed to fetch stats');
    }
  }, [contentType, id, isEnabled]);

  // Only fetch stats on mount, don't auto-track views
  useEffect(() => {
    if (isEnabled) {
      fetchStats();
      
      // Only track view if explicitly requested (e.g., on detail pages)
      if (trackViewOnMount && !hasTrackedView.current) {
        const timeoutId = setTimeout(() => {
          trackView();
        }, 1000); // Delay to ensure it's a real view
        
        return () => clearTimeout(timeoutId);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType, id, isEnabled, trackViewOnMount]); // Intentionally excluding fetchStats and trackView to prevent infinite loops

  // Toggle like
  const toggleLike = async (currentlyLiked = false) => {
    if (!isEnabled) return currentlyLiked;
    
    try {
      setLoading(true);
      const action = currentlyLiked ? 'unlike' : 'like';
      const response = await axios.post(API_ENDPOINTS.TRACK_LIKE(contentType, id), { action });
      
      setStats(prev => ({
        ...prev,
        likes: response.data.data.likes,
        isLiked: !currentlyLiked
      }));
      
      return !currentlyLiked; // Return new liked state
    } catch (err) {
      console.error('Failed to toggle like:', err);
      setError('Failed to update like');
      return currentlyLiked; // Return original state on error
    } finally {
      setLoading(false);
    }
  };

  // Track share
  const trackShare = async () => {
    try {
      const response = await axios.post(API_ENDPOINTS.TRACK_SHARE(contentType, id));
      setStats(prev => ({
        ...prev,
        shares: response.data.data.shares
      }));
    } catch (err) {
      console.error('Failed to track share:', err);
      setError('Failed to track share');
    }
  };

  // Add comment
  const addComment = async (author, email, content) => {
    try {
      setLoading(true);
      const response = await axios.post(API_ENDPOINTS.ADD_COMMENT(contentType, id), {
        author,
        email,
        content
      });
      return response.data;
    } catch (err) {
      console.error('Failed to add comment:', err);
      setError('Failed to add comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete comment (admin only)
  const deleteComment = async (commentId) => {
    try {
      setLoading(true);
      const response = await axios.delete(API_ENDPOINTS.DELETE_COMMENT(contentType, id, commentId));
      return response.data;
    } catch (err) {
      console.error('Failed to delete comment:', err);
      setError('Failed to delete comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Approve comment (admin only)
  const approveComment = async (commentId) => {
    try {
      setLoading(true);
      const response = await axios.patch(API_ENDPOINTS.APPROVE_COMMENT(contentType, id, commentId));
      return response.data;
    } catch (err) {
      console.error('Failed to approve comment:', err);
      setError('Failed to approve comment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Backward compatible likeItem function for components that use the old API
  const likeItem = useCallback(async (contentType, itemId) => {
    if (!contentType || !itemId) return;
    
    try {
      setLoading(true);
      const response = await axios.post(API_ENDPOINTS.TRACK_LIKE(contentType, itemId), { action: 'like' });
      // Note: This doesn't update local stats since it's meant for list views
      return response.data;
    } catch (err) {
      console.error('Failed to like item:', err);
      setError('Failed to like item');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Alias for backward compatibility
  const isLiking = loading;

  return {
    stats,
    loading,
    error,
    toggleLike,
    trackShare,
    trackView, // Export trackView for manual triggering
    likeItem, // Backward compatible function
    isLiking, // Backward compatible alias
    addComment,
    deleteComment,
    approveComment,
    fetchStats
  };
};

export default useEngagement;
