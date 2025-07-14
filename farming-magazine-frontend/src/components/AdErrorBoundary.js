/**
 * AdErrorBoundary Component
 * 
 * An error boundary specifically designed for ad components to prevent
 * advertising-related errors from crashing the entire application.
 * Displays a graceful fallback when ad components fail.
 * 
 * @module components/AdErrorBoundary
 */
import React from 'react';

/**
 * Error boundary class component for handling advertising component errors
 * 
 * @extends React.Component
 */
class AdErrorBoundary extends React.Component {
  /**
   * Constructor initializes state for error tracking
   * @param {Object} props - Component props
   */
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Static lifecycle method that captures errors and updates state
   * 
   * @param {Error} error - The error that was thrown
   * @returns {Object} Updated state object with error information
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Lifecycle method called when an error is caught
   * Logs errors and sends to monitoring service in production
   * 
   * @param {Error} error - The error that was thrown
   * @param {Object} errorInfo - React component stack information
   */
  componentDidCatch(error, errorInfo) {
    console.error('Ad component error:', error, errorInfo);
    
    // Send error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error monitoring services like Sentry here
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }

  /**
   * Renders either the fallback UI when an error occurs or the child components
   * 
   * @returns {JSX.Element} Either error UI or child components
   */
  render() {
    if (this.state.hasError) {
      // Render fallback UI when an ad component fails
      return (
        <div className="ad-container my-4" role="banner" aria-label="Advertisement space">
          <div className="text-xs text-gray-400 text-center mb-2">Advertisement</div>
          <div className="bg-gray-100 rounded-lg p-4 text-center text-gray-500" style={{ minHeight: '90px' }}>
            <div className="flex items-center justify-center h-full">
              <span>Unable to load advertisement</span>
            </div>
          </div>
        </div>
      );
    }

    // When no error, render the wrapped components
    return this.props.children;
  }
}

export default AdErrorBoundary;
