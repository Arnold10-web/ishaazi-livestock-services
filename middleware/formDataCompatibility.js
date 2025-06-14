/**
 * Form Data Compatibility Middleware
 * 
 * This middleware handles conversion between FormData and JSON formats
 * for all content-related routes. It ensures proper processing of:
 * - Tags (array handling)
 * - Metadata (JSON objects)
 * - Boolean fields (string to boolean conversion)
 * - Date fields (proper formatting)
 */
import express from 'express';

/**
 * Process form data for content submissions
 * This middleware converts FormData fields to the formats expected by the API
 */
export const processFormData = (req, res, next) => {
  console.log('FormData compatibility middleware processing request...');
  
  // Apply to all content-related routes (not just blog updates)
  if (req.originalUrl.includes('/content/')) {
    console.log(`Processing form data for ${req.method} request to ${req.originalUrl}...`);
    
    // Process tags specifically - convert string to array when needed
    if (req.body.tags && typeof req.body.tags === 'string') {
      try {
        // First try to parse as JSON
        if (req.body.tags.trim().startsWith('[') && req.body.tags.trim().endsWith(']')) {
          req.body.tags = JSON.parse(req.body.tags);
        } else {
          // Otherwise treat as comma-separated
          req.body.tags = req.body.tags.split(',').map(tag => tag.trim()).filter(Boolean);
        }
        console.log('Tags processed:', req.body.tags);
      } catch (err) {
        console.error('Error processing tags in form data:', err);
        // Fallback to empty array if parsing fails
        req.body.tags = [];
      }
    }
    
    // Process boolean fields (convert string to boolean)
    const booleanFields = ['published', 'featured', 'urgent', 'notificationSent'];
    booleanFields.forEach(field => {
      if (req.body[field] !== undefined && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field].toLowerCase() === 'true';
      }
    });
    
    // Process metadata field if it's a string
    if (req.body.metadata && typeof req.body.metadata === 'string') {
      try {
        req.body.metadata = JSON.parse(req.body.metadata);
      } catch (err) {
        console.error('Error parsing metadata in form data:', err);
        // Leave as string if parsing fails - validation will catch it
      }
    }
    
    // Handle date fields for events
    if (req.originalUrl.includes('/events')) {
      const dateFields = ['startDate', 'endDate', 'registrationDeadline'];
      dateFields.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
          try {
            // Ensure the date is properly formatted
            const date = new Date(req.body[field]);
            if (!isNaN(date)) {
              req.body[field] = date.toISOString();
            }
          } catch (err) {
            console.error(`Error formatting date field ${field}:`, err);
          }
        }
      });
    }
    
    // Handle numeric fields
    const numericFields = ['readTime', 'maxAttendees', 'ticketPrice'];
    numericFields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = parseFloat(req.body[field]);
      }
    });
  }
  
  next();
};

export default processFormData;
