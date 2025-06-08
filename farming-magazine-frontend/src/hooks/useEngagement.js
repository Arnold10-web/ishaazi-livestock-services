import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_ENDPOINTS from '../config/apiConfig';

export const useEngagement = (contentType, id) => {
  const [stats, setStats] = useState({
    views: 0,
    likes: 0,
    shares: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track a view
  const trackView = useCallback(async () => {
    try {
      await axios.post(API_ENDPOINTS.TRACK_VIEW(contentType, id));
    } catch (err) {
      console.error('Failed to track view:', err);
    }
  }, [contentType, id]);

  // Fetch current engagement stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_ENGAGEMENT_STATS(contentType, id));
      setStats(response.data.data);
    } catch (err) {
      console.error('Failed to fetch engagement stats:', err);
      setError('Failed to fetch stats');
    }
  }, [contentType, id]);

  // Track view when component mounts
  useEffect(() => {
    if (contentType && id) {
      trackView();
      fetchStats();
    }
  }, [contentType, id, trackView, fetchStats]);

  // Toggle like
  const toggleLike = async (currentlyLiked = false) => {
    try {
      setLoading(true);
      const action = currentlyLiked ? 'unlike' : 'like';
      const response = await axios.post(API_ENDPOINTS.TRACK_LIKE(contentType, id), { action });
      
      setStats(prev => ({
        ...prev,
        likes: response.data.data.likes
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

  return {
    stats,
    loading,
    error,
    toggleLike,
    trackShare,
    addComment,
    deleteComment,
    approveComment,
    fetchStats
  };
};

export default useEngagement;
