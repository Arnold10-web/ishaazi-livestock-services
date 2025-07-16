// middleware/validateSubscriptionData.js
import { body, validationResult } from 'express-validator';

/**
 * Validation middleware for push subscription data
 */
export const validateSubscriptionData = [
  body('endpoint')
    .isURL()
    .withMessage('Valid endpoint URL is required'),
  
  body('keys.p256dh')
    .isLength({ min: 1 })
    .withMessage('p256dh key is required'),
  
  body('keys.auth')
    .isLength({ min: 1 })
    .withMessage('auth key is required'),
  
  body('userAgent')
    .optional()
    .isString()
    .withMessage('userAgent must be a string'),
  
  body('platform')
    .optional()
    .isString()
    .withMessage('platform must be a string'),
  
  body('preferences')
    .optional()
    .isObject()
    .withMessage('preferences must be an object'),
  
  body('preferences.news')
    .optional()
    .isBoolean()
    .withMessage('preferences.news must be a boolean'),
  
  body('preferences.events')
    .optional()
    .isBoolean()
    .withMessage('preferences.events must be a boolean'),
  
  body('preferences.blogs')
    .optional()
    .isBoolean()
    .withMessage('preferences.blogs must be a boolean'),
  
  body('preferences.magazine')
    .optional()
    .isBoolean()
    .withMessage('preferences.magazine must be a boolean'),
  
  body('preferences.breakingNews')
    .optional()
    .isBoolean()
    .withMessage('preferences.breakingNews must be a boolean'),
  
  body('preferences.adminAlerts')
    .optional()
    .isBoolean()
    .withMessage('preferences.adminAlerts must be a boolean'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];
