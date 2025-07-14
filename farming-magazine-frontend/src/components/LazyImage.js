import React, { useState, useEffect } from 'react';

/**
 * LazyImage component for optimized image loading
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {string} props.className - CSS classes
 * @param {string} props.placeholder - Placeholder image URL
 * @param {function} props.onLoad - Callback when image loads
 * @param {function} props.onError - Callback when image fails to load
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '/images/placeholder.jpg',
  onLoad = () => {},
  onError = () => {},
  ...rest
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholder);
  
  useEffect(() => {
    // Create a new image element
    const img = new Image();
    
    // Set up load handler
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoaded(true);
      onLoad();
    };
    
    // Set up error handler
    img.onerror = () => {
      console.error(`Failed to load image: ${src}`);
      onError();
    };
    
    // Start loading the image
    img.src = src;
    
    return () => {
      // Clean up by removing event listeners
      img.onload = null;
      img.onerror = null;
    };
  }, [src, onLoad, onError]);
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      className={`${className} ${!isLoaded ? 'opacity-50' : 'opacity-100'} transition-opacity duration-300`}
      {...rest}
    />
  );
};

export default LazyImage;
