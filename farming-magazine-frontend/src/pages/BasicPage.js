import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { Loader2, AlertCircle } from 'lucide-react';
import BasicList from '../components/BasicList';

const BasicPage = () => {
  const [basics, setBasics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasData, setHasData] = useState(false);
  
  const isMountedRef = useRef(true);
  const isLoadingRef = useRef(false);
  const requestTimeoutRef = useRef(null);
  const lastFetchTimeRef = useRef(0);
  
  const THROTTLE_MS = 2000;

  const axiosInstance = useRef(axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    timeout: 30000,
    headers: {
      'Accept': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })).current;

  const throttledFetch = useCallback((fn) => {
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetchTimeRef.current;
    
    if (requestTimeoutRef.current) {
      clearTimeout(requestTimeoutRef.current);
    }
    
    if (timeSinceLastFetch < THROTTLE_MS) {
      requestTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          lastFetchTimeRef.current = Date.now();
          fn();
        }
      }, THROTTLE_MS - timeSinceLastFetch);
      return;
    }
    
    lastFetchTimeRef.current = now;
    fn();
  }, []);

  const fetchBasics = useCallback(() => {
    if (isLoadingRef.current) return;
    
    const doFetch = async () => {
      if (!isMountedRef.current) return;
      
      isLoadingRef.current = true;
      
      try {
        if (!hasData) {
          setLoading(true);
        }
        
        const response = await axiosInstance.get(`/api/content/basics?page=${page}&limit=5`);
        
        if (!isMountedRef.current) return;
        
        if (response.data && response.data.data) {
          const { basics = [], totalPages = 1 } = response.data.data;
          
          const processedBasics = basics.map(item => ({
            ...item,
            comments: Array.isArray(item.comments) ? item.comments : [],
            imageUrl: item.imageUrl || null,
            fileUrl: item.fileUrl || null,
            fileType: item.fileUrl?.toLowerCase().endsWith('.mp4') || 
              item.fileUrl?.toLowerCase().endsWith('.webm') || 
              item.fileUrl?.toLowerCase().endsWith('.mov') ? 'video' :
              item.fileUrl?.toLowerCase().endsWith('.mp3') || 
              item.fileUrl?.toLowerCase().endsWith('.wav') ? 'audio' : null
          }));
          
          if (isMountedRef.current) {
            setBasics(processedBasics);
            setTotalPages(totalPages);
            setError(null);
            setHasData(true);
          }
        } else {
          throw new Error('Invalid response format from server');
        }
      } catch (err) {
        if (!isMountedRef.current) return;
        
        console.error('Error fetching basics:', err);
        
        if (!hasData) {
          setError(err.message === 'timeout of 30000ms exceeded' 
            ? 'The server is taking too long to respond. Please try again later.' 
            : 'Failed to fetch content. Please try again later.');
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
        isLoadingRef.current = false;
      }
    };
    
    throttledFetch(doFetch);
  }, [page, axiosInstance, hasData, throttledFetch]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchBasics();
    
    return () => {
      isMountedRef.current = false;
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
    };
  }, [fetchBasics]);

  const handleAddComment = async (basicId, content) => {
    if (!basicId || !content) return;
    
    const updatedBasics = basics.map(basic => {
      if (basic._id === basicId) {
        return {
          ...basic,
          comments: [...basic.comments, { _id: Date.now(), content }]
        };
      }
      return basic;
    });
    setBasics(updatedBasics);
    
    try {
      await axiosInstance.post(`/api/content/basics/${basicId}/comments`, { content });
    } catch (err) {
      console.error('Error adding comment:', err);
      setBasics(basics);
      alert('Failed to add comment. Please try again.');
    }
  };

  const handleRetry = () => {
    if (isLoadingRef.current) return;
    fetchBasics();
  };

  const goToNextPage = useCallback(() => {
    if (page < totalPages && !isLoadingRef.current) {
      setPage(prevPage => prevPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (page > 1 && !isLoadingRef.current) {
      setPage(prevPage => prevPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  if (loading && !hasData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-12">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-64 mx-auto mb-4 animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96 mx-auto animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200 dark:bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !hasData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 max-w-md w-full text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Unable to load content</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              disabled={isLoadingRef.current}
            >
              {isLoadingRef.current ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </span>
              ) : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Farming Foundations: Your Journey to Agricultural Success</h1>
          <p className="text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            Build your farming expertise from the ground up with essential knowledge, practical skills, and time-tested fundamentals that every successful farmer needs to know.
          </p>
        </div>

        <BasicList
          basics={basics}
          apiBaseUrl={axiosInstance.defaults.baseURL}
          isAdmin={false}
          onAddComment={handleAddComment}
          isLoading={loading}
        />

        {loading && hasData && (
          <div className="flex justify-center items-center bg-white dark:bg-gray-800 shadow-md rounded-lg px-6 py-4 my-6">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            <span className="ml-3 text-gray-700 dark:text-gray-300 font-medium">Refreshing content...</span>
          </div>
        )}

        {error && hasData && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-center justify-between my-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-3" />
              <p className="text-amber-700 dark:text-amber-300">Couldn't refresh content. Using cached data.</p>
            </div>
            <button 
              onClick={handleRetry}
              className="text-amber-600 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-200 font-medium bg-amber-100 dark:bg-amber-800/40 hover:bg-amber-200 dark:hover:bg-amber-800/60 px-4 py-2 rounded-md transition-colors"
              disabled={isLoadingRef.current}
            >
              Retry
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-6 mt-10">
            <button
              disabled={page <= 1 || loading}
              onClick={goToPrevPage}
              className="px-5 py-2.5 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors font-medium shadow-sm"
            >
              Previous
            </button>
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages || loading}
              onClick={goToNextPage}
              className="px-5 py-2.5 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors font-medium shadow-sm"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default BasicPage;