import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email'
      }
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          if (!v) return true; // Phone is optional
          // Remove spaces, dashes, and parentheses for validation
          const cleanPhone = v.replace(/[\s\-\(\)]/g, '');
          // Must start with + and have 1-4 digit country code followed by 6-14 digits
          return /^\+\d{1,4}\d{6,14}$/.test(cleanPhone);
        },
        message: 'Phone number must include a country code (e.g., +1234567890)'
      }
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled'],
      default: 'confirmed'
    },
    metadata: {
      type: Object,
      default: {}
    }
  },
  { 
    timestamps: true,
    // Ensure one registration per email per event
    index: { eventId: 1, email: 1 },
    unique: true
  }
);

// Index for better query performance
eventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });
eventRegistrationSchema.index({ eventId: 1 });
eventRegistrationSchema.index({ email: 1 });

export default mongoose.model('EventRegistration', eventRegistrationSchema);
