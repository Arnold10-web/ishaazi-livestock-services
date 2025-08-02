/**
 * Reusable upload middleware helpers
 * Reduces code duplication across routes
 */

import { storeInGridFS } from './enhancedFileUpload.js';

// Common optional image upload middleware
export const optionalImageUpload = () => {
  return storeInGridFS('image', ['image/*'], { optional: true });
};

// PDF upload middleware for documents
export const pdfUpload = () => {
  return storeInGridFS('pdf', ['application/pdf'], { optional: false });
};

// Media upload middleware for audio/video
export const mediaUpload = (fieldName = 'media') => {
  return storeInGridFS(fieldName, ['audio/*', 'video/*'], { 
    optional: false,
    maxFileSize: 100 * 1024 * 1024 // 100MB for media files
  });
};

// Multi-file upload for magazines (image + pdf)
export const magazineFileUpload = () => {
  // Note: This would need custom implementation for multiple fields
  // For now, keeping the existing pattern in routes
  return {
    image: storeInGridFS('image', ['image/*'], { optional: false }),
    pdf: storeInGridFS('pdf', ['application/pdf'], { optional: false })
  };
};

// Flexible file upload with custom options
export const customFileUpload = (fieldName, mimeTypes, options = {}) => {
  return storeInGridFS(fieldName, mimeTypes, {
    optional: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB default
    ...options
  });
};
