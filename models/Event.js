/**
 * @file Event.js
 * @description Event model for the Online Farming Magazine platform
 * 
 * This model represents farming-related events such as conferences,
 * workshops, trade shows, and community gatherings. The schema includes
 * automatic notification sending when events are published.
 * 
 * @module models/Event
 * @requires mongoose
 */

import mongoose from 'mongoose';

/**
 * Event Schema
 * 
 * @typedef {Object} EventSchema
 * @property {String} title - The event title (required)
 * @property {String} description - Detailed description of the event (required)
 * @property {Date} startDate - When the event begins (required)
 * @property {Date} endDate - When the event ends (optional)
 * @property {String} location - Physical or virtual location of the event
 * @property {String} imageUrl - Featured image for the event
 * @property {Object} metadata - Additional structured event data (speakers, agenda, etc.)
 * @property {Boolean} published - Whether the event is visible to users (default: true)
 * @property {Date} publishedAt - When the event was first published
 * @property {Boolean} notificationSent - Tracks if publication notification was sent
 */
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String },
    imageUrl: { type: String, default: null },
    metadata: { type: Object },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
    notificationSent: { type: Boolean, default: false }
  },
  { timestamps: true } // Automatically add createdAt and updatedAt timestamps
);

/**
 * Pre-save middleware for automatic event publishing actions
 * 
 * This middleware performs two key functions:
 * 1. Sets the publishedAt timestamp when an event is first published
 * 2. Sends notifications to subscribers when a new event is published
 * 
 * The notification system uses dynamic imports for better code splitting
 * and creates well-formatted notifications with event details.
 * Notifications are sent asynchronously to prevent blocking the save operation.
 * 
 * @param {Function} next - Mongoose middleware next function
 */
eventSchema.pre('save', async function(next) {
  try {
    // Set publishedAt timestamp when an event is published for the first time
    // This helps track when events become publicly visible
    if (this.published && !this.publishedAt) {
      this.publishedAt = new Date();
    }

    // Handle new publication with notification
    // Only triggers when:
    // 1. Event is published (published === true)
    // 2. Notification hasn't been sent yet (notificationSent === false)
    // 3. The published field has been modified in this update
    if (this.published && !this.notificationSent && this.isModified('published')) {
      this.notificationSent = true; // Mark as sent to prevent duplicate notifications
      
      // Dynamic import reduces initial load time and creates better code separation
      const { sendContentNotification } = await import('../services/notificationService.js');
      
      // Define subscriber groups to receive this notification
      const targetTypes = ['all', 'events'];
      
      // Format the event date in a human-readable format (e.g. "June 15, 2025")
      const eventDate = new Date(this.startDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
      
      // Build a rich notification description with emojis and event details
      let description = `📅 ${eventDate}`;
      if (this.location) {
        description += ` | 📍 ${this.location}`;
      }
      description += `\n\n${this.description.substring(0, 150)}...`; // Preview of description
      
      // Use process.nextTick to send notification asynchronously
      // This improves performance by not blocking the save operation
      process.nextTick(async () => {
        try {
          await sendContentNotification(
            'event',             // Content type
            this._id,            // Content ID for linking
            this.title,          // Notification title
            description,         // Formatted description
            targetTypes          // Target subscriber groups
          );
        } catch (error) {
          console.error('Failed to send event notification:', error);
          // Notification failure doesn't stop the event from being saved
        }
      });
    }
    
    next(); // Continue with the save operation
  } catch (error) {
    console.error('Error in event pre-save middleware:', error);
    next(); // Continue despite errors to prevent blocking saves
  }
});

/**
 * Event model
 * 
 * Compiled model from the event schema with automatic notification capabilities.
 * Used throughout the application for CRUD operations on farming events.
 * 
 * @type {mongoose.Model}
 */
export default mongoose.model('Event', eventSchema);

