/**
 * useEngagement Hook Tests
 * 
 * Comprehensive tests for the useEngagement custom hook
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import axios from 'axios';
import { useEngagement } from '../useEngagement';
import API_ENDPOINTS from '../../config/apiConfig';

// Mock axios
jest.mock('axios');
const mockedAxios = axios;

// Mock API_ENDPOINTS
jest.mock('../../config/apiConfig', () => ({
  TRACK_VIEW: jest.fn((contentType, id) => `/api/content/track/view/${contentType}/${id}`),
  TRACK_LIKE: jest.fn((contentType, id) => `/api/content/track/like/${contentType}/${id}`),
  TRACK_SHARE: jest.fn((contentType, id) => `/api/content/track/share/${contentType}/${id}`),
  GET_ENGAGEMENT_STATS: jest.fn((contentType, id) => `/api/content/stats/${contentType}/${id}`),
  ADD_COMMENT: jest.fn((contentType, id) => `/api/content/${contentType}/${id}/comments`),
  DELETE_COMMENT: jest.fn((contentType, id, commentId) => `/api/content/${contentType}/${id}/comments/${commentId}`),
  APPROVE_COMMENT: jest.fn((contentType, id, commentId) => `/api/content/${contentType}/${id}/comments/${commentId}/approve`),
}));

describe('useEngagement Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.post.mockClear();
    mockedAxios.get.mockClear();
    mockedAxios.delete.mockClear();
    mockedAxios.patch.mockClear();
    
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default state', () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      expect(result.current.stats).toEqual({
        views: expect.any(Number),
        likes: expect.any(Number),
        shares: expect.any(Number),
        isLiked: false,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles missing contentType', () => {
      const { result } = renderHook(() => useEngagement(null, '123'));

      expect(result.current.stats).toEqual({
        views: 0,
        likes: 0,
        shares: 0,
        isLiked: false,
      });
    });

    it('handles missing id', () => {
      const { result } = renderHook(() => useEngagement('blog', null));

      expect(result.current.stats).toEqual({
        views: 0,
        likes: 0,
        shares: 0,
        isLiked: false,
      });
    });

    it('handles missing both contentType and id', () => {
      const { result } = renderHook(() => useEngagement(null, null));

      expect(result.current.stats).toEqual({
        views: 0,
        likes: 0,
        shares: 0,
        isLiked: false,
      });
    });
  });

  describe('fetchStats', () => {
    it('generates mock stats when enabled', async () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      await waitFor(() => {
        expect(result.current.stats.views).toBeGreaterThanOrEqual(0);
        expect(result.current.stats.likes).toBeGreaterThanOrEqual(0);
        expect(result.current.stats.shares).toBeGreaterThanOrEqual(0);
        expect(result.current.stats.isLiked).toBe(false);
      });
    });

    it('does not fetch stats when disabled', () => {
      const { result } = renderHook(() => useEngagement(null, '123'));

      expect(result.current.stats).toEqual({
        views: 0,
        likes: 0,
        shares: 0,
        isLiked: false,
      });
    });

    it('can be called manually', async () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(result.current.stats.views).toBeGreaterThanOrEqual(0);
    });
  });

  describe('trackView', () => {
    it('tracks view when called manually', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.trackView();
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/content/track/view/blog/123');
    });

    it('tracks view on mount when trackViewOnMount is true', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      renderHook(() => useEngagement('blog', '123', { trackViewOnMount: true }));

      await waitFor(() => {
        expect(mockedAxios.post).toHaveBeenCalledWith('/api/content/track/view/blog/123');
      }, { timeout: 2000 });
    });

    it('does not track view on mount when trackViewOnMount is false', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      renderHook(() => useEngagement('blog', '123', { trackViewOnMount: false }));

      // Wait a bit to ensure no call is made
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockedAxios.post).not.toHaveBeenCalledWith('/api/content/track/view/blog/123');
    });

    it('only tracks view once', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.trackView();
        await result.current.trackView();
        await result.current.trackView();
      });

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.trackView();
      });

      expect(console.error).toHaveBeenCalledWith('Failed to track view:', expect.any(Error));
    });

    it('does not track view when disabled', async () => {
      const { result } = renderHook(() => useEngagement(null, '123'));

      await act(async () => {
        await result.current.trackView();
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('likes an item when not currently liked', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { likes: 11 } }
      });

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let newLikedState;
      await act(async () => {
        newLikedState = await result.current.toggleLike(false);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/content/track/like/blog/123',
        { action: 'like' }
      );
      expect(newLikedState).toBe(true);
      expect(result.current.stats.likes).toBe(11);
      expect(result.current.stats.isLiked).toBe(true);
    });

    it('unlikes an item when currently liked', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { likes: 9 } }
      });

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let newLikedState;
      await act(async () => {
        newLikedState = await result.current.toggleLike(true);
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/content/track/like/blog/123',
        { action: 'unlike' }
      );
      expect(newLikedState).toBe(false);
      expect(result.current.stats.likes).toBe(9);
      expect(result.current.stats.isLiked).toBe(false);
    });

    it('sets loading state during API call', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedAxios.post.mockReturnValue(promise);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      act(() => {
        result.current.toggleLike(false);
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ data: { data: { likes: 11 } } });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let newLikedState;
      await act(async () => {
        newLikedState = await result.current.toggleLike(false);
      });

      expect(console.error).toHaveBeenCalledWith('Failed to toggle like:', expect.any(Error));
      expect(newLikedState).toBe(false); // Should return original state
      expect(result.current.error).toBe('Failed to update like');
      expect(result.current.loading).toBe(false);
    });

    it('returns original state when disabled', async () => {
      const { result } = renderHook(() => useEngagement(null, '123'));

      const newLikedState = await act(async () => {
        return await result.current.toggleLike(true);
      });

      expect(newLikedState).toBe(true);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });
  });

  describe('trackShare', () => {
    it('tracks share successfully', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { data: { shares: 6 } }
      });

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.trackShare();
      });

      expect(mockedAxios.post).toHaveBeenCalledWith('/api/content/track/share/blog/123');
      expect(result.current.stats.shares).toBe(6);
    });

    it('handles API errors gracefully', async () => {
      mockedAxios.post.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.trackShare();
      });

      expect(console.error).toHaveBeenCalledWith('Failed to track share:', expect.any(Error));
      expect(result.current.error).toBe('Failed to track share');
    });
  });

  describe('addComment', () => {
    it('adds comment successfully', async () => {
      const mockResponse = { data: { success: true, comment: { id: '1' } } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let response;
      await act(async () => {
        response = await result.current.addComment('John Doe', 'john@example.com', 'Great article!');
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/content/blog/123/comments',
        {
          author: 'John Doe',
          email: 'john@example.com',
          content: 'Great article!'
        }
      );
      expect(response).toEqual(mockResponse.data);
    });

    it('sets loading state during comment addition', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedAxios.post.mockReturnValue(promise);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      act(() => {
        result.current.addComment('John Doe', 'john@example.com', 'Great article!');
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ data: { success: true } });
        await promise;
      });

      expect(result.current.loading).toBe(false);
    });

    it('handles API errors and throws', async () => {
      const error = new Error('API Error');
      mockedAxios.post.mockRejectedValue(error);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await expect(
          result.current.addComment('John Doe', 'john@example.com', 'Great article!')
        ).rejects.toThrow('API Error');
      });

      expect(console.error).toHaveBeenCalledWith('Failed to add comment:', error);
      expect(result.current.error).toBe('Failed to add comment');
      expect(result.current.loading).toBe(false);
    });
  });

  describe('deleteComment', () => {
    it('deletes comment successfully', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let response;
      await act(async () => {
        response = await result.current.deleteComment('comment-1');
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith('/api/content/blog/123/comments/comment-1');
      expect(response).toEqual(mockResponse.data);
    });

    it('handles API errors and throws', async () => {
      const error = new Error('API Error');
      mockedAxios.delete.mockRejectedValue(error);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await expect(result.current.deleteComment('comment-1')).rejects.toThrow('API Error');
      });

      expect(console.error).toHaveBeenCalledWith('Failed to delete comment:', error);
      expect(result.current.error).toBe('Failed to delete comment');
    });
  });

  describe('approveComment', () => {
    it('approves comment successfully', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let response;
      await act(async () => {
        response = await result.current.approveComment('comment-1');
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith('/api/content/blog/123/comments/comment-1/approve');
      expect(response).toEqual(mockResponse.data);
    });

    it('handles API errors and throws', async () => {
      const error = new Error('API Error');
      mockedAxios.patch.mockRejectedValue(error);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await expect(result.current.approveComment('comment-1')).rejects.toThrow('API Error');
      });

      expect(console.error).toHaveBeenCalledWith('Failed to approve comment:', error);
      expect(result.current.error).toBe('Failed to approve comment');
    });
  });

  describe('likeItem (backward compatibility)', () => {
    it('likes item with old API', async () => {
      const mockResponse = { data: { success: true } };
      mockedAxios.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      let response;
      await act(async () => {
        response = await result.current.likeItem('blog', '456');
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/content/track/like/blog/456',
        { action: 'like' }
      );
      expect(response).toEqual(mockResponse.data);
    });

    it('handles missing parameters', async () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await result.current.likeItem(null, '456');
      });

      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('handles API errors and throws', async () => {
      const error = new Error('API Error');
      mockedAxios.post.mockRejectedValue(error);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      await act(async () => {
        await expect(result.current.likeItem('blog', '456')).rejects.toThrow('API Error');
      });

      expect(console.error).toHaveBeenCalledWith('Failed to like item:', error);
      expect(result.current.error).toBe('Failed to like item');
    });
  });

  describe('isLiking alias', () => {
    it('returns same value as loading', () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      expect(result.current.isLiking).toBe(result.current.loading);
    });

    it('updates when loading state changes', async () => {
      let resolvePromise;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockedAxios.post.mockReturnValue(promise);

      const { result } = renderHook(() => useEngagement('blog', '123'));

      act(() => {
        result.current.toggleLike(false);
      });

      expect(result.current.isLiking).toBe(true);
      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise({ data: { data: { likes: 11 } } });
        await promise;
      });

      expect(result.current.isLiking).toBe(false);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('Hook dependencies and re-renders', () => {
    it('updates when contentType changes', async () => {
      const { result, rerender } = renderHook(
        ({ contentType, id }) => useEngagement(contentType, id),
        { initialProps: { contentType: 'blog', id: '123' } }
      );

      const initialStats = result.current.stats;

      rerender({ contentType: 'news', id: '123' });

      await waitFor(() => {
        // Stats should be regenerated (different random values)
        expect(result.current.stats).not.toEqual(initialStats);
      });
    });

    it('updates when id changes', async () => {
      const { result, rerender } = renderHook(
        ({ contentType, id }) => useEngagement(contentType, id),
        { initialProps: { contentType: 'blog', id: '123' } }
      );

      const initialStats = result.current.stats;

      rerender({ contentType: 'blog', id: '456' });

      await waitFor(() => {
        // Stats should be regenerated (different random values)
        expect(result.current.stats).not.toEqual(initialStats);
      });
    });

    it('does not cause infinite re-renders', () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      // Call functions multiple times to ensure they don't cause re-renders
      act(() => {
        result.current.fetchStats();
        result.current.trackView();
      });

      expect(result.current.stats).toBeDefined();
    });
  });

  describe('Memory leaks and cleanup', () => {
    it('cleans up timeouts on unmount', () => {
      jest.useFakeTimers();
      
      const { unmount } = renderHook(() => 
        useEngagement('blog', '123', { trackViewOnMount: true })
      );

      // Fast-forward time to trigger timeout
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Unmount before timeout completes
      unmount();

      // Fast-forward past the timeout
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Should not make API call after unmount
      expect(mockedAxios.post).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('handles rapid successive calls without memory leaks', async () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      // Make many rapid calls
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          act(async () => {
            await result.current.fetchStats();
          })
        );
      }

      await Promise.all(promises);

      expect(result.current.stats).toBeDefined();
    });
  });

  describe('Edge cases', () => {
    it('handles undefined options', () => {
      const { result } = renderHook(() => useEngagement('blog', '123', undefined));

      expect(result.current.stats).toBeDefined();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('handles empty string contentType and id', () => {
      const { result } = renderHook(() => useEngagement('', ''));

      expect(result.current.stats).toEqual({
        views: 0,
        likes: 0,
        shares: 0,
        isLiked: false,
      });
    });

    it('handles numeric id', () => {
      const { result } = renderHook(() => useEngagement('blog', 123));

      expect(result.current.stats.views).toBeGreaterThanOrEqual(0);
    });

    it('handles boolean values gracefully', async () => {
      const { result } = renderHook(() => useEngagement('blog', '123'));

      // Should not crash with invalid boolean values
      await act(async () => {
        const newState = await result.current.toggleLike('invalid');
        expect(typeof newState).toBe('boolean');
      });
    });
  });
});